import clienteApi from '../../api/clienteApi';
import type { RespuestaApi, ResultadoPaginado } from '../../types/comun';
import type {
  CompraDto,
  RegistrarCompraDto,
  FiltroComprasDto,
} from './tiposCompras';

/**
 * Servicio cliente para el módulo de compras y abastecimiento de inventario.
 */
export const servicioCompras = {
  /**
   * Registra atómicamente una nueva compra:
   * incrementa existencias, genera movimientos de Kardex y actualiza costos ponderados.
   */
  async registrarCompra(dto: RegistrarCompraDto): Promise<CompraDto> {
    const respuesta = await clienteApi.post<RespuestaApi<CompraDto>>('/compras', dto);
    return respuesta.data.datos!;
  },

  /**
   * Obtiene el historial de compras paginado con filtros.
   */
  async obtenerPaginado(filtro: FiltroComprasDto): Promise<ResultadoPaginado<CompraDto>> {
    const respuesta = await clienteApi.get<RespuestaApi<ResultadoPaginado<CompraDto>>>('/compras', {
      params: {
        pagina: filtro.pagina,
        registrosPorPagina: filtro.registrosPorPagina,
        idProveedor: filtro.idProveedor || undefined,
        fechaInicio: filtro.fechaInicio || undefined,
        fechaFin: filtro.fechaFin || undefined,
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
   * Obtiene el detalle completo de una compra y sus partidas recibidas.
   */
  async obtenerPorId(idCompra: number): Promise<CompraDto> {
    const respuesta = await clienteApi.get<RespuestaApi<CompraDto>>(`/compras/${idCompra}`);
    return respuesta.data.datos!;
  },
};
