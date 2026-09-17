namespace PdvAbarrotes.Dominio.Entidades;

/// <summary>
/// Partida de un ticket pendiente. Mapea a dbo.DetalleTicketsPendientes.
/// </summary>
public class DetalleTicketPendiente
{
    public int IdDetalleTicketPendiente { get; set; }
    public int IdTicketPendiente { get; set; }
    public int IdProducto { get; set; }
    public decimal Cantidad { get; set; }
    public decimal PrecioUnitario { get; set; }
    public decimal Subtotal { get; set; }
    public string? Notas { get; set; }

    public virtual TicketPendiente? TicketPendiente { get; set; }
    public virtual Producto? Producto { get; set; }
}
