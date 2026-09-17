namespace PdvAbarrotes.Aplicacion.DTOs.Caja;

/// <summary>
/// Resumen financiero completo de un corte de caja (Corte X preliminar o Corte Z definitivo).
/// </summary>
public class ResumenCorteDto
{
    public int? IdCorteCaja { get; set; }
    public int IdTurnoCaja { get; set; }
    public int IdCaja { get; set; }
    public string NombreCaja { get; set; } = string.Empty;
    public int IdUsuario { get; set; }
    public string NombreUsuario { get; set; } = string.Empty;
    public DateTime FechaInicio { get; set; }
    public DateTime FechaCorte { get; set; }
    public string TipoCorte { get; set; } = "X"; // "X" (Parcial/Informativo) o "Z" (Cierre de Turno)
    public decimal MontoInicial { get; set; }
    public decimal VentasEfectivo { get; set; }
    public decimal VentasTarjeta { get; set; }
    public decimal VentasTransferencia { get; set; }
    public decimal VentasVales { get; set; }
    public decimal VentasCredito { get; set; }
    public decimal TotalVentas { get; set; }
    public decimal EntradasEfectivo { get; set; }
    public decimal SalidasEfectivo { get; set; }
    public decimal TotalEsperadoEnCaja { get; set; }
    public decimal TotalContado { get; set; }
    public decimal Diferencia { get; set; }
    public string? Observaciones { get; set; }
    public int TotalTransacciones { get; set; }
    public string EstatusTurno { get; set; } = string.Empty;
}
