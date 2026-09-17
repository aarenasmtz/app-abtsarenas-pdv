import React, { useState, useEffect, useRef } from 'react';
import { DollarSign, AlertCircle, Check, Loader2 } from 'lucide-react';
import { servicioCaja } from './servicioCaja';
import type { CajaDto, TurnoCajaDto } from './tiposCaja';
import { reproducirBeepExito, reproducirBeepError } from '../../utils/sonidosPdv';

interface PropiedadesModalAbrirTurno {
  abierto: boolean;
  onTurnoAbierto: (turno: TurnoCajaDto) => void;
  onCancelar?: () => void;
}

export const ModalAbrirTurno: React.FC<PropiedadesModalAbrirTurno> = ({
  abierto,
  onTurnoAbierto,
  onCancelar
}) => {
  const [cajas, setCajas] = useState<CajaDto[]>([]);
  const [idCajaSeleccionada, setIdCajaSeleccionada] = useState<number>(1);
  const [montoInicialTexto, setMontoInicialTexto] = useState<string>('300.00');
  const [cargando, setCargando] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const inputFondoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!abierto) return;

    const cargarCajas = async () => {
      try {
        const resp = await servicioCaja.obtenerCajas();
        if (resp.exito && resp.datos) {
          setCajas(resp.datos);
          // Si hay caja disponible sin turno abierto, preseleccionarla
          const libre = resp.datos.find(c => !c.tieneTurnoAbierto);
          if (libre) {
            setIdCajaSeleccionada(libre.idCaja);
          } else if (resp.datos.length > 0) {
            setIdCajaSeleccionada(resp.datos[0].idCaja);
          }
        }
      } catch {
        setError('No fue posible cargar las cajas disponibles.');
      }
    };

    cargarCajas();
    setError(null);
    setTimeout(() => {
      inputFondoRef.current?.focus();
      inputFondoRef.current?.select();
    }, 150);
  }, [abierto]);

  if (!abierto) return null;

  const agregarMonto = (valor: number) => {
    const actual = parseFloat(montoInicialTexto) || 0;
    setMontoInicialTexto((actual + valor).toFixed(2));
  };

  const handleConfirmarApertura = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const monto = parseFloat(montoInicialTexto);

    if (isNaN(monto) || monto < 0) {
      setError('Por favor ingresa un fondo inicial válido (mayor o igual a $0.00).');
      reproducirBeepError();
      return;
    }

    try {
      setCargando(true);
      setError(null);

      const resp = await servicioCaja.abrirTurno({
        idCaja: idCajaSeleccionada,
        montoInicial: monto
      });

      if (resp.exito && resp.datos) {
        reproducirBeepExito();
        onTurnoAbierto(resp.datos);
      } else {
        reproducirBeepError();
        setError(resp.mensaje || 'No se pudo abrir el turno.');
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
        <div className="bg-emerald-700 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-800 rounded-xl">
              <DollarSign className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Apertura de Turno de Caja</h2>
              <p className="text-xs text-emerald-100">Ingreso de fondo inicial para iniciar ventas</p>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleConfirmarApertura} className="p-6 flex flex-col gap-5">
          {error && (
            <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl flex items-center gap-2 text-rose-300 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Selector de Caja */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Terminal / Caja Física
            </label>
            <select
              value={idCajaSeleccionada}
              onChange={(e) => setIdCajaSeleccionada(Number(e.target.value))}
              disabled={cargando}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              {cajas.map((c) => (
                <option key={c.idCaja} value={c.idCaja} disabled={c.tieneTurnoAbierto}>
                  {c.nombre} {c.tieneTurnoAbierto ? `(Ocupada por ${c.nombreCajeroActual || 'otro usuario'})` : '(Disponible)'}
                </option>
              ))}
            </select>
          </div>

          {/* Fondo Inicial */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Fondo Inicial en Efectivo ($)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-emerald-400 font-bold text-2xl">
                $
              </div>
              <input
                ref={inputFondoRef}
                type="number"
                step="0.50"
                min="0"
                value={montoInicialTexto}
                onChange={(e) => setMontoInicialTexto(e.target.value)}
                disabled={cargando}
                placeholder="0.00"
                className="w-full bg-slate-800 border-2 border-emerald-500/40 focus:border-emerald-500 rounded-xl pl-10 pr-4 py-3 text-3xl font-extrabold text-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Ingresa el dinero físico en cambio (morralla y billetes) con el que arranca tu turno.
            </p>
          </div>

          {/* Botones rápidos de denominaciones para el fondo */}
          <div>
            <span className="text-xs text-slate-400 block mb-2 font-medium">Billetes rápidos para sumar al fondo:</span>
            <div className="grid grid-cols-4 gap-2">
              {[50, 100, 200, 500].map((billete) => (
                <button
                  key={billete}
                  type="button"
                  onClick={() => agregarMonto(billete)}
                  disabled={cargando}
                  className="py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 transition-all rounded-lg border border-slate-700 text-sm font-semibold text-slate-200"
                >
                  +${billete}
                </button>
              ))}
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-3 pt-2">
            {onCancelar && (
              <button
                type="button"
                onClick={onCancelar}
                disabled={cargando}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 active:scale-95 transition-all text-slate-300 font-semibold rounded-xl"
              >
                Volver
              </button>
            )}
            <button
              type="submit"
              disabled={cargando}
              className="flex-2 py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 transition-all text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40"
            >
              {cargando ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Abriendo Turno...</span>
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  <span>Iniciar Turno de Caja</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalAbrirTurno;
