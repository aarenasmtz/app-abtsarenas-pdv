using System.Globalization;
using Microsoft.EntityFrameworkCore;
using PdvAbarrotes.Aplicacion.Comun;
using PdvAbarrotes.Aplicacion.DTOs.PedidosSugeridos;
using PdvAbarrotes.Aplicacion.Interfaces;
using PdvAbarrotes.Dominio.Entidades;

namespace PdvAbarrotes.Infraestructura.Servicios;

/// <summary>
/// Implementación del servicio de cálculo de Pedido Sugerido Dominical para reabastecimiento eficiente.
/// Analiza velocidad de venta histórica, stock mínimo, punto de reorden y agrupa por proveedor.
/// </summary>
public class ServicioPedidosSugeridos : IServicioPedidosSugeridos
{
    private readonly IContextoPrincipal _contexto;

    public ServicioPedidosSugeridos(IContextoPrincipal contexto)
    {
        _contexto = contexto;
    }

    /// <inheritdoc />
    public async Task<PedidoSugeridoDto> GenerarPedidoSugeridoAsync(GenerarPedidoSugeridoDto dto, CancellationToken ct = default)
    {
        var diasAnalisis = dto.DiasAnalisisHistorial > 0 ? dto.DiasAnalisisHistorial : 14;
        var diasCobertura = dto.DiasCobertura > 0 ? dto.DiasCobertura : 7;
        var fechaFin = DateTime.Now;
        var fechaInicio = fechaFin.AddDays(-diasAnalisis);
        var ahora = DateTime.Now;
        var semana = ISOWeek.GetWeekOfYear(ahora);
        var anio = ahora.Year;

        // 1. Obtener proveedor por defecto del sistema si algún producto carece de proveedor predeterminado
        var proveedorFallback = await _contexto.Proveedores
            .AsNoTracking()
            .Where(p => p.Activo)
            .OrderBy(p => p.IdProveedor)
            .FirstOrDefaultAsync(ct);

        int idProveedorFallback = proveedorFallback?.IdProveedor ?? 1;

        // 2. Consultar productos elegibles (activos y que manejan inventario)
        var consultaProductos = _contexto.Productos
            .AsNoTracking()
            .Include(p => p.CodigosBarras)
            .Include(p => p.Categoria)
            .Include(p => p.UnidadMedida)
            .Include(p => p.ProveedorPredeterminado)
            .Include(p => p.Inventarios)
            .Where(p => p.Activo && p.ManejaInventario);

        if (dto.IdProveedor.HasValue)
        {
            consultaProductos = consultaProductos.Where(p => p.IdProveedorPredeterminado == dto.IdProveedor.Value);
        }

        if (dto.IdCategoria.HasValue)
        {
            consultaProductos = consultaProductos.Where(p => p.IdCategoria == dto.IdCategoria.Value);
        }

        var productos = await consultaProductos.ToListAsync(ct);

        // 3. Consultar volumen de ventas por producto en la ventana de tiempo
        var ventasPorProducto = await _contexto.DetalleVentas
            .AsNoTracking()
            .Where(dv => dv.Venta != null &&
                         !dv.Venta.EsCancelada &&
                         dv.Venta.FechaVenta >= fechaInicio &&
                         dv.Venta.FechaVenta <= fechaFin)
            .GroupBy(dv => dv.IdProducto)
            .Select(g => new
            {
                IdProducto = g.Key,
                CantidadVendida = g.Sum(x => x.Cantidad - x.CantidadDevuelta)
            })
            .ToDictionaryAsync(x => x.IdProducto, x => x.CantidadVendida, ct);

        // 4. Crear entidad de pedido sugerido
        var pedido = new PedidoSugerido
        {
            IdSucursal = dto.IdSucursal,
            FechaGeneracion = ahora,
            SemanaAnio = semana,
            Anio = anio,
            Estado = "GENERADO",
            Observaciones = dto.Observaciones
        };

        // 5. Calcular partida de cada producto
        foreach (var prod in productos)
        {
            var cantidadVendidaPeriodo = ventasPorProducto.GetValueOrDefault(prod.IdProducto, 0m);
            if (cantidadVendidaPeriodo < 0) cantidadVendidaPeriodo = 0m;

            var ventaPromedioDiaria = Math.Round(cantidadVendidaPeriodo / diasAnalisis, 4);
            var demandaEstimada = Math.Round(ventaPromedioDiaria * diasCobertura, 4);

            var existenciaActual = prod.Inventarios
                .Where(i => i.IdSucursal == dto.IdSucursal)
                .Select(i => i.ExistenciaActual)
                .FirstOrDefault();

            var stockMinimo = prod.ExistenciaMinima;
            var stockObjetivo = demandaEstimada + stockMinimo;
            var sugeridoBruto = Math.Max(0m, stockObjetivo - existenciaActual);

            decimal cantidadSugerida;
            if (!prod.PermiteVentaFraccionada)
            {
                cantidadSugerida = Math.Ceiling(sugeridoBruto);
            }
            else
            {
                cantidadSugerida = Math.Round(sugeridoBruto, 2);
            }

            // Si se solicita filtrar solo sugerencias positivas
            if (dto.SoloConSugerenciaPositiva && cantidadSugerida <= 0)
            {
                continue;
            }

            int idProveedor = prod.IdProveedorPredeterminado ?? idProveedorFallback;
            decimal subtotal = Math.Round(cantidadSugerida * prod.PrecioCosto, 2);

            pedido.Detalles.Add(new DetallePedidoSugerido
            {
                IdProducto = prod.IdProducto,
                IdProveedor = idProveedor,
                StockActual = existenciaActual,
                VentaPromedioDiaria = ventaPromedioDiaria,
                DiasCobertura = diasCobertura,
                CantidadSugerida = cantidadSugerida,
                CantidadAjustada = null,
                PrecioCostoUnitario = prod.PrecioCosto,
                SubtotalSugerido = subtotal
            });
        }

        _contexto.PedidosSugeridos.Add(pedido);
        await _contexto.SaveChangesAsync(ct);

        // Devolver el DTO completo estructurado
        return (await ObtenerPedidoPorIdAsync(pedido.IdPedidoSugerido, ct))!;
    }

