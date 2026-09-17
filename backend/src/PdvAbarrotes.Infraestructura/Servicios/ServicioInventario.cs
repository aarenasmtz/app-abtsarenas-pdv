using Microsoft.EntityFrameworkCore;
using PdvAbarrotes.Aplicacion.Comun;
using PdvAbarrotes.Aplicacion.DTOs.Inventario;
using PdvAbarrotes.Aplicacion.Interfaces;
using PdvAbarrotes.Dominio.Entidades;
using PdvAbarrotes.Dominio.Excepciones;
using PdvAbarrotes.Infraestructura.Persistencia;

namespace PdvAbarrotes.Infraestructura.Servicios;

/// <summary>
/// Implementación integral del servicio de control de inventarios, Kardex y ajustes de stock.
/// </summary>
public class ServicioInventario : IServicioInventario
{
    private readonly ContextoPrincipal _contexto;
    private readonly IServicioAuditoria _servicioAuditoria;
    private readonly IServicioUsuarioActual _usuarioActual;

    public ServicioInventario(
        ContextoPrincipal contexto, 
        IServicioAuditoria servicioAuditoria, 
        IServicioUsuarioActual usuarioActual)
    {
        _contexto = contexto;
        _servicioAuditoria = servicioAuditoria;
        _usuarioActual = usuarioActual;
    }

    public async Task<ResultadoPaginado<StockProductoDto>> ObtenerStockPaginadoAsync(
        FiltroInventarioDto filtro, 
        CancellationToken cancellationToken = default)
    {
        var consulta = _contexto.Productos
            .AsNoTracking()
            .Include(p => p.Categoria)
            .Include(p => p.Marca)
            .Include(p => p.UnidadMedida)
            .Include(p => p.CodigosBarras)
            .Include(p => p.Inventarios)
            .AsQueryable();

        // 1. Filtrar por búsqueda textual
        if (!string.IsNullOrWhiteSpace(filtro.Busqueda))
        {
            var termino = filtro.Busqueda.Trim().ToLower();
            consulta = consulta.Where(p => 
                p.Descripcion.ToLower().Contains(termino) ||
                (p.CodigoProducto != null && p.CodigoProducto.ToLower().Contains(termino)) ||
                p.CodigosBarras.Any(cb => cb.Activo && cb.CodigoValor.ToLower().Contains(termino)));
        }

        // 2. Filtrar por categoría
        if (filtro.IdCategoria.HasValue && filtro.IdCategoria.Value > 0)
        {
            consulta = consulta.Where(p => p.IdCategoria == filtro.IdCategoria.Value);
        }

        // 3. Filtrar por marca
        if (filtro.IdMarca.HasValue && filtro.IdMarca.Value > 0)
        {
            consulta = consulta.Where(p => p.IdMarca == filtro.IdMarca.Value);
        }

        // 4. Filtrar por estado de activación
        if (filtro.SoloActivos.HasValue)
        {
            consulta = consulta.Where(p => p.Activo == filtro.SoloActivos.Value);
        }

        // 5. Filtrar por artículos con bajo stock
        if (filtro.SoloBajoStock.HasValue && filtro.SoloBajoStock.Value)
        {
            consulta = consulta.Where(p => 
                p.ManejaInventario && 
                (p.Inventarios.Sum(i => (decimal?)i.ExistenciaActual) ?? 0m) <= p.ExistenciaMinima);
        }

        var totalRegistros = await consulta.CountAsync(cancellationToken);

        // Opciones de paginación server-side (25, 50, 100)
        var registrosPorPagina = filtro.RegistrosPorPagina;
        if (registrosPorPagina is not (25 or 50 or 100))
        {
            registrosPorPagina = 25;
        }

        var pagina = filtro.Pagina < 1 ? 1 : filtro.Pagina;

        var elementos = await consulta
            .OrderBy(p => p.Descripcion)
            .Skip((pagina - 1) * registrosPorPagina)
            .Take(registrosPorPagina)
            .Select(p => new
            {
                p.IdProducto,
                CodigoBarras = p.CodigosBarras.Where(cb => cb.EsPrincipal && cb.Activo).Select(cb => cb.CodigoValor).FirstOrDefault() 
                               ?? p.CodigoProducto 
                               ?? string.Empty,
                p.CodigoProducto,
                p.Descripcion,
                Categoria = p.Categoria != null ? p.Categoria.Descripcion : "GENERAL",
                Marca = p.Marca != null ? p.Marca.Descripcion : "SIN MARCA",
                UnidadMedida = p.UnidadMedida != null ? p.UnidadMedida.Nombre : "Pieza",
                p.PrecioCosto,
                p.PrecioVenta,
                ExistenciaActual = p.Inventarios.Sum(i => (decimal?)i.ExistenciaActual) ?? 0m,
                p.ExistenciaMinima,
                p.ExistenciaMaxima,
                p.ManejaInventario,
                p.PermiteVentaFraccionada,
                p.Activo
            })
            .ToListAsync(cancellationToken);

        var dtos = elementos.Select(e =>
        {
            string estadoStock;
            if (e.ExistenciaActual <= 0)
            {
                estadoStock = "Critico";
            }
            else if (e.ExistenciaActual <= e.ExistenciaMinima)
            {
                estadoStock = "Bajo";
            }
            else if (e.ExistenciaMaxima > 0 && e.ExistenciaActual > e.ExistenciaMaxima)
            {
                estadoStock = "Excedido";
            }
            else
            {
                estadoStock = "Optimo";
            }

            return new StockProductoDto
            {
                IdProducto = e.IdProducto,
                CodigoBarras = e.CodigoBarras,
                CodigoProducto = e.CodigoProducto ?? string.Empty,
                Descripcion = e.Descripcion,
                Categoria = e.Categoria,
                Marca = e.Marca,
                UnidadMedida = e.UnidadMedida,
                PrecioCosto = e.PrecioCosto,
                PrecioVenta = e.PrecioVenta,
                ExistenciaActual = e.ExistenciaActual,
                ExistenciaMinima = e.ExistenciaMinima,
                ExistenciaMaxima = e.ExistenciaMaxima,
                ManejaInventario = e.ManejaInventario,
                PermiteVentaFraccionada = e.PermiteVentaFraccionada,
                EstadoStock = estadoStock,
                Activo = e.Activo
            };
        }).ToList();

        return new ResultadoPaginado<StockProductoDto>(dtos, totalRegistros, pagina, registrosPorPagina);
    }

