import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { RespuestaApi } from '../types/comun';

/**
 * Determina dinámicamente la URL base de la API según el entorno de ejecución:
 * 1. Variable de entorno explícita (VITE_API_URL) si fue provista en el build y no es un path relativo en dominios ajenos.
 * 2. Si se ejecuta en localhost o 127.0.0.1 -> http://localhost:5000/api/v1
 * 3. Si se accede desde el dominio oficial de producción (abarrotesarenas.com) -> /api/v1
 * 4. Si se accede desde Cloudflare Workers (*.workers.dev, *.pages.dev) -> https://abarrotesarenas.com/api/v1
 */
const obtenerUrlBaseApi = (): string => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    // Entorno local de desarrollo
    if (host === 'localhost' || host === '127.0.0.1') {
      return import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
    }
    // Dominio oficial del VPS de producción
    if (host.includes('abarrotesarenas.com')) {
      return '/api/v1';
    }
    // Entorno Cloudflare Workers (*.workers.dev) o previews remotos
    return 'https://abarrotesarenas.com/api/v1';
  }

  return 'https://abarrotesarenas.com/api/v1';
};

export const clienteApi = axios.create({
  baseURL: obtenerUrlBaseApi(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Interceptor de solicitudes: inyecta el token de autenticación
clienteApi.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('pdv_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de respuestas: estandariza errores
clienteApi.interceptors.response.use(
  (response) => response,
  (error: AxiosError<RespuestaApi<unknown>>) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('pdv_token');
      localStorage.removeItem('pdv_usuario');
      // Redirigir a login si es necesario
    }
    return Promise.reject(error);
  }
);

export default clienteApi;
