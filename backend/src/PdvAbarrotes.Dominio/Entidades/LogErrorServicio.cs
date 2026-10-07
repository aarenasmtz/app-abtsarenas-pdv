namespace PdvAbarrotes.Dominio.Entidades;

/// <summary>
/// Log de errores técnicos, rechazos del proveedor y excepciones de red/SOAP para la integración RNP.
/// Mapea a dbo.LogErroresServicios.
/// </summary>
public class LogErrorServicio
{
    public int IdLogError { get; set; }
    public string? FolioPos { get; set; }
    public string MetodoSoap { get; set; } = string.Empty;
    public string TipoError { get; set; } = string.Empty;
    public string? CodigoError { get; set; }
    public string MensajeError { get; set; } = string.Empty;
    public string? PeticionXmlOJson { get; set; }
    public string? RespuestaXmlOJson { get; set; }
    public string? StackTrace { get; set; }
    public DateTime FechaHora { get; set; } = DateTime.Now;
}
