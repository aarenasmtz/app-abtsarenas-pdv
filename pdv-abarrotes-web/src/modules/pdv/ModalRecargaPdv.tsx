import React, { useState, useEffect, useRef } from 'react';
import {
  Smartphone,
  Receipt,
  Zap,
  CheckCircle2,
  AlertCircle,
  Printer,
  ShoppingCart,
  X,
  PhoneCall,
  RotateCcw,
  ShieldCheck,
  Search,
  Layers,
} from 'lucide-react';
import { servicioRecargasYServicios } from '../servicios/servicioRecargasYServicios';
import { COMPANIAS_PREDETERMINADAS, enriquecerCompanias, type CompaniaVisual } from '../servicios/datosCompanias';
import { IconoCompania } from '../servicios/IconoCompania';
import { VentanaMosaicoCatalogo } from '../servicios/VentanaMosaicoCatalogo';
import type {
  ResultadoRecargaDto,
  ResultadoPagoServicioDto,
  CatalogoServicioDto,
} from '../servicios/tiposServicios';
import { reproducirBeepExito, reproducirBeepError } from '../../utils/sonidosPdv';

interface ModalRecargaPdvProps {
  abierto: boolean;
  onCerrar: () => void;
  onAgregarAlCarrito?: (item: {
    descripcion: string;
    monto: number;
    folio: string;
    codigoBarras: string;
  }) => void;
}

