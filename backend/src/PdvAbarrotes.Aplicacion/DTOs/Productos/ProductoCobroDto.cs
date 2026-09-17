namespace PdvAbarrotes.Aplicacion.DTOs.Productos;

/// <summary>
/// Modelo ultraligero para consulta de escáner y cobro en el Punto de Venta (PDV).
/// REGLA ESTRICTA: No contiene imagen ni costos para garantizar latencia mínima en caja.
/// </summary>
public class ProductoCobroDto
{
    public int IdProducto { get; set; }
    public string CodigoBarras { get; set; } = string.Empty;
    public string CodigoProducto { get; set; } = string.Empty;
    public string Descripcion { get; set; } = string.Empty;
    public decimal PrecioVenta { get; set; }
    public decimal PrecioMayoreo { get; set; }
    public bool PermiteVentaFraccionada { get; set; }
    public bool ManejaInventario { get; set; }
    public decimal ExistenciaActual { get; set; }
    public decimal CantidadSugerida { get; set; } = 1.0m;
    public bool EsPesableConCodigo { get; set; }
}
