import clienteApi from '../../api/clienteApi';
import type { RespuestaApi, ResultadoPaginado } from '../../types/comun';
import type {
  ProductoAdminDto,
  ProductoCobroDto,
  ResultadoBusquedaPdvDto,
  CrearProductoDto,
  ActualizarProductoDto,
  FiltroProductosDto,
} from './tipos';

/**
 * Servicio cliente para interactuar con los endpoints de productos.
 */
export const servicioProductos = {
  /**
   * Obtiene listado paginado con filtros server-side para administración.
   */
  async obtenerPaginado(filtro: FiltroProductosDto): Promise<ResultadoPaginado<ProductoAdminDto>> {
    const respuesta = await clienteApi.get<RespuestaApi<ResultadoPaginado<ProductoAdminDto>>>('/productos', {
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
   * Obtiene detalle de un producto por su identificador.
   */
  async obtenerPorId(idProducto: number): Promise<ProductoAdminDto> {
    const respuesta = await clienteApi.get<RespuestaApi<ProductoAdminDto>>(`/productos/${idProducto}`);
    return respuesta.data.datos!;
  },

  /**
   * Registra un nuevo producto en el catálogo.
   */
  async crear(nuevoProducto: CrearProductoDto): Promise<ProductoAdminDto> {
    const respuesta = await clienteApi.post<RespuestaApi<ProductoAdminDto>>('/productos', nuevoProducto);
    return respuesta.data.datos!;
  },

  /**
   * Modifica los datos de un producto.
   */
  async actualizar(idProducto: number, datosActualizados: ActualizarProductoDto): Promise<ProductoAdminDto> {
    const respuesta = await clienteApi.put<RespuestaApi<ProductoAdminDto>>(`/productos/${idProducto}`, datosActualizados);
    return respuesta.data.datos!;
  },

  /**
   * Activa o desactiva un producto del catálogo.
   */
  async cambiarEstado(idProducto: number, activo: boolean): Promise<boolean> {
    const respuesta = await clienteApi.patch<RespuestaApi<boolean>>(`/productos/${idProducto}/estado`, null, {
      params: { activo },
    });
    return respuesta.data.datos ?? false;
  },

  /**
   * Sube una imagen para un producto y actualiza su URL en el servidor.
   */
  async subirImagen(idProducto: number, archivo: File): Promise<string> {
    const formData = new FormData();
    formData.append('archivoImagen', archivo);

    const respuesta = await clienteApi.post<RespuestaApi<string>>(`/productos/${idProducto}/imagen`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return respuesta.data.datos || '';
  },

  /**
   * Consulta ultrarrápida para escáner de código de barras en PDV (<50ms, sin imágenes).
   * Maneja tanto código directo como reintento con '0' inicial si la pistola omite ceros en códigos UPC (11/12 dígitos).
   */
  async buscarPorCodigoBarras(codigo: string): Promise<ProductoCobroDto> {
    try {
      const respuesta = await clienteApi.get<RespuestaApi<ProductoCobroDto>>(`/productos/codigo-barras/${encodeURIComponent(codigo)}`);
      return respuesta.data.datos!;
    } catch (err: unknown) {
      const errorAxios = err as { response?: { status?: number } };
      // Si fue 404 y el código tiene 11 o 12 dígitos, reintentar anteponiendo '0'
      if (errorAxios?.response?.status === 404 && (codigo.length === 11 || codigo.length === 12)) {
        try {
          const respuestaConCero = await clienteApi.get<RespuestaApi<ProductoCobroDto>>(`/productos/codigo-barras/${encodeURIComponent('0' + codigo)}`);
          if (respuestaConCero.data.datos) {
            return respuestaConCero.data.datos;
          }
        } catch {
          // Si tampoco se encontró con cero inicial, dejamos propagar el error original
        }
      }
      throw err;
    }
  },

  /**
   * Búsqueda predictiva optimizada para la caja del PDV (máximo 15 coincidencias, sin imágenes).
   */
  async buscarPdv(termino: string, limite: number = 15): Promise<ResultadoBusquedaPdvDto[]> {
    if (!termino || !termino.trim()) return [];
    const respuesta = await clienteApi.get<RespuestaApi<ResultadoBusquedaPdvDto[]>>('/productos/buscar-pdv', {
      params: { termino: termino.trim(), limite },
    });
    return respuesta.data.datos || [];
  },
};
