namespace PdvAbarrotes.Aplicacion.DTOs.Productos;

/// <summary>
/// Parámetros para registrar un nuevo producto en el catálogo.
/// </summary>
public class CrearProductoDto
{
    public string CodigoProducto { get; set; } = string.Empty;
    public string CodigoBarras { get; set; } = string.Empty;
    public string Descripcion { get; set; } = string.Empty;
    public int? IdCategoria { get; set; }
    public int? IdMarca { get; set; }
    public int? IdUnidadMedida { get; set; }
    public decimal PrecioCosto { get; set; }
    public decimal PrecioVenta { get; set; }
    public decimal PrecioMayoreo { get; set; }
    public decimal PorcentajeGanancia { get; set; }
    public decimal ExistenciaInicial { get; set; }
    public decimal ExistenciaMinima { get; set; } = 5;
    public decimal ExistenciaMaxima { get; set; } = 100;
    public bool PermiteVentaFraccionada { get; set; } = false;
    public bool ManejaInventario { get; set; } = true;
    public string? ImagenUrl { get; set; }
}
