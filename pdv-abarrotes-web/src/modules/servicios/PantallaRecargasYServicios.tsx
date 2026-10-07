import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Receipt,
  Server,
  Zap,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  PhoneCall,
  DollarSign,
  ShieldCheck,
  History,
  FileText,
  Search,
  Database,
  Info,
  Layers,
} from 'lucide-react';
import { servicioRecargasYServicios } from './servicioRecargasYServicios';
import { COMPANIAS_PREDETERMINADAS, enriquecerCompanias, type CompaniaVisual } from './datosCompanias';
import { IconoCompania } from './IconoCompania';
import { VentanaMosaicoCatalogo } from './VentanaMosaicoCatalogo';
import type {
  EstadoIntegracionServiciosDto,
  CatalogoServicioDto,
  ResultadoRecargaDto,
  ResultadoPagoServicioDto,
  TransaccionServicioDetalleDto,
  RegistroBitacoraDto,
  RegistroLogErrorDto,
} from './tiposServicios';

export const PantallaRecargasYServicios: React.FC = () => {
  const [pestaña, setPestaña] = useState<'recargas' | 'servicios' | 'catalogo' | 'historial' | 'bitacora' | 'integracion'>('recargas');


  // Estado de integración del proveedor
  const [estadoIntegracion, setEstadoIntegracion] = useState<EstadoIntegracionServiciosDto | null>(null);
  const [cargandoEstado, setCargandoEstado] = useState<boolean>(true);

  // Catálogos
  const [companias, setCompanias] = useState<CompaniaVisual[]>(COMPANIAS_PREDETERMINADAS);
  const [servicios, setServicios] = useState<CatalogoServicioDto[]>([]);

  // Formulario Recargas
  const [companiaSeleccionada, setCompaniaSeleccionada] = useState<string>('TELCEL');
  const [numeroTelefono, setNumeroTelefono] = useState<string>('');
  const [confirmarNumero, setConfirmarNumero] = useState<string>('');
  const [montoRecarga, setMontoRecarga] = useState<number>(50);
  const [procesandoRecarga, setProcesandoRecarga] = useState<boolean>(false);
  const [resultadoRecarga, setResultadoRecarga] = useState<ResultadoRecargaDto | null>(null);
  const [errorRecarga, setErrorRecarga] = useState<string | null>(null);

  // Formulario Servicios
  const [servicioSeleccionado, setServicioSeleccionado] = useState<string>('CFE');
  const [referenciaRecibo, setReferenciaRecibo] = useState<string>('');
  const [montoServicio, setMontoServicio] = useState<string>('');
  const [comisionServicio, setComisionServicio] = useState<number>(12);
  const [procesandoServicio, setProcesandoServicio] = useState<boolean>(false);
  const [consultandoAdeudo, setConsultandoAdeudo] = useState<boolean>(false);
  const [mensajeAdeudo, setMensajeAdeudo] = useState<string | null>(null);
  const [resultadoServicio, setResultadoServicio] = useState<ResultadoPagoServicioDto | null>(null);
  const [errorServicio, setErrorServicio] = useState<string | null>(null);

  // Historial y Bitácora
  const [transacciones, setTransacciones] = useState<TransaccionServicioDetalleDto[]>([]);
  const [bitacora, setBitacora] = useState<RegistroBitacoraDto[]>([]);
  const [errores, setErrores] = useState<RegistroLogErrorDto[]>([]);
  const [cargandoAuditoria, setCargandoAuditoria] = useState<boolean>(false);
  const [sincronizandoCatalogo, setSincronizandoCatalogo] = useState<boolean>(false);
  const [mensajeSincronizacion, setMensajeSincronizacion] = useState<string | null>(null);

  const cargarDatos = async () => {
    setCargandoEstado(true);
    try {
      const [estado, companiasData, serviciosData] = await Promise.all([
        servicioRecargasYServicios.obtenerEstado(),
        servicioRecargasYServicios.obtenerCompanias(),
        servicioRecargasYServicios.obtenerCatalogoServicios(),
      ]);
      setEstadoIntegracion(estado);
      const companiasVisuales = enriquecerCompanias(companiasData);
      setCompanias(companiasVisuales);
      setServicios(serviciosData);

      if (serviciosData.length > 0) {
        setComisionServicio(serviciosData[0].comisionRecomendada);
      }
    } catch {
      console.warn('Error al conectar con el módulo de recargas y servicios.');
    } finally {
      setCargandoEstado(false);
    }
  };

  const cargarHistorial = async () => {
    setCargandoAuditoria(true);
    try {
      const [txs, bit, errs] = await Promise.all([
        servicioRecargasYServicios.obtenerTransacciones({ limite: 50 }),
        servicioRecargasYServicios.obtenerBitacora(undefined, 50),
        servicioRecargasYServicios.obtenerErrores(undefined, 50),
      ]);
      setTransacciones(txs);
      setBitacora(bit);
      setErrores(errs);
    } catch {
      console.warn('Error al cargar historial y bitácora.');
    } finally {
      setCargandoAuditoria(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    if (pestaña === 'historial' || pestaña === 'bitacora') {
      cargarHistorial();
    }
  }, [pestaña]);

  const companiaActual = companias.find((c) => c.codigo === companiaSeleccionada);
  const montosActuales = companiaActual?.montosDisponibles?.length
    ? companiaActual.montosDisponibles
    : [20, 30, 50, 100, 200, 500];

  const servicioActual = servicios.find((s) => s.codigo === servicioSeleccionado);

  const manejarCambioServicio = (codigo: string) => {
    setServicioSeleccionado(codigo);
    setMensajeAdeudo(null);
    const s = servicios.find((item) => item.codigo === codigo);
    if (s) {
      setComisionServicio(s.comisionRecomendada);
    }
  };

  const ejecutarRecarga = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorRecarga(null);
    setResultadoRecarga(null);

    const telLimpio = numeroTelefono.replace(/\D/g, '');
    const confLimpio = confirmarNumero.replace(/\D/g, '');

    if (telLimpio.length !== 10) {
      setErrorRecarga('El número telefónico debe tener exactamente 10 dígitos.');
      return;
    }

    if (telLimpio !== confLimpio) {
      setErrorRecarga('Los números telefónicos no coinciden. Por favor verifíquelos.');
      return;
    }

    setProcesandoRecarga(true);
    try {
      const respuesta = await servicioRecargasYServicios.procesarRecarga({
        codigoCompania: companiaSeleccionada,
        numeroTelefono: telLimpio,
        confirmarNumeroTelefono: confLimpio,
        monto: montoRecarga,
      });
      setResultadoRecarga(respuesta);
      cargarDatos();
    } catch (err: unknown) {
      setErrorRecarga(err instanceof Error ? err.message : 'Error al procesar recarga.');
    } finally {
      setProcesandoRecarga(false);
    }
  };

  const consultarAdeudoEnLinea = async () => {
    if (!referenciaRecibo.trim()) {
      setErrorServicio('Ingrese la referencia del recibo para consultar el adeudo.');
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

      if (resp.exito) {
        if (resp.montoAdeudo > 0) {
          setMontoServicio(resp.montoAdeudo.toFixed(2));
          setMensajeAdeudo(`Adeudo consultado: $${resp.montoAdeudo.toFixed(2)} MXN`);
        } else {
          setMensajeAdeudo(resp.mensajeProveedor || 'Consulta exitosa. Referencia al corriente o sin saldo pendiente.');
        }
      } else {
        setMensajeAdeudo(resp.mensajeProveedor || 'No se obtuvo información de adeudo para esta referencia.');
      }
    } catch (err: unknown) {
      setErrorServicio(err instanceof Error ? err.message : 'Error al consultar adeudo en línea.');
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
      setErrorServicio('Ingrese un monto válido mayor a $0.00 para el recibo.');
      return;
    }

    if (!referenciaRecibo.trim()) {
      setErrorServicio('Ingrese o escanee la referencia del recibo.');
      return;
    }

    setProcesandoServicio(true);
    try {
      const respuesta = await servicioRecargasYServicios.procesarPagoServicio({
        codigoServicio: servicioSeleccionado,
        referenciaRecibo: referenciaRecibo.trim(),
        montoRecibo: montoNum,
        comision: comisionServicio,
      });
      setResultadoServicio(respuesta);
      cargarDatos();
    } catch (err: unknown) {
      setErrorServicio(err instanceof Error ? err.message : 'Error al procesar pago de servicio.');
    } finally {
      setProcesandoServicio(false);
    }
  };

  const sincronizarCatalogoRnp = async () => {
    setSincronizandoCatalogo(true);
    setMensajeSincronizacion(null);
    try {
      const total = await servicioRecargasYServicios.sincronizarCatalogo();
      setMensajeSincronizacion(`Catálogo RNP sincronizado con éxito (${total} productos guardados en BD).`);
      cargarDatos();
    } catch (err: unknown) {
      setMensajeSincronizacion(err instanceof Error ? err.message : 'Error al sincronizar catálogo con RNP.');
    } finally {
      setSincronizandoCatalogo(false);
    }
  };

  const formatearDinero = (monto: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(monto);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      {/* Cabecera del módulo */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Zap size={28} style={{ color: 'var(--color-primario)' }} />
            <h1 style={{ fontSize: '1.6rem', fontWeight: 700, margin: 0 }}>
              Recargas y Pago de Servicios
            </h1>
          </div>
          <p style={{ color: 'var(--color-texto-secundario)', margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>
            Integración con Red Nacional de Pagos (RNP / VentaMovil) · Tiempo aire, cobro de recibos y bitácora de auditoría
          </p>
        </div>

        <button
          type="button"
          className="btn btn-secundario"
          onClick={() => {
            cargarDatos();
            if (pestaña === 'historial' || pestaña === 'bitacora') cargarHistorial();
          }}
          disabled={cargandoEstado}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <RefreshCw size={16} className={cargandoEstado ? 'animacion-giratoria' : ''} />
          <span>Actualizar Estado</span>
        </button>
      </div>

      {/* Banner de estado de conexión del proveedor comercial */}
      <div
        className="tarjeta"
        style={{
          padding: '1rem 1.25rem',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: estadoIntegracion?.estaConfigurado
            ? 'rgba(16, 185, 129, 0.08)'
            : 'rgba(59, 130, 246, 0.08)',
          border: estadoIntegracion?.estaConfigurado
            ? '1px solid rgba(16, 185, 129, 0.3)'
            : '1px solid rgba(59, 130, 246, 0.3)',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {estadoIntegracion?.estaConfigurado ? (
            <CheckCircle size={24} style={{ color: '#059669' }} />
          ) : (
            <Server size={24} style={{ color: 'var(--color-primario)' }} />
          )}
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--color-texto-principal)' }}>
              {estadoIntegracion?.estaConfigurado
                ? 'Conexión con Red Nacional de Pagos (RNP) Activa'
                : 'Módulo Preparado para Integración (En Espera de Contratación)'}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-texto-secundario)', marginTop: '0.15rem' }}>
              {estadoIntegracion?.mensajeEstatus ||
                'Web Services SOAP (.asmx) conectados con tolerancia a fallos y persistencia de Folio_POS.'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-texto-secundario)', textTransform: 'uppercase' }}>
              Saldo Bolsa Prepago RNP
            </span>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-exito)' }}>
              {formatearDinero(estadoIntegracion?.saldoBolsaDisponible || 0)}
            </div>
          </div>
          <button
            type="button"
            className="btn btn-secundario"
            onClick={() => setPestaña('integracion')}
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
          >
            Detalles API
          </button>
        </div>
      </div>

      {/* Selector de pestañas */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--color-borde)', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          className={`btn ${pestaña === 'recargas' ? 'btn-primario' : 'btn-secundario'}`}
          onClick={() => setPestaña('recargas')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.1rem' }}
        >
          <Smartphone size={17} />
          <span>Tiempo Aire</span>
        </button>

        <button
          type="button"
          className={`btn ${pestaña === 'servicios' ? 'btn-primario' : 'btn-secundario'}`}
          onClick={() => setPestaña('servicios')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.1rem' }}
        >
          <Receipt size={17} />
          <span>Pago de Servicios</span>
        </button>

        <button
          type="button"
          className={`btn ${pestaña === 'catalogo' ? 'btn-primario' : 'btn-secundario'}`}
          onClick={() => setPestaña('catalogo')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.1rem' }}
        >
          <Layers size={17} />
          <span>Catálogo RNP (Mosaico)</span>
        </button>

        <button
          type="button"
          className={`btn ${pestaña === 'historial' ? 'btn-primario' : 'btn-secundario'}`}
          onClick={() => setPestaña('historial')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.1rem' }}
        >
          <History size={17} />
          <span>Historial de Transacciones</span>
        </button>

        <button
          type="button"
          className={`btn ${pestaña === 'bitacora' ? 'btn-primario' : 'btn-secundario'}`}
          onClick={() => setPestaña('bitacora')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.1rem' }}
        >
          <FileText size={17} />
          <span>Bitácora & Errores</span>
        </button>

        <button
          type="button"
          className={`btn ${pestaña === 'integracion' ? 'btn-primario' : 'btn-secundario'}`}
          onClick={() => setPestaña('integracion')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.1rem' }}
        >
          <Server size={17} />
          <span>Configuración RNP</span>
        </button>
      </div>

      {/* PESTAÑA 1: RECARGAS ELECTRÓNICAS */}
      {pestaña === 'recargas' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(300px, 1fr)', gap: '1.5rem' }}>
          {/* Panel Izquierdo: Formulario de Recarga */}
          <div className="tarjeta" style={{ margin: 0, padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <PhoneCall size={20} style={{ color: 'var(--color-primario)' }} />
              <span>Solicitar Recarga de Tiempo Aire</span>
            </h3>

            {errorRecarga && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid var(--color-peligro)',
                  borderRadius: '6px',
                  color: 'var(--color-peligro)',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '1rem',
                }}
              >
                <AlertTriangle size={16} />
                <span>{errorRecarga}</span>
              </div>
            )}

            <form onSubmit={ejecutarRecarga} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Selección de Compañía mediante Mosaico Visual */}
              <div className="grupo-formulario">
                <label className="etiqueta-formulario">
                  <span>Compañía Telefónica (Operador):</span>
                  {companiaActual && (
                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      Seleccionada: <strong style={{ color: companiaActual.colorTexto }}>{companiaActual.nombre}</strong>
                    </span>
                  )}
                </label>
                <div className="mosaico-companias-grid" style={{ marginTop: '0.35rem' }}>
                  {companias.map((c) => {
                    const esSeleccionada = companiaSeleccionada === c.codigo;
                    return (
                      <div
                        key={c.codigo}
                        className={`tarjeta-mosaico-compania ${esSeleccionada ? 'seleccionada' : ''}`}
                        onClick={() => {
                          setCompaniaSeleccionada(c.codigo);
                          if (!c.montosDisponibles.includes(montoRecarga) && c.montosDisponibles.length > 0) {
                            setMontoRecarga(c.montosDisponibles[0]);
                          }
                        }}
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
                          <IconoCompania tipo={c.iconoTipo} size={32} />
                        </div>

                        <span
                          style={{
                            fontSize: '0.85rem',
                            fontWeight: esSeleccionada ? 800 : 600,
                            color: esSeleccionada ? c.colorTexto : '#0f172a',
                          }}
                        >
                          {c.nombre}
                        </span>

                        <span
                          style={{
                            fontSize: '0.68rem',
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

              {/* Teléfono y Confirmación en 2 Columnas */}
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

              {/* Montos Predefinidos con Selector Mosaico */}
              <div className="grupo-formulario">
                <label className="etiqueta-formulario">
                  <span>Monto a Recargar:</span>
                  <span style={{ fontSize: '0.85rem', color: '#059669', fontWeight: 700 }}>
                    Monto seleccionado: {formatearDinero(montoRecarga)} MXN
                  </span>
                </label>
                <div className="mosaico-montos-grid" style={{ marginTop: '0.35rem' }}>
                  {montosActuales.map((m) => {
                    const esActivo = montoRecarga === m;
                    return (
                      <button
                        key={m}
                        type="button"
                        className={`boton-monto-recarga ${esActivo ? 'activo' : ''}`}
                        onClick={() => setMontoRecarga(m)}
                        style={{
                          backgroundColor: esActivo ? (companiaActual?.colorPrimario || 'var(--color-primario)') : '#ffffff',
                          borderColor: esActivo ? (companiaActual?.colorPrimario || 'var(--color-primario)') : '#cbd5e1',
                          color: esActivo ? '#ffffff' : '#0f172a',
                        }}
                      >
                        ${m}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Botón de Enviar */}
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
                  backgroundColor: companiaActual?.colorPrimario || 'var(--color-primario)',
                  borderColor: companiaActual?.colorPrimario || 'var(--color-primario)',
                }}
              >
                {procesandoRecarga ? (
                  <>
                    <div className="animacion-giratoria" style={{ width: '20px', height: '20px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%' }} />
                    <span>Enviando Transacción a RNP...</span>
                  </>
                ) : (
                  <>
                    <Zap size={20} />
                    <span>Aplicar Recarga de {formatearDinero(montoRecarga)} MXN</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Panel Derecho: Comprobante de Recarga */}
          <div className="tarjeta" style={{ margin: 0, padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={20} style={{ color: 'var(--color-exito)' }} />
              <span>Comprobante de Recarga</span>
            </h3>

            {resultadoRecarga ? (
              <div
                style={{
                  border: '1px solid var(--color-borde)',
                  borderRadius: '8px',
                  padding: '1.25rem',
                  backgroundColor: resultadoRecarga.exito ? 'rgba(16, 185, 129, 0.05)' : 'rgba(245, 158, 11, 0.06)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
                  {resultadoRecarga.exito ? (
                    <CheckCircle size={24} style={{ color: '#059669' }} />
                  ) : (
                    <AlertTriangle size={24} style={{ color: '#d97706' }} />
                  )}
                  <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
                    {resultadoRecarga.exito ? 'Recarga Exitosa' : 'Respuesta del Proveedor'}
                  </h4>
                </div>

                <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: 'var(--color-texto-secundario)', lineHeight: 1.5 }}>
                  {resultadoRecarga.mensaje}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem' }}>
                  <div>
                    <span style={{ color: 'var(--color-texto-secundario)' }}>Operadora:</span>
                    <div style={{ fontWeight: 600 }}>{resultadoRecarga.compania}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--color-texto-secundario)' }}>Número:</span>
                    <div style={{ fontWeight: 600 }}>{resultadoRecarga.numeroTelefono}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--color-texto-secundario)' }}>Folio RNP:</span>
                    <div style={{ fontWeight: 600 }}>{resultadoRecarga.folioProveedor || 'N/A'}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--color-texto-secundario)' }}>Folio Carrier:</span>
                    <div style={{ fontWeight: 600 }}>{resultadoRecarga.codigoAutorizacion || 'N/A'}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--color-texto-secundario)' }}>Monto:</span>
                    <div style={{ fontWeight: 700, color: 'var(--color-exito)' }}>
                      {formatearDinero(resultadoRecarga.monto)}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--color-texto-secundario)' }}>Fecha y Hora:</span>
                    <div style={{ fontWeight: 600 }}>
                      {new Date(resultadoRecarga.fechaHora).toLocaleTimeString('es-MX')}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-texto-secundario)', margin: 'auto 0' }}>
                <Smartphone size={48} style={{ opacity: 0.35, marginBottom: '0.75rem' }} />
                <h4 style={{ margin: '0 0 0.4rem 0', fontWeight: 600 }}>Sin operaciones recientes</h4>
                <p style={{ margin: 0, fontSize: '0.85rem', maxWidth: '320px', marginInline: 'auto' }}>
                  Al procesar una recarga telefónica, los folios de autorización de RNP y de la compañía telefónica se mostrarán aquí.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PESTAÑA 2: PAGO DE SERVICIOS */}
      {pestaña === 'servicios' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(300px, 1fr)', gap: '1.5rem' }}>
          {/* Panel Izquierdo: Formulario de Servicio */}
          <div className="tarjeta" style={{ margin: 0, padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Receipt size={20} style={{ color: 'var(--color-primario)' }} />
              <span>Cobro de Recibos y Servicios Públicos</span>
            </h3>

            {errorServicio && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid var(--color-peligro)',
                  borderRadius: '6px',
                  color: 'var(--color-peligro)',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '1rem',
                }}
              >
                <AlertTriangle size={16} />
                <span>{errorServicio}</span>
              </div>
            )}

            {mensajeAdeudo && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '6px',
                  color: 'var(--color-exito)',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '1rem',
                }}
              >
                <Info size={16} />
                <span>{mensajeAdeudo}</span>
              </div>
            )}

            <form onSubmit={ejecutarPagoServicio} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Selección de Servicio */}
              <div className="grupo-formulario">
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Empresa / Servicio a Pagar:</label>
                <select
                  className="control-formulario"
                  value={servicioSeleccionado}
                  onChange={(e) => manejarCambioServicio(e.target.value)}
                  style={{ marginTop: '0.35rem' }}
                >
                  {servicios.map((s) => (
                    <option key={s.codigo} value={s.codigo}>
                      {s.nombre} ({s.categoria})
                    </option>
                  ))}
                </select>
              </div>

              {/* Referencia o Código de Barras + Botón Consultar Adeudo */}
              <div className="grupo-formulario">
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  Referencia o Código de Barras del Recibo:
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.35rem' }}>
                  <input
                    type="text"
                    className="control-formulario"
                    placeholder={servicioActual?.formatoReferencia || 'Escanee o teclee la referencia'}
                    value={referenciaRecibo}
                    onChange={(e) => setReferenciaRecibo(e.target.value)}
                    style={{ fontSize: '1rem', fontFamily: 'monospace' }}
                    required
                  />
                  <button
                    type="button"
                    className="btn btn-secundario"
                    onClick={consultarAdeudoEnLinea}
                    disabled={consultandoAdeudo}
                    title="Consulta el saldo pendiente del recibo ante el proveedor"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', whiteSpace: 'nowrap', padding: '0.5rem 0.75rem' }}
                  >
                    <Search size={15} className={consultandoAdeudo ? 'animacion-giratoria' : ''} />
                    <span>{consultandoAdeudo ? 'Consultando...' : 'Consultar Adeudo'}</span>
                  </button>
                </div>
                <small style={{ color: 'var(--color-texto-secundario)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                  Soporta Sky, Izzi, Megacable, CFE, Totalplay y convenios de agua municipal.
                </small>
              </div>

              {/* Montos y Comisión */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="grupo-formulario">
                  <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Monto del Recibo ($):</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    className="control-formulario"
                    placeholder="0.00"
                    value={montoServicio}
                    onChange={(e) => setMontoServicio(e.target.value)}
                    style={{ marginTop: '0.35rem', fontSize: '1.1rem', fontWeight: 700 }}
                    required
                  />
                </div>

                <div className="grupo-formulario">
                  <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Comisión del Servicio ($):</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    className="control-formulario"
                    value={comisionServicio}
                    onChange={(e) => setComisionServicio(Number(e.target.value))}
                    style={{ marginTop: '0.35rem', fontSize: '1.1rem', fontWeight: 700 }}
                  />
                </div>
              </div>

              {/* Total a Cobrar al Cliente */}
              <div
                style={{
                  padding: '1rem',
                  backgroundColor: 'var(--color-fondo-suave)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  border: '1px solid var(--color-borde)',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-texto-secundario)', textTransform: 'uppercase' }}>
                    Total a Cobrar en Caja
                  </span>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-texto-secundario)' }}>
                    Recibo + ${comisionServicio} comisión
                  </div>
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-exito)' }}>
                  {formatearDinero((parseFloat(montoServicio) || 0) + comisionServicio)}
                </div>
              </div>

              {/* Botón de Pago */}
              <button
                type="submit"
                className="btn btn-primario"
                disabled={procesandoServicio}
                style={{
                  padding: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  fontSize: '1rem',
                  fontWeight: 600,
                }}
              >
                {procesandoServicio ? (
                  <>
                    <div className="animacion-giratoria" style={{ width: '18px', height: '18px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%' }} />
                    <span>Dispersando Pago en RNP...</span>
                  </>
                ) : (
                  <>
                    <DollarSign size={18} />
                    <span>Cobrar y Aplicar Pago de Servicio</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Panel Derecho: Comprobante de Servicio */}
          <div className="tarjeta" style={{ margin: 0, padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={20} style={{ color: 'var(--color-exito)' }} />
              <span>Comprobante de Servicio</span>
            </h3>

            {resultadoServicio ? (
              <div
                style={{
                  border: '1px solid var(--color-borde)',
                  borderRadius: '8px',
                  padding: '1.25rem',
                  backgroundColor: resultadoServicio.exito ? 'rgba(16, 185, 129, 0.05)' : 'rgba(245, 158, 11, 0.06)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
                  {resultadoServicio.exito ? (
                    <CheckCircle size={24} style={{ color: '#059669' }} />
                  ) : (
                    <AlertTriangle size={24} style={{ color: '#d97706' }} />
                  )}
                  <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
                    {resultadoServicio.exito ? 'Pago Aplicado Correctamente' : 'Respuesta del Proveedor'}
                  </h4>
                </div>

                <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: 'var(--color-texto-secundario)', lineHeight: 1.5 }}>
                  {resultadoServicio.mensaje}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem' }}>
                  <div>
                    <span style={{ color: 'var(--color-texto-secundario)' }}>Servicio:</span>
                    <div style={{ fontWeight: 600 }}>{resultadoServicio.servicio}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--color-texto-secundario)' }}>Referencia:</span>
                    <div style={{ fontWeight: 600, fontFamily: 'monospace' }}>{resultadoServicio.referencia}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--color-texto-secundario)' }}>Folio Autorización:</span>
                    <div style={{ fontWeight: 600 }}>{resultadoServicio.folioAutorizacion || 'N/A'}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--color-texto-secundario)' }}>Total Cobrado:</span>
                    <div style={{ fontWeight: 700, color: 'var(--color-exito)' }}>
                      {formatearDinero(resultadoServicio.totalCobrado)}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--color-texto-secundario)' }}>Fecha:</span>
                    <div style={{ fontWeight: 600 }}>
                      {new Date(resultadoServicio.fechaHora).toLocaleTimeString('es-MX')}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-texto-secundario)', margin: 'auto 0' }}>
                <Receipt size={48} style={{ opacity: 0.35, marginBottom: '0.75rem' }} />
                <h4 style={{ margin: '0 0 0.4rem 0', fontWeight: 600 }}>Sin recibos cobrados recientemente</h4>
                <p style={{ margin: 0, fontSize: '0.85rem', maxWidth: '320px', marginInline: 'auto' }}>
                  Al registrar el cobro de un recibo (CFE, Agua, Telmex), el comprobante con folio de autorización y desglose de comisión se generará aquí.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PESTAÑA: CATÁLOGO COMPLETO EN MOSAICO */}
      {pestaña === 'catalogo' && (
        <div className="tarjeta" style={{ margin: 0, padding: '1.5rem' }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Layers size={22} style={{ color: 'var(--color-primario)' }} />
              <span>Explorador de Catálogo Oficial RNP en Modo Mosaico</span>
            </h3>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--color-texto-secundario)' }}>
              Filtre por nombre de empresa o categoría, verifique comisiones recomendadas y sincronice en tiempo real con Red Nacional de Pagos.
            </p>
          </div>
          <VentanaMosaicoCatalogo
            onSeleccionarServicio={(serv) => {
              setServicioSeleccionado(serv.codigo);
              setComisionServicio(serv.comisionRecomendada || 12);
              setPestaña('servicios');
            }}
            onSeleccionarCompania={(comp) => {
              setCompaniaSeleccionada(comp.codigo);
              setPestaña('recargas');
            }}
            onSincronizacionCompletada={() => {
              cargarDatos();
            }}
          />
        </div>
      )}

      {/* PESTAÑA 3: HISTORIAL DE TRANSACCIONES */}
      {pestaña === 'historial' && (
        <div className="tarjeta" style={{ margin: 0, padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Historial Transaccional de Servicios & Recargas</h3>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: 'var(--color-texto-secundario)' }}>
                Operaciones persistidas con Folio_POS, códigos de respuesta de RNP y folios devueltos por el carrier.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-secundario"
              onClick={cargarHistorial}
              disabled={cargandoAuditoria}
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem' }}
            >
              <RefreshCw size={14} className={cargandoAuditoria ? 'animacion-giratoria' : ''} />
              <span>Actualizar Tabla</span>
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="tabla-general" style={{ width: '100%', fontSize: '0.85rem' }}>
              <thead>
                <tr>
                  <th>Folio POS</th>
                  <th>Tipo</th>
                  <th>Carrier</th>
                  <th>Referencia</th>
                  <th>Monto</th>
                  <th>Estado</th>
                  <th>Cód. RNP</th>
                  <th>Folio Prov.</th>
                  <th>Folio Carrier</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {transacciones.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-texto-secundario)' }}>
                      No hay transacciones registradas en el periodo actual.
                    </td>
                  </tr>
                ) : (
                  transacciones.map((tx) => (
                    <tr key={tx.idTransaccionServicio}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{tx.folioPos}</td>
                      <td>
                        <span
                          style={{
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            backgroundColor: tx.tipoTransaccion === 'RECARGA' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(168, 85, 247, 0.15)',
                            color: tx.tipoTransaccion === 'RECARGA' ? '#2563eb' : '#7e22ce',
                          }}
                        >
                          {tx.tipoTransaccion}
                        </span>
                      </td>
                      <td>{tx.carrierNombre}</td>
                      <td style={{ fontFamily: 'monospace' }}>{tx.referencia}</td>
                      <td style={{ fontWeight: 700 }}>{formatearDinero(tx.monto)}</td>
                      <td>
                        <span
                          style={{
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            backgroundColor:
                              tx.estado === 'EXITOSA'
                                ? 'rgba(16, 185, 129, 0.15)'
                                : tx.estado === 'EN_ESPERA'
                                ? 'rgba(245, 158, 11, 0.15)'
                                : 'rgba(239, 68, 68, 0.15)',
                            color:
                              tx.estado === 'EXITOSA'
                                ? '#059669'
                                : tx.estado === 'EN_ESPERA'
                                ? '#d97706'
                                : '#dc2626',
                          }}
                        >
                          {tx.estado}
                        </span>
                      </td>
                      <td>{tx.codigoRespuesta || '-'}</td>
                      <td>{tx.folioProveedor || '-'}</td>
                      <td>{tx.folioCarrier || '-'}</td>
                      <td>{new Date(tx.fechaCreacion).toLocaleString('es-MX')}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PESTAÑA 4: BITÁCORA Y ERRORES */}
      {pestaña === 'bitacora' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1.2fr) minmax(300px, 1fr)', gap: '1.5rem' }}>
          {/* Bitácora de Eventos */}
          <div className="tarjeta" style={{ margin: 0, padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={20} style={{ color: 'var(--color-primario)' }} />
              <span>Bitácora de Operaciones (Auditoría)</span>
            </h3>

            <div style={{ maxHeight: '450px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {bitacora.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-texto-secundario)' }}>
                  Sin eventos en la bitácora.
                </div>
              ) : (
                bitacora.map((b) => (
                  <div
                    key={b.idBitacoraServicio}
                    style={{
                      padding: '0.75rem',
                      border: '1px solid var(--color-borde)',
                      borderRadius: '6px',
                      backgroundColor: 'var(--color-fondo-suave)',
                      fontSize: '0.85rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: 700, color: 'var(--color-primario)' }}>{b.accion}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-texto-secundario)' }}>
                        {new Date(b.fechaHora).toLocaleTimeString('es-MX')}
                      </span>
                    </div>
                    <div style={{ color: 'var(--color-texto-principal)' }}>{b.mensaje}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-texto-secundario)', marginTop: '0.25rem', fontFamily: 'monospace' }}>
                      Folio_POS: {b.folioPos}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Log de Errores Técnicos */}
          <div className="tarjeta" style={{ margin: 0, padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={20} style={{ color: 'var(--color-peligro)' }} />
              <span>Log de Errores & Excepciones SOAP</span>
            </h3>

            <div style={{ maxHeight: '450px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {errores.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-exito)' }}>
                  <CheckCircle size={32} style={{ margin: '0 auto 0.5rem auto', opacity: 0.8 }} />
                  <div>No se han registrado errores técnicos recientes.</div>
                </div>
              ) : (
                errores.map((err) => (
                  <div
                    key={err.idLogError}
                    style={{
                      padding: '0.75rem',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(239, 68, 68, 0.05)',
                      fontSize: '0.85rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: 700, color: 'var(--color-peligro)' }}>
                        [{err.tipoError}] {err.codigoError || ''}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-texto-secundario)' }}>
                        {new Date(err.fechaHora).toLocaleTimeString('es-MX')}
                      </span>
                    </div>
                    <div style={{ fontWeight: 600, color: 'var(--color-texto-principal)' }}>{err.metodoSoap}</div>
                    <div style={{ color: 'var(--color-peligro)', marginTop: '0.2rem' }}>{err.mensajeError}</div>
                    {err.folioPos && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-texto-secundario)', marginTop: '0.25rem', fontFamily: 'monospace' }}>
                        Folio_POS: {err.folioPos}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA 5: CONFIGURACIÓN E INTEGRACIÓN RNP */}
      {pestaña === 'integracion' && (
        <div className="tarjeta" style={{ margin: 0, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <h3 style={{ margin: '0 0 0.35rem 0', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Server size={22} style={{ color: 'var(--color-primario)' }} />
              <span>Configuración del Web Service Red Nacional de Pagos (RNP)</span>
            </h3>
            <p style={{ margin: 0, color: 'var(--color-texto-secundario)', fontSize: '0.875rem' }}>
              Credenciales asignadas a Aaron Arenas Martínez para el ambiente de certificación y producción.
            </p>
          </div>

          {mensajeSincronizacion && (
            <div
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid var(--color-exito)',
                borderRadius: '6px',
                color: 'var(--color-exito)',
                fontSize: '0.85rem',
              }}
            >
              {mensajeSincronizacion}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            <div style={{ padding: '1rem', border: '1px solid var(--color-borde)', borderRadius: '8px', backgroundColor: 'var(--color-fondo-suave)' }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.5rem', color: 'var(--color-primario)' }}>
                1. Endpoint WSDL y Métodos SOAP
              </div>
              <ul style={{ fontSize: '0.85rem', color: 'var(--color-texto-secundario)', lineHeight: 1.6, margin: 0, paddingLeft: '1.2rem' }}>
                <li><strong>Endpoint:</strong> http://ws_stage.cloud-services.mx:9192/service.asmx</li>
                <li><strong>Protocolo:</strong> SOAP 1.1 con envolvente <code>&lt;jrquest&gt;</code> en JSON</li>
                <li><strong>Operaciones:</strong> Request_Transaction, check_transaction, Check_Balance, pos_prices_products, check_service_pending_amount</li>
              </ul>
            </div>

            <div style={{ padding: '1rem', border: '1px solid var(--color-borde)', borderRadius: '8px', backgroundColor: 'var(--color-fondo-suave)' }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.5rem', color: 'var(--color-exito)' }}>
                2. Reglas de Transacción y Conexión
              </div>
              <ul style={{ fontSize: '0.85rem', color: 'var(--color-texto-secundario)', lineHeight: 1.6, margin: 0, paddingLeft: '1.2rem' }}>
                <li><strong>Prefijo Folio_POS:</strong> <code>10008</code> + ID único persistido antes de enviar</li>
                <li><strong>Respuesta 24 (En espera):</strong> Polling cada 2s hasta 90s</li>
                <li><strong>Tolerancia a Caídas:</strong> Verificación de estado obligatoria sin reenviar venta</li>
              </ul>
            </div>

            <div style={{ padding: '1rem', border: '1px solid var(--color-borde)', borderRadius: '8px', backgroundColor: 'var(--color-fondo-suave)' }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.5rem', color: 'var(--color-advertencia)' }}>
                3. Sincronización de Catálogo RNP
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-texto-secundario)', margin: '0 0 0.75rem 0' }}>
                Descargue los 412 productos y operadoras autorizadas directamente desde los servidores de RNP.
              </p>
              <button
                type="button"
                className="btn btn-primario"
                onClick={sincronizarCatalogoRnp}
                disabled={sincronizandoCatalogo}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
              >
                <Database size={15} className={sincronizandoCatalogo ? 'animacion-giratoria' : ''} />
                <span>{sincronizandoCatalogo ? 'Sincronizando...' : 'Sincronizar Catálogo RNP'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
