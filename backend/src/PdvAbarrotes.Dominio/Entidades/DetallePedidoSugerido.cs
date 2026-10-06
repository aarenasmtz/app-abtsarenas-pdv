namespace PdvAbarrotes.Dominio.Entidades;

/// <summary>
/// Partida de producto calculada en el pedido sugerido dominical. Mapea a dbo.DetallePedidosSugeridos.
/// </summary>
public class DetallePedidoSugerido
{
    public int IdDetallePedidoSugerido { get; set; }
    public int IdPedidoSugerido { get; set; }
    public int IdProducto { get; set; }
    public int IdProveedor { get; set; }
    public decimal StockActual { get; set; }
    public decimal VentaPromedioDiaria { get; set; }
    public int DiasCobertura { get; set; } = 7;
    public decimal CantidadSugerida { get; set; }
    public decimal? CantidadAjustada { get; set; }
    public decimal PrecioCostoUnitario { get; set; }
    public decimal SubtotalSugerido { get; set; }

    public virtual PedidoSugerido? PedidoSugerido { get; set; }
    public virtual Producto? Producto { get; set; }
    public virtual Proveedor? Proveedor { get; set; }
}
