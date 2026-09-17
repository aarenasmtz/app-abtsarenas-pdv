import type { FiltroPaginacion } from '../../types/comun';

/**
 * Resumen de existencias de un producto con semáforo de inventario.
 */
export interface StockProductoDto {
  idProducto: number;
  codigoBarras: string;
  codigoProducto: string;
  descripcion: string;
  categoria: string;
  marca: string;
  unidadMedida: string;
  precioCosto: number;
  precioVenta: number;
  existenciaActual: number;
  existenciaMinima: number;
  existenciaMaxima: number;
  manejaInventario: boolean;
  permiteVentaFraccionada: boolean;
  estadoStock: 'Optimo' | 'Bajo' | 'Critico' | 'Excedido';
  activo: boolean;
}

/**
 * Movimiento inmutable del Kardex histórico.
 */
export interface MovimientoKardexDto {
  idMovimientoInventario: number;
  idProducto: number;
  codigoBarras: string;
  codigoProducto: string;
  descripcionProducto: string;
  categoria: string;
  idTipoMovimiento: number;
  tipoMovimiento: string;
  efectoStock: number; // +1, -1, 0
  cantidadAnterior: number;
  cantidadMovimiento: number;
  cantidadNueva: number;
  precioCosto: number;
  referenciaModulo?: string;
  idReferencia?: number;
  motivo?: string;
  usuario: string;
  fechaMovimiento: string;
}

/**
 * Parámetros para aplicar un ajuste manual de existencias.
 */
export interface RegistrarAjusteStockDto {
  idProducto: number;
  cantidadAjuste: number;
  tipoAjuste: 'ENTRADA' | 'SALIDA' | 'RECONTEO_FISICO';
  motivo: string;
  observaciones?: string;
}

/**
 * Producto con nivel de inventario insuficiente que requiere compra.
 */
export interface AlertaStockDto {
  idProducto: number;
  codigoBarras: string;
  descripcion: string;
  categoria: string;
  existenciaActual: number;
  existenciaMinima: number;
  existenciaMaxima: number;
  faltanteParaMinimo: number;
  sugeridoParaMaximo: number;
  nivelAlerta: 'CRITICO' | 'BAJO';
}

export interface TipoMovimientoInventarioDto {
  idTipoMovimiento: number;
  codigoTipo: string;
  descripcion: string;
  efectoStock: number;
}

export interface FiltroInventarioDto extends FiltroPaginacion {
  idCategoria?: number;
  idMarca?: number;
  soloBajoStock?: boolean;
  soloActivos?: boolean;
}

export interface FiltroKardexDto extends FiltroPaginacion {
  idProducto?: number;
  idTipoMovimiento?: number;
  fechaInicio?: string;
  fechaFin?: string;
}
