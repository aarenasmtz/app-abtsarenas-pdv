import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  X, 
  Tag, 
  Package, 
  ShoppingCart, 
  AlertCircle, 
  Barcode, 
  Scale, 
  HelpCircle
} from 'lucide-react';
import { servicioProductos } from '../productos/servicioProductos';
import type { ProductoCobroDto } from '../productos/tipos';
import { reproducirBeepExito, reproducirBeepError } from '../../utils/sonidosPdv';

export interface PropiedadesModalVerificadorPrecio {
  abierto: boolean;
  onCerrar: () => void;
  onAgregarAlCarrito?: (producto: ProductoCobroDto) => void;
}

export const ModalVerificadorPrecio: React.FC<PropiedadesModalVerificadorPrecio> = ({
  abierto,
  onCerrar,
  onAgregarAlCarrito
}) => {
  const [codigoBusqueda, setCodigoBusqueda] = useState<string>('');
  const [productoEncontrado, setProductoEncontrado] = useState<ProductoCobroDto | null>(null);
  const [cargando, setCargando] = useState<boolean>(false);
  const [errorBusqueda, setErrorBusqueda] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-foco inmediato al abrir
  useEffect(() => {
    if (abierto) {
      setCodigoBusqueda('');
      setProductoEncontrado(null);
      setErrorBusqueda(null);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 100);
    }
  }, [abierto]);

  // Manejo de atajos: Esc para cerrar, Enter para agregar si ya está consultado
  useEffect(() => {
    if (!abierto) return;

    const manejarTeclas = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCerrar();
      }
    };

    window.addEventListener('keydown', manejarTeclas);
    return () => window.removeEventListener('keydown', manejarTeclas);
  }, [abierto, onCerrar]);

  const consultarProducto = async (codigo: string) => {
    const valor = codigo.trim();
    if (!valor) return;

    setCargando(true);
    setErrorBusqueda(null);

    try {
      // 1. Intentar por código de barras exacto
      const prod = await servicioProductos.buscarPorCodigoBarras(valor);
      if (prod) {
        setProductoEncontrado(prod);
        reproducirBeepExito();
        return;
      }
    } catch {
      // 2. Si no es exacto, probar búsqueda por nombre/sku predictiva
      try {
        const resultados = await servicioProductos.buscarPdv(valor, 5);
        if (resultados.length > 0) {
          const primero = resultados[0];
          setProductoEncontrado({
            idProducto: primero.idProducto,
            codigoBarras: primero.codigoBarras,
            codigoProducto: primero.codigoBarras,
            descripcion: primero.descripcion,
            precioVenta: primero.precioVenta,
            precioMayoreo: primero.precioVenta,
            permiteVentaFraccionada: primero.permiteVentaFraccionada,
            manejaInventario: true,
            existenciaActual: primero.existenciaActual,
            categoria: primero.categoria
          });
          reproducirBeepExito();
          return;
        }
      } catch {}
    } finally {
      setCargando(false);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 80);
    }

    // No encontrado
    reproducirBeepError();
    setProductoEncontrado(null);
    setErrorBusqueda(`No se encontró ningún producto con código o nombre "${valor}".`);
  };

  const manejarEnvio = (e: React.FormEvent) => {
    e.preventDefault();
    consultarProducto(codigoBusqueda);
  };

  const handleAgregarVenta = () => {
    if (!productoEncontrado || !onAgregarAlCarrito) return;
    onAgregarAlCarrito(productoEncontrado);
    onCerrar();
  };

  if (!abierto) return null;

  return (
    <div className="modal-fondo">
      <div 
        className="modal-contenido"
        style={{
          maxWidth: '650px',
          width: '95%',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.3)',
          border: '1px solid #e2e8f0',
          overflow: 'hidden'
        }}
      >
        {/* Cabecera Estilo Verificador con Azul/Índigo */}
        <div style={{
          padding: '1.25rem 1.75rem',
          backgroundColor: '#1e1b4b',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              backgroundColor: '#4338ca',
              padding: '0.6rem',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Tag size={24} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>
                  Verificador de Precios
                </h2>
                <span style={{
                  fontSize: '0.75rem',
                  backgroundColor: '#4338ca',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '6px',
                  fontWeight: 700
                }}>
                  F9
                </span>
              </div>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: '#c7d2fe' }}>
                Consulta rápida de precios y existencias sin modificar la venta en curso
              </p>
            </div>
          </div>

          <button
            onClick={onCerrar}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              color: '#ffffff',
              borderRadius: '8px',
              padding: '0.4rem',
              cursor: 'pointer',
              display: 'flex'
            }}
            title="Cerrar (Esc)"
          >
            <X size={20} />
          </button>
        </div>

        {/* Barra de Entrada / Escáner */}
        <div style={{ padding: '1.5rem', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          <form onSubmit={manejarEnvio} style={{ display: 'flex', gap: '0.75rem' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Barcode 
                size={22} 
                style={{ 
                  position: 'absolute', 
                  left: '14px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  color: '#6366f1' 
                }} 
              />
              <input
                ref={inputRef}
                type="text"
                value={codigoBusqueda}
                onChange={(e) => setCodigoBusqueda(e.target.value)}
                placeholder="Escanea el código de barras o escribe nombre / código..."
                style={{
                  width: '100%',
                  padding: '0.85rem 1rem 0.85rem 2.85rem',
                  fontSize: '1.1rem',
                  borderRadius: '10px',
                  border: '2px solid #6366f1',
                  backgroundColor: '#ffffff',
                  outline: 'none',
                  fontWeight: 600,
                  color: '#0f172a',
                  boxShadow: '0 2px 8px rgba(99, 102, 241, 0.12)'
                }}
              />
            </div>
            <button
              type="submit"
              disabled={cargando || !codigoBusqueda.trim()}
              className="btn btn-primario"
              style={{
                padding: '0.85rem 1.5rem',
                fontSize: '1rem',
                fontWeight: 700,
                backgroundColor: '#4f46e5',
                borderColor: '#4f46e5',
                gap: '0.4rem'
              }}
            >
              <Search size={18} />
              <span>{cargando ? 'Buscando...' : 'Consultar'}</span>
            </button>
          </form>
        </div>

        {/* Contenido / Resultado */}
        <div style={{ padding: '1.5rem', minHeight: '260px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {errorBusqueda && (
            <div style={{
              padding: '1.25rem',
              backgroundColor: '#fef2f2',
              borderRadius: '12px',
              border: '1px solid #fecaca',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              color: '#991b1b'
            }}>
              <AlertCircle size={28} color="#dc2626" />
              <div>
                <strong style={{ fontSize: '1rem' }}>Producto no encontrado</strong>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem' }}>{errorBusqueda}</p>
              </div>
            </div>
          )}

          {!productoEncontrado && !errorBusqueda && (
            <div style={{ textAlign: 'center', color: '#64748b', padding: '2rem 1rem' }}>
              <HelpCircle size={56} style={{ color: '#cbd5e1', margin: '0 auto 1rem' }} />
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#334155', fontWeight: 700 }}>
                Pasa el lector sobre cualquier producto
              </h3>
              <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem' }}>
                Verás el precio al público, existencia en inventario y precio de mayoreo al instante.
              </p>
            </div>
          )}

          {productoEncontrado && (
            <div style={{
              border: '2px solid #10b981',
              borderRadius: '16px',
              backgroundColor: '#ecfdf5',
              padding: '1.5rem',
              boxShadow: '0 8px 20px -4px rgba(16, 185, 129, 0.2)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ flex: 1, minWidth: '240px' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{
                      backgroundColor: '#d1fae5',
                      color: '#065f46',
                      padding: '0.25rem 0.65rem',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem'
                    }}>
                      <Package size={13} />
                      {productoEncontrado.categoria || 'Abarrotes'}
                    </span>

                    {productoEncontrado.permiteVentaFraccionada && (
                      <span style={{
                        backgroundColor: '#e0e7ff',
                        color: '#3730a3',
                        padding: '0.25rem 0.65rem',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}>
                        <Scale size={13} />
                        Venta a Granel (Kg)
                      </span>
                    )}

                    <span style={{
                      backgroundColor: '#f1f5f9',
                      color: '#475569',
                      padding: '0.25rem 0.65rem',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontFamily: 'monospace',
                      fontWeight: 700
                    }}>
                      Cód: {productoEncontrado.codigoBarras}
                    </span>
                  </div>

                  <h3 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.3 }}>
                    {productoEncontrado.descripcion}
                  </h3>

                  <div style={{ marginTop: '0.75rem', display: 'flex', gap: '1rem', color: '#475569', fontSize: '0.9rem' }}>
                    <div>
                      Existencia: <strong style={{ color: '#0f172a' }}>{productoEncontrado.existenciaActual} {productoEncontrado.permiteVentaFraccionada ? 'kg' : 'pzas'}</strong>
                    </div>
                    {productoEncontrado.precioMayoreo && productoEncontrado.precioMayoreo < productoEncontrado.precioVenta && (
                      <div>
                        Mayoreo: <strong style={{ color: '#2563eb' }}>${productoEncontrado.precioMayoreo.toFixed(2)}</strong>
                      </div>
                    )}
                  </div>
                </div>

                {/* Precio Gigante de Alta Visibilidad */}
                <div style={{
                  textAlign: 'right',
                  backgroundColor: '#ffffff',
                  padding: '1rem 1.5rem',
                  borderRadius: '12px',
                  border: '1px solid #a7f3d0',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.04)'
                }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#059669', textTransform: 'uppercase' }}>
                    Precio al Público
                  </div>
                  <div style={{
                    fontSize: '2.5rem',
                    fontWeight: 900,
                    color: '#065f46',
                    fontFamily: 'var(--fuente-numerica)'
                  }}>
                    ${productoEncontrado.precioVenta.toFixed(2)}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    por {productoEncontrado.permiteVentaFraccionada ? 'kilogramo' : 'pieza'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Pie con Acciones */}
        <div style={{
          padding: '1.25rem 1.75rem',
          backgroundColor: '#f8fafc',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <button
            type="button"
            onClick={onCerrar}
            className="btn btn-secundario"
            style={{ padding: '0.75rem 1.25rem' }}
          >
            Cerrar (Esc)
          </button>

          {productoEncontrado && onAgregarAlCarrito && (
            <button
              type="button"
              onClick={handleAgregarVenta}
              className="btn btn-primario"
              style={{
                padding: '0.85rem 1.75rem',
                fontSize: '1rem',
                fontWeight: 800,
                backgroundColor: '#059669',
                borderColor: '#059669',
                gap: '0.5rem',
                boxShadow: '0 4px 14px rgba(5, 150, 105, 0.35)'
              }}
            >
              <ShoppingCart size={18} />
              <span>+ Agregar a la Venta Actual</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModalVerificadorPrecio;
