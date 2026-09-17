namespace PdvAbarrotes.Dominio.Entidades;

/// <summary>
/// Movimiento manual de efectivo en caja (entradas o salidas de dinero). Mapea a dbo.MovimientosCaja.
/// </summary>
public class MovimientoCaja
{
    public int IdMovimientoCaja { get; set; }
    public int IdTurnoCaja { get; set; }
    public int IdCaja { get; set; }
    public string TipoMovimiento { get; set; } = string.Empty; // Entrada / Salida
    public decimal Monto { get; set; }
    public string Descripcion { get; set; } = string.Empty;
    public DateTime FechaMovimiento { get; set; }

    public virtual TurnoCaja? TurnoCaja { get; set; }
    public virtual Caja? Caja { get; set; }
}
