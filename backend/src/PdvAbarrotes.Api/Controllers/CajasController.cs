using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PdvAbarrotes.Aplicacion.Comun;
using PdvAbarrotes.Aplicacion.DTOs.Caja;
using PdvAbarrotes.Aplicacion.Interfaces;

namespace PdvAbarrotes.Api.Controllers;

/// <summary>
/// Controlador para la administración de cajas, turnos de trabajo, entradas/salidas de efectivo y cortes X y Z.
/// </summary>
[Authorize]
public class CajasController : ControladorBase
{
    private readonly IServicioCaja _servicioCaja;
    private readonly IServicioUsuarioActual _servicioUsuarioActual;

    public CajasController(
        IServicioCaja servicioCaja,
        IServicioUsuarioActual servicioUsuarioActual)
    {
        _servicioCaja = servicioCaja;
        _servicioUsuarioActual = servicioUsuarioActual;
    }

    /// <summary>
    /// Lista todas las cajas o terminales registradas y su estado operativo.
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "Cajero,Supervisor,Administrador")]
    [ProducesResponseType(typeof(RespuestaApi<IReadOnlyList<CajaDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ObtenerCajas()
    {
        var cajas = await _servicioCaja.ObtenerCajasDisponiblesAsync();
        return Ok(RespuestaApi<IReadOnlyList<CajaDto>>.Satisfactorio(cajas, "Cajas obtenidas con éxito."));
    }

    /// <summary>
    /// Consulta el turno que se encuentra actualmente abierto para el cajero o caja.
    /// </summary>
    /// <param name="idCaja">Identificador opcional de la caja física.</param>
    [HttpGet("turno-actual")]
    [Authorize(Roles = "Cajero,Supervisor,Administrador")]
    [ProducesResponseType(typeof(RespuestaApi<TurnoCajaDto?>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ObtenerTurnoActual([FromQuery] int? idCaja)
    {
        int? idUsuario = _servicioUsuarioActual.IdUsuario;
        var turno = await _servicioCaja.ObtenerTurnoActualAsync(idCaja, idUsuario);
        return Ok(RespuestaApi<TurnoCajaDto?>.Satisfactorio(turno, turno != null ? "Turno activo encontrado." : "No hay turno activo para esta caja o usuario."));
    }

    /// <summary>
    /// Realiza la apertura de un turno de caja con fondo inicial.
    /// </summary>
    /// <param name="dto">Datos para la apertura (IdCaja y MontoInicial).</param>
    [HttpPost("abrir-turno")]
    [Authorize(Roles = "Cajero,Supervisor,Administrador")]
    [ProducesResponseType(typeof(RespuestaApi<TurnoCajaDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(RespuestaApi<TurnoCajaDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> AbrirTurno([FromBody] AbrirTurnoDto dto)
    {
        try
        {
            int idUsuario = _servicioUsuarioActual.IdUsuario ?? 1;
            var turno = await _servicioCaja.AbrirTurnoAsync(dto, idUsuario);
            return Ok(RespuestaApi<TurnoCajaDto>.Satisfactorio(turno, "Turno abierto exitosamente con fondo inicial."));
        }
        catch (Exception ex)
        {
            return BadRequest(RespuestaApi<TurnoCajaDto>.Fallido(ex.Message));
        }
    }

    /// <summary>
    /// Registra una entrada o salida manual de efectivo en el turno en curso.
    /// </summary>
    /// <param name="dto">Tipo de movimiento (ENTRADA o SALIDA), monto y motivo.</param>
    [HttpPost("movimientos")]
    [Authorize(Roles = "Cajero,Supervisor,Administrador")]
    [ProducesResponseType(typeof(RespuestaApi<MovimientoCajaDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(RespuestaApi<MovimientoCajaDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RegistrarMovimiento([FromBody] RegistrarMovimientoCajaDto dto)
    {
        try
        {
            int idUsuario = _servicioUsuarioActual.IdUsuario ?? 1;
            var movimiento = await _servicioCaja.RegistrarMovimientoAsync(dto, idUsuario);
            return Ok(RespuestaApi<MovimientoCajaDto>.Satisfactorio(movimiento, $"Movimiento de {dto.TipoMovimiento.ToUpper()} registrado correctamente."));
        }
        catch (Exception ex)
        {
            return BadRequest(RespuestaApi<MovimientoCajaDto>.Fallido(ex.Message));
        }
    }

    /// <summary>
    /// Obtiene el historial de movimientos de efectivo registrados en un turno de caja.
    /// </summary>
    /// <param name="idTurno">Identificador del turno de caja.</param>
    [HttpGet("turnos/{idTurno:int}/movimientos")]
    [Authorize(Roles = "Cajero,Supervisor,Administrador")]
    [ProducesResponseType(typeof(RespuestaApi<IReadOnlyList<MovimientoCajaDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ObtenerMovimientosTurno([FromRoute] int idTurno)
    {
        var movimientos = await _servicioCaja.ObtenerMovimientosTurnoAsync(idTurno);
        return Ok(RespuestaApi<IReadOnlyList<MovimientoCajaDto>>.Satisfactorio(movimientos, "Movimientos obtenidos con éxito."));
    }

    /// <summary>
    /// Calcula la lectura financiera acumulada en vivo (Corte X preliminar) sin cerrar el turno.
    /// </summary>
    /// <param name="idTurno">Identificador del turno de caja.</param>
    [HttpGet("turnos/{idTurno:int}/corte-x")]
    [Authorize(Roles = "Cajero,Supervisor,Administrador")]
    [ProducesResponseType(typeof(RespuestaApi<ResumenCorteDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(RespuestaApi<ResumenCorteDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ObtenerCorteX([FromRoute] int idTurno)
    {
        try
        {
            var corteX = await _servicioCaja.CalcularCorteXAsync(idTurno);
            return Ok(RespuestaApi<ResumenCorteDto>.Satisfactorio(corteX, "Corte X preliminar calculado con éxito."));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(RespuestaApi<ResumenCorteDto>.Fallido(ex.Message));
        }
        catch (Exception ex)
        {
            return BadRequest(RespuestaApi<ResumenCorteDto>.Fallido(ex.Message));
        }
    }

    /// <summary>
    /// Realiza el cierre definitivo del turno con arqueo ciego, registra el balance contable y emite el Corte Z.
    /// </summary>
    /// <param name="dto">Conteo físico de efectivo y observaciones del cajero.</param>
    [HttpPost("cerrar-turno-corte-z")]
    [Authorize(Roles = "Cajero,Supervisor,Administrador")]
    [ProducesResponseType(typeof(RespuestaApi<ResumenCorteDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(RespuestaApi<ResumenCorteDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CerrarTurnoCorteZ([FromBody] CerrarTurnoDto dto)
    {
        try
        {
            int idUsuario = _servicioUsuarioActual.IdUsuario ?? 1;
            var corteZ = await _servicioCaja.CerrarTurnoCorteZAsync(dto, idUsuario);
            return Ok(RespuestaApi<ResumenCorteDto>.Satisfactorio(corteZ, "Turno cerrado exitosamente con Corte Z definitivo."));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(RespuestaApi<ResumenCorteDto>.Fallido(ex.Message));
        }
        catch (Exception ex)
        {
            return BadRequest(RespuestaApi<ResumenCorteDto>.Fallido(ex.Message));
        }
    }

    /// <summary>
    /// Obtiene el historial de cortes de caja realizados con filtros opcionales.
    /// </summary>
    /// <param name="idCaja">Identificador de la caja física (opcional).</param>
    /// <param name="fechaInicio">Fecha inicial del reporte (opcional).</param>
    /// <param name="fechaFin">Fecha final del reporte (opcional).</param>
    [HttpGet("cortes")]
    [Authorize(Roles = "Supervisor,Administrador")]
    [ProducesResponseType(typeof(RespuestaApi<IReadOnlyList<CorteCajaDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ObtenerHistorialCortes(
        [FromQuery] int? idCaja,
        [FromQuery] DateTime? fechaInicio,
        [FromQuery] DateTime? fechaFin)
    {
        var cortes = await _servicioCaja.ObtenerHistorialCortesAsync(idCaja, fechaInicio, fechaFin);
        return Ok(RespuestaApi<IReadOnlyList<CorteCajaDto>>.Satisfactorio(cortes, "Historial de cortes obtenido con éxito."));
    }
}
