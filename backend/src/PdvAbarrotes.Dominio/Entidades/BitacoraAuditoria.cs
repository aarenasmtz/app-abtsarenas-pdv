namespace PdvAbarrotes.Dominio.Entidades;

/// <summary>
/// Bitácora de auditoría detallada con valores anteriores y nuevos. Mapea a dbo.BitacoraAuditoria.
/// </summary>
public class BitacoraAuditoria
{
    public int IdAuditoria { get; set; }
    public string Tabla { get; set; } = string.Empty;
    public int IdRegistro { get; set; }
    public string Accion { get; set; } = string.Empty;
    public string? ValorAnterior { get; set; }
    public string? ValorNuevo { get; set; }
    public string Usuario { get; set; } = string.Empty;
    public DateTime FechaHora { get; set; }
    public string? DireccionIp { get; set; }
}
