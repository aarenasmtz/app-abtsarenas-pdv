using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using PdvAbarrotes.Aplicacion.Comun;
using PdvAbarrotes.Aplicacion.DTOs.Compras;
using PdvAbarrotes.Aplicacion.Interfaces;
using PdvAbarrotes.Dominio.Entidades;

namespace PdvAbarrotes.Infraestructura.Servicios;

/// <summary>
/// Implementación del servicio de compras y recepción de mercancías con recálculo de costos y Kardex.
/// </summary>
public class ServicioCompras : IServicioCompras
{
    private readonly IContextoPrincipal _contexto;
    private readonly IServicioAuditoria _servicioAuditoria;
    private readonly ILogger<ServicioCompras> _logger;

    public ServicioCompras(
        IContextoPrincipal contexto,
        IServicioAuditoria servicioAuditoria,
        ILogger<ServicioCompras> logger)
    {
        _contexto = contexto;
        _servicioAuditoria = servicioAuditoria;
        _logger = logger;
    }

    public async Task<CompraDto> RegistrarCompraAsync(RegistrarCompraDto dto, int idUsuario, CancellationToken ct = default)
    {
        if (dto.Partidas == null || !dto.Partidas.Any())
        {
            throw new ArgumentException("Debe especificar al menos un producto o partida en la compra.");
        }

        // ── PRE-VALIDACIÓN: verificar todos los productos y montos antes de abrir transacción ──
        foreach (var partida in dto.Partidas)
        {
            if (partida.Cantidad <= 0)
            {
                throw new ArgumentException($"La cantidad en la partida del producto #{partida.IdProducto} debe ser superior a cero.");
            }

            if (partida.CostoUnitario < 0)
            {
                throw new ArgumentException($"El costo unitario del producto #{partida.IdProducto} no puede ser negativo.");
            }

            bool existeProducto = await _contexto.Productos.AnyAsync(p => p.IdProducto == partida.IdProducto, ct);
            if (!existeProducto)
            {
                throw new KeyNotFoundException($"El producto con ID #{partida.IdProducto} no existe.");
            }
        }

        // Obtener siguiente folio de compra consecutivo
        int ultimoFolio = await _contexto.Compras.MaxAsync(c => (int?)c.FolioCompra, ct) ?? 0;
        int nuevoFolio = ultimoFolio + 1;

        var ahora = DateTime.Now;
        decimal totalCompra = dto.Partidas.Sum(p => p.Cantidad * p.CostoUnitario);

        var compra = new Compra
        {
            FolioCompra = nuevoFolio,
            IdSucursal = 1,
            IdProveedor = dto.IdProveedor > 0 ? dto.IdProveedor : null,
            IdUsuario = idUsuario,
            FechaCompra = dto.FechaCompra ?? ahora,
            TotalCompra = totalCompra,
            Estatus = "RECIBIDO",
            Observaciones = dto.Observaciones?.Trim(),
            FechaRegistro = ahora
        };

        // Iniciar transacción atómica para compras con soporte de CreateExecutionStrategy
        var estrategia = _contexto.Database.CreateExecutionStrategy();
        return await estrategia.ExecuteAsync(async () =>
        {
            await using var transaccion = await _contexto.Database.BeginTransactionAsync(ct);

            try
        {
            _contexto.Compras.Add(compra);
            await _contexto.SaveChangesAsync(ct);

            int renglon = 1;
            foreach (var partida in dto.Partidas)
            {
                var producto = await _contexto.Productos
                    .Include(p => p.CodigosBarras)
                    .FirstOrDefaultAsync(p => p.IdProducto == partida.IdProducto, ct);

                if (producto == null)
                {
                    throw new KeyNotFoundException($"El producto con ID #{partida.IdProducto} no existe.");
                }

                if (partida.Cantidad <= 0)
                {
                    throw new ArgumentException($"La cantidad para '{producto.Descripcion}' debe ser superior a cero.");
                }

                if (partida.CostoUnitario < 0)
                {
                    throw new ArgumentException($"El costo unitario para '{producto.Descripcion}' no puede ser negativo.");
                }

                decimal totalRenglon = Math.Round(partida.Cantidad * partida.CostoUnitario, 2);

                var detalle = new DetalleCompra
                {
                    IdCompra = compra.IdCompra,
                    IdProducto = partida.IdProducto,
                    NumeroRenglon = renglon++,
                    CantidadRecibida = partida.Cantidad,
                    CostoUnitario = partida.CostoUnitario,
                    TotalRenglon = totalRenglon
                };
                _contexto.DetalleCompras.Add(detalle);

                // Actualizar o crear existencia en Inventario
                var inventario = await _contexto.Inventarios
                    .FirstOrDefaultAsync(i => i.IdProducto == partida.IdProducto && i.IdSucursal == 1, ct);

                decimal stockAnterior = 0m;
                if (inventario == null)
                {
                    inventario = new Inventario
                    {
                        IdSucursal = 1,
                        IdProducto = partida.IdProducto,
                        ExistenciaActual = partida.Cantidad,
                        FechaUltimaModificacion = ahora
                    };
                    _contexto.Inventarios.Add(inventario);
                }
                else
                {
                    stockAnterior = inventario.ExistenciaActual;
                    inventario.ExistenciaActual += partida.Cantidad;
                    inventario.FechaUltimaModificacion = ahora;
                }

                // Registrar en Kardex Histórico (dbo.MovimientosInventario)
                var movimientoKardex = new MovimientoInventario
                {
                    IdSucursal = 1,
                    IdProducto = partida.IdProducto,
                    IdTipoMovimiento = 1, // ENTRADA_COMPRA
                    CantidadAnterior = stockAnterior,
                    CantidadMovimiento = partida.Cantidad,
                    CantidadNueva = inventario.ExistenciaActual,
                    PrecioCosto = partida.CostoUnitario,
                    ReferenciaModulo = "COMPRA",
                    IdReferencia = compra.IdCompra,
                    Motivo = $"Recepción Compra Folio #{compra.FolioCompra}",
                    IdUsuario = idUsuario,
                    FechaMovimiento = ahora
                };
                _contexto.MovimientosInventario.Add(movimientoKardex);

                // Recálculo del Costo Promedio Ponderado
                if (partida.ActualizarPrecioCosto)
                {
                    decimal costoPonderado;
                    if (stockAnterior > 0 && producto.PrecioCosto > 0)
                    {
                        decimal valorActual = stockAnterior * producto.PrecioCosto;
                        decimal valorNuevo = partida.Cantidad * partida.CostoUnitario;
                        costoPonderado = (valorActual + valorNuevo) / (stockAnterior + partida.Cantidad);
                    }
                    else
                    {
                        costoPonderado = partida.CostoUnitario;
                    }

                    producto.PrecioCosto = Math.Round(costoPonderado, 2);

                    // Si el producto tiene margen de ganancia configurado, actualizar proporcionalmente el precio de venta
                    if (producto.PorcentajeGanancia > 0)
                    {
                        producto.PrecioVenta = Math.Round(producto.PrecioCosto * (1 + (producto.PorcentajeGanancia / 100m)), 2);
                    }
                }
            }

            await _contexto.SaveChangesAsync(ct);
            await transaccion.CommitAsync(ct);

            await _servicioAuditoria.RegistrarAsync(
                "Compras",
                compra.IdCompra,
                "RECEPCION_COMPRA",
                null,
                $"Folio: {compra.FolioCompra}, Total: ${compra.TotalCompra:N2}, Partidas: {dto.Partidas.Count}",
                ct
            );

            return new CompraDto
            {
                IdCompra = compra.IdCompra,
                FolioCompra = compra.FolioCompra,
                IdProveedor = compra.IdProveedor,
                NombreProveedor = "Proveedor General / Sin Asignar",
                IdUsuario = compra.IdUsuario,
                NombreUsuario = $"Usuario #{compra.IdUsuario}",
                FechaCompra = compra.FechaCompra,
                TotalCompra = compra.TotalCompra,
                Estatus = compra.Estatus,
                Observaciones = compra.Observaciones,
                FechaRegistro = compra.FechaRegistro,
                TotalPartidas = dto.Partidas.Count,
                Detalles = dto.Partidas.Select((p, idx) => new DetalleCompraDto
                {
                    IdProducto = p.IdProducto,
                    NumeroRenglon = idx + 1,
                    CantidadRecibida = p.Cantidad,
                    CostoUnitario = p.CostoUnitario,
                    TotalRenglon = Math.Round(p.Cantidad * p.CostoUnitario, 2)
                }).ToList()
            };
        }
        catch (Exception ex)
        {
            await transaccion.RollbackAsync(ct);
            _logger.LogError(ex, "Error al procesar la compra de mercancía");
            throw;
        }
    });
}

