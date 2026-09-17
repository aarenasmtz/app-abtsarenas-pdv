namespace PdvAbarrotes.Dominio.Entidades;

/// <summary>
/// Venta en espera o ticket pendiente para permitir atender a otro cliente. Mapea a dbo.TicketsPendientes.
/// </summary>
public class TicketPendiente
{
    public int IdTicketPendiente { get; set; }
    public int IdCaja { get; set; }
    public int IdUsuario { get; set; }
    public int IdCliente { get; set; }
    public string IdentificadorCliente { get; set; } = string.Empty;
    public decimal Total { get; set; }
    public DateTime FechaRegistro { get; set; }
    public bool Activo { get; set; }

    public virtual ICollection<DetalleTicketPendiente> Detalles { get; set; } = new List<DetalleTicketPendiente>();
}
