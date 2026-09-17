namespace PdvAbarrotes.Dominio.Entidades;

/// <summary>
/// Partida de un ticket de venta. Mapea a dbo.DetalleVentas.
/// </summary>
public class DetalleVenta
{
    public int IdDetalleVenta { get; set; }
    public int IdVenta { get; set; }
    public int IdProducto { get; set; }
    public string CodigoBarras { get; set; } = string.Empty;
    public string Descripcion { get; set; } = string.Empty;
    public decimal Cantidad { get; set; }
    public decimal PrecioCosto { get; set; }
    public decimal PrecioUnitario { get; set; }
    public decimal Descuento { get; set; }
    public decimal Impuesto { get; set; }
    public decimal Subtotal { get; set; }
    public decimal Total { get; set; }
    public decimal Ganancia { get; set; }
    public bool EsDevuelto { get; set; }
    public decimal CantidadDevuelta { get; set; }

    public virtual Venta? Venta { get; set; }
    public virtual Producto? Producto { get; set; }
}
