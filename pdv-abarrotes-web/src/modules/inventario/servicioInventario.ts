import clienteApi from '../../api/clienteApi';
import type { RespuestaApi, ResultadoPaginado } from '../../types/comun';
import type {
  StockProductoDto,
  MovimientoKardexDto,
  RegistrarAjusteStockDto,
  AlertaStockDto,
  TipoMovimientoInventarioDto,
  FiltroInventarioDto,
  FiltroKardexDto,
} from './tipos';

/**
 * Servicio cliente para interactuar con la gestión de inventario, Kardex y ajustes.
 */
export const servicioInventario = {
  /**
   * Consulta las existencias de productos con paginación server-side.
   */
  async obtenerStockPaginado(filtro: FiltroInventarioDto): Promise<ResultadoPaginado<StockProductoDto>> {
    const respuesta = await clienteApi.get<RespuestaApi<ResultadoPaginado<StockProductoDto>>>('/inventario/stock', {
      params: filtro,
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
   * Consulta el Kardex histórico inmutable con filtros por fecha, tipo y producto.
   */
  async obtenerKardexPaginado(filtro: FiltroKardexDto): Promise<ResultadoPaginado<MovimientoKardexDto>> {
    const respuesta = await clienteApi.get<RespuestaApi<ResultadoPaginado<MovimientoKardexDto>>>('/inventario/kardex', {
      params: filtro,
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
   * Aplica un ajuste manual (Entrada, Salida o Reconteo Físico) de forma atómica.
   */
  async registrarAjuste(dto: RegistrarAjusteStockDto): Promise<MovimientoKardexDto> {
    const respuesta = await clienteApi.post<RespuestaApi<MovimientoKardexDto>>('/inventario/ajuste', dto);
    return respuesta.data.datos!;
  },

  /**
   * Consulta los artículos con existencias críticas o por debajo del mínimo.
   */
  async obtenerAlertasBajoStock(limite: number = 50): Promise<AlertaStockDto[]> {
    const respuesta = await clienteApi.get<RespuestaApi<AlertaStockDto[]>>('/inventario/alertas-bajo-stock', {
      params: { limite },
    });
    return respuesta.data.datos || [];
  },

  /**
   * Consulta el catálogo de tipos de movimiento para filtros.
   */
  async obtenerTiposMovimiento(): Promise<TipoMovimientoInventarioDto[]> {
    const respuesta = await clienteApi.get<RespuestaApi<TipoMovimientoInventarioDto[]>>('/inventario/tipos-movimiento');
    return respuesta.data.datos || [];
  },
};
