import React, { useState, useEffect, useRef } from 'react';
import { DollarSign, ArrowDownRight, ArrowUpRight, AlertCircle, Check, Loader2, X } from 'lucide-react';
import { servicioCaja } from './servicioCaja';
import type { TurnoCajaDto } from './tiposCaja';
import { reproducirBeepExito, reproducirBeepError } from '../../utils/sonidosPdv';

interface PropiedadesModalMovimientoCaja {
  abierto: boolean;
  turno: TurnoCajaDto | null;
  onCerrar: () => void;
  onMovimientoRegistrado: () => void;
}

export const ModalMovimientoCaja: React.FC<PropiedadesModalMovimientoCaja> = ({
  abierto,
  turno,
  onCerrar,
  onMovimientoRegistrado
}) => {
  const [tipo, setTipo] = useState<'ENTRADA' | 'SALIDA'>('ENTRADA');
  const [montoTexto, setMontoTexto] = useState<string>('');
  const [motivo, setMotivo] = useState<string>('');
  const [cargando, setCargando] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const inputMontoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (abierto) {
      setMontoTexto('');
      setMotivo('');
      setError(null);
      setTimeout(() => {
        inputMontoRef.current?.focus();
      }, 150);
    }
  }, [abierto]);

  // Atajo para cerrar con Escape
  useEffect(() => {
    if (!abierto) return;
    const manejarTecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCerrar();
      }
    };
    window.addEventListener('keydown', manejarTecla);
    return () => window.removeEventListener('keydown', manejarTecla);
  }, [abierto, onCerrar]);

  if (!abierto || !turno) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const monto = parseFloat(montoTexto);

    if (isNaN(monto) || monto <= 0) {
      setError('Ingresa un monto válido mayor a $0.00.');
      reproducirBeepError();
      return;
    }

    if (!motivo.trim()) {
      setError('Debes especificar el motivo o justificación del movimiento.');
      reproducirBeepError();
      return;
    }

    if (tipo === 'SALIDA' && monto > turno.efectivoActualEnCaja) {
      setError(`No hay suficiente efectivo en caja. Disponible: $${turno.efectivoActualEnCaja.toFixed(2)}.`);
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
        descripcion: motivo.trim()
      });

      if (resp.exito) {
        reproducirBeepExito();
        onMovimientoRegistrado();
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
          padding: '1.25rem 1.5rem',
          backgroundColor: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              padding: '0.5rem',
              borderRadius: '10px',
              backgroundColor: tipo === 'ENTRADA' ? '#ecfdf5' : '#fef2f2',
              color: tipo === 'ENTRADA' ? '#059669' : '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <DollarSign size={22} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                Movimiento de Caja
              </h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                Turno #{turno.idTurnoCaja} • {turno.nombreCaja} • Efectivo: <strong>${turno.efectivoActualEnCaja.toFixed(2)}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onCerrar}
            disabled={cargando}
            style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '0.35rem' }}
            title="Cerrar (Esc)"
          >
            <X size={20} />
          </button>
        </div>

        {/* Formulario */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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

          {/* Selector de Tipo */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={() => setTipo('ENTRADA')}
              style={{
                padding: '0.85rem',
                borderRadius: '12px',
                border: tipo === 'ENTRADA' ? '2px solid #059669' : '1px solid #e2e8f0',
                backgroundColor: tipo === 'ENTRADA' ? '#ecfdf5' : '#ffffff',
                color: tipo === 'ENTRADA' ? '#065f46' : '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: 'pointer'
              }}
            >
              <ArrowDownRight size={18} />
              <span>Entrada (+Efectivo)</span>
            </button>

            <button
              type="button"
              onClick={() => setTipo('SALIDA')}
              style={{
                padding: '0.85rem',
                borderRadius: '12px',
                border: tipo === 'SALIDA' ? '2px solid #dc2626' : '1px solid #e2e8f0',
                backgroundColor: tipo === 'SALIDA' ? '#fef2f2' : '#ffffff',
                color: tipo === 'SALIDA' ? '#991b1b' : '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: 'pointer'
              }}
            >
              <ArrowUpRight size={18} />
              <span>Salida (-Retiro/Gasto)</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                Importe del Movimiento ($)
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '16px', top: '10px', fontSize: '1.4rem', fontWeight: 800, color: tipo === 'ENTRADA' ? '#059669' : '#dc2626' }}>
                  $
                </div>
                <input
                  ref={inputMontoRef}
                  type="number"
                  step="0.50"
                  min="0.50"
                  value={montoTexto}
                  onChange={(e) => setMontoTexto(e.target.value)}
                  disabled={cargando}
                  placeholder="0.00"
                  style={{
                    width: '100%',
                    padding: '0.65rem 1rem 0.65rem 2.75rem',
                    borderRadius: '12px',
                    border: `2px solid ${tipo === 'ENTRADA' ? '#10b981' : '#f87171'}`,
                    backgroundColor: tipo === 'ENTRADA' ? '#f0fdf4' : '#fff1f2',
                    color: tipo === 'ENTRADA' ? '#047857' : '#991b1b',
                    fontSize: '1.8rem',
                    fontWeight: 800,
                    fontFamily: 'var(--fuente-numerica)'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                Motivo / Justificación
              </label>
              <input
                type="text"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                disabled={cargando}
                placeholder={tipo === 'ENTRADA' ? 'Ej. Cambio adicional de banco, fondo extra...' : 'Ej. Pago de refrescos, pago de pan, retiro a dueño...'}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#f8fafc',
                  color: '#0f172a',
                  fontSize: '0.95rem'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.5rem' }}>
              <button
                type="button"
                onClick={onCerrar}
                disabled={cargando}
                className="btn btn-secundario"
                style={{ flex: 1, padding: '0.85rem' }}
              >
                Cancelar (Esc)
              </button>
              <button
                type="submit"
                disabled={cargando}
                className={tipo === 'ENTRADA' ? 'btn btn-primario' : 'btn btn-peligro'}
                style={{ flex: 2, padding: '0.85rem', fontSize: '1rem', gap: '0.5rem' }}
              >
                {cargando ? (
                  <>
                    <Loader2 size={18} className="spinner" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Check size={18} />
                    <span>Confirmar {tipo === 'ENTRADA' ? 'Entrada' : 'Salida'}</span>
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
