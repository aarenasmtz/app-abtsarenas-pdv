import { create } from 'zustand';
import type { UsuarioSesion } from '../../types/modelos';
import { servicioAutenticacion, type SolicitudLogin } from './servicioAutenticacion';

interface EstadoAutenticacion {
  usuario: UsuarioSesion | null;
  estaAutenticado: boolean;
  cargando: boolean;
  error: string | null;

  // Acciones
  iniciarSesion: (solicitud: SolicitudLogin) => Promise<boolean>;
  cerrarSesion: () => void;
  cargarSesionInicial: () => void;
}

export const useStoreAutenticacion = create<EstadoAutenticacion>((set) => ({
  usuario: null,
  estaAutenticado: false,
  cargando: false,
  error: null,

  iniciarSesion: async (solicitud: SolicitudLogin) => {
    set({ cargando: true, error: null });
    try {
      const datos = await servicioAutenticacion.iniciarSesion(solicitud);
      const usuarioSesion: UsuarioSesion = {
        idUsuario: datos.idUsuario,
        nombreCompleto: datos.nombreCompleto,
        nombreUsuario: datos.nombreUsuario,
        rol: datos.rol,
        token: datos.token,
      };

      set({
        usuario: usuarioSesion,
        estaAutenticado: true,
        cargando: false,
        error: null,
      });
      return true;
    } catch (err: unknown) {
      const mensaje = err instanceof Error ? err.message : 'Error al conectar con el servidor';
      set({
        cargando: false,
        error: mensaje,
      });
      return false;
    }
  },

  cerrarSesion: () => {
    servicioAutenticacion.cerrarSesion();
    set({
      usuario: null,
      estaAutenticado: false,
      error: null,
    });
  },

  cargarSesionInicial: () => {
    const sesion = servicioAutenticacion.obtenerSesionGuardada();
    if (sesion) {
      set({
        usuario: sesion,
        estaAutenticado: true,
      });
    }
  },
}));
