import clienteApi from '../../api/clienteApi';
import type { RespuestaApi } from '../../types/comun';
import type {
  EstadoIntegracionServiciosDto,
  CompaniaTelefonicaDto,
  CatalogoServicioDto,
  SolicitudRecargaDto,
  ResultadoRecargaDto,
  SolicitudPagoServicioDto,
  ResultadoPagoServicioDto,
  SolicitudConsultaAdeudoDto,
  ResultadoConsultaAdeudoDto,
  TransaccionServicioDetalleDto,
  RegistroBitacoraDto,
  RegistroLogErrorDto,
  FiltroTransaccionesServiciosDto,
} from './tiposServicios';

/**
 * Servicio cliente para el módulo de Recargas Electrónicas y Pago de Servicios Públicos (RNP).
 */
export const servicioRecargasYServicios = {
  /**
   * Obtiene el estado de configuración del proveedor externo y saldo en bolsa.
   */
  async obtenerEstado(): Promise<EstadoIntegracionServiciosDto> {
    const respuesta = await clienteApi.get<RespuestaApi<EstadoIntegracionServiciosDto>>(
      '/recargas-servicios/estado'
    );
    return respuesta.data.datos!;
  },

  /**
   * Obtiene la lista de compañías telefónicas móviles en México y montos autorizados.
   */
  async obtenerCompanias(): Promise<CompaniaTelefonicaDto[]> {
    const respuesta = await clienteApi.get<RespuestaApi<CompaniaTelefonicaDto[]>>(
      '/recargas-servicios/companias'
    );
    return respuesta.data.datos || [];
  },

  /**
   * Obtiene el catálogo de servicios públicos y privados autorizados para cobro.
   */
  async obtenerCatalogoServicios(): Promise<CatalogoServicioDto[]> {
    const respuesta = await clienteApi.get<RespuestaApi<CatalogoServicioDto[]>>(
      '/recargas-servicios/catalogo'
    );
    return respuesta.data.datos || [];
  },

  /**
   * Procesa una recarga electrónica de tiempo aire.
   */
  async procesarRecarga(solicitud: SolicitudRecargaDto): Promise<ResultadoRecargaDto> {
    const respuesta = await clienteApi.post<RespuestaApi<ResultadoRecargaDto>>(
      '/recargas-servicios/recargar',
      solicitud
    );
    return respuesta.data.datos!;
  },

  /**
   * Procesa el pago y dispersión de un servicio público.
   */
  async procesarPagoServicio(solicitud: SolicitudPagoServicioDto): Promise<ResultadoPagoServicioDto> {
    const respuesta = await clienteApi.post<RespuestaApi<ResultadoPagoServicioDto>>(
      '/recargas-servicios/pagar-servicio',
      solicitud
    );
    return respuesta.data.datos!;
  },

  /**
   * Consulta el adeudo en tiempo real de un recibo o servicio.
   */
  async consultarAdeudo(solicitud: SolicitudConsultaAdeudoDto): Promise<ResultadoConsultaAdeudoDto> {
    const respuesta = await clienteApi.post<RespuestaApi<ResultadoConsultaAdeudoDto>>(
      '/recargas-servicios/consultar-adeudo',
      solicitud
    );
    return respuesta.data.datos!;
  },

  /**
   * Solicita la sincronización del catálogo completo de 400+ productos desde el API de RNP.
   */
  async sincronizarCatalogo(): Promise<number> {
    const respuesta = await clienteApi.post<RespuestaApi<number>>(
      '/recargas-servicios/sincronizar-catalogo'
    );
    return respuesta.data.datos ?? 0;
  },

  /**
   * Consulta las transacciones de recargas y servicios registradas.
   */
  async obtenerTransacciones(filtro?: FiltroTransaccionesServiciosDto): Promise<TransaccionServicioDetalleDto[]> {
    const params = new URLSearchParams();
    if (filtro?.folioPos) params.append('folioPos', filtro.folioPos);
    if (filtro?.referencia) params.append('referencia', filtro.referencia);
    if (filtro?.estado) params.append('estado', filtro.estado);
    if (filtro?.tipoTransaccion) params.append('tipoTransaccion', filtro.tipoTransaccion);
    if (filtro?.limite) params.append('limite', filtro.limite.toString());

    const respuesta = await clienteApi.get<RespuestaApi<TransaccionServicioDetalleDto[]>>(
      `/recargas-servicios/transacciones?${params.toString()}`
    );
    return respuesta.data.datos || [];
  },

  /**
   * Consulta el registro de bitácora operativa de servicios.
   */
  async obtenerBitacora(folioPos?: string, limite = 50): Promise<RegistroBitacoraDto[]> {
    const params = new URLSearchParams();
    if (folioPos) params.append('folioPos', folioPos);
    params.append('limite', limite.toString());

    const respuesta = await clienteApi.get<RespuestaApi<RegistroBitacoraDto[]>>(
      `/recargas-servicios/bitacora?${params.toString()}`
    );
    return respuesta.data.datos || [];
  },

  /**
   * Consulta el log de errores técnicos de la integración.
   */
  async obtenerErrores(folioPos?: string, limite = 50): Promise<RegistroLogErrorDto[]> {
    const params = new URLSearchParams();
    if (folioPos) params.append('folioPos', folioPos);
    params.append('limite', limite.toString());

    const respuesta = await clienteApi.get<RespuestaApi<RegistroLogErrorDto[]>>(
      `/recargas-servicios/errores?${params.toString()}`
    );
    return respuesta.data.datos || [];
  },

  /**
   * Consulta el saldo detallado de la bolsa RNP.
   */
  async obtenerSaldoBolsa(): Promise<any> {
    const respuesta = await clienteApi.get<RespuestaApi<any>>(
      '/recargas-servicios/saldo-bolsa'
    );
    return respuesta.data.datos;
  },
};
