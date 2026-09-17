namespace PdvAbarrotes.Aplicacion.DTOs.Inventario;

/// <summary>
/// Modelo de resumen del inventario actual y semáforo de reorden de un producto.
/// </summary>
public class StockProductoDto
{
    public int IdProducto { get; set; }
    public string CodigoBarras { get; set; } = string.Empty;
    public string CodigoProducto { get; set; } = string.Empty;
    public string Descripcion { get; set; } = string.Empty;
    public string Categoria { get; set; } = string.Empty;
    public string Marca { get; set; } = string.Empty;
    public string UnidadMedida { get; set; } = string.Empty;
    public decimal PrecioCosto { get; set; }
    public decimal PrecioVenta { get; set; }
    public decimal ExistenciaActual { get; set; }
    public decimal ExistenciaMinima { get; set; }
    public decimal ExistenciaMaxima { get; set; }
    public bool ManejaInventario { get; set; }
    public bool PermiteVentaFraccionada { get; set; }
    public string EstadoStock { get; set; } = "Optimo"; // "Critico", "Bajo", "Optimo", "Excedido"
    public bool Activo { get; set; }
}
