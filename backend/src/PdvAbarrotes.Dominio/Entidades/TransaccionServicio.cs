namespace PdvAbarrotes.Dominio.Entidades;

/// <summary>
/// Representa una transacción individual de recarga o pago de servicio procesada vía Red Nacional de Pagos (RNP).
/// </summary>
public class TransaccionServicio
{
    public int IdTransaccionServicio { get; set; }
    
    /// <summary>
    /// Identificador alfanumérico único para RNP (Prefijo 10008 + valor único, máx 30 caracteres).
    /// </summary>
    public string FolioPos { get; set; } = string.Empty;
    
    public string TipoTransaccion { get; set; } = string.Empty; // 'RECARGA' | 'SERVICIO'
    public string CarrierId { get; set; } = string.Empty;       // SKU en RNP (ej. '01', '17')
    public string CarrierNombre { get; set; } = string.Empty;   // Ej: 'TELCEL', 'CFE'
    public string Referencia { get; set; } = string.Empty;      // Teléfono o cuenta de recibo
    public decimal Monto { get; set; }
    public decimal Comision { get; set; }
    public decimal TotalCobrado { get; set; }
    
    public string Estado { get; set; } = "PENDIENTE";           // PENDIENTE, EN_ESPERA, EXITOSA, FALLIDA, TIMEOUT
    public string? CodigoRespuesta { get; set; }               // Código numérico devuelto por RNP (00, 24, 01, etc.)
    public string? DescripcionRespuesta { get; set; }
    public string? FolioProveedor { get; set; }                // Folio RNP
    public string? FolioCarrier { get; set; }                  // Folio operadora
    public string? AvisoNotice { get; set; }                   // Mensaje adicional 'Notice'
    public decimal? SaldoPosterior { get; set; }
    public DateTime? FechaOperacionRnp { get; set; }
    
    public int? IdUsuario { get; set; }
    public int? IdCaja { get; set; }
    public int? IdVenta { get; set; }
    
    public int ReintentosConsulta { get; set; } = 0;
    public DateTime? UltimaConsultaEstado { get; set; }
    
    public string? DatosPeticionJson { get; set; }
    public string? DatosRespuestaJson { get; set; }
    
    public DateTime FechaCreacion { get; set; } = DateTime.Now;
    public DateTime? FechaActualizacion { get; set; }

    // Propiedades de navegación opcionales
    public virtual Usuario? Usuario { get; set; }
    public virtual Caja? Caja { get; set; }
    public virtual Venta? Venta { get; set; }
}
