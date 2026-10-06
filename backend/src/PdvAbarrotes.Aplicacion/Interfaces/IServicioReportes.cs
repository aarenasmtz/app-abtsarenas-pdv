using PdvAbarrotes.Aplicacion.Comun;
using PdvAbarrotes.Aplicacion.DTOs.Reportes;

namespace PdvAbarrotes.Aplicacion.Interfaces;

/// <summary>
/// Contrato para el servicio de reportes gerenciales y métricas de Dashboard.
/// Opera con aislamiento de lectura Snapshot/AsNoTracking para garantizar latencia cero en el PDV.
/// </summary>
public interface IServicioReportes
{
    /// <summary>
    /// Obtiene las métricas consolidadas del Dashboard (ventas hoy/semana/mes, top productos, métodos de pago).
    /// </summary>
    Task<ResumenDashboardDto> ObtenerResumenDashboardAsync(CancellationToken ct = default);

    /// <summary>
    /// Consulta el listado paginado de tickets de venta con sus totales, ganancias y cajero.
    /// </summary>
    Task<ResultadoPaginado<ReporteVentaItemDto>> ObtenerReporteVentasPaginadoAsync(ReporteVentasFiltroDto filtro, CancellationToken ct = default);

    /// <summary>
    /// Calcula los totales globales del periodo filtrado (sin paginar) para tarjetas resumen del reporte.
    /// </summary>
    Task<ResumenReporteVentasDto> ObtenerResumenReporteVentasAsync(ReporteVentasFiltroDto filtro, CancellationToken ct = default);

    /// <summary>
    /// Genera el reporte de rentabilidad y utilidad bruta por producto en un rango de fechas.
    /// </summary>
    Task<IReadOnlyList<ReporteUtilidadItemDto>> ObtenerReporteUtilidadesAsync(DateTime fechaInicio, DateTime fechaFin, int limite = 50, CancellationToken ct = default);
}
