namespace PdvAbarrotes.Aplicacion.DTOs.Inventario;

/// <summary>
/// Catálogo auxiliar de tipos de movimiento de inventario.
/// </summary>
public class TipoMovimientoInventarioDto
{
    public int IdTipoMovimiento { get; set; }
    public string CodigoTipo { get; set; } = string.Empty;
    public string Descripcion { get; set; } = string.Empty;
    public short EfectoStock { get; set; }
}
