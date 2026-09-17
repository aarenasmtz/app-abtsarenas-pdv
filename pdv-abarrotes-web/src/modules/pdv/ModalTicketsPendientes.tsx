import React, { useState, useEffect, useCallback } from 'react';
import { 
  Clock, 
  X, 
  Trash2, 
  ShoppingCart, 
  ChevronDown, 
  ChevronUp, 
  Loader2, 
  AlertCircle 
} from 'lucide-react';
import type { TicketPendienteDto } from '../ventas/tipos';
import servicioTicketsPendientes from '../ventas/servicioTicketsPendientes';
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
      if (respuesta.exito && respuesta.datos) {
        setTickets(respuesta.datos);
        if (respuesta.datos.length > 0) {
          setTicketExpandido(respuesta.datos[0].idTicketPendiente);
        }
      } else {
        setError(respuesta.mensaje || 'Error al cargar tickets pendientes.');
      }
    } catch {
      setError('Error al consultar los tickets en espera.');
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
    <div className="modal-overlay" style={{ zIndex: 1200 }}>
      <div 
        className="modal-contenido" 
        style={{ 
          maxWidth: '650px', 
          width: '95%', 
          backgroundColor: '#111827', 
          borderRadius: '16px',
          border: '1px solid #374151',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
        }}
      >
        {/* Cabecera */}
        <div style={{ 
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid #1f2937',
          backgroundColor: '#1f2937',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Clock size={24} color="#f59e0b" />
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#f3f4f6' }}>
                Ventas en Espera (Tickets Pendientes)
              </h2>
              <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
                {tickets.length} ticket(s) en cola de espera
              </span>
            </div>
          </div>

          <button 
            onClick={onCerrar}
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: '#9ca3af', 
              cursor: 'pointer',
              padding: '0.4rem',
              borderRadius: '8px'
            }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div style={{ 
            backgroundColor: 'rgba(239, 68, 68, 0.15)', 
            borderBottom: '1px solid #ef4444', 
            padding: '0.65rem 1.5rem', 
            color: '#f87171',
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
            <div style={{ textAlign: 'center', padding: '3rem 0', color: '#9ca3af' }}>
              <Loader2 size={32} className="spinner" style={{ color: '#f59e0b', margin: '0 auto 0.5rem' }} />
              <p>Consultando tickets en espera...</p>
            </div>
          ) : tickets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#6b7280' }}>
              <Clock size={48} style={{ opacity: 0.3, margin: '0 auto 0.75rem' }} />
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#9ca3af' }}>No hay ventas en espera</h3>
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
                      backgroundColor: '#1f2937',
                      border: esExpandido ? '1px solid #f59e0b' : '1px solid #374151',
                      borderRadius: '10px',
                      overflow: 'hidden',
                      transition: 'border-color 0.2s'
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
                        backgroundColor: esExpandido ? 'rgba(245, 158, 11, 0.08)' : 'transparent'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        <div style={{
                          backgroundColor: '#374151',
                          color: '#f59e0b',
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
                          <div style={{ fontWeight: 700, fontSize: '1rem', color: '#f3f4f6' }}>
                            {t.identificadorCliente}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
                            {t.cantidadArticulos} artículo(s) • Atendió: {t.nombreUsuario}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '0.75rem', color: '#9ca3af', display: 'block' }}>Total</span>
                          <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#38bdf8' }}>
                            ${t.total.toFixed(2)}
                          </span>
                        </div>

                        {esExpandido ? <ChevronUp size={18} color="#9ca3af" /> : <ChevronDown size={18} color="#9ca3af" />}
                      </div>
                    </div>

                    {/* Desglose de partidas si está expandido */}
                    {esExpandido && (
                      <div style={{ 
                        borderTop: '1px solid #374151', 
                        padding: '0.75rem 1.25rem',
                        backgroundColor: '#111827'
                      }}>
                        <div style={{ maxHeight: '130px', overflowY: 'auto', marginBottom: '0.85rem' }}>
                          <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr style={{ color: '#9ca3af', borderBottom: '1px solid #374151' }}>
                                <th style={{ textAlign: 'left', paddingBottom: '0.3rem' }}>Art.</th>
                                <th style={{ textAlign: 'center', paddingBottom: '0.3rem' }}>Cant.</th>
                                <th style={{ textAlign: 'right', paddingBottom: '0.3rem' }}>Precio</th>
                                <th style={{ textAlign: 'right', paddingBottom: '0.3rem' }}>Subtotal</th>
                              </tr>
                            </thead>
                            <tbody>
                              {t.articulos.map((art, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                  <td style={{ padding: '0.3rem 0', color: '#e5e7eb' }}>{art.descripcion}</td>
                                  <td style={{ padding: '0.3rem 0', textAlign: 'center', color: '#9ca3af' }}>{art.cantidad}</td>
                                  <td style={{ padding: '0.3rem 0', textAlign: 'right', color: '#9ca3af' }}>${art.precioUnitario.toFixed(2)}</td>
                                  <td style={{ padding: '0.3rem 0', textAlign: 'right', color: '#38bdf8', fontWeight: 600 }}>${art.subtotal.toFixed(2)}</td>
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
                            style={{
                              padding: '0.45rem 0.85rem',
                              borderRadius: '6px',
                              border: '1px solid #ef4444',
                              backgroundColor: 'transparent',
                              color: '#f87171',
                              fontSize: '0.85rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
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
                            style={{
                              padding: '0.45rem 1.25rem',
                              borderRadius: '6px',
                              border: 'none',
                              backgroundColor: '#10b981',
                              color: '#ffffff',
                              fontSize: '0.85rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)'
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
          backgroundColor: '#1f2937',
          borderTop: '1px solid #374151',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
            Pulsa <strong>Esc</strong> para cerrar
          </span>

          <button
            type="button"
            onClick={onCerrar}
            style={{
              padding: '0.5rem 1.15rem',
              borderRadius: '6px',
              border: '1px solid #4b5563',
              backgroundColor: '#374151',
              color: '#d1d5db',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalTicketsPendientes;
