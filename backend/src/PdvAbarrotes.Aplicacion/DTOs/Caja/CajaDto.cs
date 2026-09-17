namespace PdvAbarrotes.Aplicacion.DTOs.Caja;

/// <summary>
/// DTO con la información de una caja o terminal física.
/// </summary>
public class CajaDto
{
    public int IdCaja { get; set; }
    public int IdSucursal { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public bool EsPrincipal { get; set; }
    public string? NombreEquipo { get; set; }
    public string? DireccionIp { get; set; }
    public bool Activo { get; set; }
    public bool TieneTurnoAbierto { get; set; }
    public int? IdTurnoActual { get; set; }
    public string? NombreCajeroActual { get; set; }
}
