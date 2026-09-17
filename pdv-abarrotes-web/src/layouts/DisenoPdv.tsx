import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Barcode, 
  Trash2, 
  CreditCard, 
  Clock, 
  ArrowLeft, 
  Search, 
  Plus, 
  Minus,
  Printer,
  DollarSign,
  Calculator
} from 'lucide-react';
import { useStoreCarritoPdv } from '../modules/pdv/storeCarrito';
import { useEscanerCodigoBarras } from '../hooks/useEscanerCodigoBarras';
import { servicioProductos } from '../modules/productos/servicioProductos';
import type { ResultadoBusquedaPdvDto } from '../modules/productos/tipos';
import { ModalCobro } from '../modules/pdv/ModalCobro';
import { ModalTicket } from '../modules/pdv/ModalTicket';
import { ModalReimpresion } from '../modules/pdv/ModalReimpresion';
import { ModalPesajeGranel } from '../modules/pdv/ModalPesajeGranel';
import { ModalTicketsPendientes } from '../modules/pdv/ModalTicketsPendientes';
import { servicioTicketsPendientes } from '../modules/ventas/servicioTicketsPendientes';
import { ModalAbrirTurno } from '../modules/caja/ModalAbrirTurno';
import { ModalMovimientoCaja } from '../modules/caja/ModalMovimientoCaja';
import { ModalCorteCaja } from '../modules/caja/ModalCorteCaja';
import { servicioCaja } from '../modules/caja/servicioCaja';
import type { TurnoCajaDto } from '../modules/caja/tiposCaja';
import { reproducirBeepExito, reproducirBeepError } from '../utils/sonidosPdv';
import type { ProductoCobroDto } from '../modules/productos/tipos';
import type { VentaRealizada, TicketPendienteDto } from '../modules/ventas/tipos';

interface PropiedadesDisenoPdv {
  onVolverAAdmin: () => void;
  servidorEnLinea: boolean;
}

