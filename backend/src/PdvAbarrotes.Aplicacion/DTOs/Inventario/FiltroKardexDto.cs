using PdvAbarrotes.Aplicacion.Comun;

namespace PdvAbarrotes.Aplicacion.DTOs.Inventario;

/// <summary>
/// Filtros server-side para consultar el historial de Kardex (25/50/100 registros).
/// </summary>
public class FiltroKardexDto : FiltroPaginacionDto
{
    public int? IdProducto { get; set; }
    public int? IdTipoMovimiento { get; set; }
    public DateTime? FechaInicio { get; set; }
    public DateTime? FechaFin { get; set; }
}
