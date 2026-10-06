import clienteApi from '../../api/clienteApi';
import type { RespuestaApi, ResultadoPaginado } from '../../types/comun';
import type {
  ReporteVentasFiltroDto,
  ReporteVentaItemDto,
  ResumenReporteVentasDto,
  ReporteUtilidadItemDto,
} from './tiposReportes';

/**
 * Servicio cliente para interactuar con los reportes de ventas y utilidades.
 */
export const servicioReportes = {
  /**
   * Obtiene el listado de tickets paginados server-side con filtros avanzados.
   */
  async obtenerReporteVentasPaginado(filtro: ReporteVentasFiltroDto): Promise<ResultadoPaginado<ReporteVentaItemDto>> {
    const respuesta = await clienteApi.get<RespuestaApi<ResultadoPaginado<ReporteVentaItemDto>>>('/reportes/ventas', {
      params: {
        pagina: filtro.pagina,
        registrosPorPagina: filtro.registrosPorPagina,
        fechaInicio: filtro.fechaInicio || undefined,
        fechaFin: filtro.fechaFin || undefined,
        idUsuario: filtro.idUsuario || undefined,
        idCaja: filtro.idCaja || undefined,
        soloCanceladas: filtro.soloCanceladas,
        terminoBusqueda: filtro.terminoBusqueda || undefined,
      },
    });

    return (
      respuesta.data.datos || {
        elementos: [],
        totalRegistros: 0,
        paginaActual: 1,
        registrosPorPagina: 25,
        totalPaginas: 0,
        tienePaginaAnterior: false,
        tienePaginaSiguiente: false,
      }
    );
  },

  /**
   * Calcula los totales consolidados (sin paginación) para el periodo filtrado.
   */
  async obtenerResumenVentas(filtro: ReporteVentasFiltroDto): Promise<ResumenReporteVentasDto> {
    const respuesta = await clienteApi.get<RespuestaApi<ResumenReporteVentasDto>>('/reportes/ventas/resumen', {
      params: {
        fechaInicio: filtro.fechaInicio || undefined,
        fechaFin: filtro.fechaFin || undefined,
        idUsuario: filtro.idUsuario || undefined,
        idCaja: filtro.idCaja || undefined,
        soloCanceladas: filtro.soloCanceladas,
        terminoBusqueda: filtro.terminoBusqueda || undefined,
      },
    });

    return respuesta.data.datos!;
  },

  /**
   * Genera el desglose gerencial de utilidades y margen neto por producto.
   */
  async obtenerReporteUtilidades(fechaInicio?: string, fechaFin?: string, limite: number = 50): Promise<ReporteUtilidadItemDto[]> {
    const respuesta = await clienteApi.get<RespuestaApi<ReporteUtilidadItemDto[]>>('/reportes/utilidades', {
      params: {
        fechaInicio: fechaInicio || undefined,
        fechaFin: fechaFin || undefined,
        limite,
      },
    });

    return respuesta.data.datos || [];
  },
};
