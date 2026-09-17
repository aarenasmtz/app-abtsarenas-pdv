namespace PdvAbarrotes.Dominio.Entidades;

/// <summary>
/// Terminal de cobro o estación de trabajo. Mapea a dbo.Cajas.
/// </summary>
public class Caja
{
    public int IdCaja { get; set; }
    public int IdSucursal { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public bool EsPrincipal { get; set; }
    public string? NombreEquipo { get; set; }
    public string? DireccionIp { get; set; }
    public bool Activo { get; set; }
    public DateTime FechaRegistro { get; set; }
}
