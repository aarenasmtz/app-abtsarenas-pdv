/**
 * Tipos y contratos TypeScript para el módulo de Pedido Sugerido Dominical.
 */

export interface GenerarPedidoSugeridoDto {
  idSucursal?: number;
  diasAnalisisHistorial?: number;
  diasCobertura?: number;
  idProveedor?: number | null;
  idCategoria?: number | null;
  soloConSugerenciaPositiva?: boolean;
  observaciones?: string | null;
}

export interface DetallePedidoSugeridoDto {
  idDetallePedidoSugerido: number;
  idPedidoSugerido: number;
  idProducto: number;
  codigoBarras: string;
  nombreProducto: string;
  categoria: string;
  unidadMedida: string;
  permiteVentaFraccionada: boolean;
  idProveedor: number;
  nombreProveedor: string;
  stockActual: number;
  stockMinimo: number;
  ventaPromedioDiaria: number;
  diasCobertura: number;
  demandaEstimada: number;
  cantidadSugerida: number;
  cantidadAjustada: number | null;
  cantidadEfectiva: number;
  precioCostoUnitario: number;
  subtotalSugerido: number;
  subtotalEfectivo: number;
}

export interface ProveedorPedidoSugeridoGrupoDto {
  idProveedor: number;
  nombreProveedor: string;
  telefono: string | null;
  email: string | null;
  contacto: string | null;
  totalPartidas: number;
  totalPiezas: number;
  inversionEstimada: number;
  partidas: DetallePedidoSugeridoDto[];
}

export interface PedidoSugeridoDto {
  idPedidoSugerido: number;
  idSucursal: number;
  fechaGeneracion: string;
  semanaAnio: number;
  anio: number;
  estado: 'GENERADO' | 'REVISADO' | 'PROCESADO' | string;
  observaciones: string | null;
  totalPartidas: number;
  totalPiezasSugeridas: number;
  totalPiezasEfectivas: number;
  inversionEstimadaSugerida: number;
  inversionEstimadaEfectiva: number;
  detalles: DetallePedidoSugeridoDto[];
  gruposPorProveedor: ProveedorPedidoSugeridoGrupoDto[];
}

export interface PedidoSugeridoResumenDto {
  idPedidoSugerido: number;
  idSucursal: number;
  fechaGeneracion: string;
  semanaAnio: number;
  anio: number;
  estado: string;
  observaciones: string | null;
  totalPartidas: number;
  totalProveedores: number;
  totalPiezas: number;
  inversionEstimada: number;
}

export interface FiltroPedidosSugeridosDto {
  pagina?: number;
  registrosPorPagina?: number;
  estado?: string | null;
  anio?: number | null;
  semanaAnio?: number | null;
  fechaInicio?: string | null;
  fechaFin?: string | null;
}

export interface ActualizarDetallePedidoSugeridoDto {
  cantidadAjustada: number | null;
}

export interface ActualizarEstadoPedidoSugeridoDto {
  estado: string;
  observaciones?: string | null;
}
