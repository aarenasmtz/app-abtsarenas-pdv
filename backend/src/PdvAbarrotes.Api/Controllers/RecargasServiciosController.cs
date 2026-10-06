using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PdvAbarrotes.Aplicacion.Comun;
using PdvAbarrotes.Aplicacion.DTOs.Servicios;
using PdvAbarrotes.Aplicacion.Interfaces;

namespace PdvAbarrotes.Api.Controllers;

/// <summary>
/// Controlador para la gestión de recargas de tiempo aire electrónico y pago de servicios en caja.
/// Ruta base: /api/v1/recargas-servicios
/// </summary>
[Authorize]
public class RecargasServiciosController : ControladorBase
{
    private readonly IServicioRecargasYServicios _servicioRecargas;
    private readonly IServicioUsuarioActual _usuarioActual;

    public RecargasServiciosController(
        IServicioRecargasYServicios servicioRecargas,
        IServicioUsuarioActual usuarioActual)
    {
        _servicioRecargas = servicioRecargas;
        _usuarioActual = usuarioActual;
    }

    /// <summary>
    /// Consulta el estado de configuración de los proveedores externos de recargas y servicios y saldo de bolsa.
    /// </summary>
    [HttpGet("estado")]
    [ProducesResponseType(typeof(RespuestaApi<EstadoIntegracionServiciosDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ObtenerEstado(CancellationToken ct)
    {
        var estado = await _servicioRecargas.ObtenerEstadoIntegracionAsync(ct);
        return Ok(RespuestaApi<EstadoIntegracionServiciosDto>.Satisfactorio(estado));
    }

    /// <summary>
    /// Obtiene las compañías de telefonía móvil disponibles en México y sus montos autorizados.
    /// </summary>
    [HttpGet("companias")]
    [ProducesResponseType(typeof(RespuestaApi<IReadOnlyList<CompaniaTelefonicaDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ObtenerCompanias(CancellationToken ct)
    {
        var companias = await _servicioRecargas.ObtenerCompaniasRecargasAsync(ct);
        return Ok(RespuestaApi<IReadOnlyList<CompaniaTelefonicaDto>>.Satisfactorio(companias));
    }

    /// <summary>
    /// Obtiene el catálogo de servicios públicos y privados autorizados para cobro en mostrador.
    /// </summary>
    [HttpGet("catalogo")]
    [ProducesResponseType(typeof(RespuestaApi<IReadOnlyList<CatalogoServicioDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ObtenerCatalogo(CancellationToken ct)
    {
        var catalogo = await _servicioRecargas.ObtenerCatalogoServiciosAsync(ct);
        return Ok(RespuestaApi<IReadOnlyList<CatalogoServicioDto>>.Satisfactorio(catalogo));
    }

    /// <summary>
    /// Procesa una recarga electrónica de tiempo aire.
    /// </summary>
    [HttpPost("recargar")]
    [ProducesResponseType(typeof(RespuestaApi<ResultadoRecargaDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(RespuestaApi<ResultadoRecargaDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ProcesarRecarga([FromBody] SolicitudRecargaDto solicitud, CancellationToken ct)
    {
        try
        {
            solicitud.IdUsuario = _usuarioActual.IdUsuario ?? solicitud.IdUsuario;
            var resultado = await _servicioRecargas.ProcesarRecargaAsync(solicitud, ct);

            if (!resultado.Exito)
            {
                return Ok(RespuestaApi<ResultadoRecargaDto>.Satisfactorio(resultado, resultado.Mensaje));
            }

            return Ok(RespuestaApi<ResultadoRecargaDto>.Satisfactorio(
                resultado,
                $"Recarga de ${resultado.Monto:N2} a {resultado.NumeroTelefono} ({resultado.Compania}) procesada con éxito."));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(RespuestaApi<ResultadoRecargaDto>.Fallido(ex.Message));
        }
        catch (Exception ex)
        {
            return BadRequest(RespuestaApi<ResultadoRecargaDto>.Fallido($"Error interno al procesar recarga: {ex.Message}"));
        }
    }

    /// <summary>
    /// Procesa el cobro y dispersión de un recibo de servicio público.
    /// </summary>
    [HttpPost("pagar-servicio")]
    [ProducesResponseType(typeof(RespuestaApi<ResultadoPagoServicioDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(RespuestaApi<ResultadoPagoServicioDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ProcesarPagoServicio([FromBody] SolicitudPagoServicioDto solicitud, CancellationToken ct)
    {
        try
        {
            solicitud.IdUsuario = _usuarioActual.IdUsuario ?? solicitud.IdUsuario;
            var resultado = await _servicioRecargas.ProcesarPagoServicioAsync(solicitud, ct);

            if (!resultado.Exito)
            {
                return Ok(RespuestaApi<ResultadoPagoServicioDto>.Satisfactorio(resultado, resultado.Mensaje));
            }

            return Ok(RespuestaApi<ResultadoPagoServicioDto>.Satisfactorio(
                resultado,
                $"Pago de servicio {resultado.Servicio} por ${resultado.MontoPagado:N2} (+ com ${resultado.ComisionCobrada:N2}) procesado con éxito."));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(RespuestaApi<ResultadoPagoServicioDto>.Fallido(ex.Message));
        }
        catch (Exception ex)
        {
            return BadRequest(RespuestaApi<ResultadoPagoServicioDto>.Fallido($"Error interno al pagar servicio: {ex.Message}"));
        }
    }
}