    public async Task<ResultadoPaginado<MovimientoKardexDto>> ObtenerKardexPaginadoAsync(
        FiltroKardexDto filtro, 
        CancellationToken cancellationToken = default)
    {
        var consulta = _contexto.MovimientosInventario
            .AsNoTracking()
            .Include(m => m.Producto)
                .ThenInclude(p => p!.Categoria)
            .Include(m => m.Producto)
                .ThenInclude(p => p!.CodigosBarras)
            .Include(m => m.TipoMovimiento)
            .Include(m => m.Usuario)
            .AsQueryable();

        // 1. Filtrar por producto específico
        if (filtro.IdProducto.HasValue && filtro.IdProducto.Value > 0)
        {
            consulta = consulta.Where(m => m.IdProducto == filtro.IdProducto.Value);
        }

        // 2. Filtrar por tipo de movimiento
        if (filtro.IdTipoMovimiento.HasValue && filtro.IdTipoMovimiento.Value > 0)
        {
            consulta = consulta.Where(m => m.IdTipoMovimiento == filtro.IdTipoMovimiento.Value);
        }

        // 3. Filtrar por rango de fechas
        if (filtro.FechaInicio.HasValue)
        {
            var inicio = filtro.FechaInicio.Value.Date;
            consulta = consulta.Where(m => m.FechaMovimiento >= inicio);
        }

        if (filtro.FechaFin.HasValue)
        {
            var fin = filtro.FechaFin.Value.Date.AddDays(1).AddTicks(-1);
            consulta = consulta.Where(m => m.FechaMovimiento <= fin);
        }

        // 4. Filtrar por texto de búsqueda (nombre del producto o motivo)
        if (!string.IsNullOrWhiteSpace(filtro.Busqueda))
        {
            var termino = filtro.Busqueda.Trim().ToLower();
            consulta = consulta.Where(m => 
                (m.Producto != null && m.Producto.Descripcion.ToLower().Contains(termino)) ||
                (m.Motivo != null && m.Motivo.ToLower().Contains(termino)));
        }

        var totalRegistros = await consulta.CountAsync(cancellationToken);

        var registrosPorPagina = filtro.RegistrosPorPagina;
        if (registrosPorPagina is not (25 or 50 or 100))
        {
            registrosPorPagina = 25;
        }

        var pagina = filtro.Pagina < 1 ? 1 : filtro.Pagina;

        var elementos = await consulta
            .OrderByDescending(m => m.FechaMovimiento)
            .ThenByDescending(m => m.IdMovimientoInventario)
            .Skip((pagina - 1) * registrosPorPagina)
            .Take(registrosPorPagina)
            .Select(m => new MovimientoKardexDto
            {
                IdMovimientoInventario = m.IdMovimientoInventario,
                IdProducto = m.IdProducto,
                CodigoBarras = m.Producto != null
                    ? (m.Producto.CodigosBarras.Where(cb => cb.EsPrincipal && cb.Activo).Select(cb => cb.CodigoValor).FirstOrDefault() ?? m.Producto.CodigoProducto ?? string.Empty)
                    : string.Empty,
                CodigoProducto = m.Producto != null ? (m.Producto.CodigoProducto ?? string.Empty) : string.Empty,
                DescripcionProducto = m.Producto != null ? m.Producto.Descripcion : "PRODUCTO DESCONOCIDO",
                Categoria = m.Producto != null && m.Producto.Categoria != null ? m.Producto.Categoria.Descripcion : "GENERAL",
                IdTipoMovimiento = m.IdTipoMovimiento,
                TipoMovimiento = m.TipoMovimiento != null ? m.TipoMovimiento.Descripcion : "OTRO",
                EfectoStock = m.TipoMovimiento != null ? m.TipoMovimiento.EfectoStock : (short)0,
                CantidadAnterior = m.CantidadAnterior,
                CantidadMovimiento = m.CantidadMovimiento,
                CantidadNueva = m.CantidadNueva,
                PrecioCosto = m.PrecioCosto,
                ReferenciaModulo = m.ReferenciaModulo,
                IdReferencia = m.IdReferencia,
                Motivo = m.Motivo,
                Usuario = m.Usuario != null ? m.Usuario.NombreUsuario : "Sistema",
                FechaMovimiento = m.FechaMovimiento
            })
            .ToListAsync(cancellationToken);

        return new ResultadoPaginado<MovimientoKardexDto>(elementos, totalRegistros, pagina, registrosPorPagina);
    }

