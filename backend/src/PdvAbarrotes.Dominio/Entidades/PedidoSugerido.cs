namespace PdvAbarrotes.Dominio.Entidades;

/// <summary>
/// Representa una orden de pedido sugerido dominical para reabastecimiento. Mapea a dbo.PedidosSugeridos.
/// </summary>
public class PedidoSugerido
{
    public int IdPedidoSugerido { get; set; }
    public int IdSucursal { get; set; } = 1;
    public DateTime FechaGeneracion { get; set; } = DateTime.Now;
    public int SemanaAnio { get; set; }
    public int Anio { get; set; }
    public string Estado { get; set; } = "GENERADO"; // GENERADO / REVISADO / PROCESADO
    public string? Observaciones { get; set; }

    public virtual ICollection<DetallePedidoSugerido> Detalles { get; set; } = new List<DetallePedidoSugerido>();
}
