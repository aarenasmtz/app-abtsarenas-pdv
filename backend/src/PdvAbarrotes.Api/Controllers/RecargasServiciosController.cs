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

    /// <summary>
    /// Consulta el adeudo de un recibo o servicio en tiempo real ante el proveedor RNP.
    /// </summary>
    [HttpPost("consultar-adeudo")]
    [ProducesResponseType(typeof(RespuestaApi<ResultadoConsultaAdeudoDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(RespuestaApi<ResultadoConsultaAdeudoDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ConsultarAdeudo([FromBody] SolicitudConsultaAdeudoDto solicitud, CancellationToken ct)
    {
        try
        {
            var resultado = await _servicioRecargas.ConsultarAdeudoServicioAsync(solicitud, ct);
            return Ok(RespuestaApi<ResultadoConsultaAdeudoDto>.Satisfactorio(resultado, resultado.MensajeProveedor));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(RespuestaApi<ResultadoConsultaAdeudoDto>.Fallido(ex.Message));
        }
        catch (Exception ex)
        {
            return BadRequest(RespuestaApi<ResultadoConsultaAdeudoDto>.Fallido($"Error al consultar adeudo: {ex.Message}"));
        }
    }

    /// <summary>
    /// Sincroniza el catálogo completo de 400+ productos y servicios desde el proveedor RNP hacia la base de datos local.
    /// </summary>
    [HttpPost("sincronizar-catalogo")]
    [ProducesResponseType(typeof(RespuestaApi<int>), StatusCodes.Status200OK)]
    public async Task<IActionResult> SincronizarCatalogo(CancellationToken ct)
    {
        try
        {
            int total = await _servicioRecargas.SincronizarCatalogoRnpAsync(ct);
            return Ok(RespuestaApi<int>.Satisfactorio(total, $"Catálogo de RNP sincronizado exitosamente ({total} productos)."));
        }
        catch (Exception ex)
        {
            return BadRequest(RespuestaApi<int>.Fallido($"Error al sincronizar catálogo con RNP: {ex.Message}"));
        }
    }

    /// <summary>
    /// Consulta el historial de transacciones de recargas y servicios procesadas.
    /// </summary>
    [HttpGet("transacciones")]
    [ProducesResponseType(typeof(RespuestaApi<IReadOnlyList<TransaccionServicioDetalleDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ConsultarTransacciones([FromQuery] FiltroTransaccionesServiciosDto filtro, CancellationToken ct)
    {
        var transacciones = await _servicioRecargas.ConsultarTransaccionesAsync(filtro, ct);
        return Ok(RespuestaApi<IReadOnlyList<TransaccionServicioDetalleDto>>.Satisfactorio(transacciones));
    }

    /// <summary>
    /// Consulta la bitácora operativa de auditoría del módulo de recargas y servicios.
    /// </summary>
    [HttpGet("bitacora")]
    [ProducesResponseType(typeof(RespuestaApi<IReadOnlyList<RegistroBitacoraDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ConsultarBitacora([FromQuery] string? folioPos, [FromQuery] int limite = 50, CancellationToken ct = default)
    {
        var bitacora = await _servicioRecargas.ConsultarBitacoraAsync(folioPos, limite, ct);
        return Ok(RespuestaApi<IReadOnlyList<RegistroBitacoraDto>>.Satisfactorio(bitacora));
    }

    /// <summary>
    /// Consulta el log de errores técnicos de la integración con RNP.
    /// </summary>
    [HttpGet("errores")]
    [ProducesResponseType(typeof(RespuestaApi<IReadOnlyList<RegistroLogErrorDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ConsultarLogErrores([FromQuery] string? folioPos, [FromQuery] int limite = 50, CancellationToken ct = default)
    {
        var errores = await _servicioRecargas.ConsultarLogErroresAsync(folioPos, limite, ct);
        return Ok(RespuestaApi<IReadOnlyList<RegistroLogErrorDto>>.Satisfactorio(errores));
    }

    /// <summary>
    /// Consulta el saldo detallado de la bolsa RNP (Balance, compras, ventas, comisión).
    /// </summary>
    [HttpGet("saldo-bolsa")]
    [ProducesResponseType(typeof(RespuestaApi<RnpBalanceResult>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ConsultarSaldoBolsa(CancellationToken ct)
    {
        try
        {
            var saldo = await _servicioRecargas.ConsultarSaldoBolsaDetalladoAsync(ct);
            return Ok(RespuestaApi<RnpBalanceResult>.Satisfactorio(saldo));
        }
        catch (Exception ex)
        {
            return BadRequest(RespuestaApi<RnpBalanceResult>.Fallido($"Error al consultar saldo de bolsa: {ex.Message}"));
        }
    }
}
