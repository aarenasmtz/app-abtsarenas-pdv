import type { FiltroPaginacion } from '../../types/comun';
import type { VentaPorMetodoPagoDto } from '../dashboard/tiposDashboard';

/**
 * Filtro de búsqueda y paginación para el reporte de tickets de venta.
 */
export interface ReporteVentasFiltroDto extends FiltroPaginacion {
  fechaInicio?: string;
  fechaFin?: string;
  idUsuario?: number;
  idCaja?: number;
  idMetodoPago?: number;
  soloCanceladas?: boolean;
  terminoBusqueda?: string;
}

/**
 * Item individual de ticket para la tabla del reporte de ventas.
 */
export interface ReporteVentaItemDto {
  idVenta: number;
  folioVenta: string;
  fechaVenta: string;
  cajero: string;
  subtotal: number;
  descuento: number;
  impuesto: number;
  total: number;
  ganancia: number;
  margenPorcentaje: number;
  numeroArticulos: number;
  metodosPago: string;
  estatus: string;
  esCancelada: boolean;
}

/**
 * Resumen consolidado del periodo filtrado.
 */
export interface ResumenReporteVentasDto {
  totalVentas: number;
  totalGanancia: number;
  margenPromedioPorcentaje: number;
  totalTickets: number;
  totalArticulosVendidos: number;
  ticketPromedio: number;
  ticketsCancelados: number;
  montoCancelado: number;
  desgloseMetodosPago: VentaPorMetodoPagoDto[];
}

/**
 * Renglón para el reporte gerencial de utilidades por producto.
 */
export interface ReporteUtilidadItemDto {
  idProducto: number;
  codigoBarras: string;
  descripcion: string;
  categoria: string;
  cantidadVendida: number;
  costoTotal: number;
  ventaTotal: number;
  utilidadBruta: number;
  margenPorcentaje: number;
}
