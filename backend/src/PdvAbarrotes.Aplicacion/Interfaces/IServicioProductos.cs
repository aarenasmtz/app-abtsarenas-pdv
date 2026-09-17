using PdvAbarrotes.Aplicacion.Comun;
using PdvAbarrotes.Aplicacion.DTOs.Productos;

namespace PdvAbarrotes.Aplicacion.Interfaces;

/// <summary>
/// Contrato de servicio para la administración y venta de productos en el catálogo y PDV.
/// </summary>
public interface IServicioProductos
{
    /// <summary>
    /// Consulta paginada de productos para el panel administrativo (25/50/100 registros con filtros).
    /// </summary>
    Task<ResultadoPaginado<ProductoAdminDto>> ObtenerPaginadoAdminAsync(FiltroProductosDto filtro, CancellationToken cancellationToken = default);

    /// <summary>
    /// Consulta detallada de un producto por su Id.
    /// </summary>
    Task<ProductoAdminDto> ObtenerPorIdAsync(int idProducto, CancellationToken cancellationToken = default);

    /// <summary>
    /// Registra un nuevo producto en el catálogo y genera su inventario base.
    /// </summary>
    Task<ProductoAdminDto> CrearAsync(CrearProductoDto nuevoProducto, CancellationToken cancellationToken = default);

    /// <summary>
    /// Modifica los datos comerciales, precios o códigos de un producto existente.
    /// </summary>
    Task<ProductoAdminDto> ActualizarAsync(int idProducto, ActualizarProductoDto datosActualizados, CancellationToken cancellationToken = default);

    /// <summary>
    /// Cambia el estado de activación (Activo/Inactivo) de un producto.
    /// </summary>
    Task<bool> CambiarEstadoActivoAsync(int idProducto, bool activo, CancellationToken cancellationToken = default);

    /// <summary>
    /// Consulta ultraligera por código de barras para el escáner de caja del Punto de Venta.
    /// REGLA ESTRICTA: No incluye imágenes ni costos. Respuesta ultrarrápida &lt;50ms.
    /// </summary>
    Task<ProductoCobroDto> BuscarPorCodigoBarrasAsync(string codigoBarras, CancellationToken cancellationToken = default);

    /// <summary>
    /// Buscador predictivo optimizado para la pantalla de cobro del PDV.
    /// Retorna máximo 15 coincidencias sin imágenes.
    /// </summary>
    Task<IReadOnlyList<ResultadoBusquedaPdvDto>> BuscarPdvAsync(string busqueda, int limite = 15, CancellationToken cancellationToken = default);

    /// <summary>
    /// Almacena la imagen del producto en el servidor y actualiza la URL en el catálogo.
    /// </summary>
    Task<string> ActualizarImagenAsync(int idProducto, Stream streamImagen, string nombreArchivoOriginal, CancellationToken cancellationToken = default);
}
