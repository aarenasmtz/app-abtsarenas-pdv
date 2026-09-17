namespace PdvAbarrotes.Aplicacion.DTOs.Caja;

/// <summary>
/// DTO con los datos de un corte de caja registrado en el historial.
/// </summary>
public class CorteCajaDto
{
    public int IdCorteCaja { get; set; }
    public int IdTurnoCaja { get; set; }
    public int IdCaja { get; set; }
    public string NombreCaja { get; set; } = string.Empty;
    public int IdUsuario { get; set; }
    public string NombreUsuario { get; set; } = string.Empty;
    public DateTime FechaCorte { get; set; }
    public string TipoCorte { get; set; } = "Z";
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
}
