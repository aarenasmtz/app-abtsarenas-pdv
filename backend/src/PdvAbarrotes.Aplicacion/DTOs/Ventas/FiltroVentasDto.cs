using PdvAbarrotes.Aplicacion.Comun;

namespace PdvAbarrotes.Aplicacion.DTOs.Ventas;

/// <summary>
/// Criterios de búsqueda y filtrado de ventas para reimpresión y consultas.
/// </summary>
public class FiltroVentasDto : FiltroPaginacionDto
{
    /// <summary>
    /// Búsqueda por folio de venta o nombre de cliente.
    /// </summary>
    public string? TerminoBusqueda { get; set; }

    /// <summary>
    /// Filtrar por fecha específica o inicial.
    /// </summary>
    public DateTime? FechaInicio { get; set; }

    /// <summary>
    /// Fecha final para rango.
    /// </summary>
    public DateTime? FechaFin { get; set; }

    /// <summary>
    /// Filtrar por caja específica.
    /// </summary>
    public int? IdCaja { get; set; }

    /// <summary>
    /// Filtrar por usuario/cajero específico.
    /// </summary>
    public int? IdUsuario { get; set; }
}
