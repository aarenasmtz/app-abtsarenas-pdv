namespace PdvAbarrotes.Dominio.Entidades;

/// <summary>
/// Representa una venta/ticket registrado en el sistema. Mapea a dbo.Ventas.
/// </summary>
public class Venta
{
    public int IdVenta { get; set; }
    public string FolioVenta { get; set; } = string.Empty;
    public int IdSucursal { get; set; }
    public int IdCaja { get; set; }
    public int IdTurnoCaja { get; set; }
    public int IdUsuario { get; set; }
    public int IdCliente { get; set; }
    public DateTime FechaVenta { get; set; }
    public decimal Subtotal { get; set; }
    public decimal Descuento { get; set; }
    public decimal Impuesto { get; set; }
    public decimal Total { get; set; }
    public decimal Ganancia { get; set; }
    public decimal ImporteRecibido { get; set; }
    public decimal Cambio { get; set; }
    public decimal NumeroArticulos { get; set; }
    public string Estatus { get; set; } = "Completada";
    public bool EsCancelada { get; set; }
    public DateTime? FechaCancelacion { get; set; }
    public int? IdUsuarioCancelacion { get; set; }
    public string? Notas { get; set; }
    public DateTime FechaRegistro { get; set; }
    public Guid? TokenIdempotencia { get; set; }

    public virtual Cliente? Cliente { get; set; }
    public virtual Usuario? Usuario { get; set; }
    public virtual ICollection<DetalleVenta> Detalles { get; set; } = new List<DetalleVenta>();
    public virtual ICollection<VentaPago> Pagos { get; set; } = new List<VentaPago>();
}
