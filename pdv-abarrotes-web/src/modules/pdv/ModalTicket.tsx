import React, { useEffect, useState, useRef } from 'react';
import { Printer, CheckCircle, ArrowRight, Loader2, X } from 'lucide-react';
import type { VentaRealizada, TicketVenta } from '../ventas/tipos';
import servicioVentas from '../ventas/servicioVentas';

interface PropiedadesModalTicket {
  abierto: boolean;
  venta: VentaRealizada | null;
  onNuevaVenta: () => void;
  onCerrar: () => void;
}

export const ModalTicket: React.FC<PropiedadesModalTicket> = ({
  abierto,
  venta,
  onNuevaVenta,
  onCerrar
}) => {
  const [ticket, setTicket] = useState<TicketVenta | null>(null);
  const [cargando, setCargando] = useState<boolean>(true);
  const ticketRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (abierto && venta) {
      setCargando(true);
      servicioVentas.obtenerTicket(venta.idVenta)
        .then(res => {
          if (res.exito && res.datos) {
            setTicket(res.datos);
          }
        })
        .finally(() => setCargando(false));
    } else {
      setTicket(null);
    }
  }, [abierto, venta]);

  // Manejo de atajo Enter para Nueva Venta
  useEffect(() => {
    if (!abierto) return;

    const manejarTecla = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onNuevaVenta();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onCerrar();
      }
    };

    window.addEventListener('keydown', manejarTecla);
    return () => window.removeEventListener('keydown', manejarTecla);
  }, [abierto, onNuevaVenta, onCerrar]);

  const handleImprimir = () => {
    window.print();
  };

  if (!abierto || !venta) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 1300 }}>
      <div 
        className="modal-contenido" 
        style={{ 
          maxWidth: '420px', 
          width: '95%', 
          backgroundColor: '#ffffff', 
          color: '#111827',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
        }}
      >
        {/* Barra superior de éxito */}
        <div style={{
          backgroundColor: '#10b981',
          color: '#ffffff',
          padding: '1rem',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.4rem',
          position: 'relative'
        }}>
          <button 
            onClick={onCerrar}
            style={{
              position: 'absolute',
              right: '12px',
              top: '12px',
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer'
            }}
          >
            <X size={20} />
          </button>
          <CheckCircle size={32} />
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>¡Venta Completada!</h3>
          <span style={{ fontSize: '0.85rem', opacity: 0.9 }}>Folio: {venta.folioVenta}</span>
        </div>

        {/* Formato de Ticket Térmico 80mm */}
        <div 
          ref={ticketRef} 
          className="area-impresion-ticket"
          style={{ 
            padding: '1.5rem', 
            fontFamily: '"Courier New", Courier, monospace',
            fontSize: '0.85rem',
            lineHeight: '1.35',
            backgroundColor: '#ffffff',
            color: '#000000',
            maxHeight: '420px',
            overflowY: 'auto'
          }}
        >
          {cargando ? (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <Loader2 size={32} className="spinner" style={{ color: '#10b981' }} />
              <p style={{ marginTop: '0.5rem', color: '#6b7280' }}>Cargando comprobante...</p>
            </div>
          ) : ticket ? (
            <>
              {/* Encabezado */}
              <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <div style={{ fontWeight: 'bold', fontSize: '1.15rem' }}>{ticket.nombreNegocio}</div>
                <div>{ticket.direccionNegocio}</div>
                {ticket.telefonoNegocio && <div>Tel: {ticket.telefonoNegocio}</div>}
                <div>RFC: {ticket.rfcNegocio}</div>
                <div style={{ borderTop: '1px dashed #000', margin: '0.5rem 0' }}></div>
                <div>FOLIO: <strong>{ticket.folioVenta}</strong></div>
                <div>FECHA: {new Date(ticket.fechaVenta).toLocaleString()}</div>
                <div>CAJERO: {ticket.nombreCajero}</div>
                <div>CAJA: {ticket.caja}</div>
                <div>CLIENTE: {ticket.nombreCliente}</div>
              </div>

              <div style={{ borderTop: '1px dashed #000', margin: '0.5rem 0' }}></div>

              {/* Partidas */}
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px dashed #000' }}>
                    <th style={{ paddingBottom: '0.25rem' }}>CANT</th>
                    <th style={{ paddingBottom: '0.25rem' }}>DESCRIPCIÓN</th>
                    <th style={{ paddingBottom: '0.25rem', textAlign: 'right' }}>TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {ticket.articulos.map((art, idx) => (
                    <tr key={idx}>
                      <td style={{ verticalAlign: 'top', paddingTop: '0.25rem' }}>{art.cantidad}</td>
                      <td style={{ verticalAlign: 'top', paddingTop: '0.25rem' }}>
                        <div>{art.descripcion}</div>
                        <div style={{ fontSize: '0.75rem', color: '#4b5563' }}>@ ${art.precioUnitario.toFixed(2)}</div>
                      </td>
                      <td style={{ verticalAlign: 'top', textAlign: 'right', paddingTop: '0.25rem', fontWeight: 600 }}>
                        ${art.importe.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ borderTop: '1px dashed #000', margin: '0.5rem 0' }}></div>

              {/* Totales */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                <span>Subtotal:</span>
                <span>${ticket.subtotal.toFixed(2)}</span>
              </div>

              {ticket.descuento > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem', color: '#dc2626' }}>
                  <span>Descuento:</span>
                  <span>-${ticket.descuento.toFixed(2)}</span>
                </div>
              )}

              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                fontWeight: 'bold', 
                fontSize: '1.2rem',
                borderTop: '1px solid #000',
                borderBottom: '1px solid #000',
                padding: '0.35rem 0',
                margin: '0.4rem 0'
              }}>
                <span>TOTAL:</span>
                <span>${ticket.total.toFixed(2)}</span>
              </div>

              {/* Formas de Pago */}
              <div style={{ margin: '0.5rem 0' }}>
                {ticket.pagos.map((p, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Pago ({p.metodoPago}):</span>
                    <span>${p.importe.toFixed(2)}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Recibido:</span>
                  <span>${ticket.importeRecibido.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1rem', marginTop: '0.2rem' }}>
                  <span>CAMBIO:</span>
                  <span>${ticket.cambio.toFixed(2)}</span>
                </div>
              </div>

              <div style={{ borderTop: '1px dashed #000', margin: '0.75rem 0' }}></div>

              {/* Pie de ticket */}
              <div style={{ textAlign: 'center', fontSize: '0.8rem', color: '#4b5563' }}>
                <div>Artículos vendidos: {ticket.totalArticulos}</div>
                <div style={{ marginTop: '0.5rem', fontWeight: 600 }}>{ticket.mensajeAgradecimiento}</div>
                <div style={{ marginTop: '0.35rem', fontSize: '0.7rem' }}>{ticket.leyendaFiscal}</div>
              </div>
            </>
          ) : (
            <p style={{ textAlign: 'center', color: '#ef4444' }}>No se pudo cargar la información del ticket.</p>
          )}
        </div>

        {/* Botones de acción inferiores */}
        <div style={{ 
          padding: '1rem', 
          backgroundColor: '#f3f4f6', 
          borderTop: '1px solid #e5e7eb',
          display: 'flex', 
          gap: '0.75rem' 
        }}>
          <button
            type="button"
            onClick={handleImprimir}
            style={{
              flex: 1,
              padding: '0.75rem',
              borderRadius: '8px',
              border: '1px solid #d1d5db',
              backgroundColor: '#ffffff',
              color: '#374151',
              fontWeight: 600,
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              cursor: 'pointer'
            }}
          >
            <Printer size={18} />
            <span>Imprimir Ticket</span>
          </button>

          <button
            type="button"
            onClick={onNuevaVenta}
            style={{
              flex: 1.2,
              padding: '0.75rem',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#10b981',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              boxShadow: '0 4px 10px rgba(16, 185, 129, 0.3)'
            }}
            autoFocus
          >
            <span>Nueva Venta (Enter)</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalTicket;
