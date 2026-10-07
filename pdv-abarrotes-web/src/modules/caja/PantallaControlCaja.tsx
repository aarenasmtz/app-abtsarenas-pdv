import React, { useState, useEffect, useCallback } from 'react';
import {
  DollarSign,
  RefreshCw,
  Calculator,
  ArrowDownRight,
  ArrowUpRight,
  Lock,
  Unlock,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  History,
  FileText,
} from 'lucide-react';
import { servicioCaja } from './servicioCaja';
import type { CajaDto, TurnoCajaDto, CorteCajaDto, MovimientoCajaDto } from './tiposCaja';
import { ModalAbrirTurno } from './ModalAbrirTurno';
import { ModalMovimientoCaja } from './ModalMovimientoCaja';
import { ModalCorteCaja } from './ModalCorteCaja';

export const PantallaControlCaja: React.FC = () => {
  const [cajas, setCajas] = useState<CajaDto[]>([]);
  const [turnoActual, setTurnoActual] = useState<TurnoCajaDto | null>(null);
  const [cortes, setCortes] = useState<CorteCajaDto[]>([]);
  const [movimientos, setMovimientos] = useState<MovimientoCajaDto[]>([]);
  const [cargando, setCargando] = useState(false);
  const [mensajeAlerta, setMensajeAlerta] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);

  // Modales
  const [mostrarModalAbrirTurno, setMostrarModalAbrirTurno] = useState(false);
  const [mostrarModalMovimiento, setMostrarModalMovimiento] = useState(false);
  const [mostrarModalCorte, setMostrarModalCorte] = useState(false);

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    try {
      const [respCajas, respTurno, respCortes] = await Promise.all([
        servicioCaja.obtenerCajas().catch(() => ({ exito: false, datos: [] as CajaDto[] })),
        servicioCaja.obtenerTurnoActual().catch(() => ({ exito: false, datos: null })),
        servicioCaja.obtenerHistorialCortes().catch(() => ({ exito: false, datos: [] as CorteCajaDto[] })),
      ]);

      if (respCajas.exito && respCajas.datos) setCajas(respCajas.datos);
      if (respTurno.exito && respTurno.datos) {
        setTurnoActual(respTurno.datos);
        // Si hay turno actual, cargar sus movimientos
        if (respTurno.datos.idTurnoCaja) {
          servicioCaja.obtenerMovimientosTurno(respTurno.datos.idTurnoCaja)
            .then(res => { if (res.exito && res.datos) setMovimientos(res.datos); })
            .catch(() => {});
        }
      } else {
        setTurnoActual(null);
      }
      if (respCortes.exito && respCortes.datos) setCortes(respCortes.datos);
    } catch {
      setMensajeAlerta({ tipo: 'error', texto: 'Error al consultar datos de caja.' });
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const formatearDinero = (monto: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(monto);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      {/* Cabecera del Módulo */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <DollarSign size={24} color="#059669" />
            <span>Control de Caja y Turnos</span>
          </h2>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--color-texto-secundario)' }}>
            Supervisión de terminales físicas, fondos iniciales, arqueos de efectivo y cortes de turno X/Z.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secundario"
            onClick={cargarDatos}
            disabled={cargando}
            title="Refrescar estado de cajas"
          >
            <RefreshCw size={16} className={cargando ? 'animacion-giratoria' : ''} />
            <span>Actualizar</span>
          </button>

          {!turnoActual ? (
            <button
              type="button"
              className="btn btn-primario"
              onClick={() => setMostrarModalAbrirTurno(true)}
              style={{ backgroundColor: '#059669', borderColor: '#059669' }}
            >
              <Unlock size={17} />
              <span>Abrir Turno de Caja</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                className="btn btn-secundario"
                onClick={() => setMostrarModalMovimiento(true)}
                style={{ borderColor: '#3b82f6', color: '#2563eb' }}
              >
                <ArrowDownRight size={17} />
                <span>Movimiento de Efectivo</span>
              </button>

              <button
                type="button"
                className="btn btn-primario"
                onClick={() => setMostrarModalCorte(true)}
                style={{ backgroundColor: '#059669', borderColor: '#059669' }}
              >
                <Calculator size={17} />
                <span>Corte de Caja (X / Z)</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Alertas */}
      {mensajeAlerta && (
        <div
          style={{
            padding: '0.75rem 1rem',
            borderRadius: '10px',
            backgroundColor: mensajeAlerta.tipo === 'exito' ? '#ecfdf5' : '#fef2f2',
            color: mensajeAlerta.tipo === 'exito' ? '#065f46' : '#991b1b',
            border: `1px solid ${mensajeAlerta.tipo === 'exito' ? '#a7f3d0' : '#fca5a5'}`,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.88rem',
            fontWeight: 600,
          }}
        >
          {mensajeAlerta.tipo === 'exito' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span>{mensajeAlerta.texto}</span>
        </div>
      )}

      {/* Tarjetas de Terminales de Caja */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {cajas.map((c) => {
          const estaAbierta = c.tieneTurnoAbierto || (turnoActual && turnoActual.idCaja === c.idCaja);
          return (
            <div
              key={c.idCaja}
              className="tarjeta"
              style={{
                margin: 0,
                padding: '1.25rem',
                borderLeft: `5px solid ${estaAbierta ? '#059669' : '#94a3b8'}`,
                backgroundColor: '#ffffff',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a' }}>{c.nombre}</h3>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    {c.esPrincipal ? 'Terminal Principal del Mostrador' : 'Terminal Auxiliar'}
                  </span>
                </div>
                <span className={`badge ${estaAbierta ? 'badge-exito' : 'badge-peligro'}`}>
                  {estaAbierta ? <Unlock size={12} /> : <Lock size={12} />}
                  <span>{estaAbierta ? 'Turno Abierto' : 'Caja Cerrada'}</span>
                </span>
              </div>

              <div style={{ marginTop: '1rem', paddingTop: '0.85rem', borderTop: '1px solid #f1f5f9', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem' }}>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Cajero Responsable:</span>
                  <div style={{ fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                    <UserCheck size={14} color="#059669" />
                    <span>{c.nombreCajeroActual || turnoActual?.nombreCajero || 'Sin asignar'}</span>
                  </div>
                </div>

                <div>
                  <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Turno Actual:</span>
                  <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '2px' }} className="mono">
                    {c.idTurnoActual ? `#${c.idTurnoActual}` : turnoActual ? `#${turnoActual.idTurnoCaja}` : 'Ninguno'}
                  </div>
                </div>

                <div>
                  <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Fondo Inicial:</span>
                  <div style={{ fontWeight: 700, color: '#059669', marginTop: '2px' }} className="mono">
                    {formatearDinero(turnoActual?.montoInicial || 700)}
                  </div>
                </div>

                <div>
                  <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Efectivo Estimado:</span>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '1rem', marginTop: '2px' }} className="mono">
                    {formatearDinero(turnoActual?.efectivoActualEnCaja || 700)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Historial de Movimientos de Efectivo del Turno */}
      {movimientos.length > 0 && (
        <div className="tarjeta" style={{ margin: 0, padding: '1.25rem' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={18} color="#3b82f6" />
            <span>Movimientos de Efectivo en Turno Actual</span>
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="tabla-general" style={{ width: '100%', fontSize: '0.85rem' }}>
              <thead>
                <tr>
                  <th>Hora</th>
                  <th>Tipo</th>
                  <th>Concepto / Motivo</th>
                  <th style={{ textAlign: 'right' }}>Monto</th>
                  <th>Usuario</th>
                </tr>
              </thead>
              <tbody>
                {movimientos.map((m) => (
                  <tr key={m.idMovimientoCaja}>
                    <td>{new Date(m.fechaMovimiento).toLocaleTimeString()}</td>
                    <td>
                      <span className={`badge ${m.tipoMovimiento === 'Entrada' ? 'badge-exito' : 'badge-peligro'}`}>
                        {m.tipoMovimiento === 'Entrada' ? <ArrowDownRight size={12} /> : <ArrowUpRight size={12} />}
                        <span>{m.tipoMovimiento}</span>
                      </span>
                    </td>
                    <td>{m.descripcion}</td>
                    <td className="mono font-bold" style={{ textAlign: 'right' }}>
                      {formatearDinero(m.monto)}
                    </td>
                    <td>{m.nombreUsuario || 'Cajero'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Historial de Cortes de Caja (Corte Z y X) */}
      <div className="tarjeta" style={{ margin: 0, padding: '1.25rem' }}>
        <h3 style={{ margin: '0 0 1rem', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <History size={18} color="#6366f1" />
          <span>Historial de Cortes de Caja (Cortes Z y Arqueos)</span>
        </h3>

        {cortes.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#64748b', padding: '1.5rem 0' }}>
            No se han registrado cortes de caja en el periodo consultado.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="tabla-general" style={{ width: '100%', fontSize: '0.85rem' }}>
              <thead>
                <tr>
                  <th>Folio</th>
                  <th>Fecha y Hora</th>
                  <th>Caja</th>
                  <th>Cajero</th>
                  <th style={{ textAlign: 'right' }}>Fondo Inicial</th>
                  <th style={{ textAlign: 'right' }}>Ventas Totales</th>
                  <th style={{ textAlign: 'right' }}>Efectivo Contado</th>
                  <th style={{ textAlign: 'right' }}>Diferencia</th>
                </tr>
              </thead>
              <tbody>
                {cortes.map((c) => {
                  const dif = c.diferencia ?? 0;
                  return (
                    <tr key={c.idCorteCaja}>
                      <td className="mono font-bold" style={{ color: '#059669' }}>
                        #{c.idCorteCaja}
                      </td>
                      <td>{new Date(c.fechaCorte).toLocaleString('es-MX')}</td>
                      <td>{c.nombreCaja}</td>
                      <td>{c.nombreUsuario || c.nombreCajero || 'Cajero'}</td>
                      <td className="mono" style={{ textAlign: 'right' }}>
                        {formatearDinero(c.montoInicial)}
                      </td>
                      <td className="mono font-bold" style={{ textAlign: 'right' }}>
                        {formatearDinero(c.totalVentas || c.ventasEfectivo || 0)}
                      </td>
                      <td className="mono font-bold" style={{ textAlign: 'right' }}>
                        {formatearDinero(c.totalContado || (c.totalEsperado + dif))}
                      </td>
                      <td
                        className="mono font-bold"
                        style={{
                          textAlign: 'right',
                          color: dif === 0 ? '#059669' : dif > 0 ? '#2563eb' : '#dc2626',
                        }}
                      >
                        {dif > 0 ? `+${formatearDinero(dif)}` : formatearDinero(dif)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modales de Control de Caja */}
      <ModalAbrirTurno
        abierto={mostrarModalAbrirTurno}
        onTurnoAbierto={(turno) => {
          setTurnoActual(turno);
          setMostrarModalAbrirTurno(false);
          cargarDatos();
        }}
        onCancelar={() => setMostrarModalAbrirTurno(false)}
      />

      <ModalMovimientoCaja
        abierto={mostrarModalMovimiento}
        turno={turnoActual}
        onCerrar={() => setMostrarModalMovimiento(false)}
        onMovimientoRegistrado={() => {
          setMostrarModalMovimiento(false);
          cargarDatos();
        }}
      />

      <ModalCorteCaja
        abierto={mostrarModalCorte}
        turno={turnoActual}
        onCerrar={() => setMostrarModalCorte(false)}
        onTurnoCerrado={() => {
          setTurnoActual(null);
          setMostrarModalCorte(false);
          cargarDatos();
        }}
      />
    </div>
  );
};
