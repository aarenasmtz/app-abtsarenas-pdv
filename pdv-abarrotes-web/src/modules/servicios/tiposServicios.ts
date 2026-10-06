/**
 * Tipos y contratos TypeScript para el módulo de Recargas Electrónicas y Pago de Servicios.
 */

export interface CompaniaTelefonicaDto {
  codigo: string;
  nombre: string;
  logotipoUrl?: string;
  montosDisponibles: number[];
}

export interface SolicitudRecargaDto {
  codigoCompania: string;
  numeroTelefono: string;
  confirmarNumeroTelefono: string;
  monto: number;
  idSucursal?: number;
  idUsuario?: number;
}

export interface ResultadoRecargaDto {
  exito: boolean;
  mensaje: string;
  folioProveedor?: string;
  codigoAutorizacion?: string;
  monto: number;
  numeroTelefono: string;
  compania: string;
  fechaHora: string;
  saldoRestanteBolsa?: number;
}

export interface CatalogoServicioDto {
  codigo: string;
  nombre: string;
  categoria: string;
  comisionRecomendada: number;
  permiteVencidos: boolean;
  formatoReferencia: string;
}

export interface SolicitudPagoServicioDto {
  codigoServicio: string;
  referenciaRecibo: string;
  montoRecibo: number;
  comision: number;
  idSucursal?: number;
  idUsuario?: number;
}

export interface ResultadoPagoServicioDto {
  exito: boolean;
  mensaje: string;
  folioAutorizacion?: string;
  montoPagado: number;
  comisionCobrada: number;
  totalCobrado: number;
  servicio: string;
  referencia: string;
  fechaHora: string;
}

export interface EstadoIntegracionServiciosDto {
  estaConfigurado: boolean;
  nombreProveedor: string;
  mensajeEstatus: string;
  saldoBolsaDisponible: number;
  ultimaVerificacion?: string;
}
