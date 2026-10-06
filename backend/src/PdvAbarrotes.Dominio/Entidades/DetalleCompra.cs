namespace PdvAbarrotes.Dominio.Entidades;

/// <summary>
/// Partida individual de una compra o recepción de mercancía. Mapea a dbo.DetalleCompras.
/// </summary>
public class DetalleCompra
{
    public int IdDetalleCompra { get; set; }
    public int IdCompra { get; set; }
    public int IdProducto { get; set; }
    public int NumeroRenglon { get; set; }
    public decimal CantidadRecibida { get; set; }
    public decimal CostoUnitario { get; set; }
    public decimal TotalRenglon { get; set; }

    public virtual Compra? Compra { get; set; }
    public virtual Producto? Producto { get; set; }
}
