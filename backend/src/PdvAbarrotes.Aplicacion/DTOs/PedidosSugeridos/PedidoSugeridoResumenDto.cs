namespace PdvAbarrotes.Aplicacion.DTOs.PedidosSugeridos;

/// <summary>
/// Resumen ligero para listados históricos de pedidos sugeridos.
/// </summary>
public class PedidoSugeridoResumenDto
{
    public int IdPedidoSugerido { get; set; }
    public int IdSucursal { get; set; }
    public DateTime FechaGeneracion { get; set; }
    public int SemanaAnio { get; set; }
    public int Anio { get; set; }
    public string Estado { get; set; } = string.Empty;
    public string? Observaciones { get; set; }
    public int TotalPartidas { get; set; }
    public int TotalProveedores { get; set; }
    public decimal TotalPiezas { get; set; }
    public decimal InversionEstimada { get; set; }
}
