import type { FiltroPaginacion } from '../../types/comun';

/**
 * DTO con la información completa de un proveedor.
 */
export interface ProveedorDto {
  idProveedor: number;
  nombre: string;
  nombreContacto?: string | null;
  rfc?: string | null;
  telefono?: string | null;
  correo?: string | null;
  direccion?: string | null;
  notas?: string | null;
  activo: boolean;
  fechaRegistro: string;
  totalComprasRegistradas: number;
}

/**
 * Parámetros para registrar un nuevo proveedor.
 */
export interface CrearProveedorDto {
  nombre: string;
  nombreContacto?: string | null;
  rfc?: string | null;
  telefono?: string | null;
  correo?: string | null;
  direccion?: string | null;
  notas?: string | null;
}

/**
 * Parámetros para actualizar un proveedor existente.
 */
export interface ActualizarProveedorDto {
  idProveedor: number;
  nombre: string;
  nombreContacto?: string | null;
  rfc?: string | null;
  telefono?: string | null;
  correo?: string | null;
  direccion?: string | null;
  notas?: string | null;
  activo: boolean;
}

/**
 * Criterios de búsqueda y filtrado para proveedores.
 */
export interface FiltroProveedoresDto extends FiltroPaginacion {
  terminoBusqueda?: string;
  soloActivos?: boolean;
}
