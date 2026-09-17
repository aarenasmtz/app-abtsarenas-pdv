import clienteApi from '../../api/clienteApi';
import type { RespuestaApi } from '../../types/comun';
import type { UsuarioSesion } from '../../types/modelos';

export interface SolicitudLogin {
  nombreUsuario: string;
  clave: string;
}

export interface RespuestaLogin {
  token: string;
  idUsuario: number;
  nombreCompleto: string;
  nombreUsuario: string;
  rol: string;
  fechaExpiracion: string;
}

export const servicioAutenticacion = {
  iniciarSesion: async (solicitud: SolicitudLogin): Promise<RespuestaLogin> => {
    const respuesta = await clienteApi.post<RespuestaApi<RespuestaLogin>>('/autenticacion/login', solicitud);
    if (!respuesta.data.exito || !respuesta.data.datos) {
      throw new Error(respuesta.data.mensaje || 'Credenciales inválidas');
    }

    const datos = respuesta.data.datos;
    localStorage.setItem('pdv_token', datos.token);
    localStorage.setItem('pdv_usuario', JSON.stringify({
      idUsuario: datos.idUsuario,
      nombreCompleto: datos.nombreCompleto,
      nombreUsuario: datos.nombreUsuario,
      rol: datos.rol,
      token: datos.token
    }));

    return datos;
  },

  obtenerSesionGuardada: (): UsuarioSesion | null => {
    const token = localStorage.getItem('pdv_token');
    const usuarioJson = localStorage.getItem('pdv_usuario');
    if (token && usuarioJson) {
      try {
        return JSON.parse(usuarioJson);
      } catch {
        return null;
      }
    }
    return null;
  },

  cerrarSesion: () => {
    localStorage.removeItem('pdv_token');
    localStorage.removeItem('pdv_usuario');
  }
};
