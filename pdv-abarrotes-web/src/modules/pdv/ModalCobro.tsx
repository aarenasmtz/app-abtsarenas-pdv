import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  DollarSign, 
  CreditCard, 
  ArrowRightLeft, 
  Check, 
  X, 
  Loader2, 
  AlertCircle,
  Delete,
  Layers,
  Plus,
  Trash2
} from 'lucide-react';
import type { ItemVenta, RegistrarVentaPeticion, VentaRealizada, VentaPago, MetodoPagoDto } from '../ventas/tipos';
import servicioVentas from '../ventas/servicioVentas';
import { reproducirBeepExito, reproducirBeepError } from '../../utils/sonidosPdv';

interface PropiedadesModalCobro {
  abierto: boolean;
  total: number;
  subtotal: number;
  descuento: number;
  articulos: ItemVenta[];
  onCerrar: () => void;
  onVentaCompletada: (venta: VentaRealizada) => void;
}

interface PartidaPagoMixto {
  idTemporal: string;
  idMetodoPago: number;
  nombreMetodo: string;
  importe: number;
  referencia?: string;
  esEfectivo: boolean;
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
  // Modo de cobro: 'rapido' (un solo método, flujo ultra veloz) o 'mixto' (múltiples métodos combinados)
  const [modoCobro, setModoCobro] = useState<'rapido' | 'mixto'>('rapido');

  // Estado modo rápido
  const [metodoPagoRapido, setMetodoPagoRapido] = useState<number>(1); // 1: Efectivo, 2: Tarjeta, 5: Transferencia
  const [montoRecibidoTexto, setMontoRecibidoTexto] = useState<string>('');
  const [referenciaRapida, setReferenciaRapida] = useState<string>('');

  // Estado modo mixto
  const [metodosDisponibles, setMetodosDisponibles] = useState<MetodoPagoDto[]>([]);
  const [pagosMixtos, setPagosMixtos] = useState<PartidaPagoMixto[]>([]);
  const [metodoMixtoSeleccionado, setMetodoMixtoSeleccionado] = useState<number>(1);
  const [montoMixtoTexto, setMontoMixtoTexto] = useState<string>('');
  const [referenciaMixta, setReferenciaMixta] = useState<string>('');