    public async Task<MovimientoKardexDto> RegistrarAjusteStockAsync(
        RegistrarAjusteStockDto dto, 
        CancellationToken cancellationToken = default)
    {
        if (dto.CantidadAjuste < 0)
        {
            throw new ExcepcionReglaNegocio("La cantidad para ajuste de inventario no puede ser negativa.");
        }

        var producto = await _contexto.Productos
            .Include(p => p.CodigosBarras)
            .Include(p => p.Categoria)
            .FirstOrDefaultAsync(p => p.IdProducto == dto.IdProducto, cancellationToken)
            ?? throw new ExcepcionNoEncontrado("Producto", dto.IdProducto);

        var inventario = await _contexto.Inventarios
            .FirstOrDefaultAsync(i => i.IdProducto == dto.IdProducto && i.IdSucursal == 1, cancellationToken);

        if (inventario == null)
        {
            inventario = new Inventario
            {
                IdProducto = dto.IdProducto,
                IdSucursal = 1,
                ExistenciaActual = 0,
                FechaUltimaModificacion = DateTime.Now
            };
            _contexto.Inventarios.Add(inventario);
        }

        decimal cantidadAnterior = inventario.ExistenciaActual;
        decimal cantidadMovimiento;
        decimal cantidadNueva;
        int idTipoMovimiento;

        var tipoNormalizado = dto.TipoAjuste?.Trim().ToUpperInvariant() ?? "ENTRADA";

        switch (tipoNormalizado)
        {
            case "ENTRADA":
                cantidadMovimiento = dto.CantidadAjuste;
                cantidadNueva = cantidadAnterior + cantidadMovimiento;
                idTipoMovimiento = 5; // Entrada por Ajuste de Inventario
                break;

            case "SALIDA":
                cantidadMovimiento = dto.CantidadAjuste;
                if (cantidadAnterior < cantidadMovimiento)
                {
                    throw new ExcepcionReglaNegocio($"No es posible descontar {cantidadMovimiento} unidades. La existencia actual es de {cantidadAnterior}.");
                }
                cantidadNueva = cantidadAnterior - cantidadMovimiento;
                idTipoMovimiento = 6; // Salida por Ajuste / Merma
                break;

            case "RECONTEO_FISICO":
                cantidadNueva = dto.CantidadAjuste;
                var diferencia = cantidadNueva - cantidadAnterior;
                cantidadMovimiento = Math.Abs(diferencia);
                idTipoMovimiento = diferencia >= 0 ? 5 : 6;
                break;

            default:
                throw new ExcepcionReglaNegocio($"Tipo de ajuste '{dto.TipoAjuste}' no válido. Use ENTRADA, SALIDA o RECONTEO_FISICO.");
        }

        // 1. Actualizar stock actual
        inventario.ExistenciaActual = cantidadNueva;
        inventario.FechaUltimaModificacion = DateTime.Now;

        // 2. Registrar movimiento inmutable en Kardex
        var movimiento = new MovimientoInventario
        {
            IdSucursal = 1,
            IdProducto = dto.IdProducto,
            IdTipoMovimiento = idTipoMovimiento,
            CantidadAnterior = cantidadAnterior,
            CantidadMovimiento = cantidadMovimiento,
            CantidadNueva = cantidadNueva,
            PrecioCosto = producto.PrecioCosto,
            ReferenciaModulo = "AJUSTE",
            Motivo = string.IsNullOrWhiteSpace(dto.Motivo) ? "Ajuste manual de inventario" : dto.Motivo.Trim(),
            IdUsuario = _usuarioActual.IdUsuario,
            FechaMovimiento = DateTime.Now
        };
        _contexto.MovimientosInventario.Add(movimiento);

        await _contexto.SaveChangesAsync(cancellationToken);

        // 3. Registrar auditoría granular
        var detalleAnterior = $"Existencia: {cantidadAnterior}";
        var detalleNuevo = $"Existencia: {cantidadNueva} ({tipoNormalizado}: {dto.Motivo})";
        await _servicioAuditoria.RegistrarAsync(
            "Inventario", 
            inventario.IdInventario, 
            "AJUSTE_STOCK", 
            detalleAnterior, 
            detalleNuevo, 
            cancellationToken);

        var tipoMovimientoEntidad = await _contexto.TiposMovimientoInventario
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.IdTipoMovimiento == idTipoMovimiento, cancellationToken);

