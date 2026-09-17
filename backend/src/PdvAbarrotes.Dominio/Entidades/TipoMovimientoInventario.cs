namespace PdvAbarrotes.Dominio.Entidades;

/// <summary>
/// Catálogo de tipos de movimiento de inventario (Entrada, Venta, Merma, etc.). Mapea a dbo.TiposMovimientoInventario.
/// </summary>
public class TipoMovimientoInventario
{
    public int IdTipoMovimiento { get; set; }
    public string CodigoTipo { get; set; } = string.Empty;
    public string Descripcion { get; set; } = string.Empty;
    public short EfectoStock { get; set; } // +1: Entrada, -1: Salida, 0: Neutro
    public bool Activo { get; set; }
}
