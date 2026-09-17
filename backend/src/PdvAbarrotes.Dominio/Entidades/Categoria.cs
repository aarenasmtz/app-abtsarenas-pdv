namespace PdvAbarrotes.Dominio.Entidades;

/// <summary>
/// Categoría para agrupación de productos. Mapea a dbo.Categorias.
/// </summary>
public class Categoria
{
    public int IdCategoria { get; set; }
    public string Descripcion { get; set; } = string.Empty;
    public bool Activo { get; set; }
    public DateTime FechaRegistro { get; set; }

    public virtual ICollection<Producto> Productos { get; set; } = new List<Producto>();
}
