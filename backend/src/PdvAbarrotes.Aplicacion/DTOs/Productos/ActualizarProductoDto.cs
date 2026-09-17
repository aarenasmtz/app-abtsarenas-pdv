namespace PdvAbarrotes.Aplicacion.DTOs.Productos;

/// <summary>
/// Parámetros para modificar los datos comerciales o precios de un producto.
/// </summary>
public class ActualizarProductoDto
{
    public string CodigoBarrasPrincipal { get; set; } = string.Empty;
    public string Descripcion { get; set; } = string.Empty;
    public int? IdCategoria { get; set; }
    public int? IdMarca { get; set; }
    public int? IdUnidadMedida { get; set; }
    public decimal PrecioCosto { get; set; }
    public decimal PrecioVenta { get; set; }
    public decimal PrecioMayoreo { get; set; }
    public decimal PorcentajeGanancia { get; set; }
    public decimal ExistenciaMinima { get; set; }
    public decimal ExistenciaMaxima { get; set; }
    public bool PermiteVentaFraccionada { get; set; }
    public bool ManejaInventario { get; set; }
    public bool Activo { get; set; }
    public string? ImagenUrl { get; set; }
}
