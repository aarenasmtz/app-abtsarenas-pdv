namespace PdvAbarrotes.Dominio.Entidades;

/// <summary>
/// Partida de un ajuste de inventario. Mapea a dbo.DetalleAjustesInventario.
/// </summary>
public class DetalleAjusteInventario
{
    public int IdDetalleAjuste { get; set; }
    public int IdAjusteInventario { get; set; }
    public int IdProducto { get; set; }
    public decimal Cantidad { get; set; }
    public decimal PrecioCosto { get; set; }

    // Propiedades de navegación
    public virtual AjusteInventario? AjusteInventario { get; set; }
    public virtual Producto? Producto { get; set; }
}
