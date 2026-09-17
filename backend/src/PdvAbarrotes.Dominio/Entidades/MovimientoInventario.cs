namespace PdvAbarrotes.Dominio.Entidades;

/// <summary>
/// Registro histórico e inmutable del Kardex de inventario. Mapea a dbo.MovimientosInventario.
/// </summary>
public class MovimientoInventario
{
    public int IdMovimientoInventario { get; set; }
    public int IdSucursal { get; set; }
    public int IdProducto { get; set; }
    public int IdTipoMovimiento { get; set; }
    public decimal CantidadAnterior { get; set; }
    public decimal CantidadMovimiento { get; set; }
    public decimal CantidadNueva { get; set; }
    public decimal PrecioCosto { get; set; }
    public string? ReferenciaModulo { get; set; } // 'VENTA', 'COMPRA', 'AJUSTE', 'INICIAL'
    public int? IdReferencia { get; set; }
    public string? Motivo { get; set; }
    public int? IdUsuario { get; set; }
    public DateTime FechaMovimiento { get; set; }

    // Propiedades de navegación
    public virtual Producto? Producto { get; set; }
    public virtual TipoMovimientoInventario? TipoMovimiento { get; set; }
    public virtual Usuario? Usuario { get; set; }
}
