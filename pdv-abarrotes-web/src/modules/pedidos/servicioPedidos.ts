import clienteApi from '../../api/clienteApi';
import type { RespuestaApi, ResultadoPaginado } from '../../types/comun';
import type {
  PedidoSugeridoDto,
  PedidoSugeridoResumenDto,
  DetallePedidoSugeridoDto,
  GenerarPedidoSugeridoDto,
  FiltroPedidosSugeridosDto,
  ActualizarDetallePedidoSugeridoDto,
  ActualizarEstadoPedidoSugeridoDto,
} from './tiposPedidos';

/**
 * Servicio cliente para el módulo de Pedido Sugerido Dominical.
 */
export const servicioPedidos = {
  /**
   * Genera y calcula un nuevo pedido sugerido dominical.
   */
  async generarPedido(dto: GenerarPedidoSugeridoDto): Promise<PedidoSugeridoDto> {
    const respuesta = await clienteApi.post<RespuestaApi<PedidoSugeridoDto>>(
      '/pedidos-sugeridos/generar',
      dto
    );
    return respuesta.data.datos!;
  },

  /**
   * Obtiene el listado histórico de pedidos sugeridos paginado con filtros.
   */
  async obtenerPaginado(
    filtro: FiltroPedidosSugeridosDto
  ): Promise<ResultadoPaginado<PedidoSugeridoResumenDto>> {
    const respuesta = await clienteApi.get<
      RespuestaApi<ResultadoPaginado<PedidoSugeridoResumenDto>>
    >('/pedidos-sugeridos', {
      params: {
        pagina: filtro.pagina || 1,
        registrosPorPagina: filtro.registrosPorPagina || 25,
        estado: filtro.estado || undefined,
        anio: filtro.anio || undefined,
        semanaAnio: filtro.semanaAnio || undefined,
        fechaInicio: filtro.fechaInicio || undefined,
        fechaFin: filtro.fechaFin || undefined,
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
   * Obtiene el detalle desglosado de un pedido sugerido con agrupación por proveedor.
   */
  async obtenerPorId(idPedidoSugerido: number): Promise<PedidoSugeridoDto> {
    const respuesta = await clienteApi.get<RespuestaApi<PedidoSugeridoDto>>(
      `/pedidos-sugeridos/${idPedidoSugerido}`
    );
    return respuesta.data.datos!;
  },

  /**
   * Ajusta la cantidad sugerida de una partida individual.
   */
  async actualizarCantidadDetalle(
    idDetalle: number,
    dto: ActualizarDetallePedidoSugeridoDto
  ): Promise<DetallePedidoSugeridoDto> {
    const respuesta = await clienteApi.put<RespuestaApi<DetallePedidoSugeridoDto>>(
      `/pedidos-sugeridos/detalles/${idDetalle}`,
      dto
    );
    return respuesta.data.datos!;
  },

  /**
   * Cambia el estado del pedido (GENERADO -> REVISADO -> PROCESADO).
   */
  async actualizarEstado(
    idPedidoSugerido: number,
    dto: ActualizarEstadoPedidoSugeridoDto
  ): Promise<PedidoSugeridoDto> {
    const respuesta = await clienteApi.patch<RespuestaApi<PedidoSugeridoDto>>(
      `/pedidos-sugeridos/${idPedidoSugerido}/estado`,
      dto
    );
    return respuesta.data.datos!;
  },

  /**
   * Elimina un pedido sugerido que no esté en estado PROCESADO.
   */
  async eliminarPedido(idPedidoSugerido: number): Promise<boolean> {
    const respuesta = await clienteApi.delete<RespuestaApi<boolean>>(
      `/pedidos-sugeridos/${idPedidoSugerido}`
    );
    return respuesta.data.exito;
  },
};
