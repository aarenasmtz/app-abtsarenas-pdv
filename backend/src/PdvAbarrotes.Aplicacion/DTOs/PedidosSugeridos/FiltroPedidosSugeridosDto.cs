using PdvAbarrotes.Aplicacion.Comun;

namespace PdvAbarrotes.Aplicacion.DTOs.PedidosSugeridos;

/// <summary>
/// Criterios de filtrado y paginación para el historial de pedidos sugeridos.
/// </summary>
public class FiltroPedidosSugeridosDto : FiltroPaginacionDto
{
    public string? Estado { get; set; }
    public int? Anio { get; set; }
    public int? SemanaAnio { get; set; }
    public DateTime? FechaInicio { get; set; }
    public DateTime? FechaFin { get; set; }
}
