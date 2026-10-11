import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { RespuestaApi } from '../types/comun';

/**
 * Determina dinámicamente la URL base de la API:
 * - Localhost / 127.0.0.1: http://localhost:5000/api/v1
 * - Producción (abarrotesarenas.com y workers.dev con proxy inverso): /api/v1
 */
const obtenerUrlBaseApi = (): string => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
    }
  }

  // Tanto en abarrotesarenas.com (Nginx) como en workers.dev (Worker Reverse Proxy),
  // las rutas /api/v1 se gestionan localmente en el mismo origen (Same-Origin).
  return '/api/v1';
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
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('pdv:sesion-expirada'));
      }
    }
    return Promise.reject(error);
  }
);

export default clienteApi;
