import type { FiltroPaginacion } from '../../types/comun';

/**
 * Producto completo para el módulo administrativo con costos, márgenes e imagen.
 */
export interface ProductoAdminDto {
  idProducto: number;
  codigoProducto: string;
  codigoBarrasPrincipal: string;
  descripcion: string;
  idCategoria?: number;
  categoriaNombre?: string;
  idMarca?: number;
  marcaNombre?: string;
  idUnidadMedida?: number;
  unidadMedidaNombre?: string;
  precioCosto: number;
  precioVenta: number;
  precioMayoreo: number;
  porcentajeGanancia: number;
  existenciaActual: number;
  existenciaMinima: number;
  existenciaMaxima: number;
  permiteVentaFraccionada: boolean;
  manejaInventario: boolean;
  activo: boolean;
  imagenUrl?: string;
  fechaRegistro: string;
  fechaModificacion?: string;
}

/**
 * Producto ultraligero para escáner y cobro en PDV (Sin imágenes ni costos).
 */
export interface ProductoCobroDto {
  idProducto: number;
  codigoBarras: string;
  codigoProducto: string;
  descripcion: string;
  precioVenta: number;
  precioMayoreo: number;
  permiteVentaFraccionada: boolean;
  manejaInventario: boolean;
  existenciaActual: number;
  cantidadSugerida?: number;
  esPesableConCodigo?: boolean;
  categoria?: string;
}

/**
 * Resultado predictivo para el buscador de caja del PDV (Sin imágenes).
 */
export interface ResultadoBusquedaPdvDto {
  idProducto: number;
  codigoBarras: string;
  descripcion: string;
  precioVenta: number;
  existenciaActual: number;
  permiteVentaFraccionada: boolean;
  categoria: string;
}

export interface CrearProductoDto {
  codigoProducto?: string;
  codigoBarras?: string;
  descripcion: string;
  idCategoria?: number;
  idMarca?: number;
  idUnidadMedida?: number;
  precioCosto: number;
  precioVenta: number;
  precioMayoreo: number;
  porcentajeGanancia: number;
  existenciaInicial: number;
  existenciaMinima: number;
  existenciaMaxima: number;
  permiteVentaFraccionada: boolean;
  manejaInventario: boolean;
  imagenUrl?: string;
}

export interface ActualizarProductoDto {
  codigoBarrasPrincipal?: string;
  descripcion: string;
  idCategoria?: number;
  idMarca?: number;
  idUnidadMedida?: number;
  precioCosto: number;
  precioVenta: number;
  precioMayoreo: number;
  porcentajeGanancia: number;
  existenciaMinima: number;
  existenciaMaxima: number;
  permiteVentaFraccionada: boolean;
  manejaInventario: boolean;
  activo: boolean;
  imagenUrl?: string;
}

export interface FiltroProductosDto extends FiltroPaginacion {
  idCategoria?: number;
  idMarca?: number;
  soloActivos?: boolean;
  soloBajoStock?: boolean;
}
