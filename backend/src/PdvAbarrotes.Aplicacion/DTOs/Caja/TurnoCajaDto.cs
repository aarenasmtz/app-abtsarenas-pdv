namespace PdvAbarrotes.Aplicacion.DTOs.Caja;

/// <summary>
/// DTO con la información del turno de trabajo en caja.
/// </summary>
public class TurnoCajaDto
{
    public int IdTurnoCaja { get; set; }
    public int IdCaja { get; set; }
    public string NombreCaja { get; set; } = string.Empty;
    public int IdUsuario { get; set; }
    public string NombreUsuario { get; set; } = string.Empty;
    public DateTime FechaInicio { get; set; }
    public DateTime? FechaCierre { get; set; }
    public string Estatus { get; set; } = string.Empty;
    public decimal MontoInicial { get; set; }
    public decimal VentasEfectivo { get; set; }
    public decimal EntradasEfectivo { get; set; }
    public decimal SalidasEfectivo { get; set; }
    public decimal EfectivoActualEnCaja => MontoInicial + VentasEfectivo + EntradasEfectivo - SalidasEfectivo;
    public int TotalTransacciones { get; set; }
}
