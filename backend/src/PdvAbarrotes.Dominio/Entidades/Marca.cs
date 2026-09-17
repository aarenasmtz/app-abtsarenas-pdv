namespace PdvAbarrotes.Dominio.Entidades;

/// <summary>
/// Marca de los productos. Mapea a dbo.Marcas.
/// </summary>
public class Marca
{
    public int IdMarca { get; set; }
    public string Descripcion { get; set; } = string.Empty;
    public bool Activo { get; set; }
    public DateTime FechaRegistro { get; set; }

    public virtual ICollection<Producto> Productos { get; set; } = new List<Producto>();
}
