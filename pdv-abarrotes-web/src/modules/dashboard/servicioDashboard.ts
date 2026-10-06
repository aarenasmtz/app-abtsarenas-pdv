import clienteApi from '../../api/clienteApi';
import type { RespuestaApi } from '../../types/comun';
import type { ResumenDashboardDto } from './tiposDashboard';

/**
 * Servicio cliente para métricas y gráficas ejecutivas del Dashboard.
 */
export const servicioDashboard = {
  /**
   * Obtiene los KPIs de ventas, utilidades, gráficos de tendencia y top productos.
   */
  async obtenerDashboard(): Promise<ResumenDashboardDto> {
    const respuesta = await clienteApi.get<RespuestaApi<ResumenDashboardDto>>('/reportes/dashboard');
    return respuesta.data.datos!;
  },
};
