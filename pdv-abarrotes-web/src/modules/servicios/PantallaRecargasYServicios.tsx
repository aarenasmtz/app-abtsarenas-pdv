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
  Send,
  Building,
} from 'lucide-react';
import { servicioRecargasYServicios } from './servicioRecargasYServicios';
import type {
  EstadoIntegracionServiciosDto,
  CompaniaTelefonicaDto,
  CatalogoServicioDto,
  ResultadoRecargaDto,
  ResultadoPagoServicioDto,
} from './tiposServicios';

export const PantallaRecargasYServicios: React.FC = () => {
  const [pestaña, setPestaña] = useState<'recargas' | 'servicios' | 'integracion'>('recargas');

  // Estado de integración del proveedor
  const [estadoIntegracion, setEstadoIntegracion] = useState<EstadoIntegracionServiciosDto | null>(null);
  const [cargandoEstado, setCargandoEstado] = useState<boolean>(true);

  // Catálogos
  const [companias, setCompanias] = useState<CompaniaTelefonicaDto[]>([]);
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
  const [resultadoServicio, setResultadoServicio] = useState<ResultadoPagoServicioDto | null>(null);
  const [errorServicio, setErrorServicio] = useState<string | null>(null);

  const cargarDatos = async () => {
    setCargandoEstado(true);
    try {
      const [estado, companiasData, serviciosData] = await Promise.all([
        servicioRecargasYServicios.obtenerEstado(),
        servicioRecargasYServicios.obtenerCompanias(),
        servicioRecargasYServicios.obtenerCatalogoServicios(),
      ]);
      setEstadoIntegracion(estado);
      setCompanias(companiasData);
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

  useEffect(() => {
    cargarDatos();
  }, []);

  const companiaActual = companias.find((c) => c.codigo === companiaSeleccionada);
  const montosActuales = companiaActual?.montosDisponibles || [20, 30, 50, 100, 200, 500];

  const servicioActual = servicios.find((s) => s.codigo === servicioSeleccionado);

  const manejarCambioServicio = (codigo: string) => {
    setServicioSeleccionado(codigo);
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
    } catch (err: unknown) {
      setErrorRecarga(err instanceof Error ? err.message : 'Error al procesar recarga.');
    } finally {
      setProcesandoRecarga(false);
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
    } catch (err: unknown) {
      setErrorServicio(err instanceof Error ? err.message : 'Error al procesar pago de servicio.');
    } finally {
      setProcesandoServicio(false);
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
            Venta de tiempo aire electrónico para telefonía móvil y recepción de recibos de servicios públicos en caja
          </p>
        </div>

        <button
          type="button"
          className="btn btn-secundario"
          onClick={cargarDatos}
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
                ? 'Conexión con Proveedor Externo Activa'
                : 'Módulo Preparado para Integración (En Espera de Contratación)'}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-texto-secundario)', marginTop: '0.15rem' }}>
              {estadoIntegracion?.mensajeEstatus ||
                'Interfaces y contratos listos para conectar las credenciales del proveedor comercial.'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-texto-secundario)', textTransform: 'uppercase' }}>
              Saldo Bolsa Prepago
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
            Ver Detalles de API
          </button>
        </div>
      </div>

      {/* Selector de pestañas */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--color-borde)', paddingBottom: '0.5rem' }}>
        <button
          type="button"
          className={`btn ${pestaña === 'recargas' ? 'btn-primario' : 'btn-secundario'}`}
          onClick={() => setPestaña('recargas')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.25rem' }}
        >
          <Smartphone size={17} />
          <span>Tiempo Aire Electrónico</span>
        </button>

        <button
          type="button"
          className={`btn ${pestaña === 'servicios' ? 'btn-primario' : 'btn-secundario'}`}
          onClick={() => setPestaña('servicios')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.25rem' }}
        >
          <Receipt size={17} />
          <span>Pago de Servicios Públicos</span>
        </button>

        <button
          type="button"
          className={`btn ${pestaña === 'integracion' ? 'btn-primario' : 'btn-secundario'}`}
          onClick={() => setPestaña('integracion')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.25rem' }}
        >
          <Server size={17} />
          <span>Configuración & Guía de Proveedor</span>
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
              {/* Selección de Compañía */}
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-texto-secundario)' }}>
                  Compañía Operadora:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {companias.map((c) => (
                    <button
                      key={c.codigo}
                      type="button"
                      onClick={() => setCompaniaSeleccionada(c.codigo)}
                      style={{
                        padding: '0.6rem 0.5rem',
                        borderRadius: '8px',
                        border: companiaSeleccionada === c.codigo ? '2px solid var(--color-primario)' : '1px solid var(--color-borde)',
                        backgroundColor: companiaSeleccionada === c.codigo ? 'rgba(59, 130, 246, 0.1)' : 'var(--color-fondo-suave)',
                        color: companiaSeleccionada === c.codigo ? 'var(--color-primario)' : 'var(--color-texto-principal)',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        textAlign: 'center',
                      }}
                    >
                      {c.nombre.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Teléfono */}
              <div className="grupo-formulario">
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  Número de Teléfono Celular (10 dígitos):
                </label>
                <input
                  type="tel"
                  className="control-formulario"
                  placeholder="Ej. 4771234567"
                  maxLength={10}
                  value={numeroTelefono}
                  onChange={(e) => setNumeroTelefono(e.target.value.replace(/\D/g, ''))}
                  style={{ fontSize: '1.1rem', letterSpacing: '0.1em', fontWeight: 600 }}
                  required
                />
              </div>

              {/* Confirmación de Teléfono */}
              <div className="grupo-formulario">
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  Confirmar Número de Celular:
                </label>
                <input
                  type="tel"
                  className="control-formulario"
                  placeholder="Reescriba el mismo número"
                  maxLength={10}
                  value={confirmarNumero}
                  onChange={(e) => setConfirmarNumero(e.target.value.replace(/\D/g, ''))}
                  style={{ fontSize: '1.1rem', letterSpacing: '0.1em', fontWeight: 600 }}
                  required
                />
              </div>

              {/* Montos Rápidos */}
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-texto-secundario)' }}>
                  Monto de Recarga:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {montosActuales.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMontoRecarga(m)}
                      style={{
                        padding: '0.65rem 0.5rem',
                        borderRadius: '8px',
                        border: montoRecarga === m ? '2px solid var(--color-exito)' : '1px solid var(--color-borde)',
                        backgroundColor: montoRecarga === m ? 'rgba(16, 185, 129, 0.12)' : 'var(--color-fondo-suave)',
                        color: montoRecarga === m ? '#059669' : 'var(--color-texto-principal)',
                        fontWeight: 700,
                        fontSize: '1rem',
                        cursor: 'pointer',
                      }}
                    >
                      ${m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Botón de Enviar */}
              <button
                type="submit"
                className="btn btn-primario"
                disabled={procesandoRecarga}
                style={{
                  padding: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  fontSize: '1rem',
                  fontWeight: 600,
                  marginTop: '0.5rem',
                }}
              >
                {procesandoRecarga ? (
                  <>
                    <div className="animacion-giratoria" style={{ width: '18px', height: '18px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%' }} />
                    <span>Conectando con Proveedor...</span>
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    <span>Enviar Recarga de ${montoRecarga} MXN</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Panel Derecho: Resultado y Comprobante */}
          <div className="tarjeta" style={{ margin: 0, padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={20} style={{ color: 'var(--color-exito)' }} />
              <span>Estado de la Transacción</span>
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
                  Al procesar una recarga telefónica, los detalles de autorización, folio y saldo restante se mostrarán aquí.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PESTAÑA 2: PAGO DE SERVICIOS PÚBLICOS */}
      {pestaña === 'servicios' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(300px, 1fr)', gap: '1.5rem' }}>
          {/* Panel Izquierdo: Formulario de Servicio */}
          <div className="tarjeta" style={{ margin: 0, padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Receipt size={20} style={{ color: 'var(--color-primario)' }} />
              <span>Cobro de Recibos y Servicios</span>
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

            <form onSubmit={ejecutarPagoServicio} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Selección de Servicio */}
              <div className="grupo-formulario">
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  Empresa / Servicio a Pagar:
                </label>
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

              {/* Referencia o Código de Barras */}
              <div className="grupo-formulario">
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  Referencia o Código de Barras del Recibo:
                </label>
                <input
                  type="text"
                  className="control-formulario"
                  placeholder={servicioActual?.formatoReferencia || 'Escanee o teclee la referencia'}
                  value={referenciaRecibo}
                  onChange={(e) => setReferenciaRecibo(e.target.value)}
                  style={{ marginTop: '0.35rem', fontSize: '1rem', fontFamily: 'monospace' }}
                  required
                />
                <small style={{ color: 'var(--color-texto-secundario)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                  Puede usar la pistola de código de barras para leer el código inferior del recibo.
                </small>
              </div>

              {/* Montos y Comisión */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="grupo-formulario">
                  <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                    Monto del Recibo ($):
                  </label>
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
                  <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                    Comisión del Servicio ($):
                  </label>
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
                    <span>Procesando Pago de Servicio...</span>
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
                  Al registrar el cobro de un recibo (CFE, Agua, Telmex), el comprobante con folio y desglose de comisión se generará aquí.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PESTAÑA 3: ARQUITECTURA DE INTEGRACIÓN */}
      {pestaña === 'integracion' && (
        <div className="tarjeta" style={{ margin: 0, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <h3 style={{ margin: '0 0 0.35rem 0', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Building size={22} style={{ color: 'var(--color-primario)' }} />
              <span>Arquitectura Desacoplada de Proveedores Externos</span>
            </h3>
            <p style={{ margin: 0, color: 'var(--color-texto-secundario)', fontSize: '0.875rem' }}>
              Especificación técnica de cómo se enlazará la API comercial cuando el negocio firme el contrato con el proveedor mayorista.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1rem',
            }}
          >
            <div style={{ padding: '1rem', border: '1px solid var(--color-borde)', borderRadius: '8px', backgroundColor: 'var(--color-fondo-suave)' }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.5rem', color: 'var(--color-primario)' }}>
                1. Contratos e Interfaces en C#
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-texto-secundario)', lineHeight: 1.4, margin: 0 }}>
                El sistema ya cuenta con <code>IProveedorRecargas</code> e <code>IProveedorServicios</code>.
                Al contratar al proveedor (ej. TAE México, Qiubo o RecargaPlus), solo se crea una clase que implemente dichos métodos y se inyecta en <code>ConfiguracionInfraestructura.cs</code>.
              </p>
            </div>

            <div style={{ padding: '1rem', border: '1px solid var(--color-borde)', borderRadius: '8px', backgroundColor: 'var(--color-fondo-suave)' }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.5rem', color: 'var(--color-exito)' }}>
                2. Modelo de Bolsa Prepago
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-texto-secundario)', lineHeight: 1.4, margin: 0 }}>
                La tienda deposita saldo a la cuenta concentradora del proveedor mayorista. Cada recarga descuenta el importe de la bolsa y suma el efectivo cobrado al turno activo de la caja en el PDV.
              </p>
            </div>

            <div style={{ padding: '1rem', border: '1px solid var(--color-borde)', borderRadius: '8px', backgroundColor: 'var(--color-fondo-suave)' }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.5rem', color: 'var(--color-advertencia)' }}>
                3. Comisiones por Recibo
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-texto-secundario)', lineHeight: 1.4, margin: 0 }}>
                El cobro de servicios (CFE, Telmex, Agua) genera una ganancia directa por comisión (ej. $12.00 por ticket). El sistema registra contablemente tanto el importe del recibo como el ingreso neto por comisión.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
