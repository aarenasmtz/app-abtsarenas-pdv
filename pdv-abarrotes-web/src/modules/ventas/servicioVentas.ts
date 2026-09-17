import clienteApi from '../../api/clienteApi';
import type { RespuestaApi, ResultadoPaginado } from '../../types/comun';
import type { 
  RegistrarVentaPeticion, 
  VentaRealizada, 
  TicketVenta, 
  VentaResumen, 
  FiltroVentas 
} from './tipos';

/**
 * Cliente de servicios HTTP para procesamiento de ventas y emisión de tickets térmicos.
 */
export const servicioVentas = {
  /**
   * Registra una venta atómica con actualización de inventarios, pagos e idempotencia.
   */
  async registrarVenta(peticion: RegistrarVentaPeticion): Promise<RespuestaApi<VentaRealizada>> {
    const respuesta = await clienteApi.post<RespuestaApi<VentaRealizada>>('/ventas', peticion);
    return respuesta.data;
  },

  /**
   * Obtiene la estructura formateada de un ticket para impresión térmica (58mm / 80mm).
   */
  async obtenerTicket(idVenta: number): Promise<RespuestaApi<TicketVenta>> {
    const respuesta = await clienteApi.get<RespuestaApi<TicketVenta>>(`/ventas/${idVenta}/ticket`);
    return respuesta.data;
  },

  /**
   * Consulta las ventas recientes paginadas para consulta rápida o reimpresión de tickets.
   */
  async obtenerVentasRecientes(filtro: FiltroVentas = {}): Promise<RespuestaApi<ResultadoPaginado<VentaResumen>>> {
    const respuesta = await clienteApi.get<RespuestaApi<ResultadoPaginado<VentaResumen>>>('/ventas/recientes', {
      params: {
        pagina: filtro.pagina || 1,
        registrosPorPagina: filtro.registrosPorPagina || 25,
        terminoBusqueda: filtro.terminoBusqueda,
        fechaInicio: filtro.fechaInicio,
        fechaFin: filtro.fechaFin,
        idCaja: filtro.idCaja,
        idUsuario: filtro.idUsuario
      }
    });
    return respuesta.data;
  },

  /**
   * Cancela una venta previa y reintegra las existencias al inventario.
   */
  async cancelarVenta(idVenta: number, motivo: string): Promise<RespuestaApi<boolean>> {
    const respuesta = await clienteApi.post<RespuestaApi<boolean>>(`/ventas/${idVenta}/cancelar`, { motivo });
    return respuesta.data;
  }
};

export default servicioVentas;
