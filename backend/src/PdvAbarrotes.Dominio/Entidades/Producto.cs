namespace PdvAbarrotes.Dominio.Entidades;

/// <summary>
/// Representa un producto en el catálogo del sistema. Mapea a dbo.Productos.
/// </summary>
public class Producto
{
    public int IdProducto { get; set; }
    public string CodigoProducto { get; set; } = string.Empty;
    public string Descripcion { get; set; } = string.Empty;
    public int? IdCategoria { get; set; }
    public int? IdMarca { get; set; }
    public int? IdUnidadMedida { get; set; }
    public int? IdProveedorPredeterminado { get; set; }
    public decimal PrecioCosto { get; set; }
    public decimal PrecioVenta { get; set; }
    public decimal PrecioMayoreo { get; set; }
    public decimal PorcentajeGanancia { get; set; }
    public decimal ExistenciaMinima { get; set; }
    public decimal ExistenciaMaxima { get; set; }
    public bool PermiteVentaFraccionada { get; set; }
    public bool ManejaInventario { get; set; }
    public bool EsKit { get; set; }
    public bool Activo { get; set; }
    public string? ImagenUrl { get; set; }
    public DateTime FechaRegistro { get; set; }
    public DateTime? FechaModificacion { get; set; }
    public DateTime? FechaBaja { get; set; }

    // Propiedades de navegación
    public virtual Categoria? Categoria { get; set; }
    public virtual Marca? Marca { get; set; }
    public virtual UnidadMedida? UnidadMedida { get; set; }
    public virtual Proveedor? ProveedorPredeterminado { get; set; }
    public virtual ICollection<CodigoBarras> CodigosBarras { get; set; } = new List<CodigoBarras>();
    public virtual ICollection<Inventario> Inventarios { get; set; } = new List<Inventario>();
}
