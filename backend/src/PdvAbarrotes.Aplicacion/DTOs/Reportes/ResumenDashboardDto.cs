namespace PdvAbarrotes.Aplicacion.DTOs.Reportes;

/// <summary>
/// Desglose de ingresos por método de pago para el Dashboard.
/// </summary>
public class VentaPorMetodoPagoDto
{
    public string MetodoPago { get; set; } = string.Empty;
    public decimal Total { get; set; }
    public decimal Porcentaje { get; set; }
    public int CantidadTransacciones { get; set; }
}

/// <summary>
/// Punto de datos para gráfico de tendencia diaria de ventas.
/// </summary>
public class TendenciaVentaDiaDto
{
    public string Fecha { get; set; } = string.Empty;
    public string DiaSemana { get; set; } = string.Empty;
    public decimal TotalVentas { get; set; }
    public decimal TotalGanancia { get; set; }
    public int TotalTickets { get; set; }
}

/// <summary>
/// Producto de alta rotación para el top de ventas del Dashboard.
/// </summary>
public class TopProductoVendidoDto
{
    public int IdProducto { get; set; }
    public string Descripcion { get; set; } = string.Empty;
    public string Categoria { get; set; } = string.Empty;
    public decimal CantidadVendida { get; set; }
    public decimal TotalVendido { get; set; }
    public decimal GananciaGenerada { get; set; }
    public decimal MargenPorcentaje { get; set; }
}

/// <summary>
/// Métricas consolidadas del Dashboard ejecutivo.
/// </summary>
public class ResumenDashboardDto
{
    // Métricas del día de hoy
    public decimal VentasHoy { get; set; }
    public int TicketsHoy { get; set; }
    public decimal GananciaHoy { get; set; }
    public decimal TicketPromedioHoy { get; set; }
    public decimal MargenPorcentajeHoy { get; set; }

    // Métricas de la semana (últimos 7 días)
    public decimal VentasSemana { get; set; }
    public int TicketsSemana { get; set; }
    public decimal GananciaSemana { get; set; }

    // Métricas del mes (últimos 30 días o mes actual)
    public decimal VentasMes { get; set; }
    public int TicketsMes { get; set; }
    public decimal GananciaMes { get; set; }

    // Inventario y catálogo
    public int TotalProductos { get; set; }
    public int ProductosBajoStock { get; set; }
    public int ProductosAgotados { get; set; }

    // Desgloses y gráficas
    public List<VentaPorMetodoPagoDto> MetodosPago { get; set; } = new();
    public List<TendenciaVentaDiaDto> TendenciaUltimosDias { get; set; } = new();
    public List<TopProductoVendidoDto> TopProductos { get; set; } = new();
}
