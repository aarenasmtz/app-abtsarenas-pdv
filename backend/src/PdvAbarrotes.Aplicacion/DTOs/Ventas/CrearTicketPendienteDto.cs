namespace PdvAbarrotes.Aplicacion.DTOs.Ventas;

/// <summary>
/// Solicitud para poner una venta en espera o ticket pendiente.
/// </summary>
public class CrearTicketPendienteDto
{
    public int IdCaja { get; set; } = 1;
    public int IdCliente { get; set; } = 1;
    public string IdentificadorCliente { get; set; } = string.Empty;
    public List<ItemTicketPendienteDto> Articulos { get; set; } = new();
}

/// <summary>
/// Renglón de artículo para el ticket en espera.
/// </summary>
public class ItemTicketPendienteDto
{
    public int IdProducto { get; set; }
    public string CodigoBarras { get; set; } = string.Empty;
    public string Descripcion { get; set; } = string.Empty;
    public decimal Cantidad { get; set; }
    public decimal PrecioUnitario { get; set; }
    public decimal Subtotal { get; set; }
    public string? Notas { get; set; }
}
