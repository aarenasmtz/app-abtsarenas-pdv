import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Scale, Check, X } from 'lucide-react';
import type { ProductoCobroDto } from '../productos/tipos';

interface PropiedadesModalPesajeGranel {
  abierto: boolean;
  producto: ProductoCobroDto | null;
  onConfirmarPeso: (producto: ProductoCobroDto, pesoKg: number) => void;
  onCerrar: () => void;
}

export const ModalPesajeGranel: React.FC<PropiedadesModalPesajeGranel> = ({
  abierto,
  producto,
  onConfirmarPeso,
  onCerrar
}) => {
  const [pesoTexto, setPesoTexto] = useState<string>('0.500');

  useEffect(() => {
    if (abierto && producto) {
      setPesoTexto(
        producto.cantidadSugerida && producto.cantidadSugerida > 0
          ? producto.cantidadSugerida.toFixed(3)
          : '0.500'
      );
    }
  }, [abierto, producto]);

  const pesoKg = useMemo(() => {
    const parsed = parseFloat(pesoTexto);
    return isNaN(parsed) || parsed < 0 ? 0 : parsed;
  }, [pesoTexto]);

  const subtotalCalculado = useMemo(() => {
    if (!producto) return 0;
    return Math.round(pesoKg * producto.precioVenta * 100) / 100;
  }, [pesoKg, producto]);

  const handleConfirmar = useCallback(() => {
    if (pesoKg <= 0 || !producto) return;
    onConfirmarPeso(producto, pesoKg);
  }, [pesoKg, producto, onConfirmarPeso]);

  // Atajos de teclado (Enter para confirmar, Esc para cancelar)
  useEffect(() => {
    if (!abierto) return;

    const manejarTecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCerrar();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (pesoKg > 0) {
          handleConfirmar();
        }
      }
    };

    window.addEventListener('keydown', manejarTecla);
    return () => window.removeEventListener('keydown', manejarTecla);
  }, [abierto, pesoKg, onCerrar, handleConfirmar]);

  if (!abierto || !producto) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 1250 }}>
      <div 
        className="modal-contenido" 
        style={{ 
          maxWidth: '480px', 
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
            <Scale size={24} color="#34d399" />
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>
                Pesaje de Producto a Granel
              </h3>
              <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
                Ingresa el peso o selecciona una porción
              </span>
            </div>
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
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Ficha del Producto */}
          <div style={{
            padding: '1rem',
            backgroundColor: '#1f2937',
            borderRadius: '10px',
            border: '1px solid #374151'
          }}>
            <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#f3f4f6' }}>
              {producto.descripcion}
            </h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.4rem' }}>
              <span style={{ fontSize: '0.85rem', color: '#9ca3af' }}>
                Código: <strong className="mono">{producto.codigoBarras}</strong>
              </span>
              <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#38bdf8' }}>
                ${producto.precioVenta.toFixed(2)} / kg
              </span>
            </div>
          </div>

          {/* Botones de Porciones Rápidas */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '0.5rem' }}>
              Porciones Frecuentes
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
              {[
                { etiqueta: '¼ kg', valor: '0.250' },
                { etiqueta: '½ kg', valor: '0.500' },
                { etiqueta: '¾ kg', valor: '0.750' },
                { etiqueta: '1.0 kg', valor: '1.000' },
              ].map(por => (
                <button
                  key={por.valor}
                  type="button"
                  onClick={() => setPesoTexto(por.valor)}
                  style={{
                    padding: '0.6rem 0.25rem',
                    borderRadius: '8px',
                    border: pesoTexto === por.valor ? '2px solid #10b981' : '1px solid #374151',
                    backgroundColor: pesoTexto === por.valor ? 'rgba(16, 185, 129, 0.15)' : '#1f2937',
                    color: pesoTexto === por.valor ? '#34d399' : '#d1d5db',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    cursor: 'pointer'
                  }}
                >
                  {por.etiqueta}
                </button>
              ))}
            </div>
          </div>

          {/* Input de Peso Exacto */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '0.4rem' }}>
              Peso Registrado (Kilogramos)
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={pesoTexto}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9.]/g, '');
                  setPesoTexto(val);
                }}
                placeholder="0.000"
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  paddingRight: '3.5rem',
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  textAlign: 'right',
                  borderRadius: '8px',
                  border: '2px solid #10b981',
                  backgroundColor: '#1f2937',
                  color: '#34d399'
                }}
                autoFocus
              />
              <span style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#9ca3af',
                fontWeight: 700,
                fontSize: '1rem'
              }}>
                kg
              </span>
            </div>
          </div>

          {/* Subtotal a Cobrar */}
          <div style={{
            padding: '1rem',
            borderRadius: '10px',
            backgroundColor: '#0f172a',
            border: '1px solid #1e293b',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: '0.9rem', color: '#9ca3af' }}>Subtotal de la partida:</span>
            <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#38bdf8' }}>
              ${subtotalCalculado.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Botones de Acción */}
        <div style={{
          padding: '1rem 1.5rem',
          backgroundColor: '#1f2937',
          borderTop: '1px solid #374151',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '0.75rem'
        }}>
          <button
            type="button"
            onClick={onCerrar}
            style={{
              padding: '0.65rem 1.25rem',
              borderRadius: '8px',
              border: '1px solid #4b5563',
              backgroundColor: '#374151',
              color: '#d1d5db',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Cancelar (Esc)
          </button>

          <button
            type="button"
            onClick={handleConfirmar}
            disabled={pesoKg <= 0}
            style={{
              padding: '0.65rem 1.5rem',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: pesoKg > 0 ? '#10b981' : '#4b5563',
              color: '#ffffff',
              fontWeight: 700,
              cursor: pesoKg > 0 ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: pesoKg > 0 ? '0 4px 12px rgba(16, 185, 129, 0.4)' : 'none'
            }}
          >
            <Check size={18} />
            <span>Agregar Partida (Enter)</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalPesajeGranel;
