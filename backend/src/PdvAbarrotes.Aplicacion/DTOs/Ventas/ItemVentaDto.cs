namespace PdvAbarrotes.Aplicacion.DTOs.Ventas;

/// <summary>
/// Representa una partida o renglón de producto en el carrito de venta del PDV.
/// </summary>
public class ItemVentaDto
{
    /// <summary>
    /// Identificador del producto.
    /// </summary>
    public int IdProducto { get; set; }

    /// <summary>
    /// Código de barras del producto.
    /// </summary>
    public string CodigoBarras { get; set; } = string.Empty;

    /// <summary>
    /// Descripción o nombre comercial del producto.
    /// </summary>
    public string Descripcion { get; set; } = string.Empty;

    /// <summary>
    /// Cantidad de unidades o peso en kilogramos a vender.
    /// </summary>
    public decimal Cantidad { get; set; }

    /// <summary>
    /// Precio unitario de venta cobrado al cliente.
    /// </summary>
    public decimal PrecioUnitario { get; set; }

    /// <summary>
    /// Descuento monetario aplicado a esta partida.
    /// </summary>
    public decimal Descuento { get; set; }

    /// <summary>
    /// Subtotal de la partida (Cantidad * PrecioUnitario - Descuento).
    /// </summary>
    public decimal Subtotal { get; set; }

    /// <summary>
    /// Notas específicas del producto si aplica.
    /// </summary>
    public string? Notas { get; set; }
}
