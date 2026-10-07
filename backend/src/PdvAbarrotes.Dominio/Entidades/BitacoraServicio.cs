namespace PdvAbarrotes.Dominio.Entidades;

/// <summary>
/// Bitácora operativa de auditoría específica para el ciclo de vida de operaciones de recargas y servicios.
/// Mapea a dbo.BitacoraServicios.
/// </summary>
public class BitacoraServicio
{
    public int IdBitacoraServicio { get; set; }
    public string FolioPos { get; set; } = string.Empty;
    public string Accion { get; set; } = string.Empty;
    public string Mensaje { get; set; } = string.Empty;
    public string? DetallesJson { get; set; }
    public string? Usuario { get; set; }
    public string? DireccionIp { get; set; }
    public DateTime FechaHora { get; set; } = DateTime.Now;
}
