namespace PdvAbarrotes.Aplicacion.DTOs.PedidosSugeridos;

/// <summary>
/// DTO para cambiar el estado de un pedido sugerido (ej. GENERADO -> REVISADO -> PROCESADO).
/// </summary>
public class ActualizarEstadoPedidoSugeridoDto
{
    public string Estado { get; set; } = string.Empty;
    public string? Observaciones { get; set; }
}
