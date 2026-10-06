using PdvAbarrotes.Aplicacion.Comun;

namespace PdvAbarrotes.Aplicacion.DTOs.Proveedores;

/// <summary>
/// Parámetros de búsqueda y paginación para el catálogo de proveedores.
/// </summary>
public class FiltroProveedoresDto : FiltroPaginacionDto
{
    public string? TerminoBusqueda { get; set; }
    public bool? SoloActivos { get; set; } = true;
}
