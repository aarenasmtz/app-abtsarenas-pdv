namespace PdvAbarrotes.Aplicacion.DTOs.Catalogos;

/// <summary>
/// Modelo de transferencia de datos para marcas de productos.
/// </summary>
public class MarcaDto
{
    public int IdMarca { get; set; }
    public string Descripcion { get; set; } = string.Empty;
    public bool Activo { get; set; }
    public int TotalProductos { get; set; }
}
