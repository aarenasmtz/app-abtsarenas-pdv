import React, { useState, useEffect, useRef } from 'react';
import { ArrowDownCircle, ArrowUpCircle, AlertCircle, Check, X, Loader2, DollarSign } from 'lucide-react';
import { servicioCaja } from './servicioCaja';
import type { TurnoCajaDto, MovimientoCajaDto } from './tiposCaja';
import { reproducirBeepExito, reproducirBeepError } from '../../utils/sonidosPdv';

interface PropiedadesModalMovimientoCaja {
  abierto: boolean;
  turno: TurnoCajaDto | null;
  onCerrar: () => void;
  onMovimientoRegistrado: (movimiento: MovimientoCajaDto) => void;
}

export const ModalMovimientoCaja: React.FC<PropiedadesModalMovimientoCaja> = ({
  abierto,
  turno,
  onCerrar,
  onMovimientoRegistrado
}) => {
  const [tipo, setTipo] = useState<'ENTRADA' | 'SALIDA'>('SALIDA');
  const [montoTexto, setMontoTexto] = useState<string>('');
  const [descripcion, setDescripcion] = useState<string>('');
  const [cargando, setCargando] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const inputMontoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (abierto) {
      setMontoTexto('');
      setDescripcion('');
      setError(null);
      setTimeout(() => {
        inputMontoRef.current?.focus();
      }, 100);
    }
  }, [abierto]);

  if (!abierto || !turno) return null;

  const handleRegistrar = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const monto = parseFloat(montoTexto);
    if (isNaN(monto) || monto <= 0) {
      setError('Ingresa un monto válido mayor a $0.00');
      reproducirBeepError();
      return;
    }

    if (!descripcion.trim()) {
      setError('Ingresa el motivo o concepto del movimiento.');
      reproducirBeepError();
      return;
    }

    if (tipo === 'SALIDA' && monto > turno.efectivoActualEnCaja) {
      setError(`Fondos insuficientes. Solo hay $${turno.efectivoActualEnCaja.toFixed(2)} en efectivo en caja.`);
      reproducirBeepError();
      return;
    }

    try {
      setCargando(true);
      setError(null);

      const resp = await servicioCaja.registrarMovimiento({
        idTurnoCaja: turno.idTurnoCaja,
        tipoMovimiento: tipo,
        monto,
        descripcion: descripcion.trim()
      });

      if (resp.exito && resp.datos) {
        reproducirBeepExito();
        onMovimientoRegistrado(resp.datos);
        onCerrar();
      } else {
        reproducirBeepError();
        setError(resp.mensaje || 'Error al registrar el movimiento.');
      }
    } catch (err: unknown) {
      reproducirBeepError();
      const errObj = err as { response?: { data?: { mensaje?: string } }; message?: string };
      setError(errObj?.response?.data?.mensaje || errObj?.message || 'Error de comunicación con el servidor.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Cabecera */}
        <div className="bg-slate-800 px-6 py-4 flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${tipo === 'ENTRADA' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Movimiento de Caja</h2>
              <p className="text-xs text-slate-400">
                Turno #{turno.idTurnoCaja} • {turno.nombreCaja} • Efectivo Actual: ${turno.efectivoActualEnCaja.toFixed(2)}
              </p>
            </div>
          </div>
          <button
            onClick={onCerrar}
            disabled={cargando}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selector de Tipo */}
        <div className="p-6 flex flex-col gap-5">
          {error && (
            <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl flex items-center gap-2 text-rose-300 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setTipo('ENTRADA')}
              className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold transition-all ${
                tipo === 'ENTRADA'
                  ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg shadow-emerald-950/40 scale-[1.02]'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowDownCircle className="w-5 h-5 text-emerald-300" />
              <span>ENTRADA (Ingreso)</span>
            </button>

            <button
              type="button"
              onClick={() => setTipo('SALIDA')}
              className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold transition-all ${
                tipo === 'SALIDA'
                  ? 'bg-rose-600 border-rose-400 text-white shadow-lg shadow-rose-950/40 scale-[1.02]'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowUpCircle className="w-5 h-5 text-rose-300" />
              <span>SALIDA (Retiro)</span>
            </button>
          </div>

          <form onSubmit={handleRegistrar} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Monto del Movimiento ($)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 font-bold text-2xl">
                  $
                </div>
                <input
                  ref={inputMontoRef}
                  type="number"
                  step="0.50"
                  min="0"
                  value={montoTexto}
                  onChange={(e) => setMontoTexto(e.target.value)}
                  disabled={cargando}
                  placeholder="0.00"
                  className="w-full bg-slate-800 border-2 border-slate-700 focus:border-cyan-500 rounded-xl pl-10 pr-4 py-3 text-3xl font-extrabold text-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Concepto / Motivo
              </label>
              <input
                type="text"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                disabled={cargando}
                placeholder={tipo === 'ENTRADA' ? 'Ej. Cambio aportado por gerencia' : 'Ej. Pago a proveedor de panadería'}
                className="w-full bg-slate-800 border border-slate-700 focus:border-cyan-500 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none"
              />
            </div>

            {/* Botones de acción */}
            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={onCerrar}
                disabled={cargando}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={cargando}
                className={`flex-2 py-3 font-bold text-white rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all ${
                  tipo === 'ENTRADA'
                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/40'
                    : 'bg-rose-600 hover:bg-rose-500 shadow-rose-950/40'
                }`}
              >
                {cargando ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Registrando...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    <span>Confirmar {tipo === 'ENTRADA' ? 'Ingreso' : 'Retiro'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ModalMovimientoCaja;
