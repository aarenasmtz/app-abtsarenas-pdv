using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PdvAbarrotes.Aplicacion.Comun;
using PdvAbarrotes.Aplicacion.DTOs.Ventas;
using PdvAbarrotes.Aplicacion.Interfaces;

namespace PdvAbarrotes.Api.Controllers;

/// <summary>
/// Controlador para la administración de ventas en espera (tickets pendientes) en la caja.
/// </summary>
[Authorize]
public class TicketsPendientesController : ControladorBase
{
    private readonly IServicioTicketsPendientes _servicioTicketsPendientes;

    public TicketsPendientesController(IServicioTicketsPendientes servicioTicketsPendientes)
    {
        _servicioTicketsPendientes = servicioTicketsPendientes;
    }

    /// <summary>
    /// Pone en espera una venta en curso liberando la caja para otros clientes.
    /// </summary>
    /// <param name="peticion">Artículos e identificación del cliente en espera.</param>
    /// <param name="ct">Token de cancelación.</param>
    [HttpPost]
    [Authorize(Roles = "Cajero,Supervisor,Administrador")]
    [ProducesResponseType(typeof(RespuestaApi<TicketPendienteDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(RespuestaApi<TicketPendienteDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GuardarTicketPendiente([FromBody] CrearTicketPendienteDto peticion, CancellationToken ct)
    {
        var resultado = await _servicioTicketsPendientes.GuardarTicketPendienteAsync(peticion, ct);
        return resultado.Exito ? Ok(resultado) : BadRequest(resultado);
    }

    /// <summary>
    /// Consulta los tickets pendientes activos en espera de cobro.
    /// </summary>
    /// <param name="idCaja">Identificador opcional de la caja para filtrar.</param>
    /// <param name="ct">Token de cancelación.</param>
    [HttpGet]
    [Authorize(Roles = "Cajero,Supervisor,Administrador")]
    [ProducesResponseType(typeof(RespuestaApi<List<TicketPendienteDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ObtenerTicketsPendientes([FromQuery] int? idCaja, CancellationToken ct)
    {
        var resultado = await _servicioTicketsPendientes.ObtenerTicketsPendientesActivosAsync(idCaja, ct);
        return Ok(resultado);
    }

    /// <summary>
    /// Reanuda un ticket en espera para cargarlo de nuevo al carrito activo y lo retira de la cola.
    /// </summary>
    /// <param name="id">Identificador del ticket pendiente.</param>
    /// <param name="ct">Token de cancelación.</param>
    [HttpPost("{id:int}/recuperar")]
    [Authorize(Roles = "Cajero,Supervisor,Administrador")]
    [ProducesResponseType(typeof(RespuestaApi<TicketPendienteDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(RespuestaApi<TicketPendienteDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RecuperarTicketPendiente([FromRoute] int id, CancellationToken ct)
    {
        var resultado = await _servicioTicketsPendientes.RecuperarTicketPendienteAsync(id, ct);
        return resultado.Exito ? Ok(resultado) : BadRequest(resultado);
    }

    /// <summary>
    /// Descarta y anula una venta en espera cuando el cliente ya no regresa a pagar.
    /// </summary>
    /// <param name="id">Identificador del ticket pendiente.</param>
    /// <param name="ct">Token de cancelación.</param>
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Cajero,Supervisor,Administrador")]
    [ProducesResponseType(typeof(RespuestaApi<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(RespuestaApi<bool>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> DescartarTicketPendiente([FromRoute] int id, CancellationToken ct)
    {
        var resultado = await _servicioTicketsPendientes.DescartarTicketPendienteAsync(id, ct);
        return resultado.Exito ? Ok(resultado) : BadRequest(resultado);
    }
}
