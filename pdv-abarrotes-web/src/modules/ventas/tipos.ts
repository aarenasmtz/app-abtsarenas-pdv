export interface ItemVenta {
  idProducto: number;
  codigoBarras: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  descuento: number;
  subtotal: number;
  notas?: string;
}

export interface VentaPago {
  idMetodoPago: number;
  importe: number;
  referencia?: string;
}

export interface RegistrarVentaPeticion {
  tokenIdempotencia: string;
  idCliente: number;
  idCaja: number;
  idTurnoCaja: number;
  descuentoGlobal: number;
  importeRecibido: number;
  notas?: string;
  articulos: ItemVenta[];
  pagos: VentaPago[];
}

export interface VentaRealizada {
  idVenta: number;
  folioVenta: string;
  fechaVenta: string;
  subtotal: number;
  descuento: number;
  impuesto: number;
  total: number;
  importeRecibido: number;
  cambio: number;
  numeroArticulos: number;
  nombreCajero: string;
  nombreCliente: string;
  esReintentoIdempotente: boolean;
  tokenIdempotencia: string;
}

export interface ItemTicket {
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  importe: number;
}

export interface PagoTicket {
  metodoPago: string;
  importe: number;
  referencia?: string;
}

export interface TicketVenta {
  idVenta: number;
  folioVenta: string;
  fechaVenta: string;
  nombreNegocio: string;
  direccionNegocio: string;
  telefonoNegocio: string;
  rfcNegocio: string;
  nombreCajero: string;
  nombreCliente: string;
  caja: string;
  subtotal: number;
  descuento: number;
  impuesto: number;
  total: number;
  importeRecibido: number;
  cambio: number;
  totalArticulos: number;
  articulos: ItemTicket[];
  pagos: PagoTicket[];
  mensajeAgradecimiento: string;
  leyendaFiscal: string;
}

export interface VentaResumen {
  idVenta: number;
  folioVenta: string;
  fechaVenta: string;
  nombreCajero: string;
  nombreCliente: string;
  total: number;
  numeroArticulos: number;
  estatus: string;
  esCancelada: boolean;
  metodosPago: string;
}

export interface FiltroVentas {
  pagina?: number;
  registrosPorPagina?: number;
  terminoBusqueda?: string;
  fechaInicio?: string;
  fechaFin?: string;
  idCaja?: number;
  idUsuario?: number;
}

export interface MetodoPagoDto {
  idMetodoPago: number;
  codigoMetodo: string;
  descripcion: string;
  requiereReferencia: boolean;
  activo: boolean;
}
