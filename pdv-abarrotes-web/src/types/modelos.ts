/**
 * Definiciones de tipos de dominio del sistema PDV en español.
 */

export interface Producto {
  idProducto: number;
  codigoProducto: string;
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
  existenciaMinima: number;
  existenciaMaxima: number;
  permiteVentaFraccionada: boolean;
  manejaInventario: boolean;
  activo: boolean;
  imagenUrl?: string;
  existenciaActual?: number;
}

export interface CodigoBarras {
  idCodigoBarras: number;
  idProducto: number;
  codigoValor: string;
  esPrincipal: boolean;
}

export interface ItemCarrito {
  idProducto: number;
  codigoBarras: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  permiteVentaFraccionada: boolean;
  existenciaDisponible: number;
}

export interface MetodoPagoDesglose {
  idMetodoPago: number;
  nombreMetodo: string;
  importe: number;
  referencia?: string;
}

export interface TicketPendienteResumen {
  idTicketPendiente: number;
  identificadorCliente: string;
  total: number;
  numeroArticulos: number;
  fechaRegistro: string;
}

export interface UsuarioSesion {
  idUsuario: number;
  nombreCompleto: string;
  nombreUsuario: string;
  rol: string;
  token: string;
}

export interface TurnoCajaActual {
  idTurnoCaja: number;
  idCaja: number;
  cajaNombre: string;
  idUsuario: number;
  fechaInicio: string;
  estatus: 'Abierto' | 'Cerrado';
}
