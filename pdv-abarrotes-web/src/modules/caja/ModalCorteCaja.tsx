import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calculator, 
  FileText, 
  Printer, 
  AlertCircle, 
  CheckCircle, 
  X, 
  Loader2, 
  Lock
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

  // Atajo de teclado para Escape
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

  const totalContadoCalculado = useMemo(() => {
    if (modoConteo === 'manual') {
      const parsed = parseFloat(montoContadoDirecto);
      return isNaN(parsed) ? 0 : parsed;
    }
    return denominaciones.reduce((acum, d) => acum + d.denominacion * d.cantidad, 0);
  }, [modoConteo, montoContadoDirecto, denominaciones]);

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
    if (!window.confirm('¿Estás seguro de cerrar definitivamente el turno de caja actual? Se generará el Corte Z oficial.')) {
      return;
    }

    try {
      setGuardandoCierre(true);
      setError(null);

      const resp = await servicioCaja.cerrarTurnoCorteZ({
        idTurnoCaja: turno.idTurnoCaja,
        totalContado: totalContadoCalculado,
        observaciones: observaciones.trim()
      });

      if (resp.exito && resp.datos) {
        reproducirBeepExito();
        setCorteFinalizado(resp.datos);
        setMostrarTiraImpresion(true);
        onTurnoCerrado();
      } else {
        reproducirBeepError();
        setError(resp.mensaje || 'Error al procesar el cierre de turno.');
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
    <div className="modal-overlay">
      <div 
        className="modal-contenido"
        style={{
          maxWidth: '850px',
          width: '95%',
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.25)',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Cabecera Principal */}
        <div style={{
          padding: '1.25rem 1.75rem',
          backgroundColor: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              padding: '0.6rem',
              backgroundColor: '#eff6ff',
              color: '#2563eb',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Calculator size={24} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#0f172a' }}>
                Control de Caja y Cortes Financieros
              </h2>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                Turno #{turno.idTurnoCaja} • {turno.nombreCaja} • Cajero: <strong>{turno.nombreUsuario}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onCerrar}
            disabled={guardandoCierre}
            style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '0.35rem' }}
            title="Cerrar (Esc)"
          >
            <X size={20} />
          </button>
        </div>

        {/* Pestañas de navegación */}
        {!mostrarTiraImpresion && (
          <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f1f5f9' }}>
            <button
              onClick={() => setPestanaActiva('corteX')}
              style={{
                flex: 1,
                padding: '0.85rem 1rem',
                fontWeight: 700,
                fontSize: '0.95rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                border: 'none',
                borderBottom: pestanaActiva === 'corteX' ? '3px solid #2563eb' : '3px solid transparent',
                backgroundColor: pestanaActiva === 'corteX' ? '#ffffff' : 'transparent',
                color: pestanaActiva === 'corteX' ? '#2563eb' : '#64748b',
                cursor: 'pointer'
              }}
            >
              <FileText size={18} />
              <span>Corte X (Lectura Parcial en Vivo)</span>
            </button>

            <button
              onClick={() => setPestanaActiva('corteZ')}
              style={{
                flex: 1,
                padding: '0.85rem 1rem',
                fontWeight: 700,
                fontSize: '0.95rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                border: 'none',
                borderBottom: pestanaActiva === 'corteZ' ? '3px solid #dc2626' : '3px solid transparent',
                backgroundColor: pestanaActiva === 'corteZ' ? '#ffffff' : 'transparent',
                color: pestanaActiva === 'corteZ' ? '#dc2626' : '#64748b',
                cursor: 'pointer'
              }}
            >
              <Lock size={18} />
              <span>Corte Z (Cierre de Turno y Arqueo)</span>
            </button>
          </div>
        )}

        {/* Contenido Principal */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, maxHeight: 'calc(85vh - 120px)' }}>
          {error && (
            <div style={{
              marginBottom: '1rem',
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

          {mostrarTiraImpresion && (corteFinalizado || corteXData) ? (
            <div>
              <TiraCorteTermico
                corte={corteFinalizado || corteXData!}
                onCerrar={() => {
                  setMostrarTiraImpresion(false);
                  if (corteFinalizado) onCerrar();
                }}
              />
            </div>
          ) : cargando ? (
            <div style={{ textAlign: 'center', padding: '3rem 0' }}>
              <Loader2 size={36} className="spinner" style={{ color: '#2563eb' }} />
              <p style={{ marginTop: '0.75rem', color: '#64748b' }}>Cargando acumulados del turno actual...</p>
            </div>
          ) : pestanaActiva === 'corteX' && corteXData ? (
            /* VISTA CORTE X */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                <div style={{ padding: '1rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Fondo Inicial:</span>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginTop: '0.25rem' }}>
                    ${corteXData.montoInicial.toFixed(2)}
                  </div>
                </div>

                <div style={{ padding: '1rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#166534', textTransform: 'uppercase' }}>Ventas en Efectivo:</span>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#15803d', marginTop: '0.25rem' }}>
                    +${corteXData.ventasEfectivo.toFixed(2)}
                  </div>
                </div>

                <div style={{ padding: '1rem', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '12px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#047857', textTransform: 'uppercase' }}>Entradas Manuales:</span>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#059669', marginTop: '0.25rem' }}>
                    +${corteXData.entradasEfectivo.toFixed(2)}
                  </div>
                </div>

                <div style={{ padding: '1rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#991b1b', textTransform: 'uppercase' }}>Salidas de Efectivo:</span>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#dc2626', marginTop: '0.25rem' }}>
                    -${corteXData.salidasEfectivo.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Total Esperado en Cajón */}
              <div style={{
                padding: '1.25rem 1.5rem',
                background: 'linear-gradient(135deg, #059669, #047857)',
                borderRadius: '16px',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 4px 14px rgba(5, 150, 105, 0.25)'
              }}>
                <div>
                  <span style={{ fontSize: '0.85rem', color: '#a7f3d0', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                    Efectivo Esperado en Caja (Cajón Físico)
                  </span>
                  <div style={{ fontSize: '2.5rem', fontWeight: 800, fontFamily: 'var(--fuente-numerica)' }}>
                    ${corteXData.totalEsperadoEnCaja.toFixed(2)}
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.85rem', color: '#d1fae5' }}>
                  <div>Total Tickets Cobrados: <strong>{corteXData.totalTransacciones}</strong></div>
                  <div>Monto Total de Ventas: <strong>${corteXData.totalVentas.toFixed(2)}</strong></div>
                </div>
              </div>

              {/* Otros métodos de pago */}
              <div>
                <h4 style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: '0.5rem' }}>
                  Ventas por Otros Métodos (Sin Impacto en Cajón)
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                  <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Tarjeta:</span>
                    <strong style={{ fontSize: '1rem', color: '#2563eb' }}>${corteXData.ventasTarjeta.toFixed(2)}</strong>
                  </div>
                  <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Transferencia:</span>
                    <strong style={{ fontSize: '1rem', color: '#7c3aed' }}>${corteXData.ventasTransferencia.toFixed(2)}</strong>
                  </div>
                  <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Vales:</span>
                    <strong style={{ fontSize: '1rem', color: '#d97706' }}>${corteXData.ventasVales.toFixed(2)}</strong>
                  </div>
                  <div style={{ padding: '0.75rem', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px' }}>
                    <span style={{ fontSize: '0.75rem', color: '#1e40af', display: 'block' }}>Total Ventas:</span>
                    <strong style={{ fontSize: '1.05rem', color: '#1d4ed8' }}>${corteXData.totalVentas.toFixed(2)}</strong>
                  </div>
                </div>
              </div>

              {/* Movimientos Recientes */}
              {movimientos.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: '0.5rem' }}>
                    Movimientos Manuales Registrados ({movimientos.length})
                  </h4>
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', maxHeight: '180px', overflowY: 'auto' }}>
                    <table className="tabla-datos" style={{ fontSize: '0.85rem' }}>
                      <thead>
                        <tr>
                          <th>Tipo</th>
                          <th style={{ textAlign: 'right' }}>Monto</th>
                          <th>Motivo / Concepto</th>
                          <th style={{ textAlign: 'right' }}>Hora</th>
                        </tr>
                      </thead>
                      <tbody>
                        {movimientos.map((m) => (
                          <tr key={m.idMovimientoCaja}>
                            <td>
                              <span className={`badge ${m.tipoMovimiento === 'ENTRADA' ? 'badge-exito' : 'badge-peligro'}`}>
                                {m.tipoMovimiento}
                              </span>
                            </td>
                            <td className="mono" style={{ textAlign: 'right', fontWeight: 700 }}>
                              ${m.monto.toFixed(2)}
                            </td>
                            <td>{m.descripcion}</td>
                            <td style={{ textAlign: 'right', color: '#64748b' }}>
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
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setMostrarTiraImpresion(true)}
                  className="btn btn-primario"
                  style={{ padding: '0.85rem 1.5rem', gap: '0.5rem' }}
                >
                  <Printer size={18} />
                  <span>Ver e Imprimir Tira Corte X</span>
                </button>
              </div>
            </div>
          ) : pestanaActiva === 'corteZ' && corteXData ? (
            /* VISTA CORTE Z (ARQUEO Y CIERRE) */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{
                padding: '1rem 1.25rem',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '12px',
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'flex-start'
              }}>
                <Lock size={20} color="#dc2626" style={{ marginTop: '2px', flexShrink: 0 }} />
                <div style={{ fontSize: '0.85rem', color: '#991b1b', lineHeight: 1.5 }}>
                  <strong style={{ display: 'block', fontSize: '0.95rem' }}>Cierre Definitivo de Turno (Corte Z)</strong>
                  Realiza el conteo de todo el efectivo físico que tienes en el cajón (billetes y monedas). Al confirmar el corte, el turno quedará cerrado formalmente y se emitirá la tira de auditoría.
                </div>
              </div>

              {/* Selector de modo de conteo */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  Método de Arqueo Físico:
                </span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setModoConteo('calculadora')}
                    className={modoConteo === 'calculadora' ? 'btn btn-primario' : 'btn btn-secundario'}
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                  >
                    Desglose por Denominación
                  </button>
                  <button
                    type="button"
                    onClick={() => setModoConteo('manual')}
                    className={modoConteo === 'manual' ? 'btn btn-primario' : 'btn btn-secundario'}
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                  >
                    Monto Directo
                  </button>
                </div>
              </div>

              {/* Desglose de denominaciones o Input Directo */}
              {modoConteo === 'calculadora' ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.65rem' }}>
                  {denominaciones.map((d) => (
                    <div
                      key={d.denominacion}
                      style={{
                        padding: '0.75rem',
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                        <span style={{ fontWeight: 700, color: '#334155' }}>{d.etiqueta}</span>
                        <span className="mono" style={{ color: '#059669', fontWeight: 600 }}>
                          ${(d.denominacion * d.cantidad).toFixed(2)}
                        </span>
                      </div>
                      <div style={{ marginTop: '0.4rem' }}>
                        <input
                          type="number"
                          min="0"
                          value={d.cantidad === 0 ? '' : d.cantidad}
                          onChange={(e) =>
                            handleActualizarCantidadDenominacion(d.denominacion, parseInt(e.target.value) || 0)
                          }
                          placeholder="0"
                          style={{
                            width: '100%',
                            padding: '0.4rem 0.6rem',
                            textAlign: 'center',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            fontWeight: 700,
                            fontSize: '0.95rem'
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '1rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                    Efectivo Total Contado ($)
                  </label>
                  <input
                    type="number"
                    step="0.50"
                    min="0"
                    value={montoContadoDirecto}
                    onChange={(e) => setMontoContadoDirecto(e.target.value)}
                    placeholder="0.00"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      border: '2px solid #2563eb',
                      fontSize: '1.75rem',
                      fontWeight: 800,
                      fontFamily: 'var(--fuente-numerica)'
                    }}
                  />
                </div>
              )}

              {/* Balance y Arqueo Resultante */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                <div style={{ padding: '1rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Efectivo Esperado:</span>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', marginTop: '0.2rem' }}>
                    ${corteXData.totalEsperadoEnCaja.toFixed(2)}
                  </div>
                </div>

                <div style={{ padding: '1rem', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#1e40af', fontWeight: 600 }}>Efectivo Contado:</span>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#2563eb', marginTop: '0.2rem' }}>
                    ${totalContadoCalculado.toFixed(2)}
                  </div>
                </div>

                <div style={{
                  padding: '1rem',
                  backgroundColor: diferenciaCalculada === 0 ? '#ecfdf5' : diferenciaCalculada > 0 ? '#eff6ff' : '#fef2f2',
                  border: `1px solid ${diferenciaCalculada === 0 ? '#a7f3d0' : diferenciaCalculada > 0 ? '#bfdbfe' : '#fecaca'}`,
                  borderRadius: '12px'
                }}>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: diferenciaCalculada === 0 ? '#065f46' : diferenciaCalculada > 0 ? '#1e40af' : '#991b1b'
                  }}>
                    {diferenciaCalculada === 0 ? 'Diferencia (Cuadrado):' : diferenciaCalculada > 0 ? 'Diferencia (Sobrante):' : 'Diferencia (Faltante):'}
                  </span>
                  <div style={{
                    fontSize: '1.35rem',
                    fontWeight: 800,
                    marginTop: '0.2rem',
                    color: diferenciaCalculada === 0 ? '#059669' : diferenciaCalculada > 0 ? '#2563eb' : '#dc2626'
                  }}>
                    {diferenciaCalculada > 0 && '+'}
                    ${diferenciaCalculada.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Observaciones */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                  Observaciones de Cierre / Justificación de Arqueo
                </label>
                <textarea
                  rows={2}
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Escribe comentarios u observaciones relevantes sobre el turno..."
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              {/* Botón Confirmar Cierre */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={onCerrar}
                  disabled={guardandoCierre}
                  className="btn btn-secundario"
                  style={{ padding: '0.85rem 1.25rem' }}
                >
                  Cancelar (Esc)
                </button>
                <button
                  type="button"
                  onClick={handleCerrarTurno}
                  disabled={guardandoCierre}
                  className="btn btn-peligro"
                  style={{ padding: '0.85rem 1.5rem', fontWeight: 700, fontSize: '1rem', gap: '0.5rem' }}
                >
                  {guardandoCierre ? (
                    <>
                      <Loader2 size={18} className="spinner" />
                      <span>Cerrando Turno...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={18} />
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
