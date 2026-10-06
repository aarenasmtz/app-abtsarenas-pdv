using PdvAbarrotes.Aplicacion.Comun;
using PdvAbarrotes.Aplicacion.DTOs.Proveedores;

namespace PdvAbarrotes.Aplicacion.Interfaces;

/// <summary>
/// Contrato para el catálogo y gestión de proveedores comerciales.
/// </summary>
public interface IServicioProveedores
{
    /// <summary>
    /// Consulta paginada del catálogo de proveedores con filtros de búsqueda y estado.
    /// </summary>
    Task<ResultadoPaginado<ProveedorDto>> ObtenerPaginadoAsync(FiltroProveedoresDto filtro, CancellationToken ct = default);

    /// <summary>
    /// Obtiene la lista completa de proveedores activos para listas desplegables y combos de compras.
    /// </summary>
    Task<IReadOnlyList<ProveedorDto>> ObtenerTodosActivosAsync(CancellationToken ct = default);

    /// <summary>
    /// Obtiene un proveedor por su identificador único.
    /// </summary>
    Task<ProveedorDto?> ObtenerPorIdAsync(int id, CancellationToken ct = default);

    /// <summary>
    /// Crea un nuevo proveedor en el catálogo con registro en auditoría.
    /// </summary>
    Task<ProveedorDto> CrearAsync(CrearProveedorDto dto, int idUsuario, CancellationToken ct = default);

    /// <summary>
    /// Actualiza los datos de contacto y comerciales de un proveedor con auditoría de cambios.
    /// </summary>
    Task<ProveedorDto> ActualizarAsync(ActualizarProveedorDto dto, int idUsuario, CancellationToken ct = default);

    /// <summary>
    /// Activa o desactiva un proveedor en el catálogo.
    /// </summary>
    Task<bool> CambiarEstadoActivoAsync(int id, bool activo, int idUsuario, CancellationToken ct = default);
}
