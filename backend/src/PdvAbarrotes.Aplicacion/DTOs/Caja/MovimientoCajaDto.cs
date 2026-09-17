namespace PdvAbarrotes.Aplicacion.DTOs.Caja;

/// <summary>
/// DTO con los datos de un movimiento manual de efectivo en caja.
/// </summary>
public class MovimientoCajaDto
{
    public int IdMovimientoCaja { get; set; }
    public int IdTurnoCaja { get; set; }
    public int IdCaja { get; set; }
    public string TipoMovimiento { get; set; } = string.Empty; // ENTRADA / SALIDA
    public decimal Monto { get; set; }
    public string Descripcion { get; set; } = string.Empty;
    public DateTime FechaMovimiento { get; set; }
}
