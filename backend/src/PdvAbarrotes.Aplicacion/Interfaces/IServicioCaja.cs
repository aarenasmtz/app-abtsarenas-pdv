using PdvAbarrotes.Aplicacion.DTOs.Caja;

namespace PdvAbarrotes.Aplicacion.Interfaces;

/// <summary>
/// Contrato del servicio para el control de caja, turnos, movimientos de efectivo y cortes X y Z.
/// </summary>
public interface IServicioCaja
{
    /// <summary>
    /// Obtiene las cajas/terminales físicas registradas en el sistema.
    /// </summary>
    Task<IReadOnlyList<CajaDto>> ObtenerCajasDisponiblesAsync();

    /// <summary>
    /// Obtiene el turno actualmente abierto para la caja o el usuario especificado.
    /// </summary>
    Task<TurnoCajaDto?> ObtenerTurnoActualAsync(int? idCaja = null, int? idUsuario = null);

    /// <summary>
    /// Realiza la apertura de turno registrando el fondo inicial y cambiando el estatus a ABIERTO.
    /// </summary>
    Task<TurnoCajaDto> AbrirTurnoAsync(AbrirTurnoDto dto, int idUsuario);

    /// <summary>
    /// Registra un movimiento manual de efectivo (ENTRADA o SALIDA) en el turno activo.
    /// </summary>
    Task<MovimientoCajaDto> RegistrarMovimientoAsync(RegistrarMovimientoCajaDto dto, int idUsuario);

    /// <summary>
    /// Obtiene la lista cronológica de movimientos de efectivo registrados en un turno.
    /// </summary>
    Task<IReadOnlyList<MovimientoCajaDto>> ObtenerMovimientosTurnoAsync(int idTurnoCaja);

    /// <summary>
    /// Calcula la lectura financiera acumulada en tiempo real de un turno (Corte X preliminar/parcial).
    /// </summary>
    Task<ResumenCorteDto> CalcularCorteXAsync(int idTurnoCaja);

    /// <summary>
    /// Realiza el cierre formal del turno con arqueo ciego y genera el Corte Z definitivo.
    /// </summary>
    Task<ResumenCorteDto> CerrarTurnoCorteZAsync(CerrarTurnoDto dto, int idUsuario);

    /// <summary>
    /// Obtiene el historial de cortes de caja realizados con filtros opcionales.
    /// </summary>
    Task<IReadOnlyList<CorteCajaDto>> ObtenerHistorialCortesAsync(int? idCaja = null, DateTime? fechaInicio = null, DateTime? fechaFin = null);
}
