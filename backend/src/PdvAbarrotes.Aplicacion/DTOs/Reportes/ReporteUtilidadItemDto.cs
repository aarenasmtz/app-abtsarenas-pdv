namespace PdvAbarrotes.Aplicacion.DTOs.Reportes;

/// <summary>
/// Renglón para el reporte gerencial de utilidades y margen por producto o categoría.
/// </summary>
public class ReporteUtilidadItemDto
{
    public int IdProducto { get; set; }
    public string CodigoBarras { get; set; } = string.Empty;
    public string Descripcion { get; set; } = string.Empty;
    public string Categoria { get; set; } = string.Empty;
    public decimal CantidadVendida { get; set; }
    public decimal CostoTotal { get; set; }
    public decimal VentaTotal { get; set; }
    public decimal UtilidadBruta { get; set; }
    public decimal MargenPorcentaje { get; set; }
}
