namespace PdvAbarrotes.Dominio.Entidades;

/// <summary>
/// Desglose de cada pago aplicado a una venta (soporte para pagos mixtos). Mapea a dbo.VentaPagos.
/// </summary>
public class VentaPago
{
    public int IdVentaPago { get; set; }
    public int IdVenta { get; set; }
    public int IdMetodoPago { get; set; }
    public decimal Importe { get; set; }
    public string? Referencia { get; set; }
    public DateTime FechaRegistro { get; set; }

    public virtual Venta? Venta { get; set; }
    public virtual MetodoPago? MetodoPago { get; set; }
}
