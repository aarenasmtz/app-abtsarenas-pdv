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
} from './tiposServicios';

/**
 * Servicio cliente para el módulo de Recargas Electrónicas y Pago de Servicios Públicos.
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
};
