namespace PdvAbarrotes.Aplicacion.DTOs.Ventas;

/// <summary>
/// Modelo estructurado para impresión y renderizado del ticket de venta térmico (58mm / 80mm).
/// </summary>
public class TicketVentaDto
{
    public int IdVenta { get; set; }
    public string FolioVenta { get; set; } = string.Empty;
    public DateTime FechaVenta { get; set; }
    public string NombreNegocio { get; set; } = "ABARROTES ARENAS";
    public string DireccionNegocio { get; set; } = "Matriz - Tienda Central";
    public string TelefonoNegocio { get; set; } = "";
    public string RfcNegocio { get; set; } = "XAXX010101000";
    public string NombreCajero { get; set; } = string.Empty;
    public string NombreCliente { get; set; } = "Público en General";
    public string Caja { get; set; } = "Caja 1";

    public decimal Subtotal { get; set; }
    public decimal Descuento { get; set; }
    public decimal Impuesto { get; set; }
    public decimal Total { get; set; }
    public decimal ImporteRecibido { get; set; }
    public decimal Cambio { get; set; }
    public decimal TotalArticulos { get; set; }

    public List<ItemTicketDto> Articulos { get; set; } = new();
    public List<PagoTicketDto> Pagos { get; set; } = new();

    public string MensajeAgradecimiento { get; set; } = "¡Gracias por su compra! Vuelva pronto.";
    public string LeyendaFiscal { get; set; } = "Este comprobante no es deducible de impuestos. Solicite su factura en mostrador.";
}

/// <summary>
/// Partida de producto en el ticket de venta.
/// </summary>
public class ItemTicketDto
{
    public string Descripcion { get; set; } = string.Empty;
    public decimal Cantidad { get; set; }
    public decimal PrecioUnitario { get; set; }
    public decimal Importe { get; set; }
}

/// <summary>
/// Desglose de método de pago en el ticket de venta.
/// </summary>
public class PagoTicketDto
{
    public string MetodoPago { get; set; } = string.Empty;
    public decimal Importe { get; set; }
    public string? Referencia { get; set; }
}
