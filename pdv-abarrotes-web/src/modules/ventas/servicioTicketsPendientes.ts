import clienteApi from '../../api/clienteApi';
import type { RespuestaApi } from '../../types/comun';
import type { 
  CrearTicketPendientePeticion, 
  TicketPendienteDto 
} from './tipos';

/**
 * Servicio cliente para gestión de ventas puestas en espera (tickets pendientes).
 */
export const servicioTicketsPendientes = {
  /**
   * Pone en espera la venta actual de caja guardándola temporalmente.
   */
  async guardar(peticion: CrearTicketPendientePeticion): Promise<RespuestaApi<TicketPendienteDto>> {
    const respuesta = await clienteApi.post<RespuestaApi<TicketPendienteDto>>('/tickets-pendientes', peticion);
    return respuesta.data;
  },

  /**
   * Consulta los tickets pendientes activos en espera de cobro.
   */
  async obtenerActivos(idCaja?: number): Promise<RespuestaApi<TicketPendienteDto[]>> {
    const respuesta = await clienteApi.get<RespuestaApi<TicketPendienteDto[]>>('/tickets-pendientes', {
      params: idCaja ? { idCaja } : undefined
    });
    return respuesta.data;
  },

  /**
   * Reanuda un ticket en espera para cargarlo a caja y retirarlo de la cola.
   */
  async recuperar(idTicketPendiente: number): Promise<RespuestaApi<TicketPendienteDto>> {
    const respuesta = await clienteApi.post<RespuestaApi<TicketPendienteDto>>(`/tickets-pendientes/${idTicketPendiente}/recuperar`);
    return respuesta.data;
  },

  /**
   * Descarta y anula una venta en espera cuando el cliente ya no regresa.
   */
  async descartar(idTicketPendiente: number): Promise<RespuestaApi<boolean>> {
    const respuesta = await clienteApi.delete<RespuestaApi<boolean>>(`/tickets-pendientes/${idTicketPendiente}`);
    return respuesta.data;
  }
};

export default servicioTicketsPendientes;
