/**
 * Tipos y contratos TypeScript para el módulo de Recargas Electrónicas y Pago de Servicios (RNP).
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

export interface SolicitudConsultaAdeudoDto {
  codigoServicio: string;
  referencia: string;
}

export interface ResultadoConsultaAdeudoDto {
  exito: boolean;
  montoAdeudo: number;
  esMontoEditable: boolean;
  mensajeProveedor?: string;
  codigoResultado?: string;
}

export interface TransaccionServicioDetalleDto {
  idTransaccionServicio: number;
  folioPos: string;
  tipoTransaccion: string;
  carrierId: string;
  carrierNombre: string;
  referencia: string;
  monto: number;
  comision: number;
  totalCobrado: number;
  estado: string;
  codigoRespuesta?: string;
  descripcionRespuesta?: string;
  folioProveedor?: string;
  folioCarrier?: string;
  avisoNotice?: string;
  saldoPosterior?: number;
  fechaCreacion: string;
  reintentosConsulta: number;
  ultimaConsultaEstado?: string;
}

export interface RegistroBitacoraDto {
  idBitacoraServicio: number;
  folioPos: string;
  accion: string;
  mensaje: string;
  detallesJson?: string;
  usuario?: string;
  direccionIp?: string;
  fechaHora: string;
}

export interface RegistroLogErrorDto {
  idLogError: number;
  folioPos?: string;
  metodoSoap: string;
  tipoError: string;
  codigoError?: string;
  mensajeError: string;
  peticionXmlOJson?: string;
  respuestaXmlOJson?: string;
  stackTrace?: string;
  fechaHora: string;
}

export interface FiltroTransaccionesServiciosDto {
  folioPos?: string;
  referencia?: string;
  estado?: string;
  tipoTransaccion?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  limite?: number;
}
