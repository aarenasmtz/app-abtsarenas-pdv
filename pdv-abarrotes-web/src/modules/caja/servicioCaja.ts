import clienteApi from '../../api/clienteApi';
import type { RespuestaApi } from '../../types/comun';
import type {
  CajaDto,
  TurnoCajaDto,
  AbrirTurnoDto,
  CerrarTurnoDto,
  MovimientoCajaDto,
  RegistrarMovimientoCajaDto,
  ResumenCorteDto,
  CorteCajaDto
} from './tiposCaja';

/**
 * Cliente de servicios HTTP para el control de caja, turnos, movimientos de efectivo y cortes X/Z.
 */
export const servicioCaja = {
  /**
   * Obtiene la lista de terminales/cajas físicas del sistema.
   */
  async obtenerCajas(): Promise<RespuestaApi<CajaDto[]>> {
    const respuesta = await clienteApi.get<RespuestaApi<CajaDto[]>>('/cajas');
    return respuesta.data;
  },

  /**
   * Obtiene el turno actualmente abierto para la caja o usuario.
   */
  async obtenerTurnoActual(idCaja?: number): Promise<RespuestaApi<TurnoCajaDto | null>> {
    const params = idCaja ? { idCaja } : {};
    const respuesta = await clienteApi.get<RespuestaApi<TurnoCajaDto | null>>('/cajas/turno-actual', { params });
    return respuesta.data;
  },

  /**
   * Realiza la apertura de turno con fondo inicial en efectivo.
   */
  async abrirTurno(dto: AbrirTurnoDto): Promise<RespuestaApi<TurnoCajaDto>> {
    const respuesta = await clienteApi.post<RespuestaApi<TurnoCajaDto>>('/cajas/abrir-turno', dto);
    return respuesta.data;
  },

  /**
   * Registra una entrada o salida manual de efectivo en el turno en curso.
   */
  async registrarMovimiento(dto: RegistrarMovimientoCajaDto): Promise<RespuestaApi<MovimientoCajaDto>> {
    const respuesta = await clienteApi.post<RespuestaApi<MovimientoCajaDto>>('/cajas/movimientos', dto);
    return respuesta.data;
  },

  /**
   * Obtiene los movimientos de efectivo registrados en un turno.
   */
  async obtenerMovimientosTurno(idTurno: number): Promise<RespuestaApi<MovimientoCajaDto[]>> {
    const respuesta = await clienteApi.get<RespuestaApi<MovimientoCajaDto[]>>(`/cajas/turnos/${idTurno}/movimientos`);
    return respuesta.data;
  },

  /**
   * Calcula y obtiene la lectura parcial preliminar del turno (Corte X).
   */
  async obtenerCorteX(idTurno: number): Promise<RespuestaApi<ResumenCorteDto>> {
    const respuesta = await clienteApi.get<RespuestaApi<ResumenCorteDto>>(`/cajas/turnos/${idTurno}/corte-x`);
    return respuesta.data;
  },

  /**
   * Cierra el turno formalmente con arqueo ciego y obtiene el Corte Z definitivo.
   */
  async cerrarTurnoCorteZ(dto: CerrarTurnoDto): Promise<RespuestaApi<ResumenCorteDto>> {
    const respuesta = await clienteApi.post<RespuestaApi<ResumenCorteDto>>('/cajas/cerrar-turno-corte-z', dto);
    return respuesta.data;
  },

  /**
   * Consulta el historial de cortes de caja realizados.
   */
  async obtenerHistorialCortes(idCaja?: number, fechaInicio?: string, fechaFin?: string): Promise<RespuestaApi<CorteCajaDto[]>> {
    const params: Record<string, unknown> = {};
    if (idCaja) params.idCaja = idCaja;
    if (fechaInicio) params.fechaInicio = fechaInicio;
    if (fechaFin) params.fechaFin = fechaFin;

    const respuesta = await clienteApi.get<RespuestaApi<CorteCajaDto[]>>('/cajas/cortes', { params });
    return respuesta.data;
  }
};

export default servicioCaja;
