namespace PdvAbarrotes.Aplicacion.DTOs.Compras;

/// <summary>
/// DTO con la información de un renglón o partida recibida en una compra.
/// </summary>
public class DetalleCompraDto
{
    public int IdDetalleCompra { get; set; }
    public int IdCompra { get; set; }
    public int IdProducto { get; set; }
    public string CodigoBarras { get; set; } = string.Empty;
    public string DescripcionProducto { get; set; } = string.Empty;
    public int NumeroRenglon { get; set; }
    public decimal CantidadRecibida { get; set; }
    public decimal CostoUnitario { get; set; }
    public decimal TotalRenglon { get; set; }
}