    /// <inheritdoc />
    public async Task<ResultadoPaginado<PedidoSugeridoResumenDto>> ObtenerPedidosPaginadoAsync(FiltroPedidosSugeridosDto filtro, CancellationToken ct = default)
    {
        var query = _contexto.PedidosSugeridos
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(filtro.Estado))
        {
            query = query.Where(p => p.Estado == filtro.Estado);
        }

        if (filtro.Anio.HasValue)
        {
            query = query.Where(p => p.Anio == filtro.Anio.Value);
        }

        if (filtro.SemanaAnio.HasValue)
        {
            query = query.Where(p => p.SemanaAnio == filtro.SemanaAnio.Value);
        }

        if (filtro.FechaInicio.HasValue)
        {
            query = query.Where(p => p.FechaGeneracion >= filtro.FechaInicio.Value);
        }

        if (filtro.FechaFin.HasValue)
        {
            query = query.Where(p => p.FechaGeneracion <= filtro.FechaFin.Value);
        }

        var totalRegistros = await query.CountAsync(ct);

        var items = await query
            .OrderByDescending(p => p.FechaGeneracion)
            .Skip((filtro.Pagina - 1) * filtro.RegistrosPorPagina)
            .Take(filtro.RegistrosPorPagina)
            .Select(p => new PedidoSugeridoResumenDto
            {
                IdPedidoSugerido = p.IdPedidoSugerido,
                IdSucursal = p.IdSucursal,
                FechaGeneracion = p.FechaGeneracion,
                SemanaAnio = p.SemanaAnio,
                Anio = p.Anio,
                Estado = p.Estado,
                Observaciones = p.Observaciones,
                TotalPartidas = p.Detalles.Count,
                TotalProveedores = p.Detalles.Select(d => d.IdProveedor).Distinct().Count(),
                TotalPiezas = p.Detalles.Sum(d => d.CantidadAjustada ?? d.CantidadSugerida),
                InversionEstimada = p.Detalles.Sum(d => (d.CantidadAjustada ?? d.CantidadSugerida) * d.PrecioCostoUnitario)
            })
            .ToListAsync(ct);

