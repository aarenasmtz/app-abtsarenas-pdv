namespace PdvAbarrotes.Aplicacion.DTOs.Ventas;

/// <summary>
/// Catálogo de método de pago disponible para cobro en terminales de venta (efectivo, tarjetas, vales, transferencia).
/// </summary>
public class MetodoPagoDto
{
    public int IdMetodoPago { get; set; }
    public string CodigoMetodo { get; set; } = string.Empty;
    public string Descripcion { get; set; } = string.Empty;
    public bool RequiereReferencia { get; set; }
    public bool Activo { get; set; }
}
