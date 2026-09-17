using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using PdvAbarrotes.Aplicacion.Comun;
using PdvAbarrotes.Aplicacion.DTOs.Productos;
using PdvAbarrotes.Aplicacion.Interfaces;
using PdvAbarrotes.Dominio.Entidades;
using PdvAbarrotes.Dominio.Excepciones;
using PdvAbarrotes.Infraestructura.Persistencia;

namespace PdvAbarrotes.Infraestructura.Servicios;

/// <summary>
/// Implementación integral del servicio de productos para administración y venta en el PDV.
/// </summary>
public class ServicioProductos : IServicioProductos
{
    private readonly ContextoPrincipal _contexto;
    private readonly IServicioAuditoria _servicioAuditoria;
    private readonly IConfiguration _configuracion;

    public ServicioProductos(
        ContextoPrincipal contexto, 
        IServicioAuditoria servicioAuditoria,
        IConfiguration configuracion)
    {
        _contexto = contexto;
        _servicioAuditoria = servicioAuditoria;
        _configuracion = configuracion;
    }

    public async Task<ResultadoPaginado<ProductoAdminDto>> ObtenerPaginadoAdminAsync(
        FiltroProductosDto filtro, 
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

        // 1. Filtrar por texto de búsqueda (código de barras, código producto o descripción)
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

        // 5. Filtrar por productos con bajo stock
        if (filtro.SoloBajoStock.HasValue && filtro.SoloBajoStock.Value)
        {
            consulta = consulta.Where(p => 
                p.ManejaInventario && 
                (p.Inventarios.Sum(i => (decimal?)i.ExistenciaActual) ?? 0m) <= p.ExistenciaMinima);
        }

        var totalRegistros = await consulta.CountAsync(cancellationToken);

        // Opciones de paginación validadas server-side (25, 50, 100)
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
            .Select(p => new ProductoAdminDto
            {
                IdProducto = p.IdProducto,
                CodigoProducto = p.CodigoProducto ?? string.Empty,
                CodigoBarrasPrincipal = p.CodigosBarras.Where(cb => cb.EsPrincipal && cb.Activo).Select(cb => cb.CodigoValor).FirstOrDefault() 
                                       ?? p.CodigoProducto 
                                       ?? string.Empty,
                Descripcion = p.Descripcion,
                IdCategoria = p.IdCategoria,
                CategoriaNombre = p.Categoria != null ? p.Categoria.Descripcion : null,
                IdMarca = p.IdMarca,
                MarcaNombre = p.Marca != null ? p.Marca.Descripcion : null,
                IdUnidadMedida = p.IdUnidadMedida,
                UnidadMedidaNombre = p.UnidadMedida != null ? p.UnidadMedida.Nombre : null,
                PrecioCosto = p.PrecioCosto,
                PrecioVenta = p.PrecioVenta,
                PrecioMayoreo = p.PrecioMayoreo,
                PorcentajeGanancia = p.PorcentajeGanancia,
                ExistenciaActual = p.Inventarios.Sum(i => (decimal?)i.ExistenciaActual) ?? 0m,
                ExistenciaMinima = p.ExistenciaMinima,
                ExistenciaMaxima = p.ExistenciaMaxima,
                PermiteVentaFraccionada = p.PermiteVentaFraccionada,
                ManejaInventario = p.ManejaInventario,
                Activo = p.Activo,
                ImagenUrl = p.ImagenUrl,
                FechaRegistro = p.FechaRegistro,
                FechaModificacion = p.FechaModificacion
            })
            .ToListAsync(cancellationToken);

        return new ResultadoPaginado<ProductoAdminDto>(elementos, totalRegistros, pagina, registrosPorPagina);
    }

