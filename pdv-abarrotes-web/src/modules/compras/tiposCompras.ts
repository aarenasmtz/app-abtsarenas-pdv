import type { FiltroPaginacion } from '../../types/comun';

/**
 * Detalle individual de un renglón o partida recibida en una compra.
 */
export interface DetalleCompraDto {
  idDetalleCompra: number;
  idCompra: number;
  idProducto: number;
  codigoBarras: string;
  descripcionProducto: string;
  numeroRenglon: number;
  cantidadRecibida: number;
  costoUnitario: number;
  totalRenglon: number;
}

/**
 * Cabecera e historial completo de una compra registrada.
 */
export interface CompraDto {
  idCompra: number;
  folioCompra: number;
  idProveedor?: number | null;
  nombreProveedor: string;
  idUsuario: number;
  nombreUsuario: string;
  fechaCompra: string;
  totalCompra: number;
  estatus: string;
  observaciones?: string | null;
  fechaRegistro: string;
  totalPartidas: number;
  detalles: DetalleCompraDto[];
}

/**
 * Partida de producto individual recibida al registrar una compra.
 */
export interface PartidaCompraDto {
  idProducto: number;
  cantidad: number;
  costoUnitario: number;
  actualizarPrecioCosto: boolean;
  // Campos visuales de apoyo
  descripcion?: string;
  codigoBarras?: string;
  subtotal?: number;
}

/**
 * Solicitud completa para registrar una compra en el backend.
 */
export interface RegistrarCompraDto {
  idProveedor?: number | null;
  fechaCompra?: string | null;
  observaciones?: string | null;
  partidas: PartidaCompraDto[];
}

/**
 * Criterios de filtrado y búsqueda para historial de compras.
 */
export interface FiltroComprasDto extends FiltroPaginacion {
  idProveedor?: number;
  fechaInicio?: string;
  fechaFin?: string;
  terminoBusqueda?: string;
}
