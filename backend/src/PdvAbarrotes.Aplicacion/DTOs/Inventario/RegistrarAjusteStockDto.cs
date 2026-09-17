namespace PdvAbarrotes.Aplicacion.DTOs.Inventario;

/// <summary>
/// Parámetros para registrar un ajuste manual o conteo físico de inventario.
/// </summary>
public class RegistrarAjusteStockDto
{
    public int IdProducto { get; set; }
    public decimal CantidadAjuste { get; set; }
    public string TipoAjuste { get; set; } = "ENTRADA"; // "ENTRADA", "SALIDA", "RECONTEO_FISICO"
    public string Motivo { get; set; } = string.Empty;
    public string? Observaciones { get; set; }
}