    public async Task<ProductoAdminDto> ObtenerPorIdAsync(int idProducto, CancellationToken cancellationToken = default)
    {
        var producto = await _contexto.Productos
            .AsNoTracking()
            .Include(p => p.Categoria)
            .Include(p => p.Marca)
            .Include(p => p.UnidadMedida)
            .Include(p => p.CodigosBarras)
            .Include(p => p.Inventarios)
            .FirstOrDefaultAsync(p => p.IdProducto == idProducto, cancellationToken)
            ?? throw new ExcepcionNoEncontrado("Producto", idProducto);

        return new ProductoAdminDto
        {
            IdProducto = producto.IdProducto,
            CodigoProducto = producto.CodigoProducto ?? string.Empty,
            CodigoBarrasPrincipal = producto.CodigosBarras.Where(cb => cb.EsPrincipal && cb.Activo).Select(cb => cb.CodigoValor).FirstOrDefault() 
                                   ?? producto.CodigoProducto 
                                   ?? string.Empty,
            Descripcion = producto.Descripcion,
            IdCategoria = producto.IdCategoria,
            CategoriaNombre = producto.Categoria?.Descripcion,
            IdMarca = producto.IdMarca,
            MarcaNombre = producto.Marca?.Descripcion,
            IdUnidadMedida = producto.IdUnidadMedida,
            UnidadMedidaNombre = producto.UnidadMedida?.Nombre,
            PrecioCosto = producto.PrecioCosto,
            PrecioVenta = producto.PrecioVenta,
            PrecioMayoreo = producto.PrecioMayoreo,
            PorcentajeGanancia = producto.PorcentajeGanancia,
            ExistenciaActual = producto.Inventarios.Sum(i => (decimal?)i.ExistenciaActual) ?? 0m,
            ExistenciaMinima = producto.ExistenciaMinima,
            ExistenciaMaxima = producto.ExistenciaMaxima,
            PermiteVentaFraccionada = producto.PermiteVentaFraccionada,
            ManejaInventario = producto.ManejaInventario,
            Activo = producto.Activo,
            ImagenUrl = producto.ImagenUrl,
            FechaRegistro = producto.FechaRegistro,
            FechaModificacion = producto.FechaModificacion
        };
    }

    public async Task<ProductoAdminDto> CrearAsync(CrearProductoDto nuevoProducto, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(nuevoProducto.Descripcion))
        {
            throw new ExcepcionReglaNegocio("La descripción del producto es requerida.");
        }

        var codigoBarras = nuevoProducto.CodigoBarras?.Trim() ?? string.Empty;
        var codigoProducto = string.IsNullOrWhiteSpace(nuevoProducto.CodigoProducto) ? codigoBarras : nuevoProducto.CodigoProducto.Trim();

        // Validar unicidad del código de barras principal si se especificó
        if (!string.IsNullOrWhiteSpace(codigoBarras))
        {
            var existeCodigo = await _contexto.CodigosBarras
                .AnyAsync(cb => cb.CodigoValor == codigoBarras && cb.Activo, cancellationToken);

            if (existeCodigo)
            {
                throw new ExcepcionReglaNegocio($"El código de barras '{codigoBarras}' ya se encuentra registrado en otro producto activo.");
            }
        }

        // Calcular porcentaje de ganancia
        var porcentajeGanancia = nuevoProducto.PrecioCosto > 0
            ? Math.Round(((nuevoProducto.PrecioVenta - nuevoProducto.PrecioCosto) / nuevoProducto.PrecioCosto) * 100, 2)
            : nuevoProducto.PorcentajeGanancia;

        var idUnidadMedida = nuevoProducto.IdUnidadMedida is > 0 ? nuevoProducto.IdUnidadMedida.Value : 1; // 1 = Pieza por defecto

        var producto = new Producto
        {
            CodigoProducto = codigoProducto,
            Descripcion = nuevoProducto.Descripcion.Trim(),
            IdCategoria = nuevoProducto.IdCategoria is > 0 ? nuevoProducto.IdCategoria : null,
            IdMarca = nuevoProducto.IdMarca is > 0 ? nuevoProducto.IdMarca : null,
            IdUnidadMedida = idUnidadMedida,
            PrecioCosto = nuevoProducto.PrecioCosto,
            PrecioVenta = nuevoProducto.PrecioVenta,
            PrecioMayoreo = nuevoProducto.PrecioMayoreo > 0 ? nuevoProducto.PrecioMayoreo : nuevoProducto.PrecioVenta,
            PorcentajeGanancia = porcentajeGanancia,
            ExistenciaMinima = nuevoProducto.ExistenciaMinima,
            ExistenciaMaxima = nuevoProducto.ExistenciaMaxima,
            PermiteVentaFraccionada = nuevoProducto.PermiteVentaFraccionada,
            ManejaInventario = nuevoProducto.ManejaInventario,
            EsKit = false,
            Activo = true,
            ImagenUrl = nuevoProducto.ImagenUrl,
            FechaRegistro = DateTime.Now
        };

        _contexto.Productos.Add(producto);
        await _contexto.SaveChangesAsync(cancellationToken);

