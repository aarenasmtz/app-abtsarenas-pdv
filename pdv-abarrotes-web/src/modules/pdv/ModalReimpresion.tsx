import React, { useEffect, useState, useCallback } from 'react';
import { History, Search, Printer, X, Loader2, RefreshCw } from 'lucide-react';
import type { VentaResumen, VentaRealizada } from '../ventas/tipos';
import servicioVentas from '../ventas/servicioVentas';

interface PropiedadesModalReimpresion {
  abierto: boolean;
  onCerrar: () => void;
  onSeleccionarParaReimprimir: (venta: VentaRealizada) => void;
}

export const ModalReimpresion: React.FC<PropiedadesModalReimpresion> = ({
  abierto,
  onCerrar,
  onSeleccionarParaReimprimir
}) => {
  const [ventas, setVentas] = useState<VentaResumen[]>([]);
  const [cargando, setCargando] = useState<boolean>(false);
  const [filtroTexto, setFiltroTexto] = useState<string>('');

  const cargarVentas = useCallback(async () => {
    setCargando(true);
    try {
      const res = await servicioVentas.obtenerVentasRecientes({
        pagina: 1,
        registrosPorPagina: 25,
        terminoBusqueda: filtroTexto || undefined
      });
      if (res.exito && res.datos) {
        setVentas(res.datos.elementos);
      }
    } finally {
      setCargando(false);
    }
  }, [filtroTexto]);

  useEffect(() => {
    if (abierto) {
      cargarVentas();
    }
  }, [abierto, cargarVentas]);

  if (!abierto) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 1250 }}>
      <div 
        className="modal-contenido" 
        style={{ 
          maxWidth: '750px', 
          width: '95%', 
          backgroundColor: '#111827', 
          color: '#f9fafb',
          borderRadius: '16px',
          border: '1px solid #374151',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
        }}
      >
        {/* Cabecera */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid #1f2937',
          backgroundColor: '#1f2937'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <History size={22} color="#60a5fa" />
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
              Reimpresión de Tickets Recientes
            </h3>
          </div>

          <button 
            onClick={onCerrar}
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: '#9ca3af', 
              cursor: 'pointer' 
            }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Buscador */}
        <div style={{ padding: '1rem 1.5rem', display: 'flex', gap: '0.75rem', backgroundColor: '#111827' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            <input
              type="text"
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && cargarVentas()}
              placeholder="Buscar por folio o cliente..."
              style={{
                width: '100%',
                padding: '0.65rem 1rem 0.65rem 2.5rem',
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.9rem'
              }}
            />
          </div>

          <button
            onClick={cargarVentas}
            style={{
              padding: '0.65rem 1rem',
              backgroundColor: '#374151',
              border: '1px solid #4b5563',
              borderRadius: '8px',
              color: '#f3f4f6',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <RefreshCw size={16} />
            <span>Buscar</span>
          </button>
        </div>

        {/* Tabla de ventas */}
        <div style={{ maxHeight: '400px', overflowY: 'auto', padding: '0 1.5rem 1.5rem 1.5rem' }}>
          {cargando ? (
            <div style={{ textAlign: 'center', padding: '3rem 0' }}>
              <Loader2 size={32} className="spinner" style={{ color: '#3b82f6' }} />
              <p style={{ marginTop: '0.5rem', color: '#9ca3af' }}>Cargando ventas...</p>
            </div>
          ) : ventas.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem 0' }}>
              No se encontraron ventas recientes registradas.
            </p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #374151', color: '#9ca3af', textAlign: 'left' }}>
                  <th style={{ padding: '0.6rem 0.4rem' }}>Folio</th>
                  <th style={{ padding: '0.6rem 0.4rem' }}>Fecha</th>
                  <th style={{ padding: '0.6rem 0.4rem' }}>Artículos</th>
                  <th style={{ padding: '0.6rem 0.4rem' }}>Total</th>
                  <th style={{ padding: '0.6rem 0.4rem' }}>Estado</th>
                  <th style={{ padding: '0.6rem 0.4rem', textAlign: 'right' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {ventas.map((v) => (
                  <tr key={v.idVenta} style={{ borderBottom: '1px solid #1f2937' }}>
                    <td style={{ padding: '0.75rem 0.4rem', fontWeight: 600, color: '#60a5fa' }}>
                      {v.folioVenta}
                    </td>
                    <td style={{ padding: '0.75rem 0.4rem', color: '#d1d5db', fontSize: '0.85rem' }}>
                      {new Date(v.fechaVenta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ padding: '0.75rem 0.4rem', color: '#d1d5db' }}>
                      {v.numeroArticulos}
                    </td>
                    <td style={{ padding: '0.75rem 0.4rem', fontWeight: 700, color: '#34d399' }}>
                      ${v.total.toFixed(2)}
                    </td>
                    <td style={{ padding: '0.75rem 0.4rem' }}>
                      <span className={`badge ${v.esCancelada ? 'badge-peligro' : 'badge-exito'}`}>
                        {v.esCancelada ? 'Cancelada' : 'Completada'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 0.4rem', textAlign: 'right' }}>
                      <button
                        onClick={() => {
                          onSeleccionarParaReimprimir({
                            idVenta: v.idVenta,
                            folioVenta: v.folioVenta,
                            fechaVenta: v.fechaVenta,
                            subtotal: v.total,
                            descuento: 0,
                            impuesto: 0,
                            total: v.total,
                            importeRecibido: v.total,
                            cambio: 0,
                            numeroArticulos: v.numeroArticulos,
                            nombreCajero: v.nombreCajero,
                            nombreCliente: v.nombreCliente,
                            esReintentoIdempotente: false,
                            tokenIdempotencia: ''
                          });
                        }}
                        style={{
                          padding: '0.4rem 0.75rem',
                          borderRadius: '6px',
                          border: '1px solid #2563eb',
                          backgroundColor: 'rgba(37, 99, 235, 0.15)',
                          color: '#60a5fa',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          fontSize: '0.8rem',
                          fontWeight: 600
                        }}
                      >
                        <Printer size={14} />
                        <span>Reimprimir</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModalReimpresion;
