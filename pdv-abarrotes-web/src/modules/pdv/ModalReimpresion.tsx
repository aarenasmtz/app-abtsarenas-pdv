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

  // Atajo de teclado: Esc para cerrar
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

  const handleSeleccionar = (v: VentaResumen) => {
    const ventaAdaptada: VentaRealizada = {
      idVenta: v.idVenta,
      folioVenta: v.folioVenta,
      fechaVenta: v.fechaVenta,
      subtotal: v.total,
      descuento: 0,
      impuesto: 0,
      total: v.total,
      importeRecibido: v.total,
      cambio: 0,
      numeroArticulos: 0,
      nombreCajero: v.nombreCajero,
      nombreCliente: v.nombreCliente || 'Público General',
      esReintentoIdempotente: false,
      tokenIdempotencia: ''
    };
    onSeleccionarParaReimprimir(ventaAdaptada);
    onCerrar();
  };

  if (!abierto) return null;

  return (
    <div className="modal-overlay">
      <div 
        className="modal-contenido" 
        style={{ 
          maxWidth: '750px', 
          width: '95%', 
          backgroundColor: '#ffffff', 
          color: '#0f172a',
          borderRadius: '18px',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.25)'
        }}
      >
        {/* Cabecera */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid #e2e8f0',
          backgroundColor: '#f8fafc'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              padding: '0.5rem',
              backgroundColor: '#eff6ff',
              color: '#2563eb',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <History size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                Reimpresión de Tickets Recientes
              </h3>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Consulta y vuelve a imprimir ventas anteriores
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

        {/* Buscador */}
        <div style={{ padding: '1rem 1.5rem', display: 'flex', gap: '0.75rem', backgroundColor: '#ffffff' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              type="text"
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && cargarVentas()}
              placeholder="Buscar por folio o cliente..."
              style={{
                width: '100%',
                padding: '0.65rem 1rem 0.65rem 2.5rem',
                backgroundColor: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '10px',
                color: '#0f172a',
                fontSize: '0.95rem'
              }}
            />
          </div>

          <button
            onClick={cargarVentas}
            className="btn btn-primario"
            style={{ padding: '0.65rem 1.25rem', gap: '0.4rem' }}
          >
            <RefreshCw size={16} />
            <span>Buscar</span>
          </button>
        </div>

        {/* Tabla de ventas */}
        <div style={{ maxHeight: '400px', overflowY: 'auto', padding: '0 1.5rem 1.5rem 1.5rem' }}>
          {cargando ? (
            <div style={{ textAlign: 'center', padding: '3rem 0' }}>
              <Loader2 size={32} className="spinner" style={{ color: '#2563eb' }} />
              <p style={{ marginTop: '0.5rem', color: '#64748b' }}>Cargando ventas...</p>
            </div>
          ) : ventas.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#64748b', padding: '2rem 0' }}>
              No se encontraron ventas recientes registradas.
            </p>
          ) : (
            <table className="tabla-datos" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '0.75rem' }}>Folio</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem' }}>Fecha y Hora</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem' }}>Cliente</th>
                  <th style={{ textAlign: 'right', padding: '0.75rem' }}>Total</th>
                  <th style={{ textAlign: 'center', padding: '0.75rem' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {ventas.map((v) => (
                  <tr key={v.idVenta} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td className="mono" style={{ padding: '0.75rem', fontWeight: 700, color: '#059669' }}>
                      #{v.folioVenta}
                    </td>
                    <td style={{ padding: '0.75rem', color: '#64748b' }}>
                      {new Date(v.fechaVenta).toLocaleString()}
                    </td>
                    <td style={{ padding: '0.75rem', fontWeight: 500 }}>
                      {v.nombreCliente || 'Público General'}
                    </td>
                    <td className="mono" style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                      ${v.total.toFixed(2)}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      <button
                        onClick={() => handleSeleccionar(v)}
                        className="btn btn-secundario"
                        style={{
                          padding: '0.4rem 0.85rem',
                          fontSize: '0.85rem',
                          gap: '0.35rem'
                        }}
                      >
                        <Printer size={15} />
                        <span>Ver Ticket</span>
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
