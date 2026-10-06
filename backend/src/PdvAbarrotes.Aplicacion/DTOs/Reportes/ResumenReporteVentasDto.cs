namespace PdvAbarrotes.Aplicacion.DTOs.Reportes;

/// <summary>
/// Renglón individual de ticket para el reporte detallado de ventas.
/// </summary>
public class ReporteVentaItemDto
{
    public int IdVenta { get; set; }
    public string FolioVenta { get; set; } = string.Empty;
    public DateTime FechaVenta { get; set; }
    public string Cajero { get; set; } = string.Empty;
    public decimal Subtotal { get; set; }
    public decimal Descuento { get; set; }
    public decimal Impuesto { get; set; }
    public decimal Total { get; set; }
    public decimal Ganancia { get; set; }
    public decimal MargenPorcentaje { get; set; }
    public decimal NumeroArticulos { get; set; }
    public string MetodosPago { get; set; } = string.Empty;
    public string Estatus { get; set; } = string.Empty;
    public bool EsCancelada { get; set; }
}

/// <summary>
/// Métricas totalizadoras del periodo filtrado en el reporte de ventas.
/// </summary>
public class ResumenReporteVentasDto
{
    public decimal TotalVentas { get; set; }
    public decimal TotalGanancia { get; set; }
    public decimal MargenPromedioPorcentaje { get; set; }
    public int TotalTickets { get; set; }
    public decimal TotalArticulosVendidos { get; set; }
    public decimal TicketPromedio { get; set; }
    public int TicketsCancelados { get; set; }
    public decimal MontoCancelado { get; set; }
    public List<VentaPorMetodoPagoDto> DesgloseMetodosPago { get; set; } = new();
}