export const ModalRecargaPdv: React.FC<ModalRecargaPdvProps> = ({
  abierto,
  onCerrar,
  onAgregarAlCarrito,
}) => {
  const [pestanaActiva, setPestanaActiva] = useState<'recarga' | 'servicio' | 'catalogo'>('recarga');


  // Catálogos
  const [companias, setCompanias] = useState<CompaniaVisual[]>(COMPANIAS_PREDETERMINADAS);
  const [servicios, setServicios] = useState<CatalogoServicioDto[]>([]);

  // Estado Recarga
  const [companiaSeleccionada, setCompaniaSeleccionada] = useState<CompaniaVisual>(COMPANIAS_PREDETERMINADAS[0]);
  const [numeroTelefono, setNumeroTelefono] = useState<string>('');
  const [confirmarNumero, setConfirmarNumero] = useState<string>('');
  const [montoRecarga, setMontoRecarga] = useState<number>(50);
  const [procesandoRecarga, setProcesandoRecarga] = useState<boolean>(false);
  const [resultadoRecarga, setResultadoRecarga] = useState<ResultadoRecargaDto | null>(null);
  const [errorRecarga, setErrorRecarga] = useState<string | null>(null);

  // Estado Servicios
  const [servicioSeleccionado, setServicioSeleccionado] = useState<string>('CFE');
  const [referenciaRecibo, setReferenciaRecibo] = useState<string>('');
  const [montoServicio, setMontoServicio] = useState<string>('');
  const [comisionServicio, setComisionServicio] = useState<number>(12);
  const [consultandoAdeudo, setConsultandoAdeudo] = useState<boolean>(false);
  const [mensajeAdeudo, setMensajeAdeudo] = useState<string | null>(null);
  const [procesandoServicio, setProcesandoServicio] = useState<boolean>(false);
  const [resultadoServicio, setResultadoServicio] = useState<ResultadoPagoServicioDto | null>(null);
  const [errorServicio, setErrorServicio] = useState<string | null>(null);

  const inputTelefonoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!abierto) return;

    // Resetear formulario al abrir
    setResultadoRecarga(null);
    setResultadoServicio(null);
    setErrorRecarga(null);
    setErrorServicio(null);
    setNumeroTelefono('');
    setConfirmarNumero('');
    setReferenciaRecibo('');
    setMontoServicio('');
    setMensajeAdeudo(null);

    // Cargar catálogos desde el servidor
    const cargarCatalogos = async () => {
      try {
        const [companiasApi, serviciosApi] = await Promise.all([
          servicioRecargasYServicios.obtenerCompanias().catch(() => []),
          servicioRecargasYServicios.obtenerCatalogoServicios().catch(() => []),
        ]);

        const companiasVisuales = enriquecerCompanias(companiasApi);
        setCompanias(companiasVisuales);
        if (companiasVisuales.length > 0) {
          setCompaniaSeleccionada(companiasVisuales[0]);
        }

        if (serviciosApi.length > 0) {
          setServicios(serviciosApi);
          setServicioSeleccionado(serviciosApi[0].codigo);
          setComisionServicio(serviciosApi[0].comisionRecomendada || 12);
        }
      } catch {
        // Fallback garantizado activo
      }
    };

    cargarCatalogos();

    // Auto-focus al input principal
    const timer = setTimeout(() => {
      inputTelefonoRef.current?.focus();
    }, 150);
    return () => clearTimeout(timer);
  }, [abierto]);

  // Manejo de ESC para cerrar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!abierto) return;
      if (e.key === 'Escape' && !procesandoRecarga && !procesandoServicio) {
        e.preventDefault();
        onCerrar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [abierto, procesandoRecarga, procesandoServicio, onCerrar]);

  if (!abierto) return null;

  const seleccionarCompania = (c: CompaniaVisual) => {
    setCompaniaSeleccionada(c);
    if (!c.montosDisponibles.includes(montoRecarga) && c.montosDisponibles.length > 0) {
      setMontoRecarga(c.montosDisponibles[0]);
    }
  };

  const ejecutarRecarga = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorRecarga(null);
    setResultadoRecarga(null);

    const telLimpio = numeroTelefono.replace(/\D/g, '');
    const confLimpio = confirmarNumero.replace(/\D/g, '');

    if (telLimpio.length !== 10) {
      setErrorRecarga('El número telefónico debe ser de exactamente 10 dígitos.');
      reproducirBeepError();
      return;
    }

    if (telLimpio !== confLimpio) {
      setErrorRecarga('Los números no coinciden. Por favor verifique los 10 dígitos.');
      reproducirBeepError();
      return;
    }

    setProcesandoRecarga(true);
    try {
      const resp = await servicioRecargasYServicios.procesarRecarga({
        codigoCompania: companiaSeleccionada.codigo,
        numeroTelefono: telLimpio,
        confirmarNumeroTelefono: confLimpio,
        monto: montoRecarga,
      });

      setResultadoRecarga(resp);
      reproducirBeepExito();
    } catch (err: unknown) {
      setErrorRecarga(err instanceof Error ? err.message : 'Error al procesar la recarga.');
      reproducirBeepError();
    } finally {
      setProcesandoRecarga(false);
    }
  };

  const consultarAdeudoServicio = async () => {
    if (!referenciaRecibo.trim()) {
      setErrorServicio('Ingrese el número de servicio o referencia del recibo.');
      return;
    }

    setConsultandoAdeudo(true);
    setErrorServicio(null);
    setMensajeAdeudo(null);

    try {
      const resp = await servicioRecargasYServicios.consultarAdeudo({
        codigoServicio: servicioSeleccionado,
        referencia: referenciaRecibo.trim(),
      });

      if (resp.exito && resp.montoAdeudo > 0) {
        setMontoServicio(resp.montoAdeudo.toFixed(2));
        setMensajeAdeudo(`Adeudo registrado: $${resp.montoAdeudo.toFixed(2)} MXN`);
      } else {
        setMensajeAdeudo(resp.mensajeProveedor || 'Referencia consultada exitosamente.');
      }
    } catch (err: unknown) {
      setErrorServicio(err instanceof Error ? err.message : 'No se pudo consultar el adeudo.');
    } finally {
      setConsultandoAdeudo(false);
    }
  };

  const ejecutarPagoServicio = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorServicio(null);
    setResultadoServicio(null);

    const montoNum = parseFloat(montoServicio);
    if (isNaN(montoNum) || montoNum <= 0) {
      setErrorServicio('Ingrese un monto válido a pagar.');
      reproducirBeepError();
      return;
    }

    if (!referenciaRecibo.trim()) {
      setErrorServicio('Ingrese la referencia del recibo.');
      reproducirBeepError();
      return;
    }

    setProcesandoServicio(true);
    try {
      const resp = await servicioRecargasYServicios.procesarPagoServicio({
        codigoServicio: servicioSeleccionado,
        referenciaRecibo: referenciaRecibo.trim(),
        montoRecibo: montoNum,
        comision: comisionServicio,
      });

      setResultadoServicio(resp);
      reproducirBeepExito();
    } catch (err: unknown) {
      setErrorServicio(err instanceof Error ? err.message : 'Error al procesar el pago del recibo.');
      reproducirBeepError();
    } finally {
      setProcesandoServicio(false);
    }
  };

  const agregarRecargaAlTicket = () => {
    if (!resultadoRecarga || !onAgregarAlCarrito) return;
    onAgregarAlCarrito({
      descripcion: `Recarga ${resultadoRecarga.compania} ${resultadoRecarga.numeroTelefono}`,
      monto: resultadoRecarga.monto,
      folio: resultadoRecarga.codigoAutorizacion || resultadoRecarga.folioProveedor || 'RNP-REC',
      codigoBarras: `REC-${resultadoRecarga.numeroTelefono}`,
    });
    onCerrar();
  };

  const agregarServicioAlTicket = () => {
    if (!resultadoServicio || !onAgregarAlCarrito) return;
    onAgregarAlCarrito({
      descripcion: `Pago ${resultadoServicio.servicio} Ref: ${resultadoServicio.referencia}`,
      monto: resultadoServicio.totalCobrado,
      folio: resultadoServicio.folioAutorizacion || 'RNP-SERV',
      codigoBarras: `SRV-${resultadoServicio.referencia.substring(0, 10)}`,
    });
    onCerrar();
  };

  const formatearDinero = (monto: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(monto);

  const servicioActual = servicios.find((s) => s.codigo === servicioSeleccionado);

  return (
    <div className="modal-overlay" style={{ zIndex: 1300, backdropFilter: 'blur(4px)' }}>
      <div
        className="modal-contenido"
        style={{
          maxWidth: '940px',
          width: '95%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: 0,
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
        }}
      >
        {/* Cabecera del Modal */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(to right, #ffffff, #f8fafc)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                backgroundColor: '#ecfdf5',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Zap size={24} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                Recargas y Servicios (RNP)
              </h2>
              <p style={{ margin: '0.15rem 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                Tiempo aire electrónico y pago de recibos en mostrador
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCerrar}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '0.4rem',
              borderRadius: '8px',
              cursor: 'pointer',
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Cerrar (Esc)"
          >
            <X size={22} />
          </button>
        </div>

        {/* Pestañas de Navegación */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            padding: '0 1.5rem',
          }}
        >
          <button
            type="button"
            onClick={() => {
              setPestanaActiva('recarga');
              setErrorRecarga(null);
            }}
            style={{
              padding: '0.85rem 1.25rem',
              border: 'none',
              background: 'transparent',
              borderBottom: pestanaActiva === 'recarga' ? '3px solid #059669' : '3px solid transparent',
              color: pestanaActiva === 'recarga' ? '#059669' : '#64748b',
              fontWeight: pestanaActiva === 'recarga' ? 700 : 500,
              fontSize: '0.95rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.15s ease',
            }}
          >
            <Smartphone size={18} />
            <span>Recarga de Tiempo Aire</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setPestanaActiva('servicio');
              setErrorServicio(null);
            }}
            style={{
              padding: '0.85rem 1.25rem',
              border: 'none',
              background: 'transparent',
              borderBottom: pestanaActiva === 'servicio' ? '3px solid #0284c7' : '3px solid transparent',
              color: pestanaActiva === 'servicio' ? '#0284c7' : '#64748b',
              fontWeight: pestanaActiva === 'servicio' ? 700 : 500,
              fontSize: '0.95rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.15s ease',
            }}
          >
            <Receipt size={18} />
            <span>Pago de Recibos / Servicios</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setPestanaActiva('catalogo');
            }}
            style={{
              padding: '0.85rem 1.25rem',
              border: 'none',
              background: 'transparent',
              borderBottom: pestanaActiva === 'catalogo' ? '3px solid #7c3aed' : '3px solid transparent',
              color: pestanaActiva === 'catalogo' ? '#7c3aed' : '#64748b',
              fontWeight: pestanaActiva === 'catalogo' ? 700 : 500,
              fontSize: '0.95rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.15s ease',
            }}
          >
            <Layers size={18} />
            <span>Catálogo RNP (Mosaico & Filtros)</span>
          </button>
        </div>

        {/* Cuerpo del Modal */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          {/* ======================================================== */}
          {/* PESTAÑA: RECARGA DE TIEMPO AIRE                         */}
          {/* ======================================================== */}
          {pestanaActiva === 'recarga' && (
            <div>
              {resultadoRecarga ? (
                /* Pantalla de Éxito de Recarga */
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    padding: '1rem',
                  }}
                >
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      backgroundColor: '#ecfdf5',
                      color: '#059669',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '1rem',
                    }}
                  >
                    <CheckCircle2 size={40} />
                  </div>

                  <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
                    ¡Recarga Aplicada Exitosamente!
                  </h3>
                  <p style={{ margin: '0.35rem 0 1.25rem', color: '#64748b', fontSize: '0.9rem' }}>
                    {resultadoRecarga.mensaje || 'La transacción fue autorizada por el carrier.'}
                  </p>

                  {/* Resumen Tipo Ticket */}
                  <div
                    style={{
                      width: '100%',
                      maxWidth: '480px',
                      backgroundColor: '#f8fafc',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.65rem',
                      textAlign: 'left',
                      fontSize: '0.9rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Compañía:</span>
                      <strong style={{ color: companiaSeleccionada.colorTexto }}>
                        {resultadoRecarga.compania}
                      </strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Número Telefónico:</span>
                      <strong className="mono" style={{ fontSize: '1.05rem', color: '#0f172a' }}>
                        {resultadoRecarga.numeroTelefono}
                      </strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Monto Recargado:</span>
                      <strong style={{ fontSize: '1.15rem', color: '#059669' }}>
                        {formatearDinero(resultadoRecarga.monto)}
                      </strong>
                    </div>

                    <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Folio / Autorización:</span>
                      <strong className="mono" style={{ color: '#0284c7' }}>
                        {resultadoRecarga.codigoAutorizacion || resultadoRecarga.folioProveedor || 'RNP-AUT'}
                      </strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#94a3b8' }}>
                      <span>Fecha y Hora:</span>
                      <span>{new Date(resultadoRecarga.fechaHora).toLocaleString('es-MX')}</span>
                    </div>
                  </div>

                  {/* Botones de Acción Posterior a Recarga */}
                  <div
                    style={{
                      display: 'flex',
                      gap: '0.75rem',
                      justifyContent: 'center',
                      flexWrap: 'wrap',
                      marginTop: '1.5rem',
                      width: '100%',
                    }}
                  >
                    {onAgregarAlCarrito && (
                      <button
                        type="button"
                        onClick={agregarRecargaAlTicket}
                        className="btn btn-primario"
                        style={{
                          padding: '0.75rem 1.25rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          fontWeight: 700,
                        }}
                      >
                        <ShoppingCart size={18} />
                        <span>Agregar al Carrito de Venta</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="btn btn-secundario"
                      style={{
                        padding: '0.75rem 1.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      <Printer size={18} />
                      <span>Imprimir Comprobante</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setResultadoRecarga(null);
                        setNumeroTelefono('');
                        setConfirmarNumero('');
                        inputTelefonoRef.current?.focus();
                      }}
                      className="btn btn-secundario"
                      style={{
                        padding: '0.75rem 1.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      <RotateCcw size={18} />
                      <span>Nueva Recarga</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Formulario de Recarga */
                <form onSubmit={ejecutarRecarga} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {errorRecarga && (
                    <div
                      style={{
                        padding: '0.75rem 1rem',
                        backgroundColor: '#fef2f2',
                        border: '1px solid #f87171',
                        borderRadius: '10px',
                        color: '#b91c1c',
                        fontSize: '0.88rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      <AlertCircle size={18} />
                      <span>{errorRecarga}</span>
                    </div>
                  )}

                  {/* 1. Mosaico de Selección de Compañías */}
                  <div className="grupo-formulario">
                    <label className="etiqueta-formulario">
                      <span>Seleccionar Compañía Telefónica:</span>
                      <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                        Operador: <strong style={{ color: companiaSeleccionada.colorTexto }}>{companiaSeleccionada.nombre}</strong>
                      </span>
                    </label>

                    <div className="mosaico-companias-grid">
                      {companias.map((c) => {
                        const esSeleccionada = companiaSeleccionada.codigo === c.codigo;
                        return (
                          <div
                            key={c.codigo}
                            className={`tarjeta-mosaico-compania ${esSeleccionada ? 'seleccionada' : ''}`}
                            onClick={() => seleccionarCompania(c)}
                            style={{
                              borderColor: esSeleccionada ? c.colorPrimario : '#e2e8f0',
                              backgroundColor: esSeleccionada ? c.colorFondo : '#ffffff',
                            }}
                          >
                            {esSeleccionada && (
                              <div
                                className="indicador-check"
                                style={{ backgroundColor: c.colorPrimario }}
                              >
                                ✓
                              </div>
                            )}

                            <div style={{ marginBottom: '0.35rem' }}>
                              <IconoCompania tipo={c.iconoTipo} size={34} />
                            </div>

                            <span
                              style={{
                                fontSize: '0.88rem',
                                fontWeight: esSeleccionada ? 800 : 600,
                                color: esSeleccionada ? c.colorTexto : '#0f172a',
                              }}
                            >
                              {c.nombre}
                            </span>

                            <span
                              style={{
                                fontSize: '0.7rem',
                                color: esSeleccionada ? c.colorTexto : '#94a3b8',
                                marginTop: '0.1rem',
                              }}
                            >
                              {c.subtitulo}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. Números Telefónicos en 2 Columnas */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="grupo-formulario">
                      <label className="etiqueta-formulario">
                        <span>Número Celular (10 Dígitos):</span>
                      </label>
                      <div style={{ position: 'relative' }}>
                        <PhoneCall
                          size={18}
                          style={{
                            position: 'absolute',
                            left: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#94a3b8',
                          }}
                        />
                        <input
                          ref={inputTelefonoRef}
                          type="tel"
                          maxLength={10}
                          className="control-formulario"
                          placeholder="Ej. 4771234567"
                          value={numeroTelefono}
                          onChange={(e) => setNumeroTelefono(e.target.value.replace(/\D/g, ''))}
                          style={{
                            paddingLeft: '38px',
                            fontSize: '1.15rem',
                            fontWeight: 700,
                            letterSpacing: '2px',
                            fontFamily: 'var(--fuente-numerica)',
                          }}
                          required
                        />
                      </div>
                    </div>

                    <div className="grupo-formulario">
                      <label className="etiqueta-formulario">
                        <span>Confirmar Número Celular:</span>
                        {confirmarNumero && numeroTelefono && (
                          <span
                            style={{
                              fontSize: '0.75rem',
                              color: numeroTelefono === confirmarNumero ? '#059669' : '#dc2626',
                              fontWeight: 700,
                            }}
                          >
                            {numeroTelefono === confirmarNumero ? '✓ Coinciden' : '✗ No coinciden'}
                          </span>
                        )}
                      </label>
                      <div style={{ position: 'relative' }}>
                        <ShieldCheck
                          size={18}
                          style={{
                            position: 'absolute',
                            left: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#94a3b8',
                          }}
                        />
                        <input
                          type="tel"
                          maxLength={10}
                          className={`control-formulario ${
                            confirmarNumero && numeroTelefono !== confirmarNumero ? 'control-error' : ''
                          }`}
                          placeholder="Reescriba los 10 dígitos"
                          value={confirmarNumero}
                          onChange={(e) => setConfirmarNumero(e.target.value.replace(/\D/g, ''))}
                          style={{
                            paddingLeft: '38px',
                            fontSize: '1.15rem',
                            fontWeight: 700,
                            letterSpacing: '2px',
                            fontFamily: 'var(--fuente-numerica)',
                          }}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* 3. Selección de Monto con Mosaico */}
                  <div className="grupo-formulario">
                    <label className="etiqueta-formulario">
                      <span>Monto de la Recarga:</span>
                      <span style={{ fontSize: '0.85rem', color: '#059669', fontWeight: 700 }}>
                        Seleccionado: {formatearDinero(montoRecarga)} MXN
                      </span>
                    </label>

                    <div className="mosaico-montos-grid">
                      {companiaSeleccionada.montosDisponibles.map((m) => {
                        const esActivo = montoRecarga === m;
                        return (
                          <button
                            key={m}
                            type="button"
                            className={`boton-monto-recarga ${esActivo ? 'activo' : ''}`}
                            onClick={() => setMontoRecarga(m)}
                            style={{
                              backgroundColor: esActivo ? companiaSeleccionada.colorPrimario : '#ffffff',
                              borderColor: esActivo ? companiaSeleccionada.colorPrimario : '#cbd5e1',
                              color: esActivo ? '#ffffff' : '#0f172a',
                            }}
                          >
                            ${m}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 4. Botón de Enviar */}
                  <button
                    type="submit"
                    className="btn btn-primario"
                    disabled={
                      procesandoRecarga ||
                      numeroTelefono.length !== 10 ||
                      numeroTelefono !== confirmarNumero
                    }
                    style={{
                      padding: '0.9rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      fontSize: '1.05rem',
                      fontWeight: 800,
                      marginTop: '0.5rem',
                      backgroundColor: companiaSeleccionada.colorPrimario,
                      borderColor: companiaSeleccionada.colorPrimario,
                    }}
                  >
                    {procesandoRecarga ? (
                      <>
                        <div
                          className="animacion-giratoria"
                          style={{
                            width: '20px',
                            height: '20px',
                            border: '2px solid #ffffff',
                            borderTopColor: 'transparent',
                            borderRadius: '50%',
                          }}
                        />
                        <span>Enviando Recarga a RNP...</span>
                      </>
                    ) : (
                      <>
                        <Zap size={20} />
                        <span>Aplicar Recarga de {formatearDinero(montoRecarga)} MXN</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* PESTAÑA: PAGO DE RECIBOS Y SERVICIOS                     */}
          {/* ======================================================== */}
          {pestanaActiva === 'servicio' && (
            <div>
              {resultadoServicio ? (
                /* Pantalla de Éxito de Pago de Servicio */
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    padding: '1rem',
                  }}
                >
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      backgroundColor: '#eff6ff',
                      color: '#0284c7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '1rem',
                    }}
                  >
                    <CheckCircle2 size={40} />
                  </div>

                  <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
                    ¡Pago de Servicio Aplicado!
                  </h3>
                  <p style={{ margin: '0.35rem 0 1.25rem', color: '#64748b', fontSize: '0.9rem' }}>
                    {resultadoServicio.mensaje || 'El recibo fue liquidado en el sistema.'}
                  </p>

                  <div
                    style={{
                      width: '100%',
                      maxWidth: '480px',
                      backgroundColor: '#f8fafc',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.65rem',
                      textAlign: 'left',
                      fontSize: '0.9rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Servicio:</span>
                      <strong>{resultadoServicio.servicio}</strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Referencia:</span>
                      <strong className="mono">{resultadoServicio.referencia}</strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Importe del Recibo:</span>
                      <span>{formatearDinero(resultadoServicio.montoPagado)}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Comisión por Servicio:</span>
                      <span>{formatearDinero(resultadoServicio.comisionCobrada)}</span>
                    </div>

                    <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 700 }}>Total Cobrado al Cliente:</span>
                      <strong style={{ fontSize: '1.15rem', color: '#0284c7' }}>
                        {formatearDinero(resultadoServicio.totalCobrado)}
                      </strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Folio Autorización:</span>
                      <strong className="mono" style={{ color: '#059669' }}>
                        {resultadoServicio.folioAutorizacion || 'AUT-RNP'}
                      </strong>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      gap: '0.75rem',
                      justifyContent: 'center',
                      flexWrap: 'wrap',
                      marginTop: '1.5rem',
                      width: '100%',
                    }}
                  >
                    {onAgregarAlCarrito && (
                      <button
                        type="button"
                        onClick={agregarServicioAlTicket}
                        className="btn btn-primario"
                        style={{
                          padding: '0.75rem 1.25rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          fontWeight: 700,
                          backgroundColor: '#0284c7',
                          borderColor: '#0284c7',
                        }}
                      >
                        <ShoppingCart size={18} />
                        <span>Agregar al Carrito de Venta</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="btn btn-secundario"
                      style={{
                        padding: '0.75rem 1.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      <Printer size={18} />
                      <span>Imprimir Comprobante</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setResultadoServicio(null);
                        setReferenciaRecibo('');
                        setMontoServicio('');
                        setMensajeAdeudo(null);
                      }}
                      className="btn btn-secundario"
                      style={{
                        padding: '0.75rem 1.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      <RotateCcw size={18} />
                      <span>Pagar Otro Recibo</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Formulario de Pago de Servicio */
                <form onSubmit={ejecutarPagoServicio} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {errorServicio && (
                    <div
                      style={{
                        padding: '0.75rem 1rem',
                        backgroundColor: '#fef2f2',
                        border: '1px solid #f87171',
                        borderRadius: '10px',
                        color: '#b91c1c',
                        fontSize: '0.88rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      <AlertCircle size={18} />
                      <span>{errorServicio}</span>
                    </div>
                  )}

                  {/* Selector de Servicio */}
                  <div className="grupo-formulario">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <label className="etiqueta-formulario" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>Seleccionar Servicio o Empresa:</span>
                        {servicioActual && (
                          <span style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 600 }}>
                            (Comisión: ${servicioActual.comisionRecomendada || 12} MXN)
                          </span>
                        )}
                      </label>
                      <button
                        type="button"
                        onClick={() => setPestanaActiva('catalogo')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          background: '#eff6ff',
                          border: '1px solid #bfdbfe',
                          color: '#1d4ed8',
                          padding: '0.25rem 0.6rem',
                          borderRadius: '6px',
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        <Layers size={13} />
                        <span>Ver Catálogo Completo en Mosaico</span>
                      </button>
                    </div>
                    <select
                      className="control-formulario"
                      value={servicioSeleccionado}
                      onChange={(e) => {
                        setServicioSeleccionado(e.target.value);
                        setMensajeAdeudo(null);
                        const s = servicios.find((item) => item.codigo === e.target.value);
                        if (s) setComisionServicio(s.comisionRecomendada);
                      }}
                    >
                      {servicios.length > 0 ? (
                        servicios.map((s) => (
                          <option key={s.codigo} value={s.codigo}>
                            {s.nombre} ({s.categoria})
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="CFE">CFE (Comisión Federal de Electricidad)</option>
                          <option value="TELMEX">Telmex (Telefonía e Internet)</option>
                          <option value="NATURGY">Naturgy (Gas Natural)</option>
                          <option value="IZZI">Izzi Telecom</option>
                          <option value="SKY">Sky México</option>
                          <option value="TOTALPLAY">Totalplay</option>
                          <option value="AGUA_SAPAL">SAPAL (Agua Potable)</option>
                        </>
                      )}
                    </select>
                  </div>

                  {/* Referencia o Código de Barras del Recibo */}
                  <div className="grupo-formulario">
                    <label className="etiqueta-formulario">
                      <span>Referencia / Código de Barras del Recibo:</span>
                      <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Escanee o capture con teclado</span>
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        type="text"
                        className="control-formulario"
                        placeholder="Ingrese la referencia del recibo"
                        value={referenciaRecibo}
                        onChange={(e) => setReferenciaRecibo(e.target.value)}
                        style={{ fontFamily: 'var(--fuente-numerica)' }}
                        required
                      />
                      <button
                        type="button"
                        className="btn btn-secundario"
                        onClick={consultarAdeudoServicio}
                        disabled={consultandoAdeudo || !referenciaRecibo.trim()}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap' }}
                      >
                        <Search size={16} />
                        <span>{consultandoAdeudo ? 'Consultando...' : 'Consultar'}</span>
                      </button>
                    </div>
                  </div>

                  {mensajeAdeudo && (
                    <div
                      style={{
                        padding: '0.75rem 1rem',
                        backgroundColor: '#eff6ff',
                        border: '1px solid #bfdbfe',
                        borderRadius: '10px',
                        color: '#1d4ed8',
                        fontSize: '0.88rem',
                      }}
                    >
                      {mensajeAdeudo}
                    </div>
                  )}

                  {/* Monto del Recibo y Comisión */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="grupo-formulario">
                      <label className="etiqueta-formulario">
                        <span>Monto del Recibo ($ MXN):</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="1"
                        className="control-formulario"
                        placeholder="0.00"
                        value={montoServicio}
                        onChange={(e) => setMontoServicio(e.target.value)}
                        style={{ fontFamily: 'var(--fuente-numerica)', fontSize: '1.1rem', fontWeight: 700 }}
                        required
                      />
                    </div>

                    <div className="grupo-formulario">
                      <label className="etiqueta-formulario">
                        <span>Comisión del Negocio ($ MXN):</span>
                      </label>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        className="control-formulario"
                        value={comisionServicio}
                        onChange={(e) => setComisionServicio(parseFloat(e.target.value) || 0)}
                        style={{ fontFamily: 'var(--fuente-numerica)', fontSize: '1.1rem', fontWeight: 700 }}
                      />
                    </div>
                  </div>

                  {/* Resumen de Total */}
                  {parseFloat(montoServicio) > 0 && (
                    <div
                      style={{
                        padding: '0.75rem 1rem',
                        backgroundColor: '#f8fafc',
                        borderRadius: '10px',
                        border: '1px solid #cbd5e1',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span style={{ fontSize: '0.95rem', color: '#64748b' }}>Total a Cobrar al Cliente:</span>
                      <strong style={{ fontSize: '1.25rem', color: '#0284c7' }}>
                        {formatearDinero((parseFloat(montoServicio) || 0) + comisionServicio)}
                      </strong>
                    </div>
                  )}

                  {/* Botón de Pagar Recibo */}
                  <button
                    type="submit"
                    className="btn btn-primario"
                    disabled={procesandoServicio || !montoServicio || parseFloat(montoServicio) <= 0}
                    style={{
                      padding: '0.9rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      fontSize: '1.05rem',
                      fontWeight: 800,
                      backgroundColor: '#0284c7',
                      borderColor: '#0284c7',
                    }}
                  >
                    {procesandoServicio ? (
                      <>
                        <div
                          className="animacion-giratoria"
                          style={{
                            width: '20px',
                            height: '20px',
                            border: '2px solid #ffffff',
                            borderTopColor: 'transparent',
                            borderRadius: '50%',
                          }}
                        />
                        <span>Liquidando Servicio con RNP...</span>
                      </>
                    ) : (
                      <>
                        <Receipt size={20} />
                        <span>
                          Cobrar Recibo ({formatearDinero((parseFloat(montoServicio) || 0) + comisionServicio)})
                        </span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* PESTAÑA: CATÁLOGO COMPLETO RNP (MOSAICO Y FILTROS)       */}
          {/* ======================================================== */}
          {pestanaActiva === 'catalogo' && (
            <VentanaMosaicoCatalogo
              onSeleccionarServicio={(serv) => {
                setServicioSeleccionado(serv.codigo);
                setComisionServicio(serv.comisionRecomendada || 12);
                setPestanaActiva('servicio');
              }}
              onSeleccionarCompania={(comp) => {
                setCompaniaSeleccionada(comp);
                setPestanaActiva('recarga');
              }}
              onSincronizacionCompletada={() => {
                servicioRecargasYServicios
                  .obtenerCatalogoServicios()
                  .then((cat) => {
                    if (cat && cat.length > 0) setServicios(cat);
                  })
                  .catch(() => {});
              }}
            />
          )}
        </div>

        {/* Pie del Modal con atajo informativo */}
        <div
          style={{
            padding: '0.75rem 1.5rem',
            borderTop: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.8rem',
            color: '#64748b',
          }}
        >
          <span>Presione <strong>Esc</strong> para volver al punto de venta.</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Zap size={14} style={{ color: '#059669' }} />
            <span>Red Nacional de Pagos (RNP / VentaMovil)</span>
          </span>
        </div>
      </div>
    </div>
  );
};
