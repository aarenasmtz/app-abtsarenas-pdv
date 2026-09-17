import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calculator, 
  FileText, 
  Printer, 
  AlertCircle, 
  CheckCircle, 
  X, 
  Loader2, 
  DollarSign, 
  Lock,
  CreditCard
} from 'lucide-react';
import { servicioCaja } from './servicioCaja';
import type { TurnoCajaDto, ResumenCorteDto, MovimientoCajaDto } from './tiposCaja';
import { TiraCorteTermico } from './TiraCorteTermico';
import { reproducirBeepExito, reproducirBeepError } from '../../utils/sonidosPdv';

interface PropiedadesModalCorteCaja {
  abierto: boolean;
  turno: TurnoCajaDto | null;
  onCerrar: () => void;
  onTurnoCerrado: () => void;
}

interface DenominacionArqueo {
  denominacion: number;
  tipo: 'billete' | 'moneda';
  etiqueta: string;
  cantidad: number;
}

export const ModalCorteCaja: React.FC<PropiedadesModalCorteCaja> = ({
  abierto,
  turno,
  onCerrar,
  onTurnoCerrado
}) => {
  const [pestanaActiva, setPestanaActiva] = useState<'corteX' | 'corteZ'>('corteX');
  const [corteXData, setCorteXData] = useState<ResumenCorteDto | null>(null);
  const [corteFinalizado, setCorteFinalizado] = useState<ResumenCorteDto | null>(null);
  const [movimientos, setMovimientos] = useState<MovimientoCajaDto[]>([]);
  const [cargando, setCargando] = useState<boolean>(false);
  const [guardandoCierre, setGuardandoCierre] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [observaciones, setObservaciones] = useState<string>('');
  const [mostrarTiraImpresion, setMostrarTiraImpresion] = useState<boolean>(false);

  // Arqueo ciego desglosado por denominaciones
  const [denominaciones, setDenominaciones] = useState<DenominacionArqueo[]>([
    { denominacion: 1000, tipo: 'billete', etiqueta: 'Billete $1,000', cantidad: 0 },
    { denominacion: 500, tipo: 'billete', etiqueta: 'Billete $500', cantidad: 0 },
    { denominacion: 200, tipo: 'billete', etiqueta: 'Billete $200', cantidad: 0 },
    { denominacion: 100, tipo: 'billete', etiqueta: 'Billete $100', cantidad: 0 },
    { denominacion: 50, tipo: 'billete', etiqueta: 'Billete $50', cantidad: 0 },
    { denominacion: 20, tipo: 'billete', etiqueta: 'Billete $20', cantidad: 0 },
    { denominacion: 10, tipo: 'moneda', etiqueta: 'Moneda $10', cantidad: 0 },
    { denominacion: 5, tipo: 'moneda', etiqueta: 'Moneda $5', cantidad: 0 },
    { denominacion: 2, tipo: 'moneda', etiqueta: 'Moneda $2', cantidad: 0 },
    { denominacion: 1, tipo: 'moneda', etiqueta: 'Moneda $1', cantidad: 0 },
    { denominacion: 0.5, tipo: 'moneda', etiqueta: 'Moneda $0.50', cantidad: 0 }
  ]);

  // Modo de conteo: 'calculadora' o 'manual'
  const [modoConteo, setModoConteo] = useState<'calculadora' | 'manual'>('calculadora');
  const [montoContadoDirecto, setMontoContadoDirecto] = useState<string>('');

  useEffect(() => {
    if (!abierto || !turno) return;

    setCorteFinalizado(null);
    setMostrarTiraImpresion(false);
    setError(null);
    setPestanaActiva('corteX');

    const cargarDatosTurno = async () => {
      try {
        setCargando(true);
        const [respCorte, respMovs] = await Promise.all([
          servicioCaja.obtenerCorteX(turno.idTurnoCaja),
          servicioCaja.obtenerMovimientosTurno(turno.idTurnoCaja)
        ]);

        if (respCorte.exito && respCorte.datos) {
          setCorteXData(respCorte.datos);
        }
        if (respMovs.exito && respMovs.datos) {
          setMovimientos(respMovs.datos);
        }
      } catch {
        setError('Error al consultar los acumulados del turno actual.');
      } finally {
        setCargando(false);
      }
    };

    cargarDatosTurno();
  }, [abierto, turno]);

  // Cálculo del total contado
  const totalContadoCalculado = useMemo(() => {
    if (modoConteo === 'manual') {
      const parsed = parseFloat(montoContadoDirecto);
      return isNaN(parsed) ? 0 : parsed;
    }
    return denominaciones.reduce((acum, d) => acum + d.denominacion * d.cantidad, 0);
  }, [modoConteo, montoContadoDirecto, denominaciones]);

  // Diferencia calculada
  const diferenciaCalculada = useMemo(() => {
    if (!corteXData) return 0;
    return totalContadoCalculado - corteXData.totalEsperadoEnCaja;
  }, [totalContadoCalculado, corteXData]);

  if (!abierto || !turno) return null;

  const handleActualizarCantidadDenominacion = (denominacion: number, cantidad: number) => {
    setDenominaciones(prev =>
      prev.map(d => (d.denominacion === denominacion ? { ...d, cantidad: Math.max(0, cantidad) } : d))
    );
  };

  const handleCerrarTurno = async () => {
    if (!corteXData) return;

    if (totalContadoCalculado < 0) {
      setError('El total contado no puede ser negativo.');
      reproducirBeepError();
      return;
    }

    try {
      setGuardandoCierre(true);
      setError(null);

      const resp = await servicioCaja.cerrarTurnoCorteZ({
        idTurnoCaja: turno.idTurnoCaja,
        totalContado: totalContadoCalculado,
        observaciones: observaciones.trim() || undefined
      });

      if (resp.exito && resp.datos) {
        reproducirBeepExito();
        setCorteFinalizado(resp.datos);
        setMostrarTiraImpresion(true);
        onTurnoCerrado();
      } else {
        reproducirBeepError();
        setError(resp.mensaje || 'Error al cerrar el turno.');
      }
    } catch (err: unknown) {
      reproducirBeepError();
      const errObj = err as { response?: { data?: { mensaje?: string } }; message?: string };
      setError(errObj?.response?.data?.mensaje || errObj?.message || 'Error de comunicación al cerrar turno.');
    } finally {
      setGuardandoCierre(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[95vh]">
        {/* Cabecera Principal */}
        <div className="bg-slate-800 px-6 py-4 flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600/20 text-indigo-400 rounded-xl">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Control de Caja y Cortes Financieros</h2>
              <p className="text-xs text-slate-400">
                Turno #{turno.idTurnoCaja} • {turno.nombreCaja} • Cajero: {turno.nombreUsuario}
              </p>
            </div>
          </div>
          <button
            onClick={onCerrar}
            disabled={guardandoCierre}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pestañas de navegación */}
        {!mostrarTiraImpresion && (
          <div className="flex border-b border-slate-700 bg-slate-950/40">
            <button
              onClick={() => setPestanaActiva('corteX')}
              className={`flex-1 py-3 px-4 font-semibold text-sm flex items-center justify-center gap-2 border-b-2 transition-all ${
                pestanaActiva === 'corteX'
                  ? 'border-indigo-500 text-indigo-400 bg-indigo-950/20'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Corte X (Lectura Parcial en Vivo)</span>
            </button>

            <button
              onClick={() => setPestanaActiva('corteZ')}
              className={`flex-1 py-3 px-4 font-semibold text-sm flex items-center justify-center gap-2 border-b-2 transition-all ${
                pestanaActiva === 'corteZ'
                  ? 'border-rose-500 text-rose-400 bg-rose-950/20'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>Corte Z (Cierre de Turno y Arqueo)</span>
            </button>
          </div>
        )}

        {/* Contenido Principal */}
        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="mb-4 p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl flex items-center gap-2 text-rose-300 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {cargando ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
              <span>Calculando totales contables del turno...</span>
            </div>
          ) : mostrarTiraImpresion && (corteFinalizado || corteXData) ? (
            <TiraCorteTermico
              corte={corteFinalizado || corteXData!}
              onCerrar={() => {
                if (corteFinalizado) {
                  onCerrar();
                } else {
                  setMostrarTiraImpresion(false);
                }
              }}
            />
          ) : pestanaActiva === 'corteX' && corteXData ? (
            /* VISTA CORTE X */
            <div className="flex flex-col gap-6">
              {/* Tarjetas de Resumen Financiero */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-xl">
                  <span className="text-xs text-slate-400 font-medium block">Fondo Inicial</span>
                  <span className="text-xl font-bold text-white mt-1 block">${corteXData.montoInicial.toFixed(2)}</span>
                </div>

                <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-xl">
                  <span className="text-xs text-slate-400 font-medium block">(+) Ventas Efectivo</span>
                  <span className="text-xl font-bold text-emerald-400 mt-1 block">
                    ${corteXData.ventasEfectivo.toFixed(2)}
                  </span>
                </div>

                <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-xl">
                  <span className="text-xs text-slate-400 font-medium block">(+) Entradas Manuales</span>
                  <span className="text-xl font-bold text-cyan-400 mt-1 block">
                    ${corteXData.entradasEfectivo.toFixed(2)}
                  </span>
                </div>

                <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-xl">
                  <span className="text-xs text-slate-400 font-medium block">(-) Salidas / Retiros</span>
                  <span className="text-xl font-bold text-rose-400 mt-1 block">
                    -${corteXData.salidasEfectivo.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Total Esperado en Cajón */}
              <div className="p-5 bg-gradient-to-r from-emerald-950/60 to-emerald-900/30 border-2 border-emerald-500/40 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl">
                    <DollarSign className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-emerald-300">
                      Dinero Esperado en Cajón de Efectivo
                    </h3>
                    <p className="text-xs text-slate-400">Fondo Inicial + Ventas Efectivo + Entradas - Salidas</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-extrabold text-emerald-300">
                    ${corteXData.totalEsperadoEnCaja.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Otros Métodos de Pago */}
              <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-indigo-400" />
                  <span>Otros Métodos de Cobro Electrónicos (No Afectan Efectivo Físico)</span>
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div className="bg-slate-850 p-3 rounded-lg border border-slate-700">
                    <span className="text-xs text-slate-400 block">Tarjeta (Bancaria/Clip):</span>
                    <span className="font-semibold text-white">${corteXData.ventasTarjeta.toFixed(2)}</span>
                  </div>
                  <div className="bg-slate-850 p-3 rounded-lg border border-slate-700">
                    <span className="text-xs text-slate-400 block">Transferencia:</span>
                    <span className="font-semibold text-white">${corteXData.ventasTransferencia.toFixed(2)}</span>
                  </div>
                  <div className="bg-slate-850 p-3 rounded-lg border border-slate-700">
                    <span className="text-xs text-slate-400 block">Vales:</span>
                    <span className="font-semibold text-white">${corteXData.ventasVales.toFixed(2)}</span>
                  </div>
                  <div className="bg-slate-850 p-3 rounded-lg border border-slate-700">
                    <span className="text-xs text-slate-400 block">Total Ventas Globales:</span>
                    <span className="font-bold text-indigo-300">${corteXData.totalVentas.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Movimientos Recientes */}
              {movimientos.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Movimientos Manuales Registrados ({movimientos.length})
                  </h4>
                  <div className="bg-slate-800/60 border border-slate-700 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-850 text-slate-400 border-b border-slate-700">
                        <tr>
                          <th className="p-2.5">Tipo</th>
                          <th className="p-2.5">Monto</th>
                          <th className="p-2.5">Motivo / Concepto</th>
                          <th className="p-2.5">Hora</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700/60">
                        {movimientos.map((m) => (
                          <tr key={m.idMovimientoCaja}>
                            <td className="p-2.5 font-bold">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] ${
                                  m.tipoMovimiento === 'ENTRADA'
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : 'bg-rose-500/20 text-rose-400'
                                }`}
                              >
                                {m.tipoMovimiento}
                              </span>
                            </td>
                            <td className="p-2.5 font-semibold text-white">${m.monto.toFixed(2)}</td>
                            <td className="p-2.5 text-slate-300">{m.descripcion}</td>
                            <td className="p-2.5 text-slate-400">
                              {new Date(m.fechaMovimiento).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Botón Imprimir Corte X */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setMostrarTiraImpresion(true)}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-950/40"
                >
                  <Printer className="w-5 h-5" />
                  <span>Ver e Imprimir Tira Corte X</span>
                </button>
              </div>
            </div>
          ) : pestanaActiva === 'corteZ' && corteXData ? (
            /* VISTA CORTE Z (ARQUEO Y CIERRE) */
            <div className="flex flex-col gap-6">
              {/* Alerta de cierre formal */}
              <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-3">
                <Lock className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="text-xs text-rose-200 leading-relaxed">
                  <span className="font-bold block text-sm text-rose-300">Cierre Definitivo de Turno (Corte Z)</span>
                  Realiza el conteo de todo el efectivo físico que tienes en el cajón (billetes y monedas). Al confirmar el
                  corte, el turno quedará cerrado formalmente y se emitirá la tira de auditoría.
                </div>
              </div>

              {/* Selector de modo de conteo */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Método de Arqueo Físico:
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setModoConteo('calculadora')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      modoConteo === 'calculadora'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Desglose por Denominación
                  </button>
                  <button
                    type="button"
                    onClick={() => setModoConteo('manual')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      modoConteo === 'manual'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Monto Directo
                  </button>
                </div>
              </div>

              {/* Desglose de denominaciones o Input Directo */}
              {modoConteo === 'calculadora' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                  {denominaciones.map((d) => (
                    <div
                      key={d.denominacion}
                      className="p-2.5 bg-slate-800 border border-slate-700 rounded-xl flex flex-col justify-between"
                    >
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-300">{d.etiqueta}</span>
                        <span className="text-slate-400 font-mono text-[11px]">
                          ${(d.denominacion * d.cantidad).toFixed(2)}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-1.5">
                        <input
                          type="number"
                          min="0"
                          value={d.cantidad === 0 ? '' : d.cantidad}
                          onChange={(e) =>
                            handleActualizarCantidadDenominacion(d.denominacion, parseInt(e.target.value) || 0)
                          }
                          placeholder="0"
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-center font-bold text-white focus:outline-none focus:border-indigo-500 text-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-slate-800 border border-slate-700 rounded-xl">
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">
                    Efectivo Total Contado ($)
                  </label>
                  <input
                    type="number"
                    step="0.50"
                    min="0"
                    value={montoContadoDirecto}
                    onChange={(e) => setMontoContadoDirecto(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-900 border-2 border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-3 text-2xl font-bold text-white outline-none"
                  />
                </div>
              )}

              {/* Balance y Arqueo Resultante */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-4 bg-slate-800 border border-slate-700 rounded-xl">
                  <span className="text-xs text-slate-400 block font-medium">Efectivo Esperado en Sistema:</span>
                  <span className="text-xl font-extrabold text-white mt-1 block">
                    ${corteXData.totalEsperadoEnCaja.toFixed(2)}
                  </span>
                </div>

                <div className="p-4 bg-slate-800 border border-slate-700 rounded-xl">
                  <span className="text-xs text-slate-400 block font-medium">Efectivo Físico Contado:</span>
                  <span className="text-xl font-extrabold text-indigo-400 mt-1 block">
                    ${totalContadoCalculado.toFixed(2)}
                  </span>
                </div>

                <div
                  className={`p-4 border rounded-xl ${
                    diferenciaCalculada === 0
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400'
                      : diferenciaCalculada > 0
                      ? 'bg-blue-950/40 border-blue-500/40 text-blue-400'
                      : 'bg-rose-950/40 border-rose-500/40 text-rose-400'
                  }`}
                >
                  <span className="text-xs block font-medium">
                    {diferenciaCalculada === 0
                      ? 'Diferencia (Cuadrado):'
                      : diferenciaCalculada > 0
                      ? 'Diferencia (Sobrante):'
                      : 'Diferencia (Faltante):'}
                  </span>
                  <span className="text-xl font-extrabold mt-1 block">
                    {diferenciaCalculada > 0 && '+'}
                    ${diferenciaCalculada.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Observaciones */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Observaciones de Cierre / Justificación de Arqueo
                </label>
                <textarea
                  rows={2}
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Escribe comentarios u observaciones relevantes sobre el turno..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 text-sm"
                />
              </div>

              {/* Botón Confirmar Cierre */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onCerrar}
                  disabled={guardandoCierre}
                  className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleCerrarTurno}
                  disabled={guardandoCierre}
                  className="px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-rose-950/40 transition-all"
                >
                  {guardandoCierre ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Cerrando Turno...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      <span>Confirmar Cierre de Turno (Corte Z)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ModalCorteCaja;
