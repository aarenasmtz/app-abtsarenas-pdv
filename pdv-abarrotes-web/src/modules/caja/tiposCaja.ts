export interface CajaDto {
  idCaja: number;
  idSucursal: number;
  nombre: string;
  esPrincipal: boolean;
  nombreEquipo?: string;
  direccionIp?: string;
  activo: boolean;
  tieneTurnoAbierto: boolean;
  idTurnoActual?: number;
  nombreCajeroActual?: string;
}

export interface TurnoCajaDto {
  idTurnoCaja: number;
  idCaja: number;
  nombreCaja: string;
  idUsuario: number;
  nombreUsuario: string;
  fechaInicio: string;
  fechaCierre?: string;
  estatus: string;
  montoInicial: number;
  ventasEfectivo: number;
  entradasEfectivo: number;
  salidasEfectivo: number;
  efectivoActualEnCaja: number;
  totalTransacciones: number;
}

export interface AbrirTurnoDto {
  idCaja: number;
  montoInicial: number;
}

export interface CerrarTurnoDto {
  idTurnoCaja: number;
  totalContado: number;
  observaciones?: string;
}

export interface MovimientoCajaDto {
  idMovimientoCaja: number;
  idTurnoCaja: number;
  idCaja: number;
  tipoMovimiento: string; // 'ENTRADA' | 'SALIDA'
  monto: number;
  descripcion: string;
  fechaMovimiento: string;
}

export interface RegistrarMovimientoCajaDto {
  idTurnoCaja: number;
  tipoMovimiento: 'ENTRADA' | 'SALIDA';
  monto: number;
  descripcion: string;
}

export interface ResumenCorteDto {
  idCorteCaja?: number;
  idTurnoCaja: number;
  idCaja: number;
  nombreCaja: string;
  idUsuario: number;
  nombreUsuario: string;
  fechaInicio: string;
  fechaCorte: string;
  tipoCorte: 'X' | 'Z';
  montoInicial: number;
  ventasEfectivo: number;
  ventasTarjeta: number;
  ventasTransferencia: number;
  ventasVales: number;
  ventasCredito: number;
  totalVentas: number;
  entradasEfectivo: number;
  salidasEfectivo: number;
  totalEsperadoEnCaja: number;
  totalContado: number;
  diferencia: number;
  observaciones?: string;
  totalTransacciones: number;
  estatusTurno: string;
}

export interface CorteCajaDto {
  idCorteCaja: number;
  idTurnoCaja: number;
  idCaja: number;
  nombreCaja: string;
  idUsuario: number;
  nombreUsuario: string;
  fechaCorte: string;
  tipoCorte: string;
  montoInicial: number;
  ventasEfectivo: number;
  ventasTarjeta: number;
  ventasVales: number;
  ventasCredito: number;
  entradasEfectivo: number;
  salidasEfectivo: number;
  totalEsperado: number;
  totalContado: number;
  diferencia: number;
  observaciones?: string;
}
