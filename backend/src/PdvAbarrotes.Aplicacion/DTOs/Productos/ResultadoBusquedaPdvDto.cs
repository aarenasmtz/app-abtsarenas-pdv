namespace PdvAbarrotes.Aplicacion.DTOs.Productos;

/// <summary>
/// Modelo simplificado para resultados del buscador predictivo del PDV.
/// </summary>
public class ResultadoBusquedaPdvDto
{
    public int IdProducto { get; set; }
    public string CodigoBarras { get; set; } = string.Empty;
    public string Descripcion { get; set; } = string.Empty;
    public decimal PrecioVenta { get; set; }
    public decimal ExistenciaActual { get; set; }
    public bool PermiteVentaFraccionada { get; set; }
    public string Categoria { get; set; } = string.Empty;
}
