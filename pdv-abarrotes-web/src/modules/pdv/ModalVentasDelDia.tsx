import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Calendar,
  DollarSign,
  CreditCard,
  Receipt,
  Search,
  RefreshCw,
  Printer,
  Trash2,
  AlertTriangle,
  UserCheck,
  CheckCircle2,
  Lock,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Package,
} from 'lucide-react';
import { servicioReportes } from '../reportes/servicioReportes';
import { servicioVentas } from '../ventas/servicioVentas';
import { servicioCaja } from '../caja/servicioCaja';
import { useStoreAutenticacion } from '../autenticacion/storeAutenticacion';
import type { ReporteVentaItemDto, ResumenReporteVentasDto } from '../reportes/tiposReportes';
import type { TurnoCajaDto } from '../caja/tiposCaja';
import type { ItemTicket } from '../ventas/tipos';

interface ModalVentasDelDiaProps {
  abierto: boolean;
  onCerrar: () => void;
  turnoActual?: TurnoCajaDto | null;
  onVerTicket?: (folioVenta: string) => void;
}

export const ModalVentasDelDia: React.FC<ModalVentasDelDiaProps> = ({
  abierto,
  onCerrar,
  turnoActual,
  onVerTicket,
}) => {
  const { usuario } = useStoreAutenticacion();
  const esAdmin = usuario?.rol === 'Administrador';

  const [cargando, setCargando] = useState(false);
  const [ventas, setVentas] = useState<ReporteVentaItemDto[]>([]);
  const [resumen, setResumen] = useState<ResumenReporteVentasDto | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [mensajeAlerta, setMensajeAlerta] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);

  // Desglose de productos por idVenta
  const [ventaDetalleExpandida, setVentaDetalleExpandida] = useState<number | null>(null);
  const [articulosPorVenta, setArticulosPorVenta] = useState<Record<number, ItemTicket[]>>({});
  const [cargandoDetalle, setCargandoDetalle] = useState<Record<number, boolean>>({});

  // Devolución individual de producto
  const [articuloADevolver, setArticuloADevolver] = useState<{ idVenta: number; folioVenta: string; articulo: ItemTicket } | null>(null);
  const [cantidadDevolver, setCantidadDevolver] = useState<number>(1);
  const [motivoDevolucion, setMotivoDevolucion] = useState<string>('Devolución de cliente en mostrador');
  const [procesandoDevolucion, setProcesandoDevolucion] = useState<boolean>(false);

  // Modal para confirmar cancelación completa
  const [ventaACancelar, setVentaACancelar] = useState<ReporteVentaItemDto | null>(null);
  const [motivoCancelacion, setMotivoCancelacion] = useState('Cancelación solicitada por cliente en mostrador');
  const [cancelando, setCancelando] = useState(false);

  const hoyStr = new Date().toISOString().substring(0, 10);

  const cargarVentasDelDia = useCallback(async () => {
    setCargando(true);
    setMensajeAlerta(null);
    try {
      const [resumenData, paginadoData] = await Promise.all([
        servicioReportes.obtenerResumenVentas({
          pagina: 1,
          registrosPorPagina: 100,
          fechaInicio: `${hoyStr}T00:00:00`,
          fechaFin: `${hoyStr}T23:59:59`,
        }),
        servicioReportes.obtenerReporteVentasPaginado({
          pagina: 1,
          registrosPorPagina: 100,
          fechaInicio: `${hoyStr}T00:00:00`,
          fechaFin: `${hoyStr}T23:59:59`,
          terminoBusqueda: busqueda.trim() || undefined,
        }),
      ]);

      setResumen(resumenData);
      setVentas(paginadoData.elementos);
    } catch {
      // Si el backend no tiene ventas aún, mostrar vacío
      setVentas([]);
    } finally {
      setCargando(false);
    }
  }, [hoyStr, busqueda]);

  useEffect(() => {
    if (abierto) {
      cargarVentasDelDia();
    }
  }, [abierto, cargarVentasDelDia]);

  if (!abierto) return null;

  const ejecutarCancelacion = async () => {
    if (!ventaACancelar) return;

    if (!esAdmin) {
      setMensajeAlerta({
        tipo: 'error',
        texto: 'Permiso denegado: Solo usuarios con rol Administrador pueden cancelar ventas.',
      });
      setVentaACancelar(null);
      return;
    }

    setCancelando(true);
    try {
      await servicioVentas.cancelarVenta(ventaACancelar.idVenta, motivoCancelacion);
      setMensajeAlerta({
        tipo: 'exito',
        texto: `✓ Venta #${ventaACancelar.folioVenta} cancelada correctamente. Stock devuelto a inventario.`,
      });
      setVentaACancelar(null);
      cargarVentasDelDia();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cancelar la venta.';
      setMensajeAlerta({ tipo: 'error', texto: msg });
    } finally {
      setCancelando(false);
    }
  };

  const handleToggleDetalle = async (idVenta: number) => {
    if (ventaDetalleExpandida === idVenta) {
      setVentaDetalleExpandida(null);
      return;
    }
    setVentaDetalleExpandida(idVenta);
    if (!articulosPorVenta[idVenta]) {
      setCargandoDetalle(prev => ({ ...prev, [idVenta]: true }));
      try {
        const respTicket = await servicioVentas.obtenerTicket(idVenta);
        const ticketDatos = respTicket?.datos;
        if (ticketDatos && ticketDatos.articulos) {
          setArticulosPorVenta(prev => ({ ...prev, [idVenta]: ticketDatos.articulos }));
        }
      } catch {
        // Silencioso
      } finally {
        setCargandoDetalle(prev => ({ ...prev, [idVenta]: false }));
      }
    }
  };

  const ejecutarDevolucion = async () => {
    if (!articuloADevolver) return;
    setProcesandoDevolucion(true);
    try {
      const montoReembolso = Math.round(cantidadDevolver * articuloADevolver.articulo.precioUnitario * 100) / 100;

      // Si hay turno activo en caja, registrar salida en efectivo por devolución
      if (turnoActual && turnoActual.idTurnoCaja) {
        try {
          await servicioCaja.registrarMovimiento({
            idTurnoCaja: turnoActual.idTurnoCaja,
            tipoMovimiento: 'SALIDA',
            monto: montoReembolso,
            descripcion: `Devolución: ${cantidadDevolver}x ${articuloADevolver.articulo.descripcion} (Ticket #${articuloADevolver.folioVenta}) - ${motivoDevolucion}`
          });
        } catch {
          // Continuar
        }
      }

      setMensajeAlerta({
        tipo: 'exito',
        texto: `✓ Devolución procesada: ${cantidadDevolver}x "${articuloADevolver.articulo.descripcion}". Reembolso en efectivo entregado: $${montoReembolso.toFixed(2)}.`
      });
      setArticuloADevolver(null);
      cargarVentasDelDia();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al procesar la devolución.';
      setMensajeAlerta({ tipo: 'error', texto: msg });
    } finally {
      setProcesandoDevolucion(false);
    }
  };

  const formatearDinero = (monto: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(monto);

  return (
    <div className="modal-overlay" style={{ zIndex: 1350 }}>
      <div
        className="modal-contenido"
        style={{
          maxWidth: '920px',
          width: '95%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.3)',
        }}
      >
        {/* Cabecera del Modal */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(to right, #ffffff, #f8fafc)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Calendar size={24} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                Ventas del Día (Hoy)
              </h2>
              <p style={{ margin: '0.15rem 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                Consulta de tickets cobrados, montos acumulados y auditoría por cajero
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={cargarVentasDelDia}
              disabled={cargando}
              className="btn btn-secundario"
              style={{ padding: '0.45rem 0.75rem', fontSize: '0.82rem', gap: '0.35rem' }}
              title="Refrescar ventas"
            >
              <RefreshCw size={15} className={cargando ? 'animacion-giratoria' : ''} />
              <span>Actualizar</span>
            </button>

            <button
              type="button"
              onClick={onCerrar}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '0.4rem',
                borderRadius: '8px',
                cursor: 'pointer',
                color: '#64748b',
              }}
              title="Cerrar (Esc)"
            >
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Notificación de Alerta */}
        {mensajeAlerta && (
          <div
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: mensajeAlerta.tipo === 'exito' ? '#ecfdf5' : '#fef2f2',
              color: mensajeAlerta.tipo === 'exito' ? '#065f46' : '#991b1b',
              borderBottom: `1px solid ${mensajeAlerta.tipo === 'exito' ? '#a7f3d0' : '#fca5a5'}`,
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

        {/* Tarjetas de Resumen Rápido */}
        <div style={{ padding: '1.25rem 1.5rem', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            <div style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                Total Vendido Hoy
              </span>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#059669', marginTop: '0.2rem' }}>
                {formatearDinero(resumen?.totalVentas || 0)}
              </div>
            </div>

            <div style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <DollarSign size={14} color="#059669" /> Efectivo
              </span>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginTop: '0.2rem' }}>
                {formatearDinero(resumen?.desgloseMetodosPago?.find(m => m.metodoPago?.toLowerCase().includes('efectivo'))?.total ?? resumen?.desgloseMetodosPago?.find(m => m.metodoPago?.toLowerCase().includes('efectivo'))?.montoTotal ?? (resumen ? resumen.totalVentas : 0))}
              </div>
            </div>

            <div style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CreditCard size={14} color="#2563eb" /> Tarjeta / Vales
              </span>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginTop: '0.2rem' }}>
                {formatearDinero(resumen?.desgloseMetodosPago?.find(m => m.metodoPago?.toLowerCase().includes('tarjeta'))?.total ?? resumen?.desgloseMetodosPago?.find(m => m.metodoPago?.toLowerCase().includes('tarjeta'))?.montoTotal ?? 0)}
              </div>
            </div>

            <div style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Receipt size={14} color="#6366f1" /> Tickets Cobrados
              </span>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginTop: '0.2rem' }}>
                {resumen?.totalTickets || ventas.length}
              </div>
            </div>

            {turnoActual && (
              <div style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <UserCheck size={14} color="#059669" /> Cajero Turno #{turnoActual.idTurnoCaja}
                </span>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginTop: '0.35rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {turnoActual.nombreUsuario || turnoActual.nombreCajero || 'Cajero en Turno'}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Buscador de Tickets */}
        <div style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid #e2e8f0' }}>
          <div className="catalogo-buscador-contenedor">
            <Search size={18} color="#64748b" />
            <input
              type="text"
              className="catalogo-buscador-input"
              placeholder="Buscar por folio, cliente o cajero..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
            {busqueda && (
              <button
                type="button"
                onClick={() => setBusqueda('')}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Tabla de Ventas */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.5rem' }}>
          {ventas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
              <Receipt size={40} color="#cbd5e1" style={{ marginBottom: '0.5rem' }} />
              <p style={{ margin: 0, fontWeight: 700, color: '#475569' }}>Sin ventas registradas el día de hoy</p>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem' }}>
                Las ventas que cobres en el punto de venta aparecerán en esta lista en tiempo real.
              </p>
            </div>
          ) : (
            <table className="tabla-general" style={{ width: '100%', fontSize: '0.88rem' }}>
              <thead>
                <tr>
                  <th>Folio</th>
                  <th>Hora</th>
                  <th>Cajero</th>
                  <th>Cliente</th>
                  <th>Método</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                  <th>Estado</th>
                  <th style={{ textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {ventas.map((v) => {
                  const estaExpandida = ventaDetalleExpandida === v.idVenta;
                  const articulos = articulosPorVenta[v.idVenta];
                  const cargandoArticulos = cargandoDetalle[v.idVenta];

                  return (
                    <React.Fragment key={v.idVenta}>
                      <tr style={{ opacity: v.esCancelada ? 0.6 : 1, backgroundColor: estaExpandida ? '#f8fafc' : 'transparent' }}>
                        <td className="mono font-bold" style={{ color: '#059669' }}>
                          #{v.folioVenta}
                        </td>
                        <td>{new Date(v.fechaVenta).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</td>
                        <td>{v.cajero}</td>
                        <td>Público en General</td>
                        <td>{v.metodosPago || 'Efectivo'}</td>
                        <td className="mono font-bold" style={{ textAlign: 'right' }}>
                          {formatearDinero(v.total)}
                        </td>
                        <td>
                          <span className={`badge ${v.esCancelada ? 'badge-peligro' : 'badge-exito'}`}>
                            {v.esCancelada ? 'Cancelada' : 'Cobrada'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                            {/* Botón para Desglose de Productos */}
                            <button
                              type="button"
                              onClick={() => handleToggleDetalle(v.idVenta)}
                              className="btn btn-secundario"
                              style={{ 
                                padding: '0.3rem 0.55rem', 
                                fontSize: '0.78rem', 
                                gap: '0.25rem',
                                backgroundColor: estaExpandida ? '#e0e7ff' : '#f8fafc',
                                borderColor: estaExpandida ? '#6366f1' : '#cbd5e1',
                                color: estaExpandida ? '#4338ca' : '#334155'
                              }}
                              title="Ver desglose de productos vendidos"
                            >
                              {estaExpandida ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                              <span>Desglose</span>
                            </button>

                            {onVerTicket && (
                              <button
                                type="button"
                                onClick={() => {
                                  onVerTicket(v.folioVenta);
                                  onCerrar();
                                }}
                                className="btn btn-secundario"
                                style={{ padding: '0.3rem 0.5rem', fontSize: '0.78rem', gap: '0.25rem' }}
                                title="Reimprimir o consultar ticket"
                              >
                                <Printer size={13} />
                                <span>Ticket</span>
                              </button>
                            )}

                            {!v.esCancelada && (
                              <button
                                type="button"
                                disabled={!esAdmin}
                                onClick={() => {
                                  if (!esAdmin) {
                                    setMensajeAlerta({
                                      tipo: 'error',
                                      texto: 'Solo el Administrador tiene autorización para cancelar ventas.',
                                    });
                                    return;
                                  }
                                  setVentaACancelar(v);
                                }}
                                className="btn btn-secundario"
                                style={{
                                  padding: '0.3rem 0.5rem',
                                  fontSize: '0.78rem',
                                  gap: '0.25rem',
                                  color: esAdmin ? '#dc2626' : '#94a3b8',
                                  borderColor: esAdmin ? '#fca5a5' : '#e2e8f0',
                                  backgroundColor: esAdmin ? '#fef2f2' : '#f8fafc',
                                  cursor: esAdmin ? 'pointer' : 'not-allowed',
                                }}
                                title={esAdmin ? 'Cancelar esta venta' : 'Solo Administradores pueden cancelar'}
                              >
                                {esAdmin ? <Trash2 size={13} /> : <Lock size={13} />}
                                <span>Cancelar</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Desglose de Artículos Vendidos Expandible */}
                      {estaExpandida && (
                        <tr style={{ backgroundColor: '#f8fafc' }}>
                          <td colSpan={8} style={{ padding: '0.75rem 1.25rem', borderBottom: '2px solid #e2e8f0' }}>
                            <div style={{
                              backgroundColor: '#ffffff',
                              border: '1px solid #e2e8f0',
                              borderRadius: '10px',
                              padding: '0.85rem 1rem',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>
                                  <Package size={16} color="#4f46e5" />
                                  <span>Desglose de Productos Vendidos • Ticket #{v.folioVenta}</span>
                                </div>
                                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                  Artículos en ticket: <strong>{v.numeroArticulos}</strong>
                                </span>
                              </div>

                              {cargandoArticulos ? (
                                <div style={{ textAlign: 'center', padding: '1rem', color: '#64748b' }}>
                                  Cargando desglose de artículos...
                                </div>
                              ) : !articulos || articulos.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '1rem', color: '#64748b' }}>
                                  No hay información detallada disponible para esta venta.
                                </div>
                              ) : (
                                <table style={{ width: '100%', fontSize: '0.83rem', borderCollapse: 'collapse' }}>
                                  <thead>
                                    <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                                      <th style={{ padding: '0.4rem 0.6rem' }}>Cant.</th>
                                      <th style={{ padding: '0.4rem 0.6rem' }}>Producto</th>
                                      <th style={{ padding: '0.4rem 0.6rem', textAlign: 'right' }}>P. Unitario</th>
                                      <th style={{ padding: '0.4rem 0.6rem', textAlign: 'right' }}>Importe</th>
                                      <th style={{ padding: '0.4rem 0.6rem', textAlign: 'center' }}>Acción</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {articulos.map((art, idx) => (
                                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '0.4rem 0.6rem', fontWeight: 700, fontFamily: 'monospace' }}>
                                          {art.cantidad}
                                        </td>
                                        <td style={{ padding: '0.4rem 0.6rem', color: '#0f172a' }}>
                                          {art.descripcion}
                                        </td>
                                        <td style={{ padding: '0.4rem 0.6rem', textAlign: 'right', fontFamily: 'monospace' }}>
                                          ${art.precioUnitario.toFixed(2)}
                                        </td>
                                        <td style={{ padding: '0.4rem 0.6rem', textAlign: 'right', fontWeight: 700, color: '#059669', fontFamily: 'monospace' }}>
                                          ${art.importe.toFixed(2)}
                                        </td>
                                        <td style={{ padding: '0.4rem 0.6rem', textAlign: 'center' }}>
                                          {!v.esCancelada && (
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setArticuloADevolver({
                                                  idVenta: v.idVenta,
                                                  folioVenta: v.folioVenta,
                                                  articulo: art
                                                });
                                                setCantidadDevolver(Math.min(1, art.cantidad));
                                                setMotivoDevolucion('Devolución solicitada por cliente en mostrador');
                                              }}
                                              style={{
                                                backgroundColor: '#fef3c7',
                                                color: '#b45309',
                                                border: '1px solid #fde68a',
                                                padding: '0.2rem 0.5rem',
                                                borderRadius: '6px',
                                                fontSize: '0.75rem',
                                                fontWeight: 700,
                                                cursor: 'pointer',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '0.3rem'
                                              }}
                                              title="Devolver este producto y reembolsar importe"
                                            >
                                              <RotateCcw size={12} />
                                              <span>Devolver</span>
                                            </button>
                                          )}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal interno para confirmar cancelación */}
        {ventaACancelar && (
          <div className="modal-superposicion" style={{ zIndex: 1400 }}>
            <div className="modal-contenedor" style={{ maxWidth: '440px', padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#b91c1c', marginBottom: '0.75rem' }}>
                <AlertTriangle size={24} />
                <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Confirmar Cancelación de Venta</h3>
              </div>
              <p style={{ margin: '0 0 1rem', fontSize: '0.88rem', color: '#475569', lineHeight: 1.5 }}>
                ¿Está seguro de cancelar el ticket <strong>#{ventaACancelar.folioVenta}</strong> por{' '}
                <strong>{formatearDinero(ventaACancelar.total)}</strong>? El inventario de los artículos será restituido automáticamente.
              </p>
              <div className="grupo-formulario" style={{ marginBottom: '1.25rem' }}>
                <label className="etiqueta-formulario">Motivo de Cancelación:</label>
                <input
                  type="text"
                  className="control-formulario"
                  value={motivoCancelacion}
                  onChange={(e) => setMotivoCancelacion(e.target.value)}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secundario"
                  onClick={() => setVentaACancelar(null)}
                  disabled={cancelando}
                >
                  Volver
                </button>
                <button
                  type="button"
                  className="btn btn-peligro"
                  onClick={ejecutarCancelacion}
                  disabled={cancelando}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <Trash2 size={15} />
                  <span>{cancelando ? 'Cancelando...' : 'Confirmar Cancelación'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal interno para Devolución Individual de Producto */}
        {articuloADevolver && (
          <div className="modal-superposicion" style={{ zIndex: 1400 }}>
            <div className="modal-contenedor" style={{ maxWidth: '450px', padding: '1.5rem', borderRadius: '14px', backgroundColor: '#ffffff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#b45309', marginBottom: '0.75rem' }}>
                <RotateCcw size={22} />
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>Devolver Producto</h3>
              </div>
              <p style={{ margin: '0 0 0.75rem', fontSize: '0.88rem', color: '#475569' }}>
                Ticket <strong>#{articuloADevolver.folioVenta}</strong> • <strong>{articuloADevolver.articulo.descripcion}</strong>
              </p>

              <div style={{
                backgroundColor: '#fffbeb',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                border: '1px solid #fde68a',
                marginBottom: '1rem',
                fontSize: '0.85rem'
              }}>
                <div>Precio unitario: <strong>${articuloADevolver.articulo.precioUnitario.toFixed(2)}</strong></div>
                <div>Cantidad comprada: <strong>{articuloADevolver.articulo.cantidad}</strong></div>
                <div style={{ marginTop: '0.3rem', fontSize: '1.05rem', fontWeight: 800, color: '#b45309' }}>
                  Total a reembolsar: ${(cantidadDevolver * articuloADevolver.articulo.precioUnitario).toFixed(2)}
                </div>
              </div>

              <div className="grupo-formulario" style={{ marginBottom: '0.85rem' }}>
                <label className="etiqueta-formulario" style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                  Cantidad a Devolver:
                </label>
                <input
                  type="number"
                  step="any"
                  min="0.001"
                  max={articuloADevolver.articulo.cantidad}
                  value={cantidadDevolver}
                  onChange={(e) => setCantidadDevolver(Math.max(0.001, Math.min(articuloADevolver.articulo.cantidad, parseFloat(e.target.value) || 0)))}
                  className="control-formulario"
                  style={{ fontSize: '1.1rem', fontWeight: 700 }}
                  required
                />
              </div>

              <div className="grupo-formulario" style={{ marginBottom: '1.25rem' }}>
                <label className="etiqueta-formulario" style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                  Motivo de la Devolución:
                </label>
                <input
                  type="text"
                  className="control-formulario"
                  value={motivoDevolucion}
                  onChange={(e) => setMotivoDevolucion(e.target.value)}
                  placeholder="Ej. Producto defectuoso, cliente cambió de opinión..."
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secundario"
                  onClick={() => setArticuloADevolver(null)}
                  disabled={procesandoDevolucion}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-primario"
                  onClick={ejecutarDevolucion}
                  disabled={procesandoDevolucion || cantidadDevolver <= 0}
                  style={{
                    backgroundColor: '#d97706',
                    borderColor: '#d97706',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                >
                  <RotateCcw size={15} />
                  <span>{procesandoDevolucion ? 'Procesando...' : 'Confirmar Devolución'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pie del modal */}
        <div
          style={{
            padding: '0.85rem 1.5rem',
            borderTop: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.8rem',
            color: '#64748b',
          }}
        >
          <span>
            {esAdmin ? (
              <strong style={{ color: '#059669' }}>✓ Modo Administrador: Autorización para cancelaciones activa.</strong>
            ) : (
              <span>Modo Cajero: Cancelación de ventas restringida a Administrador.</span>
            )}
          </span>
          <button type="button" className="btn btn-secundario" onClick={onCerrar} style={{ padding: '0.4rem 0.85rem' }}>
            Cerrar Ventana
          </button>
        </div>
      </div>
    </div>
  );
};
