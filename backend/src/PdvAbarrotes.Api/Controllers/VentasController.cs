using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PdvAbarrotes.Aplicacion.Comun;
using PdvAbarrotes.Aplicacion.DTOs.Ventas;
using PdvAbarrotes.Aplicacion.Interfaces;

namespace PdvAbarrotes.Api.Controllers;

/// <summary>
/// Controlador para el procesamiento de cobros, emisión de tickets y reimpresión en el Punto de Venta.
/// </summary>
[Authorize]
public class VentasController : ControladorBase
{
    private readonly IServicioVentas _servicioVentas;

    public VentasController(IServicioVentas servicioVentas)
    {
        _servicioVentas = servicioVentas;
    }

    /// <summary>
    /// Procesa y registra una venta atómica con actualización de inventario, pagos y blindaje de idempotencia.
    /// </summary>
    /// <param name="peticion">Datos del ticket, partidas y desglose de formas de pago.</param>
    /// <param name="ct">Token de cancelación.</param>
    [HttpPost]
    [Authorize(Roles = "Cajero,Supervisor,Administrador")]
    [ProducesResponseType(typeof(RespuestaApi<VentaRealizadaDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(RespuestaApi<VentaRealizadaDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RegistrarVenta([FromBody] RegistrarVentaDto peticion, CancellationToken ct)
    {
        var resultado = await _servicioVentas.RegistrarVentaAsync(peticion, ct);
        return resultado.Exito ? Ok(resultado) : BadRequest(resultado);
    }

    /// <summary>
    /// Obtiene el ticket estructurado para renderizado o impresión térmica (58mm / 80mm).
    /// </summary>
    /// <param name="id">Identificador único de la venta.</param>
    /// <param name="ct">Token de cancelación.</param>
    [HttpGet("{id:int}/ticket")]
    [Authorize(Roles = "Cajero,Supervisor,Administrador")]
    [ProducesResponseType(typeof(RespuestaApi<TicketVentaDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(RespuestaApi<TicketVentaDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ObtenerTicket([FromRoute] int id, CancellationToken ct)
    {
        var resultado = await _servicioVentas.ObtenerTicketVentaAsync(id, ct);
        return resultado.Exito ? Ok(resultado) : NotFound(resultado);
    }

    /// <summary>
    /// Consulta las ventas recientes paginadas para consulta rápida o reimpresión de tickets desde caja.
    /// </summary>
    /// <param name="filtro">Criterios de búsqueda y paginación (25/50/100).</param>
    /// <param name="ct">Token de cancelación.</param>
    [HttpGet("recientes")]
    [Authorize(Roles = "Cajero,Supervisor,Administrador")]
    [ProducesResponseType(typeof(RespuestaApi<ResultadoPaginado<VentaResumenDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ObtenerVentasRecientes([FromQuery] FiltroVentasDto filtro, CancellationToken ct)
    {
        var resultado = await _servicioVentas.ObtenerVentasRecientesAsync(filtro, ct);
        return Ok(resultado);
    }

    /// <summary>
    /// Cancela una venta previa y reintegra las existencias vendidas al inventario.
    /// </summary>
    /// <param name="id">Identificador de la venta.</param>
    /// <param name="solicitud">Motivo de la cancelación.</param>
    /// <param name="ct">Token de cancelación.</param>
    [HttpPost("{id:int}/cancelar")]
    [Authorize(Roles = "Supervisor,Administrador")]
    [ProducesResponseType(typeof(RespuestaApi<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(RespuestaApi<bool>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CancelarVenta([FromRoute] int id, [FromBody] SolicitudCancelacionVentaDto solicitud, CancellationToken ct)
    {
        var resultado = await _servicioVentas.CancelarVentaAsync(id, solicitud?.Motivo ?? "Cancelación solicitada en caja", ct);
        return resultado.Exito ? Ok(resultado) : BadRequest(resultado);
    }
}

/// <summary>
/// Solicitud para cancelación de una venta.
/// </summary>
public class SolicitudCancelacionVentaDto
{
    public string Motivo { get; set; } = string.Empty;
}
