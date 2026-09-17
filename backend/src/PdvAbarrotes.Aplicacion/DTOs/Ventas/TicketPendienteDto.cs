namespace PdvAbarrotes.Aplicacion.DTOs.Ventas;

/// <summary>
/// Representación de una venta en espera activa con sus partidas para consulta o recuperación en caja.
/// </summary>
public class TicketPendienteDto
{
    public int IdTicketPendiente { get; set; }
    public int IdCaja { get; set; }
    public int IdUsuario { get; set; }
    public string NombreUsuario { get; set; } = string.Empty;
    public int IdCliente { get; set; }
    public string IdentificadorCliente { get; set; } = string.Empty;
    public decimal Total { get; set; }
    public decimal CantidadArticulos { get; set; }
    public DateTime FechaRegistro { get; set; }
    public bool Activo { get; set; }
    public List<ItemTicketPendienteDto> Articulos { get; set; } = new();
}
