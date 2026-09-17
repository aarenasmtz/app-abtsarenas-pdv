import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { RespuestaApi } from '../types/comun';

const URL_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const clienteApi = axios.create({
  baseURL: URL_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
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
