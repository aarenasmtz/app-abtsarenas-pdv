using PdvAbarrotes.Aplicacion.Comun;

namespace PdvAbarrotes.Aplicacion.DTOs.Auditoria;

/// <summary>
/// Parámetros de búsqueda y filtrado para la bitácora de auditoría.
/// </summary>
public class FiltroAuditoriaDto : FiltroPaginacionDto
{
    public string? Tabla { get; set; }
    public string? Accion { get; set; }
    public string? Usuario { get; set; }
    public DateTime? FechaDesde { get; set; }
    public DateTime? FechaHasta { get; set; }
}