    public async Task<ResultadoPaginado<CompraDto>> ObtenerComprasPaginadoAsync(FiltroComprasDto filtro, CancellationToken ct = default)
    {
        var consulta = _contexto.Compras
            .Include(c => c.Proveedor)
            .Include(c => c.Usuario)
            .Include(c => c.Detalles)
            .AsNoTracking()
            .AsQueryable();

        if (filtro.IdProveedor.HasValue && filtro.IdProveedor.Value > 0)
        {
            consulta = consulta.Where(c => c.IdProveedor == filtro.IdProveedor.Value);
        }

        if (filtro.FechaInicio.HasValue)
        {
            consulta = consulta.Where(c => c.FechaCompra >= filtro.FechaInicio.Value);
        }

        if (filtro.FechaFin.HasValue)
        {
            var hasta = filtro.FechaFin.Value.Date.AddDays(1).AddTicks(-1);
            consulta = consulta.Where(c => c.FechaCompra <= hasta);
        }

        if (!string.IsNullOrWhiteSpace(filtro.TerminoBusqueda))
        {
            var termino = filtro.TerminoBusqueda.Trim().ToLower();
            consulta = consulta.Where(c => 
                c.FolioCompra.ToString().Contains(termino) ||
                (c.Proveedor != null && c.Proveedor.Nombre.ToLower().Contains(termino)) ||
                (c.Observaciones != null && c.Observaciones.ToLower().Contains(termino)));
        }

        int totalRegistros = await consulta.CountAsync(ct);

        var compras = await consulta
            .OrderByDescending(c => c.FechaCompra)
            .Skip((filtro.Pagina - 1) * filtro.RegistrosPorPagina)
            .Take(filtro.RegistrosPorPagina)
            .ToListAsync(ct);

        var elementosDto = compras.Select(c => new CompraDto
        {
            IdCompra = c.IdCompra,
            FolioCompra = c.FolioCompra,
            IdProveedor = c.IdProveedor,
            NombreProveedor = c.Proveedor?.Nombre ?? "Proveedor General / Sin Asignar",
            IdUsuario = c.IdUsuario,
            NombreUsuario = c.Usuario?.NombreCompleto ?? $"Usuario #{c.IdUsuario}",
            FechaCompra = c.FechaCompra,
            TotalCompra = c.TotalCompra,
            Estatus = c.Estatus,
            Observaciones = c.Observaciones,
            FechaRegistro = c.FechaRegistro,
            TotalPartidas = c.Detalles.Count
        }).ToList();

        return new ResultadoPaginado<CompraDto>(
            elementosDto,
            totalRegistros,
            filtro.Pagina,
            filtro.RegistrosPorPagina);
    }

