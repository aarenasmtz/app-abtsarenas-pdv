using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PdvAbarrotes.Aplicacion.Comun;
using PdvAbarrotes.Aplicacion.DTOs.Reportes;
using PdvAbarrotes.Aplicacion.Interfaces;

namespace PdvAbarrotes.Api.Controllers;

/// <summary>
/// Controlador para el Dashboard ejecutivo, estadísticas de rotación,
/// reportes de ventas y utilidades netas del negocio.
/// Ruta base: /api/v1/reportes
/// </summary>
[Authorize]
public class ReportesController : ControladorBase
{
    private readonly IServicioReportes _servicioReportes;

    public ReportesController(IServicioReportes servicioReportes)
    {
        _servicioReportes = servicioReportes;
    }

    /// <summary>
    /// Retorna los KPIs consolidados del Dashboard: ventas hoy, semana, mes,
    /// ticket promedio, margen bruto, desglose de métodos de pago y top 10 productos.
    /// </summary>
    /// <param name="ct">Token de cancelación.</param>
    [HttpGet("dashboard")]
    [Authorize(Roles = "Supervisor,Administrador")]
    [ProducesResponseType(typeof(RespuestaApi<ResumenDashboardDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ObtenerDashboard(CancellationToken ct)
    {
        try
        {
            var dashboard = await _servicioReportes.ObtenerResumenDashboardAsync(ct);
            return Ok(RespuestaApi<ResumenDashboardDto>.Satisfactorio(dashboard, "Métricas de Dashboard obtenidas con éxito."));
        }
        catch (Exception ex)
        {
            return StatusCode(500, RespuestaApi<object>.Fallido($"Error al consultar métricas del Dashboard: {ex.Message}"));
        }
    }

    /// <summary>
    /// Obtiene el historial paginado de tickets de venta con filtros por fechas, cajero, estado y folio.
    /// </summary>
    /// <param name="filtro">Parámetros de filtrado y paginación.</param>
    /// <param name="ct">Token de cancelación.</param>
    [HttpGet("ventas")]
    [Authorize(Roles = "Supervisor,Administrador")]
    [ProducesResponseType(typeof(RespuestaApi<ResultadoPaginado<ReporteVentaItemDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ObtenerReporteVentas([FromQuery] ReporteVentasFiltroDto filtro, CancellationToken ct)
    {
        try
        {
            var resultado = await _servicioReportes.ObtenerReporteVentasPaginadoAsync(filtro, ct);
            return Ok(RespuestaApi<ResultadoPaginado<ReporteVentaItemDto>>.Satisfactorio(resultado, "Reporte de ventas obtenido correctamente."));
        }
        catch (Exception ex)
        {
            return StatusCode(500, RespuestaApi<object>.Fallido($"Error al consultar reporte de ventas: {ex.Message}"));
        }
    }

    /// <summary>
    /// Calcula las sumatorias y métricas globales para tarjetas de cabecera en reportes de ventas según los filtros aplicados.
    /// </summary>
    /// <param name="filtro">Criterios de filtrado.</param>
    /// <param name="ct">Token de cancelación.</param>
    [HttpGet("ventas/resumen")]
    [Authorize(Roles = "Supervisor,Administrador")]
    [ProducesResponseType(typeof(RespuestaApi<ResumenReporteVentasDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ObtenerResumenVentas([FromQuery] ReporteVentasFiltroDto filtro, CancellationToken ct)
    {
        try
        {
            var resumen = await _servicioReportes.ObtenerResumenReporteVentasAsync(filtro, ct);
            return Ok(RespuestaApi<ResumenReporteVentasDto>.Satisfactorio(resumen, "Resumen del periodo obtenido correctamente."));
        }
        catch (Exception ex)
        {
            return StatusCode(500, RespuestaApi<object>.Fallido($"Error al calcular resumen de ventas: {ex.Message}"));
        }
    }

    /// <summary>
    /// Retorna el reporte gerencial de utilidades y margen neto por producto en un periodo seleccionado.
    /// </summary>
    /// <param name="fechaInicio">Fecha inicial del periodo.</param>
    /// <param name="fechaFin">Fecha final del periodo.</param>
    /// <param name="limite">Límite de productos a retornar (por defecto 50).</param>
    /// <param name="ct">Token de cancelación.</param>
    [HttpGet("utilidades")]
    [Authorize(Roles = "Supervisor,Administrador")]
    [ProducesResponseType(typeof(RespuestaApi<IReadOnlyList<ReporteUtilidadItemDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ObtenerReporteUtilidades(
        [FromQuery] DateTime? fechaInicio,
        [FromQuery] DateTime? fechaFin,
        [FromQuery] int limite = 50,
        CancellationToken ct = default)
    {
        try
        {
            var fInicio = fechaInicio ?? DateTime.Today.AddDays(-30);
            var fFin = fechaFin ?? DateTime.Today.AddDays(1).AddSeconds(-1);

            var items = await _servicioReportes.ObtenerReporteUtilidadesAsync(fInicio, fFin, limite, ct);
            return Ok(RespuestaApi<IReadOnlyList<ReporteUtilidadItemDto>>.Satisfactorio(items, $"{items.Count} productos analizados en rentabilidad."));
        }
        catch (Exception ex)
        {
            return StatusCode(500, RespuestaApi<object>.Fallido($"Error al consultar reporte de utilidades: {ex.Message}"));
        }
    }
}
