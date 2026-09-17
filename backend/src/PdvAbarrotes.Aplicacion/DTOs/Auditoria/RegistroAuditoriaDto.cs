namespace PdvAbarrotes.Aplicacion.DTOs.Auditoria;

/// <summary>
/// Modelo de presentación de un evento de auditoría granular.
/// </summary>
public class RegistroAuditoriaDto
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
