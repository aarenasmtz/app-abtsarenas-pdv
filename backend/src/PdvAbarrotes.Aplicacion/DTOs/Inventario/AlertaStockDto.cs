namespace PdvAbarrotes.Aplicacion.DTOs.Inventario;

/// <summary>
/// Modelo de producto con nivel de inventario bajo o crítico para resurtido o compra.
/// </summary>
public class AlertaStockDto
{
    public int IdProducto { get; set; }
    public string CodigoBarras { get; set; } = string.Empty;
    public string Descripcion { get; set; } = string.Empty;
    public string Categoria { get; set; } = string.Empty;
    public decimal ExistenciaActual { get; set; }
    public decimal ExistenciaMinima { get; set; }
    public decimal ExistenciaMaxima { get; set; }
    public decimal FaltanteParaMinimo { get; set; }
    public decimal SugeridoParaMaximo { get; set; }
    public string NivelAlerta { get; set; } = "BAJO"; // "CRITICO", "BAJO"
}
