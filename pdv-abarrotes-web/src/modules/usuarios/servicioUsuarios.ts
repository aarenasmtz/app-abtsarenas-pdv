import clienteApi from '../../api/clienteApi';
import type { RespuestaApi, ResultadoPaginado, FiltroPaginacion } from '../../types/comun';

export interface UsuarioItem {
  idUsuario: number;
  nombreCompleto: string;
  nombreUsuario: string;
  correo: string;
  telefono: string;
  esAdministrador: boolean;
  activo: boolean;
  rol: string;
  fechaRegistro: string;
  [key: string]: unknown;
}

export interface CrearUsuarioSolicitud {
  nombreCompleto: string;
  nombreUsuario: string;
  clave: string;
  correo: string;
  telefono: string;
  idRol: number;
}

export interface ActualizarUsuarioSolicitud {
  nombreCompleto: string;
  correo: string;
  telefono: string;
  idRol: number;
  activo: boolean;
  nuevaClave?: string;
}

export const servicioUsuarios = {
  obtenerUsuarios: async (filtro: FiltroPaginacion): Promise<ResultadoPaginado<UsuarioItem>> => {
    const respuesta = await clienteApi.get<RespuestaApi<ResultadoPaginado<UsuarioItem>>>('/usuarios', {
      params: {
        pagina: filtro.pagina,
        registrosPorPagina: filtro.registrosPorPagina,
        busqueda: filtro.busqueda,
      },
    });

    if (!respuesta.data.exito || !respuesta.data.datos) {
      throw new Error(respuesta.data.mensaje || 'Error al obtener usuarios');
    }

    return respuesta.data.datos;
  },

  crearUsuario: async (datos: CrearUsuarioSolicitud): Promise<UsuarioItem> => {
    const respuesta = await clienteApi.post<RespuestaApi<UsuarioItem>>('/usuarios', datos);
    if (!respuesta.data.exito || !respuesta.data.datos) {
      throw new Error(respuesta.data.mensaje || 'Error al crear usuario');
    }
    return respuesta.data.datos;
  },

  actualizarUsuario: async (idUsuario: number, datos: ActualizarUsuarioSolicitud): Promise<void> => {
    const respuesta = await clienteApi.put<RespuestaApi<string>>(`/usuarios/${idUsuario}`, datos);
    if (!respuesta.data.exito) {
      throw new Error(respuesta.data.mensaje || 'Error al actualizar usuario');
    }
  },

  cambiarEstado: async (idUsuario: number, activo: boolean): Promise<void> => {
    const respuesta = await clienteApi.patch<RespuestaApi<string>>(`/usuarios/${idUsuario}/estado`, activo);
    if (!respuesta.data.exito) {
      throw new Error(respuesta.data.mensaje || 'Error al cambiar estado del usuario');
    }
  },
};
