namespace PdvAbarrotes.Aplicacion.DTOs.Catalogos;

/// <summary>
/// Modelo de transferencia de datos para categorías de productos.
/// </summary>
public class CategoriaDto
{
    public int IdCategoria { get; set; }
    public string Descripcion { get; set; } = string.Empty;
    public bool Activo { get; set; }
    public int TotalProductos { get; set; }
}