        return new ResultadoPaginado<PedidoSugeridoResumenDto>
        {
            Elementos = items,
            TotalRegistros = totalRegistros,
            PaginaActual = filtro.Pagina,
            RegistrosPorPagina = filtro.RegistrosPorPagina
        };
    }

    /// <inheritdoc />
    public async Task<PedidoSugeridoDto?> ObtenerPedidoPorIdAsync(int idPedidoSugerido, CancellationToken ct = default)
    {
        var pedido = await _contexto.PedidosSugeridos
            .AsNoTracking()
            .Include(p => p.Detalles)
                .ThenInclude(d => d.Producto)
                    .ThenInclude(prod => prod!.Categoria)
            .Include(p => p.Detalles)
                .ThenInclude(d => d.Producto)
                    .ThenInclude(prod => prod!.UnidadMedida)
            .Include(p => p.Detalles)
                .ThenInclude(d => d.Producto)
                    .ThenInclude(prod => prod!.CodigosBarras)
            .Include(p => p.Detalles)
                .ThenInclude(d => d.Proveedor)
            .FirstOrDefaultAsync(p => p.IdPedidoSugerido == idPedidoSugerido, ct);

        if (pedido == null) return null;

        var detallesDto = pedido.Detalles.Select(d =>
        {
            var codigoBarras = d.Producto?.CodigosBarras.FirstOrDefault(cb => cb.EsPrincipal)?.CodigoValor ??
                               d.Producto?.CodigosBarras.FirstOrDefault()?.CodigoValor ??
                               d.Producto?.CodigoProducto ?? string.Empty;

            var demandaEstimada = Math.Round(d.VentaPromedioDiaria * d.DiasCobertura, 4);

            return new DetallePedidoSugeridoDto
            {
                IdDetallePedidoSugerido = d.IdDetallePedidoSugerido,
                IdPedidoSugerido = d.IdPedidoSugerido,
                IdProducto = d.IdProducto,
                CodigoBarras = codigoBarras,
                NombreProducto = d.Producto?.Descripcion ?? $"Producto #{d.IdProducto}",
                Categoria = d.Producto?.Categoria?.Descripcion ?? "Sin Categoría",
                UnidadMedida = d.Producto?.UnidadMedida?.Nombre ?? "Pieza",
                PermiteVentaFraccionada = d.Producto?.PermiteVentaFraccionada ?? false,
                IdProveedor = d.IdProveedor,
                NombreProveedor = d.Proveedor?.Nombre ?? $"Proveedor #{d.IdProveedor}",
                StockActual = d.StockActual,
                StockMinimo = d.Producto?.ExistenciaMinima ?? 0m,
                VentaPromedioDiaria = d.VentaPromedioDiaria,
                DiasCobertura = d.DiasCobertura,
                DemandaEstimada = demandaEstimada,
                CantidadSugerida = d.CantidadSugerida,
                CantidadAjustada = d.CantidadAjustada,
                PrecioCostoUnitario = d.PrecioCostoUnitario,
                SubtotalSugerido = d.SubtotalSugerido
            };
        }).ToList();

        // Agrupar por proveedor
        var grupos = detallesDto
            .GroupBy(d => d.IdProveedor)
            .Select(g =>
            {
                var primerDetalle = g.First();
                var provEntidad = pedido.Detalles.FirstOrDefault(d => d.IdProveedor == g.Key)?.Proveedor;

                return new ProveedorPedidoSugeridoGrupoDto
                {
                    IdProveedor = g.Key,
                    NombreProveedor = primerDetalle.NombreProveedor,
                    Telefono = provEntidad?.Telefono,
                    Email = provEntidad?.Correo,
                    Contacto = provEntidad?.NombreContacto,
                    TotalPartidas = g.Count(),
                    TotalPiezas = g.Sum(x => x.CantidadEfectiva),
                    InversionEstimada = g.Sum(x => x.SubtotalEfectivo),
                    Partidas = g.OrderBy(x => x.NombreProducto).ToList()
                };
            })
            .OrderBy(g => g.NombreProveedor)
            .ToList();

        return new PedidoSugeridoDto
        {
            IdPedidoSugerido = pedido.IdPedidoSugerido,
            IdSucursal = pedido.IdSucursal,
            FechaGeneracion = pedido.FechaGeneracion,
            SemanaAnio = pedido.SemanaAnio,
            Anio = pedido.Anio,
            Estado = pedido.Estado,
            Observaciones = pedido.Observaciones,
            TotalPartidas = detallesDto.Count,
            TotalPiezasSugeridas = detallesDto.Sum(d => d.CantidadSugerida),
            TotalPiezasEfectivas = detallesDto.Sum(d => d.CantidadEfectiva),
            InversionEstimadaSugerida = detallesDto.Sum(d => d.SubtotalSugerido),
            InversionEstimadaEfectiva = detallesDto.Sum(d => d.SubtotalEfectivo),
            Detalles = detallesDto.OrderBy(d => d.NombreProveedor).ThenBy(d => d.NombreProducto).ToList(),
            GruposPorProveedor = grupos
        };
    }

    /// <inheritdoc />
    public async Task<DetallePedidoSugeridoDto> ActualizarCantidadDetalleAsync(int idDetalle, ActualizarDetallePedidoSugeridoDto dto, CancellationToken ct = default)
    {
        var detalle = await _contexto.DetallePedidosSugeridos
            .Include(d => d.PedidoSugerido)
            .Include(d => d.Producto)
                .ThenInclude(p => p!.Categoria)
            .Include(d => d.Producto)
                .ThenInclude(p => p!.UnidadMedida)
            .Include(d => d.Producto)
                .ThenInclude(p => p!.CodigosBarras)
            .Include(d => d.Proveedor)
            .FirstOrDefaultAsync(d => d.IdDetallePedidoSugerido == idDetalle, ct);

        if (detalle == null)
        {
            throw new InvalidOperationException($"Partida de pedido sugerido #{idDetalle} no encontrada.");
        }

        detalle.CantidadAjustada = dto.CantidadAjustada.HasValue ? Math.Max(0m, dto.CantidadAjustada.Value) : null;

        // Si el estado sigue en GENERADO, promover a REVISADO automáticamente al recibir ajustes manuales
        if (detalle.PedidoSugerido != null && detalle.PedidoSugerido.Estado == "GENERADO")
        {
            detalle.PedidoSugerido.Estado = "REVISADO";
        }

        await _contexto.SaveChangesAsync(ct);

        var codigoBarras = detalle.Producto?.CodigosBarras.FirstOrDefault(cb => cb.EsPrincipal)?.CodigoValor ??
                           detalle.Producto?.CodigosBarras.FirstOrDefault()?.CodigoValor ??
                           detalle.Producto?.CodigoProducto ?? string.Empty;

        return new DetallePedidoSugeridoDto
        {
            IdDetallePedidoSugerido = detalle.IdDetallePedidoSugerido,
            IdPedidoSugerido = detalle.IdPedidoSugerido,
            IdProducto = detalle.IdProducto,
            CodigoBarras = codigoBarras,
            NombreProducto = detalle.Producto?.Descripcion ?? $"Producto #{detalle.IdProducto}",
            Categoria = detalle.Producto?.Categoria?.Descripcion ?? "Sin Categoría",
            UnidadMedida = detalle.Producto?.UnidadMedida?.Nombre ?? "Pieza",
            PermiteVentaFraccionada = detalle.Producto?.PermiteVentaFraccionada ?? false,
            IdProveedor = detalle.IdProveedor,
            NombreProveedor = detalle.Proveedor?.Nombre ?? $"Proveedor #{detalle.IdProveedor}",
            StockActual = detalle.StockActual,
            StockMinimo = detalle.Producto?.ExistenciaMinima ?? 0m,
            VentaPromedioDiaria = detalle.VentaPromedioDiaria,
            DiasCobertura = detalle.DiasCobertura,
            DemandaEstimada = Math.Round(detalle.VentaPromedioDiaria * detalle.DiasCobertura, 4),
            CantidadSugerida = detalle.CantidadSugerida,
            CantidadAjustada = detalle.CantidadAjustada,
            PrecioCostoUnitario = detalle.PrecioCostoUnitario,
            SubtotalSugerido = detalle.SubtotalSugerido
        };
    }

    /// <inheritdoc />
    public async Task<PedidoSugeridoDto> ActualizarEstadoAsync(int idPedidoSugerido, ActualizarEstadoPedidoSugeridoDto dto, CancellationToken ct = default)
    {
        var pedido = await _contexto.PedidosSugeridos
            .FirstOrDefaultAsync(p => p.IdPedidoSugerido == idPedidoSugerido, ct);

        if (pedido == null)
        {
            throw new InvalidOperationException($"Pedido sugerido #{idPedidoSugerido} no encontrado.");
        }

        var estadosValidos = new[] { "GENERADO", "REVISADO", "PROCESADO" };
        var nuevoEstado = dto.Estado.Trim().ToUpperInvariant();

        if (!estadosValidos.Contains(nuevoEstado))
        {
            throw new InvalidOperationException($"Estado inválido '{dto.Estado}'. Los estados válidos son: {string.Join(", ", estadosValidos)}.");
        }

        pedido.Estado = nuevoEstado;
        if (!string.IsNullOrWhiteSpace(dto.Observaciones))
        {
            pedido.Observaciones = dto.Observaciones.Trim();
        }

        await _contexto.SaveChangesAsync(ct);

        return (await ObtenerPedidoPorIdAsync(idPedidoSugerido, ct))!;
    }

    /// <inheritdoc />
    public async Task<bool> EliminarPedidoAsync(int idPedidoSugerido, CancellationToken ct = default)
    {
        var pedido = await _contexto.PedidosSugeridos
            .FirstOrDefaultAsync(p => p.IdPedidoSugerido == idPedidoSugerido, ct);

        if (pedido == null) return false;

        if (pedido.Estado == "PROCESADO")
        {
            throw new InvalidOperationException("No se puede eliminar un pedido sugerido que ya ha sido procesado a órdenes de compra.");
        }

        _contexto.PedidosSugeridos.Remove(pedido);
        await _contexto.SaveChangesAsync(ct);
        return true;
    }
}