    public async Task<CompraDto?> ObtenerCompraPorIdAsync(int id, CancellationToken ct = default)
    {
        var c = await _contexto.Compras
            .Include(x => x.Proveedor)
            .Include(x => x.Usuario)
            .Include(x => x.Detalles)
                .ThenInclude(d => d.Producto)
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.IdCompra == id, ct);

        if (c == null) return null;

        return new CompraDto
        {
            IdCompra = c.IdCompra,
            FolioCompra = c.FolioCompra,
            IdProveedor = c.IdProveedor,
            NombreProveedor = c.Proveedor?.Nombre ?? "Proveedor General / Sin Asignar",
            IdUsuario = c.IdUsuario,
            NombreUsuario = c.Usuario?.NombreCompleto ?? $"Usuario #{c.IdUsuario}",
            FechaCompra = c.FechaCompra,
            TotalCompra = c.TotalCompra,
            Estatus = c.Estatus,
            Observaciones = c.Observaciones,
            FechaRegistro = c.FechaRegistro,
            TotalPartidas = c.Detalles.Count,
            Detalles = c.Detalles.OrderBy(d => d.NumeroRenglon).Select(d => new DetalleCompraDto
            {
                IdDetalleCompra = d.IdDetalleCompra,
                IdCompra = d.IdCompra,
                IdProducto = d.IdProducto,
                CodigoBarras = d.Producto?.CodigosBarras.FirstOrDefault()?.CodigoValor ?? string.Empty,
                DescripcionProducto = d.Producto?.Descripcion ?? $"Producto #{d.IdProducto}",
                NumeroRenglon = d.NumeroRenglon,
                CantidadRecibida = d.CantidadRecibida,
                CostoUnitario = d.CostoUnitario,
                TotalRenglon = d.TotalRenglon
            }).ToList()
        };
    }
}