        return new MovimientoKardexDto
        {
            IdMovimientoInventario = movimiento.IdMovimientoInventario,
            IdProducto = producto.IdProducto,
            CodigoBarras = producto.CodigosBarras.Where(cb => cb.EsPrincipal && cb.Activo).Select(cb => cb.CodigoValor).FirstOrDefault() 
                           ?? producto.CodigoProducto 
                           ?? string.Empty,
            CodigoProducto = producto.CodigoProducto ?? string.Empty,
            DescripcionProducto = producto.Descripcion,
            Categoria = producto.Categoria != null ? producto.Categoria.Descripcion : "GENERAL",
            IdTipoMovimiento = idTipoMovimiento,
            TipoMovimiento = tipoMovimientoEntidad != null ? tipoMovimientoEntidad.Descripcion : "AJUSTE",
            EfectoStock = tipoMovimientoEntidad != null ? tipoMovimientoEntidad.EfectoStock : (short)0,
            CantidadAnterior = cantidadAnterior,
            CantidadMovimiento = cantidadMovimiento,
            CantidadNueva = cantidadNueva,
            PrecioCosto = producto.PrecioCosto,
            ReferenciaModulo = "AJUSTE",
            Motivo = movimiento.Motivo,
            Usuario = _usuarioActual.NombreUsuario,
            FechaMovimiento = movimiento.FechaMovimiento
        };
    }

    public async Task<IReadOnlyList<AlertaStockDto>> ObtenerAlertasBajoStockAsync(
        int limite = 50, 
        CancellationToken cancellationToken = default)
    {
        var productos = await _contexto.Productos
            .AsNoTracking()
            .Include(p => p.Categoria)
            .Include(p => p.CodigosBarras)
            .Include(p => p.Inventarios)
            .Where(p => p.Activo && p.ManejaInventario && 
                (p.Inventarios.Sum(i => (decimal?)i.ExistenciaActual) ?? 0m) <= p.ExistenciaMinima)
            .OrderBy(p => (p.Inventarios.Sum(i => (decimal?)i.ExistenciaActual) ?? 0m) <= 0 ? 0 : 1)
            .ThenBy(p => p.Inventarios.Sum(i => (decimal?)i.ExistenciaActual) ?? 0m)
            .Take(limite)
            .Select(p => new
            {
                p.IdProducto,
                CodigoBarras = p.CodigosBarras.Where(cb => cb.EsPrincipal && cb.Activo).Select(cb => cb.CodigoValor).FirstOrDefault() 
                               ?? p.CodigoProducto 
                               ?? string.Empty,
                p.Descripcion,
                Categoria = p.Categoria != null ? p.Categoria.Descripcion : "GENERAL",
                ExistenciaActual = p.Inventarios.Sum(i => (decimal?)i.ExistenciaActual) ?? 0m,
                p.ExistenciaMinima,
                p.ExistenciaMaxima
            })
            .ToListAsync(cancellationToken);

        return productos.Select(p => new AlertaStockDto
        {
            IdProducto = p.IdProducto,
            CodigoBarras = p.CodigoBarras,
            Descripcion = p.Descripcion,
            Categoria = p.Categoria,
            ExistenciaActual = p.ExistenciaActual,
            ExistenciaMinima = p.ExistenciaMinima,
            ExistenciaMaxima = p.ExistenciaMaxima,
            FaltanteParaMinimo = Math.Max(0, p.ExistenciaMinima - p.ExistenciaActual),
            SugeridoParaMaximo = Math.Max(0, p.ExistenciaMaxima - p.ExistenciaActual),
            NivelAlerta = p.ExistenciaActual <= 0 ? "CRITICO" : "BAJO"
        }).ToList();
    }

    public async Task<IReadOnlyList<TipoMovimientoInventarioDto>> ObtenerTiposMovimientoAsync(
        CancellationToken cancellationToken = default)
    {
        var tipos = await _contexto.TiposMovimientoInventario
            .AsNoTracking()
            .Where(t => t.Activo)
            .OrderBy(t => t.IdTipoMovimiento)
            .Select(t => new TipoMovimientoInventarioDto
            {
                IdTipoMovimiento = t.IdTipoMovimiento,
                CodigoTipo = t.CodigoTipo,
                Descripcion = t.Descripcion,
                EfectoStock = t.EfectoStock
            })
            .ToListAsync(cancellationToken);

        return tipos;
    }
}
