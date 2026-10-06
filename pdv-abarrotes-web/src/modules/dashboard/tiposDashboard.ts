/**
 * Tipos e interfaces TypeScript para el Dashboard ejecutivo gerencial.
 */

export interface VentaPorMetodoPagoDto {
  metodoPago: string;
  total: number;
  porcentaje: number;
  cantidadTransacciones: number;
}

export interface TendenciaVentaDiaDto {
  fecha: string;
  diaSemana: string;
  totalVentas: number;
  totalGanancia: number;
  totalTickets: number;
}

export interface TopProductoVendidoDto {
  idProducto: number;
  descripcion: string;
  categoria: string;
  cantidadVendida: number;
  totalVendido: number;
  gananciaGenerada: number;
  margenPorcentaje: number;
}

export interface ResumenDashboardDto {
  ventasHoy: number;
  ticketsHoy: number;
  gananciaHoy: number;
  ticketPromedioHoy: number;
  margenPorcentajeHoy: number;
  ventasSemana: number;
  ticketsSemana: number;
  gananciaSemana: number;
  ventasMes: number;
  ticketsMes: number;
  gananciaMes: number;
  totalProductos: number;
  productosBajoStock: number;
  productosAgotados: number;
  metodosPago: VentaPorMetodoPagoDto[];
  tendenciaUltimosDias: TendenciaVentaDiaDto[];
  topProductos: TopProductoVendidoDto[];
}
