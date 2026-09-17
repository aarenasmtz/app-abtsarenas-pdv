namespace PdvAbarrotes.Dominio.Entidades;

/// <summary>
/// Existencia actual de un producto por sucursal. Mapea a dbo.Inventario.
/// </summary>
public class Inventario
{
    public int IdInventario { get; set; }
    public int IdSucursal { get; set; }
    public int IdProducto { get; set; }
    public decimal ExistenciaActual { get; set; }
    public DateTime FechaUltimaModificacion { get; set; }

    public virtual Producto? Producto { get; set; }
}
