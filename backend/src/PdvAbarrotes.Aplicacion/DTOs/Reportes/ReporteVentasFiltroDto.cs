using PdvAbarrotes.Aplicacion.Comun;

namespace PdvAbarrotes.Aplicacion.DTOs.Reportes;

/// <summary>
/// Filtros para la consulta y exportación de reportes de ventas y tickets.
/// </summary>
public class ReporteVentasFiltroDto : FiltroPaginacionDto
{
    public DateTime? FechaInicio { get; set; }
    public DateTime? FechaFin { get; set; }
    public int? IdUsuario { get; set; }
    public int? IdCaja { get; set; }
    public int? IdMetodoPago { get; set; }
    public bool? SoloCanceladas { get; set; }
    public string? TerminoBusqueda { get; set; }
}
