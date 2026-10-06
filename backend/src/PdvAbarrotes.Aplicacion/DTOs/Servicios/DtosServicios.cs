namespace PdvAbarrotes.Aplicacion.DTOs.Servicios;

/// <summary>
/// Catálogo de una compañía de telefonía móvil para recargas de tiempo aire.
/// </summary>
public class CompaniaTelefonicaDto
{
    public string Codigo { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string? LogotipoUrl { get; set; }
    public List<decimal> MontosDisponibles { get; set; } = new();
}

/// <summary>
/// Solicitud para realizar una recarga electrónica de tiempo aire.
/// </summary>
public class SolicitudRecargaDto
{
    public string CodigoCompania { get; set; } = string.Empty;
    public string NumeroTelefono { get; set; } = string.Empty;
    public string ConfirmarNumeroTelefono { get; set; } = string.Empty;
    public decimal Monto { get; set; }
    public int IdSucursal { get; set; } = 1;
    public int IdUsuario { get; set; }
}

/// <summary>
/// Resultado del procesamiento de una recarga electrónica.
/// </summary>
public class ResultadoRecargaDto
{
    public bool Exito { get; set; }
    public string Mensaje { get; set; } = string.Empty;
    public string? FolioProveedor { get; set; }
    public string? CodigoAutorizacion { get; set; }
    public decimal Monto { get; set; }
    public string NumeroTelefono { get; set; } = string.Empty;
    public string Compania { get; set; } = string.Empty;
    public DateTime FechaHora { get; set; } = DateTime.Now;
    public decimal? SaldoRestanteBolsa { get; set; }
}

/// <summary>
/// Servicio público o privado disponible para cobro en mostrador (CFE, Telmex, Agua, etc.).
/// </summary>
public class CatalogoServicioDto
{
    public string Codigo { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string Categoria { get; set; } = string.Empty; // Electricidad, Agua, Telefonía, Televisión, Gas
    public decimal ComisionRecomendada { get; set; } = 12.00m;
    public bool PermiteVencidos { get; set; }
    public string FormatoReferencia { get; set; } = string.Empty;
}

/// <summary>
/// Solicitud de pago de un servicio público en caja.
/// </summary>
public class SolicitudPagoServicioDto
{
    public string CodigoServicio { get; set; } = string.Empty;
    public string ReferenciaRecibo { get; set; } = string.Empty;
    public decimal MontoRecibo { get; set; }
    public decimal Comision { get; set; } = 12.00m;
    public int IdSucursal { get; set; } = 1;
    public int IdUsuario { get; set; }
}

/// <summary>
/// Resultado del pago de servicio ante el proveedor.
/// </summary>
public class ResultadoPagoServicioDto
{
    public bool Exito { get; set; }
    public string Mensaje { get; set; } = string.Empty;
    public string? FolioAutorizacion { get; set; }
    public decimal MontoPagado { get; set; }
    public decimal ComisionCobrada { get; set; }
    public decimal TotalCobrado => MontoPagado + ComisionCobrada;
    public string Servicio { get; set; } = string.Empty;
    public string Referencia { get; set; } = string.Empty;
    public DateTime FechaHora { get; set; } = DateTime.Now;
}

/// <summary>
/// Estado general de la integración con proveedores comerciales externos de TAE y Servicios.
/// </summary>
public class EstadoIntegracionServiciosDto
{
    public bool EstaConfigurado { get; set; }
    public string NombreProveedor { get; set; } = "Pendiente de Contratación";
    public string MensajeEstatus { get; set; } = string.Empty;
    public decimal SaldoBolsaDisponible { get; set; }
    public DateTime? UltimaVerificacion { get; set; }
}
