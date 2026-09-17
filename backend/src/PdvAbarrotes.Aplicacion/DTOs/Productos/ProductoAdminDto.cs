namespace PdvAbarrotes.Aplicacion.DTOs.Productos;

/// <summary>
/// Modelo de datos completo para la administración de productos.
/// Incluye imagen, costos y márgenes (exclusivo para el módulo administrativo).
/// </summary>
public class ProductoAdminDto
{
    public int IdProducto { get; set; }
    public string CodigoProducto { get; set; } = string.Empty;
    public string CodigoBarrasPrincipal { get; set; } = string.Empty;
    public string Descripcion { get; set; } = string.Empty;
    public int? IdCategoria { get; set; }
    public string? CategoriaNombre { get; set; }
    public int? IdMarca { get; set; }
    public string? MarcaNombre { get; set; }
    public int? IdUnidadMedida { get; set; }
    public string? UnidadMedidaNombre { get; set; }
    public decimal PrecioCosto { get; set; }
    public decimal PrecioVenta { get; set; }
    public decimal PrecioMayoreo { get; set; }
    public decimal PorcentajeGanancia { get; set; }
    public decimal ExistenciaActual { get; set; }
    public decimal ExistenciaMinima { get; set; }
    public decimal ExistenciaMaxima { get; set; }
    public bool PermiteVentaFraccionada { get; set; }
    public bool ManejaInventario { get; set; }
    public bool Activo { get; set; }
    public string? ImagenUrl { get; set; }
    public DateTime FechaRegistro { get; set; }
    public DateTime? FechaModificacion { get; set; }
}