  // Estados generales
  const [cargando, setCargando] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenIdempotencia, setTokenIdempotencia] = useState<string>('');

  // Cargar catálogo de métodos de pago activos al montar
  useEffect(() => {
    async function cargarMetodos() {
      try {
        const respuesta = await servicioVentas.obtenerMetodosPago();
        if (respuesta.exito && respuesta.datos && respuesta.datos.length > 0) {
          setMetodosDisponibles(respuesta.datos);
        } else {
          // Defaults estándar
          setMetodosDisponibles([
            { idMetodoPago: 1, codigoMetodo: 'EFECTIVO', descripcion: 'Efectivo', requiereReferencia: false, activo: true },
            { idMetodoPago: 2, codigoMetodo: 'TARJETA', descripcion: 'Tarjeta Débito / Crédito', requiereReferencia: true, activo: true },
            { idMetodoPago: 3, codigoMetodo: 'VALES', descripcion: 'Vales de Despensa', requiereReferencia: true, activo: true },
            { idMetodoPago: 5, codigoMetodo: 'TRANSFERENCIA', descripcion: 'Transferencia Electrónica', requiereReferencia: true, activo: true }
          ]);
        }
      } catch {
        setMetodosDisponibles([
          { idMetodoPago: 1, codigoMetodo: 'EFECTIVO', descripcion: 'Efectivo', requiereReferencia: false, activo: true },
          { idMetodoPago: 2, codigoMetodo: 'TARJETA', descripcion: 'Tarjeta Débito / Crédito', requiereReferencia: true, activo: true },
          { idMetodoPago: 3, codigoMetodo: 'VALES', descripcion: 'Vales de Despensa', requiereReferencia: true, activo: true },
          { idMetodoPago: 5, codigoMetodo: 'TRANSFERENCIA', descripcion: 'Transferencia Electrónica', requiereReferencia: true, activo: true }
        ]);
      }
    }
    if (abierto) {
      cargarMetodos();
    }
  }, [abierto]);

  // Inicializar estado cada vez que se abre el modal
  useEffect(() => {
    if (abierto) {
      setModoCobro('rapido');
      setMetodoPagoRapido(1);
      setMontoRecibidoTexto('');
      setReferenciaRapida('');
      setPagosMixtos([]);
      setMetodoMixtoSeleccionado(1);
      setMontoMixtoTexto('');
      setReferenciaMixta('');
      setError(null);
      setCargando(false);
      setTokenIdempotencia(crypto.randomUUID ? crypto.randomUUID() : `idemp-${Date.now()}`);
    }
  }, [abierto]);

  // Conversión numérica modo rápido
  const montoRecibidoRapido = useMemo(() => {
    const parsed = parseFloat(montoRecibidoTexto);
    return isNaN(parsed) ? 0 : parsed;
  }, [montoRecibidoTexto]);

  const cambioRapido = useMemo(() => {
    if (metodoPagoRapido !== 1) return 0;
    return Math.max(0, montoRecibidoRapido - total);
  }, [montoRecibidoRapido, total, metodoPagoRapido]);

  const saldoFaltanteRapido = useMemo(() => {
    if (metodoPagoRapido !== 1) return 0;
    return Math.max(0, total - montoRecibidoRapido);
  }, [montoRecibidoRapido, total, metodoPagoRapido]);

  // Cálculos modo mixto
  const sumaPagosMixtos = useMemo(() => {
    return pagosMixtos.reduce((acc, p) => acc + p.importe, 0);
  }, [pagosMixtos]);

  const sumaPagosNoEfectivo = useMemo(() => {
    return pagosMixtos.filter(p => !p.esEfectivo).reduce((acc, p) => acc + p.importe, 0);
  }, [pagosMixtos]);

  const sumaPagosEfectivo = useMemo(() => {
    return pagosMixtos.filter(p => p.esEfectivo).reduce((acc, p) => acc + p.importe, 0);
  }, [pagosMixtos]);

  const saldoRestantePorCobrar = useMemo(() => {
    return Math.max(0, Math.round((total - sumaPagosMixtos) * 100) / 100);
  }, [total, sumaPagosMixtos]);

  const cambioMixto = useMemo(() => {
    const remanenteEfectivo = total - sumaPagosNoEfectivo;
    if (remanenteEfectivo <= 0) return 0;
    return Math.max(0, sumaPagosEfectivo - remanenteEfectivo);
  }, [total, sumaPagosNoEfectivo, sumaPagosEfectivo]);

  const porcentajeCubierto = useMemo(() => {
    if (total <= 0) return 100;
    return Math.min(100, Math.round((sumaPagosMixtos / total) * 100));
  }, [sumaPagosMixtos, total]);

  // Validaciones para cobrar
  const esValidoCobrar = useMemo(() => {
    if (cargando) return false;
    if (total <= 0) return false;

    if (modoCobro === 'rapido') {
      if (metodoPagoRapido === 1) {
        return montoRecibidoRapido >= total;
      }
      return true; // Tarjeta o transferencia directa
    } else {
      // Modo mixto
      if (pagosMixtos.length === 0) return false;
      if (sumaPagosNoEfectivo > total) return false;
      return (sumaPagosEfectivo + sumaPagosNoEfectivo) >= total;
    }
  }, [cargando, total, modoCobro, metodoPagoRapido, montoRecibidoRapido, pagosMixtos, sumaPagosNoEfectivo, sumaPagosEfectivo]);

  // Manejo de teclado en pantalla para el input activo
  const agregarDigito = (digito: string) => {
    if (modoCobro === 'rapido') {
      if (digito === '.' && montoRecibidoTexto.includes('.')) return;
      setMontoRecibidoTexto(prev => prev + digito);
    } else {
      if (digito === '.' && montoMixtoTexto.includes('.')) return;
      setMontoMixtoTexto(prev => prev + digito);
    }
  };

  const borrarUltimoDigito = () => {
    if (modoCobro === 'rapido') {
      setMontoRecibidoTexto(prev => prev.slice(0, -1));
    } else {
      setMontoMixtoTexto(prev => prev.slice(0, -1));
    }
  };

  const limpiarMonto = () => {
    if (modoCobro === 'rapido') {
      setMontoRecibidoTexto('');
    } else {
      setMontoMixtoTexto('');
    }
  };

  // Botones de efectivo rápido modo rápido
  const fijarMontoExacto = () => {
    if (modoCobro === 'rapido') {
      setMontoRecibidoTexto(total.toFixed(2));
    } else {
      setMontoMixtoTexto(saldoRestantePorCobrar.toFixed(2));
    }
  };

  const agregarBillete = (valor: number) => {
    if (modoCobro === 'rapido') {
      setMontoRecibidoTexto(valor.toFixed(2));
    } else {
      setMontoMixtoTexto(valor.toFixed(2));
    }
  };

  // Acciones modo mixto
  const handleAgregarPagoMixto = () => {
    const parsed = parseFloat(montoMixtoTexto);
    if (isNaN(parsed) || parsed <= 0) {
      setError('Ingresa un importe válido mayor a $0.00');
      reproducirBeepError();
      return;
    }

    const metodo = metodosDisponibles.find(m => m.idMetodoPago === metodoMixtoSeleccionado) || {
      idMetodoPago: metodoMixtoSeleccionado,
      codigoMetodo: 'OTRO',
      descripcion: 'Otro Método',
      requiereReferencia: false,
      activo: true
    };

    const esEfectivo = metodo.idMetodoPago === 1;

    // Si no es efectivo, validar que no exceda el saldo por cubrir
    if (!esEfectivo) {
      const nuevoNoEfectivo = sumaPagosNoEfectivo + parsed;
      if (nuevoNoEfectivo > total) {
        setError(`Los métodos que no son efectivo no pueden exceder el total de la venta ($${total.toFixed(2)}).`);
        reproducirBeepError();
        return;
      }
    }

    const nuevaPartida: PartidaPagoMixto = {
      idTemporal: `pago-${Date.now()}-${Math.random()}`,
      idMetodoPago: metodo.idMetodoPago,
      nombreMetodo: metodo.descripcion,
      importe: parsed,
      referencia: referenciaMixta.trim() || undefined,
      esEfectivo
    };

    setPagosMixtos(prev => [...prev, nuevaPartida]);
    setMontoMixtoTexto('');
    setReferenciaMixta('');
    setError(null);
  };

  const handleEliminarPagoMixto = (idTemporal: string) => {
    setPagosMixtos(prev => prev.filter(p => p.idTemporal !== idTemporal));
  };

  // Procesar venta
  const handleCobrar = useCallback(async () => {
    if (!esValidoCobrar) return;

    setCargando(true);
    setError(null);

    let pagosEnviar: VentaPago[] = [];
    let importeRecibidoTotal = 0;

    if (modoCobro === 'rapido') {
      const importeFinal = metodoPagoRapido === 1 ? montoRecibidoRapido : total;
      importeRecibidoTotal = importeFinal;
      pagosEnviar = [
        {
          idMetodoPago: metodoPagoRapido,
          importe: total,
          referencia: referenciaRapida || undefined
        }
      ];
    } else {
      // Modo mixto
      importeRecibidoTotal = sumaPagosMixtos;
      pagosEnviar = pagosMixtos.map(p => ({
        idMetodoPago: p.idMetodoPago,
        importe: p.importe,
        referencia: p.referencia
      }));
    }

    const peticion: RegistrarVentaPeticion = {
      tokenIdempotencia,
      idCliente: 1, // Venta en mostrador
      idCaja: 1,
      idTurnoCaja: 1,
      descuentoGlobal: descuento,
      importeRecibido: importeRecibidoTotal,
      notas: modoCobro === 'mixto' ? 'Pago Mixto' : (referenciaRapida ? `Ref: ${referenciaRapida}` : undefined),
      articulos: articulos.map(a => ({
        idProducto: a.idProducto,
        codigoBarras: a.codigoBarras,
        descripcion: a.descripcion,
        cantidad: a.cantidad,
        precioUnitario: a.precioUnitario,
        descuento: a.descuento,
        subtotal: a.subtotal
      })),
      pagos: pagosEnviar
    };

    try {
      const respuesta = await servicioVentas.registrarVenta(peticion);
      if (respuesta.exito && respuesta.datos) {
        reproducirBeepExito();
        onVentaCompletada(respuesta.datos);
      } else {
        reproducirBeepError();
        setError(respuesta.mensaje || 'Ocurrió un error al procesar la venta.');
      }
    } catch (err: unknown) {
      reproducirBeepError();
      const errObj = err as { response?: { data?: { mensaje?: string } }; message?: string };
      setError(errObj?.response?.data?.mensaje || errObj?.message || 'Error de conexión con el servidor.');
    } finally {
      setCargando(false);
    }
  }, [
    esValidoCobrar, 
    modoCobro, 
    metodoPagoRapido, 
    montoRecibidoRapido, 
    total, 
    referenciaRapida, 
    sumaPagosMixtos, 
    pagosMixtos, 
    tokenIdempotencia, 
    descuento, 
    articulos, 
    onVentaCompletada
  ]);

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
          maxWidth: '820px', 
          width: '95%', 
          backgroundColor: '#111827', 
          borderRadius: '16px',
          border: '1px solid #374151',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
        }}
      >
        {/* Cabecera del Modal con Pestañas de Modo de Cobro */}
        <div style={{ 
          padding: '1rem 1.5rem',
          borderBottom: '1px solid #1f2937',
          backgroundColor: '#1f2937',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#f3f4f6' }}>
              Finalizar Venta y Cobro
            </h2>
            <span style={{ fontSize: '0.85rem', color: '#9ca3af' }}>
              {articulos.length} partida(s) • Subtotal: ${subtotal.toFixed(2)}
            </span>
          </div>

          {/* Selector de Modo: Rápido vs Mixto */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <div style={{ 
              display: 'inline-flex', 
              backgroundColor: '#0f172a', 
              borderRadius: '8px', 
              padding: '0.25rem', 
              border: '1px solid #374151' 
            }}>
              <button
                type="button"
                onClick={() => setModoCobro('rapido')}
                style={{
                  padding: '0.45rem 0.9rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: modoCobro === 'rapido' ? '#2563eb' : 'transparent',
                  color: modoCobro === 'rapido' ? '#ffffff' : '#9ca3af',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <DollarSign size={16} />
                <span>Cobro Directo</span>
              </button>

              <button
                type="button"
                onClick={() => setModoCobro('mixto')}
                style={{
                  padding: '0.45rem 0.9rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: modoCobro === 'mixto' ? '#10b981' : 'transparent',
                  color: modoCobro === 'mixto' ? '#ffffff' : '#9ca3af',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <Layers size={16} />
                <span>Pago Mixto</span>
              </button>
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
        </div>

        {/* Mensaje de error flotante */}
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

        {/* Contenido Principal en 2 Columnas */}
        <div style={{ padding: '1.25rem', display: 'grid', gridTemplateColumns: '1.05fr 0.95fr', gap: '1.25rem' }}>
          
          {/* ================= COLUMNA IZQUIERDA ================= */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Total a Pagar Display */}
            <div style={{ 
              backgroundColor: '#0f172a', 
              padding: '1.1rem', 
              borderRadius: '12px', 
              border: '2px solid #2563eb',
              textAlign: 'center' 
            }}>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Total a Pagar
              </span>
              <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#38bdf8', marginTop: '0.2rem' }}>
                ${total.toFixed(2)}
              </div>
            </div>

            {/* VISTA MODO RÁPIDO */}
            {modoCobro === 'rapido' ? (
              <>
                {/* Selector de Método Rápido */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '0.4rem' }}>
                    Forma de Pago
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => setMetodoPagoRapido(1)}
                      style={{
                        padding: '0.7rem 0.4rem',
                        borderRadius: '8px',
                        border: metodoPagoRapido === 1 ? '2px solid #10b981' : '1px solid #374151',
                        backgroundColor: metodoPagoRapido === 1 ? 'rgba(16, 185, 129, 0.15)' : '#1f2937',
                        color: metodoPagoRapido === 1 ? '#34d399' : '#d1d5db',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.35rem',
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
                      onClick={() => setMetodoPagoRapido(2)}
                      style={{
                        padding: '0.7rem 0.4rem',
                        borderRadius: '8px',
                        border: metodoPagoRapido === 2 ? '2px solid #3b82f6' : '1px solid #374151',
                        backgroundColor: metodoPagoRapido === 2 ? 'rgba(59, 130, 246, 0.15)' : '#1f2937',
                        color: metodoPagoRapido === 2 ? '#60a5fa' : '#d1d5db',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.35rem',
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
                      onClick={() => setMetodoPagoRapido(5)}
                      style={{
                        padding: '0.7rem 0.4rem',
                        borderRadius: '8px',
                        border: metodoPagoRapido === 5 ? '2px solid #8b5cf6' : '1px solid #374151',
                        backgroundColor: metodoPagoRapido === 5 ? 'rgba(139, 92, 246, 0.15)' : '#1f2937',
                        color: metodoPagoRapido === 5 ? '#a78bfa' : '#d1d5db',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.35rem',
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
                {metodoPagoRapido !== 1 && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '0.4rem' }}>
                      {metodoPagoRapido === 2 ? 'Últimos 4 dígitos o Autorización' : 'Folio / Referencia'}
                    </label>
                    <input
                      type="text"
                      value={referenciaRapida}
                      onChange={(e) => setReferenciaRapida(e.target.value)}
                      placeholder={metodoPagoRapido === 2 ? 'Ej. 4523' : 'Ej. SPEI-89214'}
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.9rem',
                        borderRadius: '8px',
                        border: '1px solid #374151',
                        backgroundColor: '#1f2937',
                        color: '#fff',
                        fontSize: '0.95rem'
                      }}
                    />
                  </div>
                )}

                {/* Resumen Cambio o Saldo Pendiente */}
                {metodoPagoRapido === 1 && (
                  <div style={{
                    padding: '0.85rem 1rem',
                    borderRadius: '10px',
                    backgroundColor: montoRecibidoRapido >= total ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                    border: `1px solid ${montoRecibidoRapido >= total ? '#059669' : '#dc2626'}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: '#9ca3af', display: 'block' }}>
                        {montoRecibidoRapido >= total ? 'Cambio a entregar:' : 'Faltante por cobrar:'}
                      </span>
                      <strong style={{ 
                        fontSize: '1.5rem', 
                        color: montoRecibidoRapido >= total ? '#34d399' : '#f87171' 
                      }}>
                        ${(montoRecibidoRapido >= total ? cambioRapido : saldoFaltanteRapido).toFixed(2)}
                      </strong>
                    </div>
                    <span style={{ fontSize: '0.85rem', color: '#9ca3af' }}>
                      Recibido: <strong style={{ color: '#fff' }}>${montoRecibidoRapido.toFixed(2)}</strong>
                    </span>
                  </div>
                )}
              </>
            ) : (
              /* VISTA MODO PAGO MIXTO */
              <>
                {/* Barra de progreso de cobertura */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                    <span style={{ color: '#9ca3af' }}>Cubierto: <strong>${sumaPagosMixtos.toFixed(2)}</strong></span>
                    <span style={{ color: saldoRestantePorCobrar === 0 ? '#34d399' : '#f87171', fontWeight: 700 }}>
                      {saldoRestantePorCobrar === 0 ? '✓ 100% Cubierto' : `Faltan: $${saldoRestantePorCobrar.toFixed(2)}`}
                    </span>
                  </div>
                  <div style={{ height: '8px', backgroundColor: '#1f2937', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ 
                      height: '100%', 
                      width: `${porcentajeCubierto}%`, 
                      backgroundColor: saldoRestantePorCobrar === 0 ? '#10b981' : '#f59e0b',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>

                {/* Lista de Pagos Aplicados */}
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '0.4rem' }}>
                    Desglose de Pagos Combinados ({pagosMixtos.length})
                  </label>
                  <div style={{ 
                    backgroundColor: '#1f2937', 
                    borderRadius: '8px', 
                    border: '1px solid #374151',
                    maxHeight: '160px',
                    overflowY: 'auto',
                    padding: '0.4rem'
                  }}>
                    {pagosMixtos.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '1.5rem 0.5rem', color: '#6b7280', fontSize: '0.85rem' }}>
                        No hay pagos agregados. Selecciona un método y agrega importes a la derecha.
                      </div>
                    ) : (
                      pagosMixtos.map((p) => (
                        <div 
                          key={p.idTemporal}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '0.5rem 0.75rem',
                            borderBottom: '1px solid #374151'
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#f3f4f6' }}>
                              {p.nombreMetodo}
                            </div>
                            {p.referencia && (
                              <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                                Ref: {p.referencia}
                              </div>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <span style={{ fontWeight: 700, fontSize: '1rem', color: '#38bdf8' }}>
                              ${p.importe.toFixed(2)}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleEliminarPagoMixto(p.idTemporal)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#ef4444',
                                cursor: 'pointer',
                                padding: '0.2rem'
                              }}
                              title="Eliminar este pago"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Cambio si el efectivo excedió el remanente */}
                {cambioMixto > 0 && (
                  <div style={{
                    padding: '0.65rem 0.9rem',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid #10b981',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ fontSize: '0.85rem', color: '#a7f3d0' }}>Cambio en efectivo:</span>
                    <strong style={{ fontSize: '1.25rem', color: '#34d399' }}>${cambioMixto.toFixed(2)}</strong>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ================= COLUMNA DERECHA ================= */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {/* Input de Monto */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label style={{ fontSize: '0.85rem', color: '#9ca3af' }}>
                  {modoCobro === 'rapido' ? 'Monto Recibido' : 'Importe de este Pago'}
                </label>
                {modoCobro === 'mixto' && saldoRestantePorCobrar > 0 && (
                  <button
                    type="button"
                    onClick={() => setMontoMixtoTexto(saldoRestantePorCobrar.toFixed(2))}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#38bdf8',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    Asignar Restante (${saldoRestantePorCobrar.toFixed(2)})
                  </button>
                )}
              </div>

              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#9ca3af',
                  fontSize: '1.25rem',
                  fontWeight: 600
                }}>$</span>
                <input
                  type="text"
                  readOnly
                  value={modoCobro === 'rapido' ? montoRecibidoTexto : montoMixtoTexto}
                  placeholder="0.00"
                  style={{
                    width: '100%',
                    padding: '0.65rem 1rem',
                    paddingLeft: '32px',
                    fontSize: '1.4rem',
                    fontWeight: 700,
                    borderRadius: '8px',
                    border: '1px solid #374151',
                    backgroundColor: '#1f2937',
                    color: '#f9fafb',
                    textAlign: 'right'
                  }}
                />
              </div>
            </div>

            {/* En Modo Mixto: Selector del método a agregar y referencia */}
            {modoCobro === 'mixto' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.35rem' }}>
                  {metodosDisponibles.map(m => (
                    <button
                      key={m.idMetodoPago}
                      type="button"
                      onClick={() => setMetodoMixtoSeleccionado(m.idMetodoPago)}
                      style={{
                        padding: '0.45rem 0.2rem',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        border: metodoMixtoSeleccionado === m.idMetodoPago ? '2px solid #10b981' : '1px solid #374151',
                        backgroundColor: metodoMixtoSeleccionado === m.idMetodoPago ? 'rgba(16, 185, 129, 0.2)' : '#1f2937',
                        color: metodoMixtoSeleccionado === m.idMetodoPago ? '#34d399' : '#d1d5db',
                        cursor: 'pointer',
                        textAlign: 'center'
                      }}
                    >
                      {m.codigoMetodo}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <input
                    type="text"
                    value={referenciaMixta}
                    onChange={(e) => setReferenciaMixta(e.target.value)}
                    placeholder="Ref/Autorización (opcional)"
                    style={{
                      flex: 1,
                      padding: '0.5rem 0.75rem',
                      borderRadius: '6px',
                      border: '1px solid #374151',
                      backgroundColor: '#1f2937',
                      color: '#fff',
                      fontSize: '0.85rem'
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAgregarPagoMixto}
                    style={{
                      padding: '0.5rem 0.9rem',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: '#10b981',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem'
                    }}
                  >
                    <Plus size={16} />
                    <span>Agregar</span>
                  </button>
                </div>
              </div>
            )}

            {/* Billetes rápidos */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.35rem' }}>
              {[
                { etiqueta: 'Exacto', accion: fijarMontoExacto },
                { etiqueta: '$50', valor: 50 },
                { etiqueta: '$100', valor: 100 },
                { etiqueta: '$200', valor: 200 },
                { etiqueta: '$500', valor: 500 },
              ].map((btn, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => btn.accion ? btn.accion() : agregarBillete(btn.valor!)}
                  style={{
                    padding: '0.45rem 0.2rem',
                    borderRadius: '6px',
                    border: '1px solid #374151',
                    backgroundColor: '#1f2937',
                    color: '#e5e7eb',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  {btn.etiqueta}
                </button>
              ))}
            </div>

            {/* Teclado Numérico */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.35rem' }}>
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '.'].map((tecla) => (
                <button
                  key={tecla}
                  type="button"
                  onClick={() => {
                    if (tecla === 'C') limpiarMonto();
                    else agregarDigito(tecla);
                  }}
                  style={{
                    padding: '0.65rem 0',
                    borderRadius: '8px',
                    border: '1px solid #374151',
                    backgroundColor: tecla === 'C' ? '#374151' : '#1f2937',
                    color: tecla === 'C' ? '#f87171' : '#f9fafb',
                    fontSize: '1.15rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {tecla}
                </button>
              ))}
            </div>

            {/* Botón Borrar 1 Carácter */}
            <button
              type="button"
              onClick={borrarUltimoDigito}
              style={{
                padding: '0.45rem',
                borderRadius: '6px',
                border: '1px solid #374151',
                backgroundColor: '#1f2937',
                color: '#9ca3af',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <Delete size={16} />
              <span>Borrar Dígito</span>
            </button>
          </div>
        </div>

        {/* Pie del Modal con Botones de Acción */}
        <div style={{
          padding: '1rem 1.5rem',
          backgroundColor: '#1f2937',
          borderTop: '1px solid #374151',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
            <span>Atajos: </span>
            <strong>Enter:</strong> Cobrar • <strong>Esc:</strong> Cancelar
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={onCerrar}
              disabled={cargando}
              style={{
                padding: '0.65rem 1.25rem',
                borderRadius: '8px',
                border: '1px solid #4b5563',
                backgroundColor: '#374151',
                color: '#d1d5db',
                fontWeight: 600,
                fontSize: '0.95rem',
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
                padding: '0.65rem 1.75rem',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: esValidoCobrar && !cargando ? '#10b981' : '#4b5563',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '1rem',
                cursor: esValidoCobrar && !cargando ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: esValidoCobrar && !cargando ? '0 4px 14px rgba(16, 185, 129, 0.4)' : 'none'
              }}
            >
              {cargando ? (
                <>
                  <Loader2 size={18} className="spinner" />
                  <span>Procesando...</span>
                </>
              ) : (
                <>
                  <Check size={18} />
                  <span>{modoCobro === 'mixto' ? 'Confirmar Pago Mixto (Enter)' : 'Confirmar Cobro (Enter)'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalCobro;
