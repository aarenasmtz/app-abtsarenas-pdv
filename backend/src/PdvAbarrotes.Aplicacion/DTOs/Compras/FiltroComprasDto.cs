using PdvAbarrotes.Aplicacion.Comun;

namespace PdvAbarrotes.Aplicacion.DTOs.Compras;

/// <summary>
/// Criterios de filtrado y paginación para el historial de compras.
/// </summary>
public class FiltroComprasDto : FiltroPaginacionDto
{
    public int? IdProveedor { get; set; }
    public DateTime? FechaInicio { get; set; }
    public DateTime? FechaFin { get; set; }
    public string? TerminoBusqueda { get; set; }
}
