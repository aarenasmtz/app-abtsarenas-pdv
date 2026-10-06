namespace PdvAbarrotes.Aplicacion.DTOs.PedidosSugeridos;

/// <summary>
/// Agrupación de pedidos sugeridos por proveedor para generación de órdenes de compra o envío por WhatsApp.
/// </summary>
public class ProveedorPedidoSugeridoGrupoDto
{
    public int IdProveedor { get; set; }
    public string NombreProveedor { get; set; } = string.Empty;
    public string? Telefono { get; set; }
    public string? Email { get; set; }
    public string? Contacto { get; set; }

    public int TotalPartidas { get; set; }
    public decimal TotalPiezas { get; set; }
    public decimal InversionEstimada { get; set; }

    public List<DetallePedidoSugeridoDto> Partidas { get; set; } = new();
}
