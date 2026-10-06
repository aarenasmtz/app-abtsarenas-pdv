import clienteApi from '../../api/clienteApi';
import type { RespuestaApi, ResultadoPaginado } from '../../types/comun';
import type {
  ProveedorDto,
  CrearProveedorDto,
  ActualizarProveedorDto,
  FiltroProveedoresDto,
} from './tiposProveedores';

/**
 * Servicio cliente para interactuar con la API de Proveedores.
 */
export const servicioProveedores = {
  /**
   * Obtiene la lista paginada de proveedores con filtros opcionales.
   */
  async obtenerPaginado(filtro: FiltroProveedoresDto): Promise<ResultadoPaginado<ProveedorDto>> {
    const respuesta = await clienteApi.get<RespuestaApi<ResultadoPaginado<ProveedorDto>>>('/proveedores', {
      params: {
        pagina: filtro.pagina,
        registrosPorPagina: filtro.registrosPorPagina,
        terminoBusqueda: filtro.terminoBusqueda || undefined,
        soloActivos: filtro.soloActivos,
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
   * Obtiene todos los proveedores activos (para combos y selectores).
   */
  async obtenerActivos(): Promise<ProveedorDto[]> {
    const respuesta = await clienteApi.get<RespuestaApi<ProveedorDto[]>>('/proveedores/activos');
    return respuesta.data.datos || [];
  },

  /**
   * Obtiene el detalle de un proveedor por su ID.
   */
  async obtenerPorId(idProveedor: number): Promise<ProveedorDto> {
    const respuesta = await clienteApi.get<RespuestaApi<ProveedorDto>>(`/proveedores/${idProveedor}`);
    return respuesta.data.datos!;
  },

  /**
   * Registra un nuevo proveedor comercial.
   */
  async crear(nuevoProveedor: CrearProveedorDto): Promise<ProveedorDto> {
    const respuesta = await clienteApi.post<RespuestaApi<ProveedorDto>>('/proveedores', nuevoProveedor);
    return respuesta.data.datos!;
  },

  /**
   * Modifica los datos de un proveedor existente.
   */
  async actualizar(idProveedor: number, datosActualizados: ActualizarProveedorDto): Promise<ProveedorDto> {
    const respuesta = await clienteApi.put<RespuestaApi<ProveedorDto>>(`/proveedores/${idProveedor}`, datosActualizados);
    return respuesta.data.datos!;
  },

  /**
   * Activa o desactiva a un proveedor.
   */
  async cambiarEstado(idProveedor: number, activo: boolean): Promise<boolean> {
    const respuesta = await clienteApi.patch<RespuestaApi<boolean>>(`/proveedores/${idProveedor}/estado`, null, {
      params: { activo },
    });
    return respuesta.data.datos ?? false;
  },
};
