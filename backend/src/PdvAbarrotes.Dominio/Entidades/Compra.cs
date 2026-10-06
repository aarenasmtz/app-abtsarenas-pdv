namespace PdvAbarrotes.Dominio.Entidades;

/// <summary>
/// Representa una orden de compra o recepción de mercancía de proveedores. Mapea a dbo.Compras.
/// </summary>
public class Compra
{
    public int IdCompra { get; set; }
    public int FolioCompra { get; set; }
    public int IdSucursal { get; set; }
    public int? IdProveedor { get; set; }
    public int IdUsuario { get; set; }
    public DateTime FechaCompra { get; set; }
    public decimal TotalCompra { get; set; }
    public string Estatus { get; set; } = "RECIBIDO";
    public string? Observaciones { get; set; }
    public DateTime FechaRegistro { get; set; }

    public virtual Proveedor? Proveedor { get; set; }
    public virtual Usuario? Usuario { get; set; }
    public virtual ICollection<DetalleCompra> Detalles { get; set; } = new List<DetalleCompra>();
}
