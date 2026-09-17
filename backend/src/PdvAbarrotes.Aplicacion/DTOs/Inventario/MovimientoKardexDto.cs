namespace PdvAbarrotes.Aplicacion.DTOs.Inventario;

/// <summary>
/// Modelo de datos detallado de una transacción histórica en el Kardex de inventario.
/// </summary>
public class MovimientoKardexDto
{
    public int IdMovimientoInventario { get; set; }
    public int IdProducto { get; set; }
    public string CodigoBarras { get; set; } = string.Empty;
    public string CodigoProducto { get; set; } = string.Empty;
    public string DescripcionProducto { get; set; } = string.Empty;
    public string Categoria { get; set; } = string.Empty;
    public int IdTipoMovimiento { get; set; }
    public string TipoMovimiento { get; set; } = string.Empty;
    public short EfectoStock { get; set; }
    public decimal CantidadAnterior { get; set; }
    public decimal CantidadMovimiento { get; set; }
    public decimal CantidadNueva { get; set; }
    public decimal PrecioCosto { get; set; }
    public string? ReferenciaModulo { get; set; }
    public int? IdReferencia { get; set; }
    public string? Motivo { get; set; }
    public string Usuario { get; set; } = string.Empty;
    public DateTime FechaMovimiento { get; set; }
}