export const DisenoPdv: React.FC<PropiedadesDisenoPdv> = ({
  onVolverAAdmin,
  servidorEnLinea
}) => {
  const [codigoInput, setCodigoInput] = useState('');
  const [mensajeNotificacion, setMensajeNotificacion] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);
  const [resultadosPredictivos, setResultadosPredictivos] = useState<ResultadoBusquedaPdvDto[]>([]);
  const [mostrarDropdown, setMostrarDropdown] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    articulos,
    nombreCliente,
    agregarArticulo,
    actualizarCantidad,
    eliminarArticulo,
    limpiarCarrito,
    obtenerTotal,
    obtenerCantidadArticulos,
  } = useStoreCarritoPdv();

  // Estados para modales de cobro, tickets, reimpresión y espera
  const [mostrarModalCobro, setMostrarModalCobro] = useState(false);
  const [mostrarModalTicket, setMostrarModalTicket] = useState(false);
  const [mostrarModalReimpresion, setMostrarModalReimpresion] = useState(false);
  const [mostrarModalGranel, setMostrarModalGranel] = useState(false);
  const [mostrarModalTicketsPendientes, setMostrarModalTicketsPendientes] = useState(false);
  const [mostrarDialogoPonerEnEspera, setMostrarDialogoPonerEnEspera] = useState(false);
  const [identificadorClienteEspera, setIdentificadorClienteEspera] = useState('');
  const [conteoTicketsPendientes, setConteoTicketsPendientes] = useState(0);
  const [productoGranelSeleccionado, setProductoGranelSeleccionado] = useState<ProductoCobroDto | null>(null);
  const [ventaActual, setVentaActual] = useState<VentaRealizada | null>(null);

  // Estados para Control de Caja y Turnos (Fase 10)
  const [turnoActual, setTurnoActual] = useState<TurnoCajaDto | null>(null);
  const [mostrarModalAbrirTurno, setMostrarModalAbrirTurno] = useState(false);
  const [mostrarModalMovimientoCaja, setMostrarModalMovimientoCaja] = useState(false);
  const [mostrarModalCorteCaja, setMostrarModalCorteCaja] = useState(false);

  // Escáner HID global
  useEscanerCodigoBarras({
    onCodigoEscaneado: (codigo) => {
      procesarCodigoBarras(codigo);
    },
  });

  // Mantener foco en el input del escáner
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Consultar conteo de tickets pendientes en espera
  const refrescarConteoTicketsPendientes = useCallback(async () => {
    try {
      const resp = await servicioTicketsPendientes.obtenerActivos();
      if (resp.exito && resp.datos) {
        setConteoTicketsPendientes(resp.datos.length);
      }
    } catch {
      // Silencioso
    }
  }, []);

  // Consultar estado del turno de caja actual
  const consultarTurnoActual = useCallback(async () => {
    try {
      const resp = await servicioCaja.obtenerTurnoActual();
      if (resp.exito && resp.datos) {
        setTurnoActual(resp.datos);
      } else {
        setTurnoActual(null);
        setMostrarModalAbrirTurno(true);
      }
    } catch {
      // Silencioso
    }
  }, []);

  useEffect(() => {
    refrescarConteoTicketsPendientes();
    consultarTurnoActual();
  }, [refrescarConteoTicketsPendientes, consultarTurnoActual]);

  // Escuchar atajos de teclado globales (F12 Cobrar, F10 Mov Caja, F9 Corte X/Z, F8 Reimprimir, F7 Pendientes, F6 En Espera, F4 Limpiar)
  useEffect(() => {
    const manejarTeclasGlobales = (e: KeyboardEvent) => {
      if (e.key === 'F12') {
        e.preventDefault();
        if (!turnoActual) {
          setMostrarModalAbrirTurno(true);
          return;
        }
        if (articulos.length > 0) {
          setMostrarModalCobro(true);
        }
      } else if (e.key === 'F10') {
        e.preventDefault();
        if (turnoActual) {
          setMostrarModalMovimientoCaja(true);
        } else {
          setMostrarModalAbrirTurno(true);
        }
      } else if (e.key === 'F9') {
        e.preventDefault();
        if (turnoActual) {
          setMostrarModalCorteCaja(true);
        } else {
          setMostrarModalAbrirTurno(true);
        }
      } else if (e.key === 'F8') {
        e.preventDefault();
        setMostrarModalReimpresion(true);
      } else if (e.key === 'F7') {
        e.preventDefault();
        setMostrarModalTicketsPendientes(true);
      } else if (e.key === 'F6') {
        e.preventDefault();
        if (articulos.length > 0) {
          setIdentificadorClienteEspera('');
          setMostrarDialogoPonerEnEspera(true);
        }
      } else if (e.key === 'F4') {
        e.preventDefault();
        if (articulos.length > 0) {
          limpiarCarrito();
        }
      }
    };
    window.addEventListener('keydown', manejarTeclasGlobales);
    return () => window.removeEventListener('keydown', manejarTeclasGlobales);
  }, [articulos.length, limpiarCarrito, turnoActual]);

  const handleVentaCompletada = (venta: VentaRealizada) => {
    setMostrarModalCobro(false);
    setVentaActual(venta);
    setMostrarModalTicket(true);
    limpiarCarrito();
  };

  const handleNuevaVenta = () => {
    setMostrarModalTicket(false);
    setVentaActual(null);
    inputRef.current?.focus();
  };

  const handleSeleccionarParaReimprimir = (venta: VentaRealizada) => {
    setMostrarModalReimpresion(false);
    setVentaActual(venta);
    setMostrarModalTicket(true);
  };

  const handleConfirmarPonerEnEspera = async () => {
    if (articulos.length === 0) return;

    try {
      const resp = await servicioTicketsPendientes.guardar({
        idCaja: 1,
        identificadorCliente: identificadorClienteEspera.trim() || undefined,
        articulos: articulos.map(a => ({
          idProducto: a.idProducto,
          codigoBarras: a.codigoBarras,
          descripcion: a.descripcion,
          cantidad: a.cantidad,
          precioUnitario: a.precioUnitario,
          subtotal: a.subtotal
        }))
      });

      if (resp.exito && resp.datos) {
        reproducirBeepExito();
        setMensajeNotificacion({
          tipo: 'exito',
          texto: `✓ Venta puesta en espera (${resp.datos.identificadorCliente}). Caja disponible.`
        });
        limpiarCarrito();
        setMostrarDialogoPonerEnEspera(false);
        setIdentificadorClienteEspera('');
        refrescarConteoTicketsPendientes();
        inputRef.current?.focus();
      } else {
        reproducirBeepError();
        setMensajeNotificacion({
          tipo: 'error',
          texto: `⚠️ Error al suspender venta: ${resp.mensaje}`
        });
      }
    } catch {
      reproducirBeepError();
      setMensajeNotificacion({
        tipo: 'error',
        texto: '⚠️ Error de conexión al guardar ticket pendiente.'
      });
    } finally {
      setTimeout(() => setMensajeNotificacion(null), 3000);
    }
  };

  const handleRecuperarTicketPendiente = (ticket: TicketPendienteDto) => {
    // Si ya hay artículos en el carrito, se agregan/combinan
    ticket.articulos.forEach(art => {
      agregarArticulo({
        idProducto: art.idProducto,
        codigoBarras: art.codigoBarras,
        descripcion: art.descripcion,
        cantidad: art.cantidad,
        precioUnitario: art.precioUnitario,
        permiteVentaFraccionada: art.cantidad % 1 !== 0,
        existenciaDisponible: 999
      });
    });

    reproducirBeepExito();
    setMensajeNotificacion({
      tipo: 'exito',
      texto: `✓ Venta de '${ticket.identificadorCliente}' reanudada en caja ($${ticket.total.toFixed(2)})`
    });
    setTimeout(() => setMensajeNotificacion(null), 3000);
    refrescarConteoTicketsPendientes();
    inputRef.current?.focus();
  };

  // Búsqueda predictiva con debounce mientras el cajero escribe
  useEffect(() => {
    const termino = codigoInput.trim();
    if (termino.length < 2) {
      setResultadosPredictivos([]);
      setMostrarDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setBuscando(true);
        const resultados = await servicioProductos.buscarPdv(termino, 10);
        setResultadosPredictivos(resultados);
        setMostrarDropdown(resultados.length > 0);
      } catch {
        setResultadosPredictivos([]);
      } finally {
        setBuscando(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [codigoInput]);

  const handleConfirmarPesoGranel = (producto: ProductoCobroDto, pesoKg: number) => {
    agregarArticulo({
      idProducto: producto.idProducto,
      codigoBarras: producto.codigoBarras,
      descripcion: producto.descripcion,
      cantidad: pesoKg,
      precioUnitario: producto.precioVenta,
      permiteVentaFraccionada: true,
      existenciaDisponible: producto.existenciaActual,
    });
    reproducirBeepExito();
    setMensajeNotificacion({
      tipo: 'exito',
      texto: `✓ ${producto.descripcion} (${pesoKg.toFixed(3)} kg) ($${(pesoKg * producto.precioVenta).toFixed(2)})`
    });
    setTimeout(() => setMensajeNotificacion(null), 2500);
    setMostrarModalGranel(false);
    setProductoGranelSeleccionado(null);
    inputRef.current?.focus();
  };

  const agregarDesdePredictivo = (producto: ResultadoBusquedaPdvDto) => {
    if (producto.permiteVentaFraccionada) {
      setProductoGranelSeleccionado({
        idProducto: producto.idProducto,
        codigoBarras: producto.codigoBarras,
        codigoProducto: producto.codigoBarras,
        descripcion: producto.descripcion,
        precioVenta: producto.precioVenta,
        precioMayoreo: producto.precioVenta,
        permiteVentaFraccionada: true,
        manejaInventario: true,
        existenciaActual: producto.existenciaActual,
        cantidadSugerida: 0.500,
        esPesableConCodigo: false
      });
      setMostrarModalGranel(true);
      reproducirBeepExito();
    } else {
      agregarArticulo({
        idProducto: producto.idProducto,
        codigoBarras: producto.codigoBarras,
        descripcion: producto.descripcion,
        cantidad: 1,
        precioUnitario: producto.precioVenta,
        permiteVentaFraccionada: false,
        existenciaDisponible: producto.existenciaActual,
      });
      reproducirBeepExito();
      setMensajeNotificacion({
        tipo: 'exito',
        texto: `✓ ${producto.descripcion} agregado ($${producto.precioVenta.toFixed(2)})`
      });
      setTimeout(() => setMensajeNotificacion(null), 2500);
    }

    setCodigoInput('');
    setMostrarDropdown(false);
    inputRef.current?.focus();
  };

  const procesarCodigoBarras = async (codigo: string) => {
    const codigoLimpio = codigo?.trim();
    if (!codigoLimpio) return;

    try {
      // 1. Consulta ultrarrápida por código de barras (<50ms, sin imágenes ni costos)
      const producto = await servicioProductos.buscarPorCodigoBarras(codigoLimpio);

      // Si es un código de báscula con peso ya incrustado (EAN-13 prefijo 20/21)
      if (producto.esPesableConCodigo) {
        const peso = producto.cantidadSugerida && producto.cantidadSugerida > 0 ? producto.cantidadSugerida : 1;
        agregarArticulo({
          idProducto: producto.idProducto,
          codigoBarras: producto.codigoBarras,
          descripcion: producto.descripcion,
          cantidad: peso,
          precioUnitario: producto.precioVenta,
          permiteVentaFraccionada: true,
          existenciaDisponible: producto.existenciaActual,
        });
        reproducirBeepExito();
        setMensajeNotificacion({
          tipo: 'exito',
          texto: `✓ ${producto.descripcion} (${peso.toFixed(3)} kg) ($${(peso * producto.precioVenta).toFixed(2)})`
        });
      } else if (producto.permiteVentaFraccionada) {
        // Producto a granel sin peso en el código (se abre modal de pesaje)
        setProductoGranelSeleccionado(producto);
        setMostrarModalGranel(true);
        reproducirBeepExito();
      } else {
        // Producto unitario normal
        agregarArticulo({
          idProducto: producto.idProducto,
          codigoBarras: producto.codigoBarras,
          descripcion: producto.descripcion,
          cantidad: 1,
          precioUnitario: producto.precioVenta,
          permiteVentaFraccionada: false,
          existenciaDisponible: producto.existenciaActual,
        });
        reproducirBeepExito();
        setMensajeNotificacion({
          tipo: 'exito',
          texto: `✓ ${producto.descripcion} ($${producto.precioVenta.toFixed(2)})`
        });
      }
    } catch {
      // 2. Si no coincide exactamente, revisar si hay coincidencia predictiva única
      try {
        const coincidencias = await servicioProductos.buscarPdv(codigoLimpio, 2);
        if (coincidencias.length === 1) {
          agregarDesdePredictivo(coincidencias[0]);
          return;
        }
      } catch {}

      reproducirBeepError();
      setMensajeNotificacion({
        tipo: 'error',
        texto: `⚠️ Producto con código '${codigoLimpio}' no encontrado en el catálogo.`
      });
    } finally {
      setTimeout(() => setMensajeNotificacion(null), 3000);
      setCodigoInput('');
      setMostrarDropdown(false);
      inputRef.current?.focus();
    }
  };

  const manejarEnvioManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (codigoInput.trim()) {
      procesarCodigoBarras(codigoInput.trim());
    }
  };

  const totalVenta = obtenerTotal();
  const cantidadArticulos = obtenerCantidadArticulos();

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#090d16' }}>
      {/* Barra de estado superior del cajero */}
      <header style={{ 
        height: '56px', 
        backgroundColor: '#0f172a', 
        borderBottom: '1px solid var(--color-borde)',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        padding: '0 1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            className="btn btn-secundario" 
            style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
            onClick={onVolverAAdmin}
          >
            <ArrowLeft size={16} />
            <span>Volver a Administración</span>
          </button>
          
          <h1 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>PUNTO DE VENTA</span>
            {turnoActual ? (
              <button
                type="button"
                onClick={() => setMostrarModalCorteCaja(true)}
                className="badge badge-exito"
                style={{ fontSize: '0.75rem', cursor: 'pointer', border: 'none' }}
                title="Ver detalles contables o corte del turno (F9)"
              >
                {turnoActual.nombreCaja} • Turno #{turnoActual.idTurnoCaja} • Efectivo: ${turnoActual.efectivoActualEnCaja.toFixed(2)}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setMostrarModalAbrirTurno(true)}
                className="badge badge-peligro"
                style={{ fontSize: '0.75rem', cursor: 'pointer', border: 'none' }}
                title="Haz clic para abrir el turno con fondo inicial"
              >
                Caja Cerrada (Abrir Turno)
              </button>
            )}
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Botón Movimiento de Caja (Entrada/Salida) */}
          <button 
            className="btn btn-secundario" 
            style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', gap: '0.4rem' }}
            onClick={() => {
              if (turnoActual) setMostrarModalMovimientoCaja(true);
              else setMostrarModalAbrirTurno(true);
            }}
            title="Entrada o salida manual de efectivo en caja (F10)"
          >
            <DollarSign size={16} />
            <span>Mov. Caja (F10)</span>
          </button>

          {/* Botón Corte X/Z */}
          <button 
            className="btn btn-secundario" 
            style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', gap: '0.4rem' }}
            onClick={() => {
              if (turnoActual) setMostrarModalCorteCaja(true);
              else setMostrarModalAbrirTurno(true);
            }}
            title="Corte X preliminar o Corte Z de cierre (F9)"
          >
            <Calculator size={16} />
            <span>Corte X/Z (F9)</span>
          </button>

          {/* Botón de Tickets en Espera con contador reactivo */}
          <button 
            className="btn btn-secundario" 
            style={{ 
              padding: '0.4rem 0.75rem', 
              fontSize: '0.85rem', 
              gap: '0.4rem',
              borderColor: conteoTicketsPendientes > 0 ? '#f59e0b' : undefined,
              backgroundColor: conteoTicketsPendientes > 0 ? 'rgba(245, 158, 11, 0.15)' : undefined,
              color: conteoTicketsPendientes > 0 ? '#fbbf24' : undefined,
              fontWeight: conteoTicketsPendientes > 0 ? 700 : 500
            }}
            onClick={() => setMostrarModalTicketsPendientes(true)}
            title="Consultar y reanudar ventas en espera (F7)"
          >
            <Clock size={16} />
            <span>En Espera ({conteoTicketsPendientes}) (F7)</span>
          </button>

          <button 
            className="btn btn-secundario" 
            style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', gap: '0.4rem' }}
            onClick={() => setMostrarModalReimpresion(true)}
            title="Consultar y reimprimir tickets recientes (F8)"
          >
            <Printer size={16} />
            <span>Reimprimir (F8)</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--color-texto-secundario)' }}>
            <span>Cliente:</span>
            <strong style={{ color: '#ffffff' }}>{nombreCliente}</strong>
          </div>

          <span className={`badge ${servidorEnLinea ? 'badge-exito' : 'badge-peligro'}`}>
            {servidorEnLinea ? 'SQL Conectado' : 'Sin Conexión'}
          </span>
        </div>
      </header>

      {/* Notificación rápida flotante */}
      {mensajeNotificacion && (
        <div style={{
          backgroundColor: mensajeNotificacion.tipo === 'exito' ? 'var(--color-exito)' : 'var(--color-peligro)',
          color: 'white',
          padding: '0.5rem 1rem',
          textAlign: 'center',
          fontWeight: 600,
          fontSize: '0.9rem'
        }}>
          {mensajeNotificacion.texto}
        </div>
      )}

      {/* Contenedor principal de venta */}
      <div style={{ flex: 1, padding: '1rem', overflow: 'hidden' }}>
        <div className="modo-pdv">
          {/* Panel Izquierdo: Escáner y lista de partidas */}
          <div className="pdv-panel-venta">
            <div className="pdv-buscador-barra" style={{ position: 'relative' }}>
              <form onSubmit={manejarEnvioManual} style={{ flex: 1, display: 'flex', gap: '0.75rem' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Barcode 
                    size={22} 
                    style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--color-texto-secundario)' }} 
                  />
                  <input
                    ref={inputRef}
                    type="text"
                    className="input-escaner input-escaner-permitido"
                    style={{ paddingLeft: '44px', width: '100%' }}
                    placeholder="Escanea el código de barras o escribe para buscar producto..."
                    value={codigoInput}
                    onChange={(e) => setCodigoInput(e.target.value)}
                  />
                  {buscando && (
                    <div style={{ position: 'absolute', right: '12px', top: '16px', fontSize: '0.75rem', color: 'var(--color-primario-hover)' }}>
                      Buscando...
                    </div>
                  )}

                  {/* Dropdown Predictivo Ultrarrápido (CERO IMÁGENES) */}
                  {mostrarDropdown && resultadosPredictivos.length > 0 && (
                    <div 
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 6px)',
                        left: 0,
                        right: 0,
                        zIndex: 100,
                        backgroundColor: '#1e293b',
                        border: '1px solid var(--color-borde)',
                        borderRadius: 'var(--radio-md)',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.6)',
                        maxHeight: '320px',
                        overflowY: 'auto'
                      }}
                    >
                      {resultadosPredictivos.map((p) => (
                        <div
                          key={p.idProducto}
                          style={{
                            padding: '0.75rem 1rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            cursor: 'pointer',
                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                          onClick={() => agregarDesdePredictivo(p)}
                        >
                          <div>
                            <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.95rem' }}>
                              {p.descripcion}
                            </div>
                            <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.2rem', alignItems: 'center' }}>
                              <span className="mono" style={{ fontSize: '0.8rem', color: 'var(--color-primario-hover)' }}>
                                {p.codigoBarras}
                              </span>
                              <span className="badge badge-secundario" style={{ fontSize: '0.65rem' }}>
                                {p.categoria}
                              </span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--color-texto-secundario)' }}>
                                Stock: <strong className="mono">{p.existenciaActual} {p.permiteVentaFraccionada ? 'kg' : 'pza'}</strong>
                              </span>
                            </div>
                          </div>
                          <div className="mono font-bold" style={{ color: '#34d399', fontSize: '1.15rem' }}>
                            ${p.precioVenta.toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button type="submit" className="btn btn-primario" style={{ padding: '0 1.5rem' }}>
                  <Search size={18} />
                  <span>Agregar</span>
                </button>
              </form>
            </div>

            {/* Lista de productos en el ticket actual */}
            <div className="pdv-lista-articulos">
              {articulos.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--color-texto-secundario)' }}>
                  <Barcode size={64} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                  <h3>Listo para escanear</h3>
                  <p style={{ marginTop: '0.5rem', fontSize: '0.95rem' }}>
                    Pasa los productos por el lector de código de barras.
                  </p>
                </div>
              ) : (
                <table className="tabla-datos">
                  <thead>
                    <tr>
                      <th style={{ width: '45%' }}>Producto</th>
                      <th style={{ width: '15%', textAlign: 'center' }}>Cantidad</th>
                      <th style={{ width: '15%', textAlign: 'right' }}>Precio Unit.</th>
                      <th style={{ width: '15%', textAlign: 'right' }}>Subtotal</th>
                      <th style={{ width: '10%', textAlign: 'center' }}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {articulos.map((item) => (
                      <tr key={item.idProducto}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{item.descripcion}</div>
                          <div className="mono" style={{ fontSize: '0.8rem', color: 'var(--color-texto-secundario)' }}>
                            {item.codigoBarras}
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                            <button
                              className="btn btn-secundario"
                              style={{ padding: '0.2rem 0.4rem' }}
                              onClick={() => {
                                const delta = item.permiteVentaFraccionada ? 0.250 : 1;
                                const nuevaCantidad = Math.max(0, Math.round((item.cantidad - delta) * 1000) / 1000);
                                actualizarCantidad(item.idProducto, nuevaCantidad);
                              }}
                            >
                              <Minus size={14} />
                            </button>
                            <span className="mono" style={{ fontWeight: 700, minWidth: '40px', textAlign: 'center' }}>
                              {item.permiteVentaFraccionada ? `${item.cantidad.toFixed(3)}kg` : item.cantidad}
                            </span>
                            <button
                              className="btn btn-secundario"
                              style={{ padding: '0.2rem 0.4rem' }}
                              onClick={() => {
                                const delta = item.permiteVentaFraccionada ? 0.250 : 1;
                                const nuevaCantidad = Math.round((item.cantidad + delta) * 1000) / 1000;
                                actualizarCantidad(item.idProducto, nuevaCantidad);
                              }}
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </td>
                        <td className="mono" style={{ textAlign: 'right', fontWeight: 500 }}>
                          ${item.precioUnitario.toFixed(2)}
                        </td>
                        <td className="mono" style={{ textAlign: 'right', fontWeight: 700, color: '#34d399' }}>
                          ${item.subtotal.toFixed(2)}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            className="btn btn-peligro"
                            style={{ padding: '0.35rem 0.5rem' }}
                            onClick={() => eliminarArticulo(item.idProducto)}
                            title="Eliminar partida"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Panel Derecho: Totales y Cobro */}
          <div className="pdv-panel-cobro">
            <div>
              <div className="total-caja-display">
                <span style={{ fontSize: '0.9rem', color: '#a7f3d0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Total a Cobrar
                </span>
                <div className="total-caja-monto">
                  ${totalVenta.toFixed(2)}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#6ee7b7', marginTop: '0.25rem' }}>
                  {cantidadArticulos} artículo(s)
                </div>
              </div>

              {/* Botones de acción de venta */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button 
                  className="btn btn-primario" 
                  style={{ padding: '1.1rem', fontSize: '1.15rem', gap: '0.75rem' }}
                  disabled={articulos.length === 0}
                  onClick={() => setMostrarModalCobro(true)}
                  title="Finalizar venta y cobrar (F12)"
                >
                  <CreditCard size={22} />
                  <span>Cobrar (F12)</span>
                </button>

                <button 
                  className="btn btn-advertencia" 
                  style={{ padding: '0.85rem', fontSize: '1rem', gap: '0.6rem' }}
                  disabled={articulos.length === 0}
                  onClick={() => {
                    setIdentificadorClienteEspera('');
                    setMostrarDialogoPonerEnEspera(true);
                  }}
                  title="Poner en espera la venta actual para atender a otro cliente (F6)"
                >
                  <Clock size={18} />
                  <span>Poner en Espera (F6)</span>
                </button>

                <button 
                  className="btn btn-secundario" 
                  style={{ padding: '0.75rem', fontSize: '0.95rem' }}
                  disabled={articulos.length === 0}
                  onClick={limpiarCarrito}
                  title="Limpiar carrito actual (F4)"
                >
                  <Trash2 size={16} />
                  <span>Cancelar Venta Actual (F4)</span>
                </button>
              </div>
            </div>

            {/* Accesos rápidos de teclado */}
            <div style={{ 
              borderTop: '1px solid var(--color-borde)', 
              paddingTop: '0.85rem', 
              fontSize: '0.8rem', 
              color: 'var(--color-texto-secundario)',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.45rem'
            }}>
              <div><strong>F4:</strong> Limpiar Venta</div>
              <div><strong>F6:</strong> Poner en Espera</div>
              <div><strong>F7:</strong> Ver Pendientes</div>
              <div><strong>F8:</strong> Reimprimir Ticket</div>
              <div><strong>F9:</strong> Corte X / Z</div>
              <div><strong>F10:</strong> Mov. Caja</div>
              <div><strong>F12:</strong> Finalizar Cobro</div>
              <div><strong>Enter:</strong> Confirmar / Cobrar</div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Cobro Rápido */}
      <ModalCobro
        abierto={mostrarModalCobro}
        total={totalVenta}
        subtotal={totalVenta}
        descuento={0}
        articulos={articulos.map(a => ({
          idProducto: a.idProducto,
          codigoBarras: a.codigoBarras,
          descripcion: a.descripcion,
          cantidad: a.cantidad,
          precioUnitario: a.precioUnitario,
          descuento: 0,
          subtotal: a.subtotal
        }))}
        idCaja={turnoActual?.idCaja || 1}
        idTurnoCaja={turnoActual?.idTurnoCaja || 1}
        onCerrar={() => {
          setMostrarModalCobro(false);
          inputRef.current?.focus();
        }}
        onVentaCompletada={(venta) => {
          handleVentaCompletada(venta);
          consultarTurnoActual();
        }}
      />

      {/* Modal de Impresión de Ticket Térmico */}
      <ModalTicket
        abierto={mostrarModalTicket}
        venta={ventaActual}
        onNuevaVenta={handleNuevaVenta}
        onCerrar={() => {
          setMostrarModalTicket(false);
          setVentaActual(null);
          inputRef.current?.focus();
        }}
      />

      {/* Modal de Reimpresión de Tickets */}
      <ModalReimpresion
        abierto={mostrarModalReimpresion}
        onCerrar={() => {
          setMostrarModalReimpresion(false);
          inputRef.current?.focus();
        }}
        onSeleccionarParaReimprimir={handleSeleccionarParaReimprimir}
      />

      {/* Modal de Pesaje de Productos a Granel */}
      <ModalPesajeGranel
        abierto={mostrarModalGranel}
        producto={productoGranelSeleccionado}
        onConfirmarPeso={handleConfirmarPesoGranel}
        onCerrar={() => {
          setMostrarModalGranel(false);
          setProductoGranelSeleccionado(null);
          inputRef.current?.focus();
        }}
      />

      {/* Modal de Tickets Pendientes en Espera */}
      <ModalTicketsPendientes
        abierto={mostrarModalTicketsPendientes}
        onCerrar={() => {
          setMostrarModalTicketsPendientes(false);
          inputRef.current?.focus();
        }}
        onRecuperarTicket={handleRecuperarTicketPendiente}
        alModificarTickets={refrescarConteoTicketsPendientes}
      />

      {/* Diálogo Rápido para Poner Venta en Espera */}
      {mostrarDialogoPonerEnEspera && (
        <div className="modal-overlay" style={{ zIndex: 1250 }}>
          <div 
            className="modal-contenido"
            style={{ 
              maxWidth: '440px', 
              width: '90%', 
              backgroundColor: '#111827', 
              borderRadius: '12px',
              border: '1px solid #374151',
              padding: '1.5rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <Clock size={22} color="#f59e0b" />
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#f3f4f6' }}>Poner Venta en Espera</h3>
            </div>
            
            <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', color: '#9ca3af' }}>
              Total: <strong style={{ color: '#38bdf8' }}>${totalVenta.toFixed(2)}</strong> ({cantidadArticulos} artículo(s)).
              Ingresa una referencia o nombre para reconocer al cliente cuando regrese.
            </p>

            <input
              type="text"
              autoFocus
              value={identificadorClienteEspera}
              onChange={(e) => setIdentificadorClienteEspera(e.target.value)}
              placeholder="Ej. Don Pedro / Playera azul / Mesa 2"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleConfirmarPonerEnEspera();
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  setMostrarDialogoPonerEnEspera(false);
                  inputRef.current?.focus();
                }
              }}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                border: '1px solid #374151',
                backgroundColor: '#1f2937',
                color: '#fff',
                fontSize: '0.95rem',
                marginBottom: '1.25rem'
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => {
                  setMostrarDialogoPonerEnEspera(false);
                  inputRef.current?.focus();
                }}
                style={{
                  padding: '0.55rem 1rem',
                  borderRadius: '6px',
                  border: '1px solid #4b5563',
                  backgroundColor: '#374151',
                  color: '#d1d5db',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancelar (Esc)
              </button>

              <button
                type="button"
                onClick={handleConfirmarPonerEnEspera}
                style={{
                  padding: '0.55rem 1.25rem',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#f59e0b',
                  color: '#000',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Guardar en Espera (Enter)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Apertura de Turno con Fondo Inicial */}
      <ModalAbrirTurno
        abierto={mostrarModalAbrirTurno}
        onTurnoAbierto={(turno) => {
          setTurnoActual(turno);
          setMostrarModalAbrirTurno(false);
          inputRef.current?.focus();
        }}
        onCancelar={() => setMostrarModalAbrirTurno(false)}
      />

      {/* Modal de Movimientos Manuales de Efectivo (Entrada/Salida) */}
      <ModalMovimientoCaja
        abierto={mostrarModalMovimientoCaja}
        turno={turnoActual}
        onCerrar={() => {
          setMostrarModalMovimientoCaja(false);
          inputRef.current?.focus();
        }}
        onMovimientoRegistrado={() => {
          consultarTurnoActual();
          inputRef.current?.focus();
        }}
      />

      {/* Modal de Control de Cortes X y Z con Arqueo Ciego */}
      <ModalCorteCaja
        abierto={mostrarModalCorteCaja}
        turno={turnoActual}
        onCerrar={() => {
          setMostrarModalCorteCaja(false);
          inputRef.current?.focus();
        }}
        onTurnoCerrado={() => {
          consultarTurnoActual();
          inputRef.current?.focus();
        }}
      />
    </div>
  );
};
