import clienteApi from '../../api/clienteApi';
import type { RespuestaApi } from '../../types/comun';
import type { CategoriaDto, MarcaDto, UnidadMedidaDto, CrearActualizarCatalogoDto } from './tipos';

/**
 * Servicio cliente para interactuar con los catálogos generales.
 */
export const servicioCatalogos = {
  /**
   * Obtiene la lista de categorías.
   */
  async obtenerCategorias(soloActivos: boolean = false): Promise<CategoriaDto[]> {
    const respuesta = await clienteApi.get<RespuestaApi<CategoriaDto[]>>('/catalogos/categorias', {
      params: { soloActivos },
    });
    return respuesta.data.datos || [];
  },

  /**
   * Guarda o actualiza una categoría.
   */
  async guardarCategoria(idCategoria: number | null, dto: CrearActualizarCatalogoDto): Promise<CategoriaDto> {
    const respuesta = await clienteApi.post<RespuestaApi<CategoriaDto>>('/catalogos/categorias', dto, {
      params: idCategoria ? { idCategoria } : {},
    });
    return respuesta.data.datos!;
  },

  /**
   * Obtiene la lista de marcas.
   */
  async obtenerMarcas(soloActivos: boolean = false): Promise<MarcaDto[]> {
    const respuesta = await clienteApi.get<RespuestaApi<MarcaDto[]>>('/catalogos/marcas', {
      params: { soloActivos },
    });
    return respuesta.data.datos || [];
  },

  /**
   * Guarda o actualiza una marca.
   */
  async guardarMarca(idMarca: number | null, dto: CrearActualizarCatalogoDto): Promise<MarcaDto> {
    const respuesta = await clienteApi.post<RespuestaApi<MarcaDto>>('/catalogos/marcas', dto, {
      params: idMarca ? { idMarca } : {},
    });
    return respuesta.data.datos!;
  },

  /**
   * Obtiene las unidades de medida habilitadas.
   */
  async obtenerUnidadesMedida(soloActivos: boolean = true): Promise<UnidadMedidaDto[]> {
    const respuesta = await clienteApi.get<RespuestaApi<UnidadMedidaDto[]>>('/catalogos/unidades-medida', {
      params: { soloActivos },
    });
    return respuesta.data.datos || [];
  },
};
