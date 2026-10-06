namespace PdvAbarrotes.Aplicacion.DTOs.PedidosSugeridos;

/// <summary>
/// Partida de un producto analizado y sugerido para reabastecimiento.
/// </summary>
public class DetallePedidoSugeridoDto
{
    public int IdDetallePedidoSugerido { get; set; }
    public int IdPedidoSugerido { get; set; }
    public int IdProducto { get; set; }
    public string CodigoBarras { get; set; } = string.Empty;
    public string NombreProducto { get; set; } = string.Empty;
    public string Categoria { get; set; } = string.Empty;
    public string UnidadMedida { get; set; } = string.Empty;
    public bool PermiteVentaFraccionada { get; set; }

    public int IdProveedor { get; set; }
    public string NombreProveedor { get; set; } = string.Empty;

    public decimal StockActual { get; set; }
    public decimal StockMinimo { get; set; }
    public decimal VentaPromedioDiaria { get; set; }
    public int DiasCobertura { get; set; }
    public decimal DemandaEstimada { get; set; }
    public decimal CantidadSugerida { get; set; }
    public decimal? CantidadAjustada { get; set; }
    public decimal CantidadEfectiva => CantidadAjustada ?? CantidadSugerida;

    public decimal PrecioCostoUnitario { get; set; }
    public decimal SubtotalSugerido { get; set; }
    public decimal SubtotalEfectivo => CantidadEfectiva * PrecioCostoUnitario;
}
