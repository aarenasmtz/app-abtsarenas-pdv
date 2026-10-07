import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  X, 
  DollarSign, 
  CreditCard, 
  Layers, 
  Trash2, 
  CheckCircle,
  AlertCircle,
  ArrowRightLeft,
  Printer
} from 'lucide-react';
import type { ItemVenta, RegistrarVentaPeticion, VentaRealizada, VentaPago, MetodoPagoDto } from '../ventas/tipos';
import servicioVentas from '../ventas/servicioVentas';
import { reproducirBeepExito, reproducirBeepError } from '../../utils/sonidosPdv';

export interface PropiedadesModalCobro {
  abierto: boolean;
  total: number;
  subtotal: number;
  descuento: number;
  articulos: ItemVenta[];
  idCaja?: number;
  idTurnoCaja?: number;
  modoInicial?: 'efectivo' | 'tarjeta' | 'mixto';
  onCerrar: () => void;
  onVentaCompletada: (venta: VentaRealizada, imprimirTicket?: boolean) => void;
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
  subtotal: _subtotal,
  articulos,
  idCaja = 1,
  idTurnoCaja = 1,
  modoInicial = 'efectivo',
  onCerrar,
  onVentaCompletada
}) => {
  // Modo de cobro: 'rapido' (un solo método: Efectivo o Tarjeta) o 'mixto' (múltiples métodos)
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
  const [imprimirTicketSeleccionado, setImprimirTicketSeleccionado] = useState<boolean>(false);

  // Referencia para auto-foco y selección de texto
  const inputMontoRef = useRef<HTMLInputElement>(null);

  // Cargar catálogo de métodos de pago activos al montar
  useEffect(() => {
    async function cargarMetodos() {
      try {
        const respuesta = await servicioVentas.obtenerMetodosPago();
        if (respuesta.exito && respuesta.datos && respuesta.datos.length > 0) {
          setMetodosDisponibles(respuesta.datos);
        } else {
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

  // Inicializar estado cada vez que se abre el modal con pre-carga automática del total
  useEffect(() => {
    if (abierto) {
      setError(null);
      setCargando(false);
      setImprimirTicketSeleccionado(false);
      setTokenIdempotencia(crypto.randomUUID ? crypto.randomUUID() : `idemp-${Date.now()}`);

      if (modoInicial === 'tarjeta') {
        setModoCobro('rapido');
        setMetodoPagoRapido(2); // Tarjeta
        setMontoRecibidoTexto(total.toFixed(2));
      } else if (modoInicial === 'mixto') {
        setModoCobro('mixto');
        setPagosMixtos([]);
        setMetodoMixtoSeleccionado(1);
        setMontoMixtoTexto(total.toFixed(2));
      } else {
        // Por defecto: Cobro Efectivo ultra rápido
        setModoCobro('rapido');
        setMetodoPagoRapido(1); // Efectivo
        // Pre-cargar en automático el total exacto en billete
        setMontoRecibidoTexto(total.toFixed(2));
      }

      setReferenciaRapida('');
      setReferenciaMixta('');

      // Auto-seleccionar el texto del input para sobreescribir al instante con el teclado
      setTimeout(() => {
        if (inputMontoRef.current) {
          inputMontoRef.current.focus();
          inputMontoRef.current.select();
        }
      }, 60);
    }
  }, [abierto, modoInicial, total]);

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

  // Billetes de acceso rápido en un clic
  const handleEstablecerMonto = (monto: number) => {
    setMontoRecibidoTexto(monto.toFixed(2));
    if (inputMontoRef.current) {
      inputMontoRef.current.focus();
      inputMontoRef.current.select();
    }
  };

  // Agregar partida en pago mixto
  const handleAgregarPagoMixto = () => {
    setError(null);
    const monto = parseFloat(montoMixtoTexto);
    if (isNaN(monto) || monto <= 0) {
      setError('Ingresa un importe válido mayor a $0.');
      return;
    }

    const metodo = metodosDisponibles.find(m => m.idMetodoPago === metodoMixtoSeleccionado);
    const esEfectivo = metodo?.codigoMetodo === 'EFECTIVO' || metodoMixtoSeleccionado === 1;

    if (!esEfectivo && monto > saldoRestantePorCobrar) {
      setError(`Los pagos con tarjeta/vales ($${monto.toFixed(2)}) no pueden superar el saldo pendiente ($${saldoRestantePorCobrar.toFixed(2)}).`);
      return;
    }

    const nuevaPartida: PartidaPagoMixto = {
      idTemporal: `pm-${Date.now()}-${Math.random()}`,
      idMetodoPago: metodoMixtoSeleccionado,
      nombreMetodo: metodo?.descripcion || `Método #${metodoMixtoSeleccionado}`,
      importe: monto,
      referencia: referenciaMixta.trim() || undefined,
      esEfectivo
    };

    setPagosMixtos(prev => [...prev, nuevaPartida]);
    setReferenciaMixta('');

    const nuevoSaldo = Math.max(0, saldoRestantePorCobrar - monto);
    setMontoMixtoTexto(nuevoSaldo > 0 ? nuevoSaldo.toFixed(2) : '');
  };

  const handleEliminarPagoMixto = (idTemporal: string) => {
    setPagosMixtos(prev => prev.filter(p => p.idTemporal !== idTemporal));
  };

  // Procesar cobro definitivo (imprimirTicket = false por defecto al dar Enter)
  const handleConfirmarCobro = async (imprimirTicket: boolean = false) => {
    setError(null);

    if (articulos.length === 0) {
      setError('No hay artículos para cobrar.');
      return;
    }

    let desglosePagos: VentaPago[] = [];
    let importeRecibidoFinal = 0;

    if (modoCobro === 'rapido') {
      if (metodoPagoRapido === 1) {
        if (montoRecibidoRapido < total) {
          setError(`Efectivo insuficiente. Faltan $${(total - montoRecibidoRapido).toFixed(2)}.`);
          reproducirBeepError();
          return;
        }
        desglosePagos = [{
          idMetodoPago: 1,
          importe: total,
          referencia: 'Efectivo'
        }];
        importeRecibidoFinal = montoRecibidoRapido;
      } else {
        desglosePagos = [{
          idMetodoPago: metodoPagoRapido,
          importe: total,
          referencia: referenciaRapida.trim() || (metodoPagoRapido === 2 ? 'Tarjeta' : 'Transferencia')
        }];
        importeRecibidoFinal = total;
      }
    } else {
      // Modo mixto
      if (saldoRestantePorCobrar > 0) {
        setError(`Aún faltan $${saldoRestantePorCobrar.toFixed(2)} por cubrir.`);
        reproducirBeepError();
        return;
      }

      desglosePagos = pagosMixtos.map(p => ({
        idMetodoPago: p.idMetodoPago,
        importe: p.importe,
        referencia: p.referencia
      }));
      importeRecibidoFinal = sumaPagosMixtos;
    }

    try {
      setCargando(true);

      const peticion: RegistrarVentaPeticion = {
        idCaja,
        idTurnoCaja,
        idCliente: 1,
        descuentoGlobal: 0,
        importeRecibido: importeRecibidoFinal,
        articulos,
        pagos: desglosePagos,
        tokenIdempotencia,
        notas: modoCobro === 'rapido' 
          ? (metodoPagoRapido === 1 ? 'Venta mostrador Efectivo' : 'Venta mostrador Tarjeta')
          : 'Venta mostrador Pago Mixto'
      };

      const resultado = await servicioVentas.registrarVenta(peticion);

      if (resultado.exito && resultado.datos) {
        reproducirBeepExito();
        onVentaCompletada(resultado.datos, imprimirTicket);
        onCerrar();
      } else {
        reproducirBeepError();
        setError(resultado.mensaje || 'Error al procesar la venta.');
      }
    } catch (err: unknown) {
      reproducirBeepError();
      const mensaje = err instanceof Error ? err.message : 'Error inesperado al conectar con el servidor.';
      setError(mensaje);
    } finally {
      setCargando(false);
    }
  };

  // Atajos de teclado dentro del modal (Enter para cobrar, Escape para cerrar)
  useEffect(() => {
    if (!abierto) return;

    const manejarTeclasModal = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCerrar();
      } else if (e.key === 'Enter') {
        // Al dar Enter se finaliza el cobro de inmediato.
        // Solo abrirá modal de ticket si se marcó explícitamente con el cursor.
        if (!cargando) {
          e.preventDefault();
          handleConfirmarCobro(imprimirTicketSeleccionado);
        }
      }
    };

    window.addEventListener('keydown', manejarTeclasModal);
    return () => window.removeEventListener('keydown', manejarTeclasModal);
  }, [abierto, cargando, modoCobro, montoRecibidoRapido, total, saldoRestantePorCobrar, pagosMixtos, imprimirTicketSeleccionado]);

  if (!abierto) return null;

  return (
    <div className="modal-fondo">
      <div 
        className="modal-contenido"
        style={{ 
          maxWidth: '680px', 
          width: '95%',
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.25)',
          border: '1px solid #e2e8f0',
          overflow: 'hidden'
        }}
      >
        {/* Cabecera Luminosa */}
        <div style={{ 
          padding: '1.25rem 1.75rem',
          borderBottom: '1px solid #e2e8f0',
          backgroundColor: '#f8fafc',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
              Finalizar Venta y Cobro
            </h2>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
              {articulos.length} artículo(s) • Total a pagar: <strong>${total.toFixed(2)}</strong>
            </span>
          </div>

          {/* Selector de Pestañas: Cobro Rápido vs Pago Mixto */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <div style={{ 
              display: 'inline-flex', 
              backgroundColor: '#f1f5f9', 
              borderRadius: '10px', 
              padding: '0.25rem', 
              border: '1px solid #e2e8f0' 
            }}>
              <button
                type="button"
                onClick={() => setModoCobro('rapido')}
                style={{
                  padding: '0.45rem 0.9rem',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: modoCobro === 'rapido' ? '#ffffff' : 'transparent',
                  color: modoCobro === 'rapido' ? '#059669' : '#64748b',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  boxShadow: modoCobro === 'rapido' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
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
                  fontWeight: 700,
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: modoCobro === 'mixto' ? '#ffffff' : 'transparent',
                  color: modoCobro === 'mixto' ? '#2563eb' : '#64748b',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  boxShadow: modoCobro === 'mixto' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
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
                color: '#94a3b8', 
                cursor: 'pointer',
                padding: '0.4rem',
                borderRadius: '8px'
              }}
              title="Cerrar ventana (Esc)"
            >
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Alerta de Error */}
        {error && (
          <div style={{ 
            backgroundColor: '#fef2f2', 
            borderBottom: '1px solid #fee2e2', 
            padding: '0.75rem 1.75rem', 
            color: '#dc2626',
            fontSize: '0.875rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* CUERPO DEL MODAL */}
        <div style={{ padding: '1.75rem' }}>
          {modoCobro === 'rapido' ? (
            /* =================================================================
               MODO COBRO DIRECTO ULTRA RÁPIDO (EFECTIVO O TARJETA)
               ================================================================= */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Selector de Método Directo */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    setMetodoPagoRapido(1);
                    setMontoRecibidoTexto(total.toFixed(2));
                    setTimeout(() => inputMontoRef.current?.select(), 50);
                  }}
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: '12px',
                    border: metodoPagoRapido === 1 ? '2px solid #059669' : '1px solid #e2e8f0',
                    backgroundColor: metodoPagoRapido === 1 ? '#ecfdf5' : '#ffffff',
                    color: metodoPagoRapido === 1 ? '#065f46' : '#475569',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.6rem',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '1rem',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <DollarSign size={20} color={metodoPagoRapido === 1 ? '#059669' : '#64748b'} />
                  <span>💵 Efectivo</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMetodoPagoRapido(2);
                    setMontoRecibidoTexto(total.toFixed(2));
                  }}
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: '12px',
                    border: metodoPagoRapido === 2 ? '2px solid #2563eb' : '1px solid #e2e8f0',
                    backgroundColor: metodoPagoRapido === 2 ? '#eff6ff' : '#ffffff',
                    color: metodoPagoRapido === 2 ? '#1e40af' : '#475569',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.6rem',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '1rem',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <CreditCard size={20} color={metodoPagoRapido === 2 ? '#2563eb' : '#64748b'} />
                  <span>💳 Tarjeta</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMetodoPagoRapido(5);
                    setMontoRecibidoTexto(total.toFixed(2));
                  }}
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: '12px',
                    border: metodoPagoRapido === 5 ? '2px solid #7c3aed' : '1px solid #e2e8f0',
                    backgroundColor: metodoPagoRapido === 5 ? '#f5f3ff' : '#ffffff',
                    color: metodoPagoRapido === 5 ? '#5b21b6' : '#475569',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.6rem',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '1rem',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <ArrowRightLeft size={20} color={metodoPagoRapido === 5 ? '#7c3aed' : '#64748b'} />
                  <span>📲 Transferencia</span>
                </button>
              </div>

              {/* Tarjeta de Resumen: Total a Cobrar */}
              <div style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '14px',
                padding: '1.25rem 1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                    Total de la Venta
                  </span>
                  <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#0f172a', fontFamily: 'var(--fuente-numerica)' }}>
                    ${total.toFixed(2)}
                  </div>
                </div>

                {metodoPagoRapido === 1 && (
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.85rem', color: cambioRapido > 0 ? '#059669' : '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                      {cambioRapido > 0 ? 'Cambio a Entregar' : 'Cambio'}
                    </span>
                    <div style={{ 
                      fontSize: '2.4rem', 
                      fontWeight: 800, 
                      color: cambioRapido > 0 ? '#059669' : '#0f172a', 
                      fontFamily: 'var(--fuente-numerica)' 
                    }}>
                      ${cambioRapido.toFixed(2)}
                    </div>
                  </div>
                )}
              </div>

              {/* Si es Efectivo: Campo para teclear monto recibido (con total pre-cargado) */}
              {metodoPagoRapido === 1 ? (
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
                    Efectivo Recibido (Teclea el billete o presiona Enter para pago exacto):
                  </label>
                  
                  <div style={{ position: 'relative' }}>
                    <span style={{
                      position: 'absolute',
                      left: '16px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: '1.6rem',
                      fontWeight: 700,
                      color: '#94a3b8'
                    }}>$</span>
                    <input
                      ref={inputMontoRef}
                      type="number"
                      step="any"
                      value={montoRecibidoTexto}
                      onChange={(e) => setMontoRecibidoTexto(e.target.value)}
                      placeholder="0.00"
                      style={{
                        width: '100%',
                        padding: '0.85rem 1.25rem',
                        paddingLeft: '38px',
                        fontSize: '2rem',
                        fontWeight: 800,
                        color: '#0f172a',
                        fontFamily: 'var(--fuente-numerica)',
                        borderRadius: '12px',
                        border: saldoFaltanteRapido > 0 ? '2px solid #ef4444' : '2px solid #059669',
                        backgroundColor: '#ffffff',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                        outline: 'none'
                      }}
                    />
                  </div>

                  {/* Billetes rápidos en un clic */}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                    <button
                      type="button"
                      onClick={() => handleEstablecerMonto(total)}
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        backgroundColor: '#f8fafc',
                        color: '#0f172a',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        cursor: 'pointer'
                      }}
                    >
                      Exacto (${total.toFixed(2)})
                    </button>
                    {[50, 100, 200, 500].map(billete => (
                      <button
                        key={billete}
                        type="button"
                        onClick={() => handleEstablecerMonto(billete)}
                        style={{
                          flex: 1,
                          padding: '0.5rem',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          backgroundColor: '#f8fafc',
                          color: '#0f172a',
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          cursor: 'pointer'
                        }}
                      >
                        ${billete}
                      </button>
                    ))}
                  </div>

                  {saldoFaltanteRapido > 0 && (
                    <div style={{ color: '#dc2626', fontSize: '0.85rem', fontWeight: 600, marginTop: '0.5rem' }}>
                      ⚠️ Efectivo insuficiente. Faltan ${saldoFaltanteRapido.toFixed(2)} para completar el total.
                    </div>
                  )}
                </div>
              ) : (
                /* Si es Tarjeta o Transferencia */
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.4rem' }}>
                    {metodoPagoRapido === 2 ? 'Referencia o Autorización de Terminal (Opcional):' : 'Folio de Transferencia (Opcional):'}
                  </label>
                  <input
                    type="text"
                    value={referenciaRapida}
                    onChange={(e) => setReferenciaRapida(e.target.value)}
                    placeholder={metodoPagoRapido === 2 ? 'Ej. Auth 4589 / Últimos 4 dígitos' : 'Ej. SPEI 82914'}
                    style={{
                      width: '100%',
                      padding: '0.85rem 1rem',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '1rem',
                      backgroundColor: '#f8fafc'
                    }}
                  />
                  <div style={{ color: '#059669', fontSize: '0.85rem', fontWeight: 600, marginTop: '0.5rem' }}>
                    ✓ Cobro por el monto exacto de ${total.toFixed(2)}. No genera cambio en efectivo.
                  </div>
                </div>
              )}

            </div>
          ) : (
            /* =================================================================
               MODO PAGO MIXTO (EFECTIVO + TARJETA / VALES)
               ================================================================= */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                backgroundColor: '#f8fafc',
                borderRadius: '10px',
                border: '1px solid #e2e8f0'
              }}>
                <span style={{ color: '#64748b', fontSize: '0.9rem' }}>
                  Total: <strong>${total.toFixed(2)}</strong> • Cubierto: <strong style={{ color: '#059669' }}>${sumaPagosMixtos.toFixed(2)}</strong>
                </span>
                <span style={{ 
                  color: saldoRestantePorCobrar === 0 ? '#059669' : '#dc2626', 
                  fontWeight: 700, 
                  fontSize: '0.95rem' 
                }}>
                  {saldoRestantePorCobrar === 0 ? '✓ Totalmente Cubierto' : `Faltan: $${saldoRestantePorCobrar.toFixed(2)}`}
                </span>
              </div>

              {/* Lista de pagos agregados */}
              <div style={{
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                maxHeight: '140px',
                overflowY: 'auto',
                padding: '0.5rem'
              }}>
                {pagosMixtos.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '1rem', color: '#94a3b8', fontSize: '0.875rem' }}>
                    Agrega los métodos abajo para dividir el pago.
                  </div>
                ) : (
                  pagosMixtos.map(p => (
                    <div key={p.idTemporal} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.4rem 0.6rem',
                      borderBottom: '1px solid #f1f5f9'
                    }}>
                      <div>
                        <strong>{p.nombreMetodo}</strong>
                        {p.referencia && <span style={{ color: '#64748b', fontSize: '0.8rem', marginLeft: '0.5rem' }}>({p.referencia})</span>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontWeight: 700, color: '#0f172a' }}>${p.importe.toFixed(2)}</span>
                        <button
                          type="button"
                          onClick={() => handleEliminarPagoMixto(p.idTemporal)}
                          style={{ border: 'none', background: 'none', color: '#dc2626', cursor: 'pointer' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Formulario para agregar abono */}
              {saldoRestantePorCobrar > 0 && (
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: '0.25rem' }}>Método</label>
                    <select
                      value={metodoMixtoSeleccionado}
                      onChange={(e) => setMetodoMixtoSeleccionado(Number(e.target.value))}
                      style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    >
                      {metodosDisponibles.map(m => (
                        <option key={m.idMetodoPago} value={m.idMetodoPago}>
                          {m.descripcion}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ width: '130px' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: '0.25rem' }}>Monto</label>
                    <input
                      type="number"
                      step="any"
                      value={montoMixtoTexto}
                      onChange={(e) => setMontoMixtoTexto(e.target.value)}
                      placeholder="0.00"
                      style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 700 }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleAgregarPagoMixto}
                    className="btn btn-primario"
                    style={{ padding: '0.65rem 1rem' }}
                  >
                    + Agregar
                  </button>
                </div>
              )}

              {cambioMixto > 0 && (
                <div style={{ padding: '0.75rem', backgroundColor: '#ecfdf5', borderRadius: '8px', color: '#065f46', fontWeight: 700 }}>
                  Cambio en efectivo: ${cambioMixto.toFixed(2)}
                </div>
              )}
            </div>
          )}
        </div>

        {/* PIE DEL MODAL CON BOTONES GRANDES Y CLAROS */}
        <div style={{ 
          padding: '1.25rem 1.75rem',
          borderTop: '1px solid #e2e8f0',
          backgroundColor: '#f8fafc',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <button
              type="button"
              onClick={onCerrar}
              disabled={cargando}
              className="btn btn-secundario"
              style={{ padding: '0.85rem 1.4rem', fontSize: '1rem' }}
            >
              Cancelar (Esc)
            </button>

            {/* Selector con Cursor: Casilla opcional para imprimir ticket */}
            <label 
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '0.45rem', 
                cursor: 'pointer', 
                userSelect: 'none', 
                fontSize: '0.88rem', 
                color: '#334155', 
                fontWeight: 600,
                backgroundColor: '#ffffff',
                padding: '0.6rem 0.85rem',
                borderRadius: '8px',
                border: imprimirTicketSeleccionado ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                transition: 'all 0.15s ease'
              }}
              title="Marcar con el cursor si deseas que se imprima ticket en esta venta"
            >
              <input 
                type="checkbox" 
                checked={imprimirTicketSeleccionado} 
                onChange={(e) => setImprimirTicketSeleccionado(e.target.checked)}
                style={{ width: '17px', height: '17px', cursor: 'pointer', accentColor: '#2563eb' }}
              />
              <Printer size={16} color={imprimirTicketSeleccionado ? '#2563eb' : '#64748b'} />
              <span>Imprimir ticket</span>
            </label>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Opción directa con cursor: Imprimir Ticket */}
            <button
              type="button"
              onClick={() => handleConfirmarCobro(true)}
              disabled={cargando || (modoCobro === 'rapido' && metodoPagoRapido === 1 && montoRecibidoRapido < total) || (modoCobro === 'mixto' && saldoRestantePorCobrar > 0)}
              className="btn btn-secundario"
              style={{ 
                padding: '0.85rem 1.25rem', 
                fontSize: '0.95rem', 
                fontWeight: 600,
                gap: '0.5rem',
                borderColor: '#cbd5e1',
                color: '#334155'
              }}
              title="Haz clic con el cursor si el cliente solicita expresamente ticket impreso"
            >
              <Printer size={18} />
              <span>Cobrar e Imprimir Ticket</span>
            </button>

            {/* Acción principal por defecto al dar Enter: Finalizar sin imprimir */}
            <button
              type="button"
              onClick={() => handleConfirmarCobro(imprimirTicketSeleccionado)}
              disabled={cargando || (modoCobro === 'rapido' && metodoPagoRapido === 1 && montoRecibidoRapido < total) || (modoCobro === 'mixto' && saldoRestantePorCobrar > 0)}
              className="btn btn-primario"
              style={{ 
                padding: '0.95rem 2rem', 
                fontSize: '1.15rem', 
                fontWeight: 800,
                gap: '0.6rem',
                backgroundColor: '#059669',
                borderColor: '#059669',
                boxShadow: '0 4px 14px rgba(5, 150, 105, 0.4)'
              }}
              title="Finalizar venta directamente (Enter). No abre modal de ticket a menos que lo selecciones con cursor."
            >
              {cargando ? (
                <span>Procesando Venta...</span>
              ) : (
                <>
                  <CheckCircle size={22} />
                  <span>CONFIRMAR COBRO (Enter)</span>
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