        // Registrar código de barras principal si se proporcionó
        if (!string.IsNullOrWhiteSpace(codigoBarras))
        {
            var registroCodigo = new CodigoBarras
            {
                IdProducto = producto.IdProducto,
                CodigoValor = codigoBarras,
                EsPrincipal = true,
                Activo = true,
                FechaRegistro = DateTime.Now
            };
            _contexto.CodigosBarras.Add(registroCodigo);
        }

        // Crear registro inicial de inventario en sucursal matriz (1)
        var inventarioInicial = new Inventario
        {
            IdProducto = producto.IdProducto,
            IdSucursal = 1,
            ExistenciaActual = nuevoProducto.ExistenciaInicial,
            FechaUltimaModificacion = DateTime.Now
        };
        _contexto.Inventarios.Add(inventarioInicial);

        await _contexto.SaveChangesAsync(cancellationToken);

        // Registro en auditoría
        var detalleAuditoria = $"Desc: {producto.Descripcion}, Costo: {producto.PrecioCosto:C}, Venta: {producto.PrecioVenta:C}, Stock: {nuevoProducto.ExistenciaInicial}";
        await _servicioAuditoria.RegistrarAsync("Productos", producto.IdProducto, "CREAR", null, detalleAuditoria, cancellationToken);

        return await ObtenerPorIdAsync(producto.IdProducto, cancellationToken);
    }

    public async Task<ProductoAdminDto> ActualizarAsync(
        int idProducto, 
        ActualizarProductoDto datosActualizados, 
        CancellationToken cancellationToken = default)
    {
        var producto = await _contexto.Productos
            .Include(p => p.CodigosBarras)
            .FirstOrDefaultAsync(p => p.IdProducto == idProducto, cancellationToken)
            ?? throw new ExcepcionNoEncontrado("Producto", idProducto);

        if (string.IsNullOrWhiteSpace(datosActualizados.Descripcion))
        {
            throw new ExcepcionReglaNegocio("La descripción del producto no puede estar vacía.");
        }

        // Detección y auditoría específica de cambio de precios
        var huboCambioPrecios = producto.PrecioVenta != datosActualizados.PrecioVenta || 
                               producto.PrecioCosto != datosActualizados.PrecioCosto ||
                               producto.PrecioMayoreo != datosActualizados.PrecioMayoreo;

        var detallePreciosAnteriores = $"Costo: {producto.PrecioCosto:C}, Venta: {producto.PrecioVenta:C}, Mayoreo: {producto.PrecioMayoreo:C}";
        var detallePreciosNuevos = $"Costo: {datosActualizados.PrecioCosto:C}, Venta: {datosActualizados.PrecioVenta:C}, Mayoreo: {datosActualizados.PrecioMayoreo:C}";

        // Calcular porcentaje de ganancia actualizado
        var porcentajeGanancia = datosActualizados.PrecioCosto > 0
            ? Math.Round(((datosActualizados.PrecioVenta - datosActualizados.PrecioCosto) / datosActualizados.PrecioCosto) * 100, 2)
            : datosActualizados.PorcentajeGanancia;

        // Actualizar datos comerciales
        producto.Descripcion = datosActualizados.Descripcion.Trim();
        producto.IdCategoria = datosActualizados.IdCategoria is > 0 ? datosActualizados.IdCategoria : null;
        producto.IdMarca = datosActualizados.IdMarca is > 0 ? datosActualizados.IdMarca : null;
        if (datosActualizados.IdUnidadMedida.HasValue && datosActualizados.IdUnidadMedida.Value > 0)
        {
            producto.IdUnidadMedida = datosActualizados.IdUnidadMedida.Value;
        }

        producto.PrecioCosto = datosActualizados.PrecioCosto;
        producto.PrecioVenta = datosActualizados.PrecioVenta;
        producto.PrecioMayoreo = datosActualizados.PrecioMayoreo;
        producto.PorcentajeGanancia = porcentajeGanancia;
        producto.ExistenciaMinima = datosActualizados.ExistenciaMinima;
        producto.ExistenciaMaxima = datosActualizados.ExistenciaMaxima;
        producto.PermiteVentaFraccionada = datosActualizados.PermiteVentaFraccionada;
        producto.ManejaInventario = datosActualizados.ManejaInventario;
        producto.Activo = datosActualizados.Activo;
        producto.FechaModificacion = DateTime.Now;

        if (!string.IsNullOrWhiteSpace(datosActualizados.ImagenUrl))
        {
            producto.ImagenUrl = datosActualizados.ImagenUrl;
        }

        // Actualizar o crear código de barras principal si se proporcionó uno nuevo
        var codigoBarrasNuevo = datosActualizados.CodigoBarrasPrincipal?.Trim();
        if (!string.IsNullOrWhiteSpace(codigoBarrasNuevo))
        {
            var codigoActual = producto.CodigosBarras.FirstOrDefault(cb => cb.EsPrincipal && cb.Activo);
            if (codigoActual == null)
            {
                _contexto.CodigosBarras.Add(new CodigoBarras
                {
                    IdProducto = producto.IdProducto,
                    CodigoValor = codigoBarrasNuevo,
                    EsPrincipal = true,
                    Activo = true,
                    FechaRegistro = DateTime.Now
                });
            }
            else if (codigoActual.CodigoValor != codigoBarrasNuevo)
            {
                // Verificar que no pertenezca a otro producto
                var enUso = await _contexto.CodigosBarras.AnyAsync(cb => 
                    cb.CodigoValor == codigoBarrasNuevo && 
                    cb.IdProducto != idProducto && 
                    cb.Activo, cancellationToken);

                if (enUso)
                {
                    throw new ExcepcionReglaNegocio($"El código de barras '{codigoBarrasNuevo}' ya está asignado a otro producto activo.");
                }

                codigoActual.CodigoValor = codigoBarrasNuevo;
            }
        }

        await _contexto.SaveChangesAsync(cancellationToken);

        // Registrar auditoría de cambio de precios si aplica
        if (huboCambioPrecios)
        {
            await _servicioAuditoria.RegistrarAsync(
                "Productos", 
                producto.IdProducto, 
                "CAMBIO_PRECIO", 
                detallePreciosAnteriores, 
                detallePreciosNuevos, 
                cancellationToken);
        }

        await _servicioAuditoria.RegistrarAsync(
            "Productos", 
            producto.IdProducto, 
            "ACTUALIZAR", 
            null, 
            $"Producto '{producto.Descripcion}' actualizado", 
            cancellationToken);

        return await ObtenerPorIdAsync(producto.IdProducto, cancellationToken);
    }

    public async Task<bool> CambiarEstadoActivoAsync(int idProducto, bool activo, CancellationToken cancellationToken = default)
    {
        var producto = await _contexto.Productos.FirstOrDefaultAsync(p => p.IdProducto == idProducto, cancellationToken)
            ?? throw new ExcepcionNoEncontrado("Producto", idProducto);

        var estadoAnterior = producto.Activo ? "Activo" : "Inactivo";
        var estadoNuevo = activo ? "Activo" : "Inactivo";

        producto.Activo = activo;
        producto.FechaModificacion = DateTime.Now;
        producto.FechaBaja = activo ? null : DateTime.Now;

        await _contexto.SaveChangesAsync(cancellationToken);

        await _servicioAuditoria.RegistrarAsync(
            "Productos", 
            producto.IdProducto, 
            "CAMBIO_ESTADO", 
            estadoAnterior, 
            estadoNuevo, 
            cancellationToken);

        return true;
    }

    public async Task<ProductoCobroDto> BuscarPorCodigoBarrasAsync(string codigoBarras, CancellationToken cancellationToken = default)
    {
        var codigoLimpio = codigoBarras?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(codigoLimpio))
        {
            throw new ExcepcionReglaNegocio("El código de barras no puede estar vacío.");
        }

        // Búsqueda ultrarrápida indexada en CodigosBarras
        var cb = await _contexto.CodigosBarras
            .AsNoTracking()
            .Include(c => c.Producto)
            .FirstOrDefaultAsync(c => c.CodigoValor == codigoLimpio && c.Activo && c.Producto != null && c.Producto.Activo, cancellationToken);

        Producto? producto = cb?.Producto;

        // Si no se encontró en tabla de códigos de barras, verificar si coincide con CodigoProducto
        if (producto == null)
        {
            producto = await _contexto.Productos
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.CodigoProducto == codigoLimpio && p.Activo, cancellationToken);
        }

        if (producto == null)
        {
            throw new ExcepcionNoEncontrado("Producto", codigoLimpio);
        }

        // Existencia sumada en inventario
        var existencia = await _contexto.Inventarios
            .AsNoTracking()
            .Where(i => i.IdProducto == producto.IdProducto)
            .SumAsync(i => (decimal?)i.ExistenciaActual, cancellationToken) ?? 0m;

        return new ProductoCobroDto
        {
            IdProducto = producto.IdProducto,
            CodigoBarras = cb?.CodigoValor ?? producto.CodigoProducto ?? string.Empty,
            CodigoProducto = producto.CodigoProducto ?? string.Empty,
            Descripcion = producto.Descripcion,
            PrecioVenta = producto.PrecioVenta,
            PrecioMayoreo = producto.PrecioMayoreo,
            PermiteVentaFraccionada = producto.PermiteVentaFraccionada,
            ManejaInventario = producto.ManejaInventario,
            ExistenciaActual = existencia
        };
    }

    public async Task<IReadOnlyList<ResultadoBusquedaPdvDto>> BuscarPdvAsync(string busqueda, int limite = 15, CancellationToken cancellationToken = default)
    {
        var termino = busqueda?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(termino))
        {
            return Array.Empty<ResultadoBusquedaPdvDto>();
        }

        // Consulta predictiva sin imágenes (Collation de SQL Server soporta case/accent insensitivity)
        var consulta = _contexto.Productos
            .AsNoTracking()
            .Include(p => p.Categoria)
            .Include(p => p.CodigosBarras)
            .Include(p => p.Inventarios)
            .Where(p => p.Activo && (
                p.Descripcion.Contains(termino) ||
                (p.CodigoProducto != null && p.CodigoProducto.Contains(termino)) ||
                p.CodigosBarras.Any(cb => cb.Activo && cb.CodigoValor.Contains(termino))
            ))
            .OrderByDescending(p => p.Descripcion.StartsWith(termino))
            .ThenBy(p => p.Descripcion)
            .Take(limite);

        var lista = await consulta.Select(p => new ResultadoBusquedaPdvDto
        {
            IdProducto = p.IdProducto,
            CodigoBarras = p.CodigosBarras.Where(cb => cb.EsPrincipal && cb.Activo).Select(cb => cb.CodigoValor).FirstOrDefault() 
                           ?? p.CodigoProducto 
                           ?? string.Empty,
            Descripcion = p.Descripcion,
            PrecioVenta = p.PrecioVenta,
            ExistenciaActual = p.Inventarios.Sum(i => (decimal?)i.ExistenciaActual) ?? 0m,
            PermiteVentaFraccionada = p.PermiteVentaFraccionada,
            Categoria = p.Categoria != null ? p.Categoria.Descripcion : "GENERAL"
        }).ToListAsync(cancellationToken);

        return lista;
    }

    public async Task<string> ActualizarImagenAsync(
        int idProducto, 
        Stream streamImagen, 
        string nombreArchivoOriginal, 
        CancellationToken cancellationToken = default)
    {
        var producto = await _contexto.Productos.FirstOrDefaultAsync(p => p.IdProducto == idProducto, cancellationToken)
            ?? throw new ExcepcionNoEncontrado("Producto", idProducto);

        var extension = Path.GetExtension(nombreArchivoOriginal).ToLowerInvariant();
        var extensionesPermitidas = new[] { ".jpg", ".jpeg", ".png", ".webp" };

        if (!extensionesPermitidas.Contains(extension))
        {
            throw new ExcepcionReglaNegocio("Formato de imagen inválido. Solo se admiten archivos .jpg, .jpeg, .png o .webp.");
        }

        // Carpeta wwwroot/imagenes/productos
        var carpetaRaiz = _configuracion["Almacenamiento:RutaImagenes"] 
                         ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "imagenes", "productos");

        if (!Directory.Exists(carpetaRaiz))
        {
            Directory.CreateDirectory(carpetaRaiz);
        }

        var nombreArchivo = $"prod_{idProducto}_{DateTime.UtcNow.Ticks}{extension}";
        var rutaCompleta = Path.Combine(carpetaRaiz, nombreArchivo);

        using (var streamDestino = new FileStream(rutaCompleta, FileMode.Create))
        {
            await streamImagen.CopyToAsync(streamDestino, cancellationToken);
        }

        var urlRelativa = $"/imagenes/productos/{nombreArchivo}";
        var urlAnterior = producto.ImagenUrl;

        producto.ImagenUrl = urlRelativa;
        producto.FechaModificacion = DateTime.Now;

        await _contexto.SaveChangesAsync(cancellationToken);

        await _servicioAuditoria.RegistrarAsync(
            "Productos", 
            producto.IdProducto, 
            "ACTUALIZAR_IMAGEN", 
            urlAnterior, 
            urlRelativa, 
            cancellationToken);

        return urlRelativa;
    }
}
