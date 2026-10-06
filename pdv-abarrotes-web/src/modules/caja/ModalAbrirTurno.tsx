import React, { useState, useEffect, useRef } from 'react';
import { DollarSign, AlertCircle, Check, Loader2, X } from 'lucide-react';
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

  // Atajo para cerrar con Escape
  useEffect(() => {
    if (!abierto) return;
    const manejarTecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancelar?.();
      }
    };
    window.addEventListener('keydown', manejarTecla);
    return () => window.removeEventListener('keydown', manejarTecla);
  }, [abierto, onCancelar]);

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
    <div className="modal-overlay">
      <div 
        className="modal-contenido"
        style={{
          maxWidth: '520px',
          backgroundColor: '#ffffff',
          borderRadius: '18px',
          boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.25)',
          border: '1px solid #e2e8f0',
          overflow: 'hidden'
        }}
      >
        {/* Cabecera */}
        <div style={{
          backgroundColor: '#059669',
          padding: '1.25rem 1.5rem',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ 
              padding: '0.5rem', 
              backgroundColor: 'rgba(255, 255, 255, 0.2)', 
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <DollarSign size={24} color="#ffffff" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>
                Apertura de Turno de Caja
              </h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#d1fae5' }}>
                Ingreso de fondo inicial para iniciar ventas
              </p>
            </div>
          </div>
          {onCancelar && (
            <button
              onClick={onCancelar}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#ffffff',
                cursor: 'pointer',
                padding: '0.4rem',
                borderRadius: '8px'
              }}
              title="Cerrar (Esc)"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Formulario */}
        <form onSubmit={handleConfirmarApertura} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {error && (
            <div style={{
              padding: '0.75rem 1rem',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#b91c1c',
              fontSize: '0.9rem'
            }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* Selector de Caja */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
              Terminal / Caja Física
            </label>
            <select
              value={idCajaSeleccionada}
              onChange={(e) => setIdCajaSeleccionada(Number(e.target.value))}
              disabled={cargando}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#f8fafc',
                color: '#0f172a',
                fontSize: '0.95rem',
                fontWeight: 600
              }}
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
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
              Fondo Inicial en Efectivo ($)
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '16px', top: '12px', fontSize: '1.5rem', fontWeight: 800, color: '#059669' }}>
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
                style={{
                  width: '100%',
                  padding: '0.65rem 1rem 0.65rem 2.75rem',
                  borderRadius: '12px',
                  border: '2px solid #10b981',
                  backgroundColor: '#f0fdf4',
                  color: '#047857',
                  fontSize: '2rem',
                  fontWeight: 800,
                  fontFamily: 'var(--fuente-numerica)'
                }}
              />
            </div>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.35rem' }}>
              Ingresa el dinero físico en cambio (morralla y billetes) con el que arranca tu turno.
            </p>
          </div>

          {/* Botones rápidos de denominaciones para el fondo */}
          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '0.4rem' }}>
              Billetes rápidos para sumar al fondo:
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
              {[50, 100, 200, 500].map((billete) => (
                <button
                  key={billete}
                  type="button"
                  onClick={() => agregarMonto(billete)}
                  disabled={cargando}
                  className="btn btn-secundario"
                  style={{
                    padding: '0.5rem',
                    fontWeight: 700,
                    fontSize: '0.9rem'
                  }}
                >
                  +${billete}
                </button>
              ))}
            </div>
          </div>

          {/* Botones de acción */}
          <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.5rem' }}>
            {onCancelar && (
              <button
                type="button"
                onClick={onCancelar}
                disabled={cargando}
                className="btn btn-secundario"
                style={{ flex: 1, padding: '0.85rem' }}
              >
                Volver (Esc)
              </button>
            )}
            <button
              type="submit"
              disabled={cargando}
              className="btn btn-primario"
              style={{ flex: 2, padding: '0.85rem', fontSize: '1.05rem', gap: '0.5rem' }}
            >
              {cargando ? (
                <>
                  <Loader2 size={20} className="spinner" />
                  <span>Abriendo Turno...</span>
                </>
              ) : (
                <>
                  <Check size={20} />
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
