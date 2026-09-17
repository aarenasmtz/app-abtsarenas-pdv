namespace PdvAbarrotes.Dominio.Entidades;

/// <summary>
/// Corte de caja (cierre financiero y balance de turno). Mapea a dbo.CortesCaja.
/// </summary>
public class CorteCaja
{
    public int IdCorteCaja { get; set; }
    public int IdTurnoCaja { get; set; }
    public int IdCaja { get; set; }
    public int IdUsuario { get; set; }
    public DateTime FechaCorte { get; set; }
    public decimal MontoInicial { get; set; }
    public decimal VentasEfectivo { get; set; }
    public decimal VentasTarjeta { get; set; }
    public decimal VentasVales { get; set; }
    public decimal VentasCredito { get; set; }
    public decimal EntradasEfectivo { get; set; }
    public decimal SalidasEfectivo { get; set; }
    public decimal TotalEsperado { get; set; }
    public decimal TotalContado { get; set; }
    public decimal Diferencia { get; set; }
    public string? Observaciones { get; set; }

    public virtual TurnoCaja? TurnoCaja { get; set; }
    public virtual Caja? Caja { get; set; }
    public virtual Usuario? Usuario { get; set; }
}
