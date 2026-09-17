import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  DollarSign, 
  CreditCard, 
  ArrowRightLeft, 
  Check, 
  X, 
  Loader2, 
  AlertCircle,
  Delete
} from 'lucide-react';
import type { ItemVenta, RegistrarVentaPeticion, VentaRealizada } from '../ventas/tipos';
import servicioVentas from '../ventas/servicioVentas';

interface PropiedadesModalCobro {
  abierto: boolean;
  total: number;
  subtotal: number;
  descuento: number;
  articulos: ItemVenta[];
  onCerrar: () => void;
  onVentaCompletada: (venta: VentaRealizada) => void;
}

export const ModalCobro: React.FC<PropiedadesModalCobro> = ({
  abierto,
  total,
  subtotal,
  descuento,
  articulos,
  onCerrar,
  onVentaCompletada
}) => {
  const [metodoPago, setMetodoPago] = useState<number>(1); // 1: Efectivo, 2: Tarjeta, 5: Transferencia
  const [montoRecibidoTexto, setMontoRecibidoTexto] = useState<string>('');
  const [referencia, setReferencia] = useState<string>('');
  const [cargando, setCargando] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenIdempotencia, setTokenIdempotencia] = useState<string>('');

  // Inicializar estado cada vez que se abre el modal
  useEffect(() => {
    if (abierto) {
      setMetodoPago(1);
      setMontoRecibidoTexto('');
      setReferencia('');
      setError(null);
      setCargando(false);
      // Generar token UUID único para blindar contra cobros dobles
      setTokenIdempotencia(crypto.randomUUID ? crypto.randomUUID() : `idemp-${Date.now()}`);
    }
  }, [abierto]);

  // Convertir texto ingresado a número
  const montoRecibido = useMemo(() => {
    const parsed = parseFloat(montoRecibidoTexto);
    return isNaN(parsed) ? 0 : parsed;
  }, [montoRecibidoTexto]);

  // Calcular cambio o saldo pendiente
  const cambio = useMemo(() => {
    if (metodoPago !== 1) return 0; // En tarjeta/transferencia se cobra el monto exacto
    return Math.max(0, montoRecibido - total);
  }, [montoRecibido, total, metodoPago]);

  const saldoFaltante = useMemo(() => {
    if (metodoPago !== 1) return 0;
    return Math.max(0, total - montoRecibido);
  }, [montoRecibido, total, metodoPago]);

  const esValidoCobrar = useMemo(() => {
    if (cargando) return false;
    if (total <= 0) return false;
    if (metodoPago === 1) {
      return montoRecibido >= total;
    }
    return true; // Tarjeta o transferencia
  }, [cargando, total, metodoPago, montoRecibido]);

  // Manejar teclado en pantalla
  const agregarDigito = (digito: string) => {
    if (digito === '.' && montoRecibidoTexto.includes('.')) return;
    setMontoRecibidoTexto(prev => prev + digito);
  };

  const borrarUltimoDigito = () => {
    setMontoRecibidoTexto(prev => prev.slice(0, -1));
  };

  const limpiarMonto = () => {
    setMontoRecibidoTexto('');
  };

  // Botones de efectivo rápido
  const fijarMontoExacto = () => {
    setMontoRecibidoTexto(total.toFixed(2));
  };

  const agregarBillete = (valor: number) => {
    setMontoRecibidoTexto(valor.toFixed(2));
  };

  // Procesar venta
  const handleCobrar = useCallback(async () => {
    if (!esValidoCobrar) return;

    setCargando(true);
    setError(null);

    const importeFinal = metodoPago === 1 ? montoRecibido : total;

    const peticion: RegistrarVentaPeticion = {
      tokenIdempotencia,
      idCliente: 1, // Venta en mostrador / Público en General
      idCaja: 1,
      idTurnoCaja: 1,
      descuentoGlobal: descuento,
      importeRecibido: importeFinal,
      notas: referencia ? `Ref: ${referencia}` : undefined,
      articulos: articulos.map(a => ({
        idProducto: a.idProducto,
        codigoBarras: a.codigoBarras,
        descripcion: a.descripcion,
        cantidad: a.cantidad,
        precioUnitario: a.precioUnitario,
        descuento: a.descuento,
        subtotal: a.subtotal
      })),
      pagos: [
        {
          idMetodoPago: metodoPago,
          importe: total,
          referencia: referencia || undefined
        }
      ]
    };

    try {
      const respuesta = await servicioVentas.registrarVenta(peticion);
      if (respuesta.exito && respuesta.datos) {
        onVentaCompletada(respuesta.datos);
      } else {
        setError(respuesta.mensaje || 'Ocurrió un error al procesar la venta.');
      }
    } catch (err: unknown) {
      const errObj = err as { response?: { data?: { mensaje?: string } }; message?: string };
      setError(errObj?.response?.data?.mensaje || errObj?.message || 'Error de conexión con el servidor.');
    } finally {
      setCargando(false);
    }
  }, [esValidoCobrar, metodoPago, montoRecibido, total, tokenIdempotencia, descuento, referencia, articulos, onVentaCompletada]);

  // Manejo de atajos de teclado (Enter para cobrar, Esc para cerrar)
  useEffect(() => {
    if (!abierto) return;

    const manejarTecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCerrar();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (esValidoCobrar) {
          handleCobrar();
        }
      }
    };

    window.addEventListener('keydown', manejarTecla);
    return () => window.removeEventListener('keydown', manejarTecla);
  }, [abierto, esValidoCobrar, onCerrar, handleCobrar]);

  if (!abierto) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 1200 }}>
      <div 
        className="modal-contenido" 
        style={{ 
          maxWidth: '750px', 
          width: '95%', 
          backgroundColor: '#111827', 
          borderRadius: '16px',
          border: '1px solid #374151',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
        }}
      >
        {/* Cabecera del Modal */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid #1f2937',
          backgroundColor: '#1f2937'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 700, color: '#f3f4f6' }}>
              Finalizar Venta
            </h2>
            <span style={{ fontSize: '0.85rem', color: '#9ca3af' }}>
              {articulos.length} partida(s) • Subtotal: ${subtotal.toFixed(2)}
            </span>
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
            <X size={24} />
          </button>
        </div>

        <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {/* Columna Izquierda: Métodos de Pago y Total */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Total Gigante a Pagar */}
            <div style={{ 
              backgroundColor: '#0f172a', 
              padding: '1.25rem', 
              borderRadius: '12px', 
              border: '2px solid #2563eb',
              textAlign: 'center' 
            }}>
              <span style={{ fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Total a Pagar
              </span>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#38bdf8', marginTop: '0.25rem' }}>
                ${total.toFixed(2)}
              </div>
            </div>

            {/* Selector de Método de Pago */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '0.5rem' }}>
                Método de Pago
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setMetodoPago(1)}
                  style={{
                    padding: '0.75rem 0.5rem',
                    borderRadius: '8px',
                    border: metodoPago === 1 ? '2px solid #10b981' : '1px solid #374151',
                    backgroundColor: metodoPago === 1 ? 'rgba(16, 185, 129, 0.15)' : '#1f2937',
                    color: metodoPago === 1 ? '#34d399' : '#d1d5db',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.4rem',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.85rem'
                  }}
                >
                  <DollarSign size={20} />
                  <span>Efectivo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMetodoPago(2)}
                  style={{
                    padding: '0.75rem 0.5rem',
                    borderRadius: '8px',
                    border: metodoPago === 2 ? '2px solid #3b82f6' : '1px solid #374151',
                    backgroundColor: metodoPago === 2 ? 'rgba(59, 130, 246, 0.15)' : '#1f2937',
                    color: metodoPago === 2 ? '#60a5fa' : '#d1d5db',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.4rem',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.85rem'
                  }}
                >
                  <CreditCard size={20} />
                  <span>Tarjeta</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMetodoPago(5)}
                  style={{
                    padding: '0.75rem 0.5rem',
                    borderRadius: '8px',
                    border: metodoPago === 5 ? '2px solid #8b5cf6' : '1px solid #374151',
                    backgroundColor: metodoPago === 5 ? 'rgba(139, 92, 246, 0.15)' : '#1f2937',
                    color: metodoPago === 5 ? '#a78bfa' : '#d1d5db',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.4rem',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.85rem'
                  }}
                >
                  <ArrowRightLeft size={20} />
                  <span>Transf.</span>
                </button>
              </div>
            </div>

            {/* Referencia si es tarjeta o transferencia */}
            {metodoPago !== 1 && (
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '0.4rem' }}>
                  {metodoPago === 2 ? 'Últimos 4 dígitos o Autorización' : 'Folio de Transferencia'}
                </label>
                <input
                  type="text"
                  value={referencia}
                  onChange={(e) => setReferencia(e.target.value)}
                  placeholder={metodoPago === 2 ? 'Ej. 4523' : 'Ej. SPEI-89214'}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid #374151',
                    backgroundColor: '#1f2937',
                    color: '#fff',
                    fontSize: '1rem'
                  }}
                  autoFocus
                />
              </div>
            )}

            {/* Panel de Cambio en Efectivo */}
            {metodoPago === 1 && (
              <div style={{
                padding: '1rem',
                borderRadius: '10px',
                backgroundColor: montoRecibido >= total ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                border: `1px solid ${montoRecibido >= total ? '#059669' : '#dc2626'}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: '#9ca3af', display: 'block' }}>
                    {montoRecibido >= total ? 'CAMBIO A ENTREGAR' : 'FALTANTE POR COBRAR'}
                  </span>
                  <span style={{ 
                    fontSize: '1.6rem', 
                    fontWeight: 800, 
                    color: montoRecibido >= total ? '#34d399' : '#f87171' 
                  }}>
                    ${montoRecibido >= total ? cambio.toFixed(2) : saldoFaltante.toFixed(2)}
                  </span>
                </div>

                <div style={{ textAlign: 'right', fontSize: '0.85rem', color: '#9ca3af' }}>
                  <span>Recibido: </span>
                  <strong style={{ color: '#f3f4f6' }}>${montoRecibido.toFixed(2)}</strong>
                </div>
              </div>
            )}

            {error && (
              <div style={{
                padding: '0.75rem 1rem',
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid #ef4444',
                borderRadius: '8px',
                color: '#fca5a5',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Columna Derecha: Teclado Numérico y Denominaciones de Efectivo */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Input de Monto Recibido */}
            {metodoPago === 1 ? (
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '0.4rem' }}>
                  Monto Recibido en Efectivo ($)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={montoRecibidoTexto}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9.]/g, '');
                      setMontoRecibidoTexto(val);
                    }}
                    placeholder="0.00"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      paddingRight: '3rem',
                      fontSize: '1.4rem',
                      fontWeight: 700,
                      textAlign: 'right',
                      borderRadius: '8px',
                      border: '2px solid #3b82f6',
                      backgroundColor: '#1f2937',
                      color: '#60a5fa'
                    }}
                    autoFocus
                  />
                  {montoRecibidoTexto && (
                    <button
                      type="button"
                      onClick={limpiarMonto}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        color: '#9ca3af',
                        cursor: 'pointer'
                      }}
                    >
                      <X size={20} />
                    </button>
                  )}
                </div>

                {/* Botones de Denominaciones Rápidas */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={fijarMontoExacto}
                    style={{
                      padding: '0.5rem 0.25rem',
                      borderRadius: '6px',
                      border: '1px solid #10b981',
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                      color: '#34d399',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Exacto
                  </button>
                  {[50, 100, 200, 500].map(billete => (
                    <button
                      key={billete}
                      type="button"
                      onClick={() => agregarBillete(billete)}
                      style={{
                        padding: '0.5rem 0.25rem',
                        borderRadius: '6px',
                        border: '1px solid #374151',
                        backgroundColor: '#1f2937',
                        color: '#d1d5db',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      ${billete}
                    </button>
                  ))}
                </div>

                {/* Teclado Numérico Táctil */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(3, 1fr)', 
                  gap: '0.4rem', 
                  marginTop: '0.75rem' 
                }}>
                  {['7', '8', '9', '4', '5', '6', '1', '2', '3', '0', '00', '.'].map(tecla => (
                    <button
                      key={tecla}
                      type="button"
                      onClick={() => agregarDigito(tecla)}
                      style={{
                        padding: '0.85rem',
                        borderRadius: '8px',
                        border: '1px solid #374151',
                        backgroundColor: '#1f2937',
                        color: '#f9fafb',
                        fontSize: '1.2rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'background-color 0.1s'
                      }}
                      onMouseDown={(e) => e.currentTarget.style.backgroundColor = '#374151'}
                      onMouseUp={(e) => e.currentTarget.style.backgroundColor = '#1f2937'}
                    >
                      {tecla}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={borrarUltimoDigito}
                    style={{
                      gridColumn: 'span 3',
                      padding: '0.7rem',
                      borderRadius: '8px',
                      border: '1px solid #374151',
                      backgroundColor: '#374151',
                      color: '#9ca3af',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    <Delete size={18} />
                    <span>Borrar</span>
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'center', 
                alignItems: 'center',
                backgroundColor: '#1f2937',
                borderRadius: '12px',
                padding: '2rem',
                textAlign: 'center'
              }}>
                <div style={{ 
                  padding: '1.25rem', 
                  borderRadius: '50%', 
                  backgroundColor: 'rgba(59, 130, 246, 0.1)', 
                  color: '#60a5fa',
                  marginBottom: '1rem'
                }}>
                  {metodoPago === 2 ? <CreditCard size={48} /> : <ArrowRightLeft size={48} />}
                </div>
                <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#f3f4f6' }}>
                  {metodoPago === 2 ? 'Cobro con Tarjeta' : 'Transferencia Electrónica'}
                </h4>
                <p style={{ color: '#9ca3af', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                  Solicite al cliente ingresar su tarjeta en la terminal bancaria o realizar la transferencia por ${total.toFixed(2)}.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Botones de Acción */}
        <div style={{ 
          padding: '1.25rem 1.5rem', 
          borderTop: '1px solid #1f2937', 
          display: 'flex', 
          justifyContent: 'flex-end', 
          gap: '1rem',
          backgroundColor: '#1f2937'
        }}>
          <button
            type="button"
            onClick={onCerrar}
            disabled={cargando}
            style={{
              padding: '0.75rem 1.5rem',
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
            onClick={handleCobrar}
            disabled={!esValidoCobrar || cargando}
            style={{
              padding: '0.75rem 2rem',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: esValidoCobrar ? '#10b981' : '#4b5563',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '1rem',
              cursor: esValidoCobrar ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              boxShadow: esValidoCobrar ? '0 4px 14px 0 rgba(16, 185, 129, 0.4)' : 'none'
            }}
          >
            {cargando ? (
              <>
                <Loader2 size={20} className="spinner" />
                <span>Procesando Venta...</span>
              </>
            ) : (
              <>
                <Check size={20} />
                <span>Cobrar Ticket (Enter)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalCobro;
