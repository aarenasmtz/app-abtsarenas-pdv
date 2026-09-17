/**
 * Envoltorio estándar para respuestas del backend .NET 9.
 */
export interface RespuestaApi<T> {
  exito: boolean;
  mensaje: string;
  datos?: T;
  errores?: string[];
}

/**
 * Modelo de paginación server-side estándar.
 * Cumple con las reglas: 25 por defecto, opciones 25/50/100, máximo 100.
 */
export interface ResultadoPaginado<T> {
  elementos: T[];
  paginaActual: number;
  registrosPorPagina: number;
  totalRegistros: number;
  totalPaginas: number;
  tienePaginaAnterior: boolean;
  tienePaginaSiguiente: boolean;
}

/**
 * Parámetros para solicitudes paginadas.
 */
export interface FiltroPaginacion {
  pagina: number;
  registrosPorPagina: 25 | 50 | 100;
  busqueda?: string;
}
