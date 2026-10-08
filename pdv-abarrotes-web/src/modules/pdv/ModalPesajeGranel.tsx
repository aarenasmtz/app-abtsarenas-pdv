import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Scale, Check, X } from 'lucide-react';
import type { ProductoCobroDto } from '../productos/tipos';

interface PropiedadesModalPesajeGranel {
  abierto: boolean;
  producto: ProductoCobroDto | null;
  onConfirmarPeso: (producto: ProductoCobroDto, pesoKg: number, subtotalExacto?: number) => void;
  onCerrar: () => void;
}

export const ModalPesajeGranel: React.FC<PropiedadesModalPesajeGranel> = ({
  abierto,
  producto,
  onConfirmarPeso,
  onCerrar
}) => {
  const [pesoTexto, setPesoTexto] = useState<string>('0.500');
  const [importeTexto, setImporteTexto] = useState<string>('0.00');
  const [modoIngreso, setModoIngreso] = useState<'peso' | 'importe'>('peso');
  const inputPesoRef = useRef<HTMLInputElement>(null);

  // Inicializar al abrir
  useEffect(() => {
    if (abierto && producto) {
      setModoIngreso('peso');
      const pesoInicial = producto.cantidadSugerida && producto.cantidadSugerida > 0
        ? producto.cantidadSugerida
        : 0.500;
      setPesoTexto(pesoInicial.toFixed(3));
      const sub = Math.round(pesoInicial * producto.precioVenta * 100) / 100;
      setImporteTexto(sub.toFixed(2));

      setTimeout(() => {
        inputPesoRef.current?.focus();
        inputPesoRef.current?.select();
      }, 100);
    }
  }, [abierto, producto]);

  // Manejar cambio directo en Kilogramos
  const handleCambioPeso = (valorStr: string) => {
    setModoIngreso('peso');
    setPesoTexto(valorStr);
    const p = parseFloat(valorStr);
    if (!isNaN(p) && p >= 0 && producto) {
      const imp = Math.round(p * producto.precioVenta * 100) / 100;
      setImporteTexto(imp.toFixed(2));
    } else {
      setImporteTexto('0.00');
    }
  };

  // Manejar cambio directo en Dinero / Importe ($)
  // Ej: Quieren $100 de queso a $165/kg -> peso = 100 / 165 = 0.606 kg, subtotal exacto = $100.00
  const handleCambioImporte = (valorStr: string) => {
    setModoIngreso('importe');
    setImporteTexto(valorStr);
    const imp = parseFloat(valorStr);
    if (!isNaN(imp) && imp >= 0 && producto && producto.precioVenta > 0) {
      const p = Math.round((imp / producto.precioVenta) * 1000) / 1000;
      setPesoTexto(p.toFixed(3));
    } else {
      setPesoTexto('0.000');
    }
  };

  const seleccionarPorcion = (kg: number) => {
    if (!producto) return;
    setModoIngreso('peso');
    setPesoTexto(kg.toFixed(3));
    const imp = Math.round(kg * producto.precioVenta * 100) / 100;
    setImporteTexto(imp.toFixed(2));
  };

  const seleccionarImporte = (dinero: number) => {
    if (!producto || producto.precioVenta <= 0) return;
    setModoIngreso('importe');
    setImporteTexto(dinero.toFixed(2));
    const kg = Math.round((dinero / producto.precioVenta) * 1000) / 1000;
    setPesoTexto(kg.toFixed(3));
  };

  const pesoNumerico = parseFloat(pesoTexto) || 0;
  const subtotalNumerico = parseFloat(importeTexto) || 0;

  const handleConfirmar = useCallback(() => {
    if (pesoNumerico <= 0 || !producto) return;
    const subtotalFijo = modoIngreso === 'importe' && subtotalNumerico > 0 ? subtotalNumerico : undefined;
    onConfirmarPeso(producto, pesoNumerico, subtotalFijo);
  }, [pesoNumerico, subtotalNumerico, modoIngreso, producto, onConfirmarPeso]);

  // Atajos de teclado (Enter para confirmar, Esc para cancelar)
  useEffect(() => {
    if (!abierto) return;

    const manejarTecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCerrar();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (pesoNumerico > 0) {
          handleConfirmar();
        }
      }
    };

    window.addEventListener('keydown', manejarTecla);
    return () => window.removeEventListener('keydown', manejarTecla);
  }, [abierto, pesoNumerico, onCerrar, handleConfirmar]);

  if (!abierto || !producto) return null;

  return (
    <div className="modal-overlay">
      <div 
        className="modal-contenido" 
        style={{ 
          maxWidth: '520px', 
          width: '95%', 
          backgroundColor: '#ffffff', 
          borderRadius: '18px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.25)',
          overflow: 'hidden'
        }}
      >
        {/* Cabecera Luminosa */}
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
              backgroundColor: '#ecfdf5',
              color: '#059669',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Scale size={24} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                Pesaje de Producto a Granel
              </h3>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Ingresa por peso (kg) o por importe en dinero ($)
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

        {/* Cuerpo del Modal */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Tarjeta del Producto */}
          <div style={{
            padding: '1rem 1.25rem',
            backgroundColor: '#f8fafc',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.15rem', color: '#0f172a' }}>
                {producto.descripcion}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.2rem' }}>
                Código: <strong className="mono" style={{ color: '#059669' }}>{producto.codigoBarras}</strong>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Precio x Kilo</div>
              <div className="mono" style={{ fontSize: '1.35rem', fontWeight: 800, color: '#2563eb' }}>
                ${producto.precioVenta.toFixed(2)} / kg
              </div>
            </div>
          </div>

          {/* Doble Campo: Peso (kg) y Total en Dinero ($) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {/* Campo 1: Kilogramos */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                ⚖️ Peso (Kg / Gramos)
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  ref={inputPesoRef}
                  type="number"
                  step="0.005"
                  min="0.001"
                  value={pesoTexto}
                  onChange={(e) => handleCambioPeso(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 2.5rem 0.75rem 1rem',
                    fontSize: '1.6rem',
                    fontWeight: 800,
                    fontFamily: 'var(--fuente-numerica)',
                    border: '2px solid #059669',
                    borderRadius: '12px',
                    backgroundColor: '#f0fdf4',
                    color: '#047857'
                  }}
                />
                <span style={{ position: 'absolute', right: '12px', top: '14px', fontSize: '0.9rem', fontWeight: 700, color: '#059669' }}>
                  kg
                </span>
              </div>
            </div>

            {/* Campo 2: Dinero Total ($) */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                💵 Total en Dinero ($)
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '10px', fontSize: '1.4rem', fontWeight: 800, color: '#2563eb' }}>
                  $
                </span>
                <input
                  type="number"
                  step="0.50"
                  min="0.10"
                  value={importeTexto}
                  onChange={(e) => handleCambioImporte(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem 0.75rem 2.25rem',
                    fontSize: '1.6rem',
                    fontWeight: 800,
                    fontFamily: 'var(--fuente-numerica)',
                    border: '2px solid #2563eb',
                    borderRadius: '12px',
                    backgroundColor: '#eff6ff',
                    color: '#1d4ed8'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Botones de Porciones Frecuentes */}
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '0.4rem' }}>
              Porciones por Peso Frecuentes:
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
              {[
                { label: '¼ kg (250g)', valor: 0.250 },
                { label: '½ kg (500g)', valor: 0.500 },
                { label: '¾ kg (750g)', valor: 0.750 },
                { label: '1.0 kg (1000g)', valor: 1.000 },
              ].map((p) => {
                const activo = Math.abs(pesoNumerico - p.valor) < 0.001;
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => seleccionarPorcion(p.valor)}
                    className="btn"
                    style={{
                      padding: '0.6rem 0.4rem',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      backgroundColor: activo ? '#ecfdf5' : '#f8fafc',
                      color: activo ? '#059669' : '#475569',
                      border: activo ? '2px solid #059669' : '1px solid #e2e8f0',
                      borderRadius: '10px',
                      cursor: 'pointer'
                    }}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Botones de Importes en Dinero Frecuentes */}
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '0.4rem' }}>
              Pedir por Dinero Exacto:
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
              {[10, 20, 50, 100].map((monto) => {
                const activo = Math.abs(subtotalNumerico - monto) < 0.01;
                return (
                  <button
                    key={monto}
                    type="button"
                    onClick={() => seleccionarImporte(monto)}
                    className="btn"
                    style={{
                      padding: '0.55rem',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      backgroundColor: activo ? '#eff6ff' : '#f8fafc',
                      color: activo ? '#2563eb' : '#475569',
                      border: activo ? '2px solid #2563eb' : '1px solid #e2e8f0',
                      borderRadius: '10px',
                      cursor: 'pointer'
                    }}
                  >
                    ${monto}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subtotal a Cobrar */}
          <div style={{
            padding: '1rem 1.25rem',
            backgroundColor: '#f8fafc',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#475569' }}>
              Subtotal de la partida a registrar:
            </span>
            <span className="mono" style={{ fontSize: '1.75rem', fontWeight: 800, color: '#059669' }}>
              ${subtotalNumerico.toFixed(2)}
            </span>
          </div>

          {/* Botones de Acción */}
          <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.25rem' }}>
            <button
              type="button"
              onClick={onCerrar}
              className="btn btn-secundario"
              style={{ flex: 1, padding: '0.85rem' }}
            >
              Cancelar (Esc)
            </button>
            <button
              type="button"
              onClick={handleConfirmar}
              disabled={pesoNumerico <= 0}
              className="btn btn-primario"
              style={{ flex: 2, padding: '0.85rem', fontSize: '1.05rem', gap: '0.5rem' }}
            >
              <Check size={20} />
              <span>Agregar Partida (Enter)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalPesajeGranel;
