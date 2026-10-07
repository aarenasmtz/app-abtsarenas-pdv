import React, { useState, useEffect, useCallback } from 'react';
import { 
  Clock, 
  X, 
  ShoppingCart, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  AlertCircle,
  Loader2
} from 'lucide-react';
import type { TicketPendienteDto } from '../ventas/tipos';
import { servicioTicketsPendientes } from '../ventas/servicioTicketsPendientes';
import { reproducirBeepExito, reproducirBeepError } from '../../utils/sonidosPdv';

interface PropiedadesModalTicketsPendientes {
  abierto: boolean;
  onCerrar: () => void;
  onRecuperarTicket: (ticket: TicketPendienteDto) => void;
  alModificarTickets?: () => void;
}

export const ModalTicketsPendientes: React.FC<PropiedadesModalTicketsPendientes> = ({
  abierto,
  onCerrar,
  onRecuperarTicket,
  alModificarTickets
}) => {
  const [tickets, setTickets] = useState<TicketPendienteDto[]>([]);
  const [cargando, setCargando] = useState<boolean>(false);
  const [ticketExpandido, setTicketExpandido] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [procesandoId, setProcesandoId] = useState<number | null>(null);

  const cargarTickets = useCallback(async () => {
    try {
      setCargando(true);
      setError(null);
      const respuesta = await servicioTicketsPendientes.obtenerActivos();
      if (respuesta.exito && Array.isArray(respuesta.datos)) {
        setTickets(respuesta.datos);
        if (respuesta.datos.length > 0) {
          setTicketExpandido(respuesta.datos[0].idTicketPendiente);
        }
      } else {
        setTickets([]);
      }
    } catch {
      setTickets([]);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    if (abierto) {
      cargarTickets();
    }
  }, [abierto, cargarTickets]);

  const handleRecuperar = async (ticket: TicketPendienteDto) => {
    try {
      setProcesandoId(ticket.idTicketPendiente);
      const respuesta = await servicioTicketsPendientes.recuperar(ticket.idTicketPendiente);
      if (respuesta.exito && respuesta.datos) {
        reproducirBeepExito();
        onRecuperarTicket(respuesta.datos);
        alModificarTickets?.();
        onCerrar();
      } else {
        reproducirBeepError();
        setError(respuesta.mensaje || 'No se pudo reanudar el ticket.');
      }
    } catch {
      reproducirBeepError();
      setError('Error de comunicación al reanudar el ticket.');
    } finally {
      setProcesandoId(null);
    }
  };

  const handleDescartar = async (idTicketPendiente: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('¿Seguro que deseas descartar esta venta en espera?')) {
      return;
    }

    try {
      setProcesandoId(idTicketPendiente);
      const respuesta = await servicioTicketsPendientes.descartar(idTicketPendiente);
      if (respuesta.exito) {
        setTickets(prev => prev.filter(t => t.idTicketPendiente !== idTicketPendiente));
        alModificarTickets?.();
      } else {
        setError(respuesta.mensaje || 'No se pudo descartar el ticket.');
      }
    } catch {
      setError('Error al descartar el ticket.');
    } finally {
      setProcesandoId(null);
    }
  };

  // Atajos de teclado: Esc para cerrar
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

  if (!abierto) return null;

  return (
    <div className="modal-overlay">
      <div 
        className="modal-contenido" 
        style={{ 
          maxWidth: '650px', 
          width: '95%', 
          backgroundColor: '#ffffff', 
          borderRadius: '18px',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.25)'
        }}
      >
        {/* Cabecera */}
        <div style={{ 
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid #e2e8f0',
          backgroundColor: '#f8fafc',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              padding: '0.5rem',
              backgroundColor: '#fffbeb',
              color: '#d97706',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Clock size={22} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                Ventas en Espera (Tickets Pendientes)
              </h2>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                {tickets.length} ticket(s) en cola de espera
              </span>
            </div>
          </div>

          <button 
            onClick={onCerrar}
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: '#64748b', 
              cursor: 'pointer',
              padding: '0.35rem',
              borderRadius: '8px'
            }}
            title="Cerrar (Esc)"
          >
            <X size={20} />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div style={{ 
            backgroundColor: '#fef2f2', 
            borderBottom: '1px solid #fecaca', 
            padding: '0.75rem 1.5rem', 
            color: '#b91c1c',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Lista de tickets */}
        <div style={{ padding: '1.25rem', maxHeight: '420px', overflowY: 'auto' }}>
          {cargando ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: '#64748b' }}>
              <Loader2 size={32} className="spinner" style={{ color: '#d97706', margin: '0 auto 0.5rem' }} />
              <p>Consultando tickets en espera...</p>
            </div>
          ) : tickets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
              <Clock size={48} style={{ opacity: 0.25, margin: '0 auto 0.75rem', color: '#d97706' }} />
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a' }}>No hay ventas en espera</h3>
              <p style={{ margin: '0.35rem 0 0', fontSize: '0.85rem' }}>
                Puedes poner una venta en espera en cualquier momento usando el atajo <strong>F6</strong>.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {tickets.map((t) => {
                const esExpandido = ticketExpandido === t.idTicketPendiente;
                const estaProcesando = procesandoId === t.idTicketPendiente;
                const fecha = new Date(t.fechaRegistro);
                const horaStr = fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                return (
                  <div 
                    key={t.idTicketPendiente}
                    style={{
                      backgroundColor: '#ffffff',
                      border: esExpandido ? '2px solid #d97706' : '1px solid #e2e8f0',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      boxShadow: esExpandido ? '0 4px 12px rgba(217, 119, 6, 0.12)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {/* Encabezado del ticket */}
                    <div 
                      onClick={() => setTicketExpandido(esExpandido ? null : t.idTicketPendiente)}
                      style={{
                        padding: '0.9rem 1.25rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                        backgroundColor: esExpandido ? '#fffbeb' : '#ffffff'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        <div style={{
                          backgroundColor: '#fef3c7',
                          color: '#d97706',
                          borderRadius: '8px',
                          padding: '0.4rem 0.65rem',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem'
                        }}>
                          <Clock size={14} />
                          <span>{horaStr}</span>
                        </div>

                        <div>
                          <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>
                            {t.identificadorCliente}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                            {t.cantidadArticulos} artículo(s) • Atendió: {t.nombreUsuario}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Total</span>
                          <span className="mono" style={{ fontSize: '1.25rem', fontWeight: 800, color: '#059669' }}>
                            ${t.total.toFixed(2)}
                          </span>
                        </div>

                        {esExpandido ? <ChevronUp size={18} color="#64748b" /> : <ChevronDown size={18} color="#64748b" />}
                      </div>
                    </div>

                    {/* Desglose de partidas si está expandido */}
                    {esExpandido && (
                      <div style={{ 
                        borderTop: '1px solid #e2e8f0', 
                        padding: '0.85rem 1.25rem',
                        backgroundColor: '#f8fafc'
                      }}>
                        <div style={{ maxHeight: '140px', overflowY: 'auto', marginBottom: '0.85rem' }}>
                          <table style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr style={{ color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>
                                <th style={{ textAlign: 'left', paddingBottom: '0.4rem' }}>Art.</th>
                                <th style={{ textAlign: 'center', paddingBottom: '0.4rem' }}>Cant.</th>
                                <th style={{ textAlign: 'right', paddingBottom: '0.4rem' }}>Precio</th>
                                <th style={{ textAlign: 'right', paddingBottom: '0.4rem' }}>Subtotal</th>
                              </tr>
                            </thead>
                            <tbody>
                              {t.articulos.map((art, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                  <td style={{ padding: '0.4rem 0', color: '#0f172a', fontWeight: 500 }}>{art.descripcion}</td>
                                  <td style={{ padding: '0.4rem 0', textAlign: 'center', color: '#64748b' }}>{art.cantidad}</td>
                                  <td className="mono" style={{ padding: '0.4rem 0', textAlign: 'right', color: '#64748b' }}>${art.precioUnitario.toFixed(2)}</td>
                                  <td className="mono" style={{ padding: '0.4rem 0', textAlign: 'right', color: '#059669', fontWeight: 700 }}>${art.subtotal.toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Botones de acción del ticket */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
                          <button
                            type="button"
                            onClick={(e) => handleDescartar(t.idTicketPendiente, e)}
                            disabled={estaProcesando}
                            className="btn btn-secundario"
                            style={{
                              padding: '0.45rem 0.85rem',
                              color: '#dc2626',
                              fontSize: '0.85rem',
                              fontWeight: 600,
                              gap: '0.35rem'
                            }}
                          >
                            <Trash2 size={15} />
                            <span>Descartar</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRecuperar(t)}
                            disabled={estaProcesando}
                            className="btn btn-primario"
                            style={{
                              padding: '0.45rem 1.25rem',
                              fontSize: '0.85rem',
                              fontWeight: 700,
                              gap: '0.4rem'
                            }}
                          >
                            {estaProcesando ? (
                              <Loader2 size={15} className="spinner" />
                            ) : (
                              <ShoppingCart size={15} />
                            )}
                            <span>Cargar a Caja</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pie */}
        <div style={{
          padding: '0.9rem 1.5rem',
          backgroundColor: '#f8fafc',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Pulsa <strong>Esc</strong> para cerrar
          </span>

          <button
            type="button"
            onClick={onCerrar}
            className="btn btn-secundario"
            style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
          >
            Cerrar (Esc)
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalTicketsPendientes;
