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
  Calculator,
  Layers,
  Zap,
  Package,
  Calendar,
  Lock
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
import { ModalBuscarProductos } from '../modules/pdv/ModalBuscarProductos';
import { ModalRecargaPdv } from '../modules/pdv/ModalRecargaPdv';
import { servicioTicketsPendientes } from '../modules/ventas/servicioTicketsPendientes';
import { ModalVentasDelDia } from '../modules/pdv/ModalVentasDelDia';
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
  servidorEnLinea: _servidorEnLinea
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
  const [modoInicialCobro, setModoInicialCobro] = useState<'efectivo' | 'tarjeta' | 'mixto'>('efectivo');
  const [mostrarModalTicket, setMostrarModalTicket] = useState(false);
  const [mostrarModalReimpresion, setMostrarModalReimpresion] = useState(false);
  const [mostrarModalGranel, setMostrarModalGranel] = useState(false);
  const [mostrarModalTicketsPendientes, setMostrarModalTicketsPendientes] = useState(false);
  const [mostrarModalBuscarProductos, setMostrarModalBuscarProductos] = useState(false);
  const [mostrarModalRecargas, setMostrarModalRecargas] = useState(false);
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
  const [mostrarModalVentasDelDia, setMostrarModalVentasDelDia] = useState(false);

  // Escáner HID global
  useEscanerCodigoBarras({
    onCodigoEscaneado: (codigo) => {
      procesarCodigoBarras(codigo);
    },
  });

  // Mantener foco en el input del escáner al cargar
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Auto-foco permanente en el escáner al hacer clic fuera de elementos interactivos
  useEffect(() => {
    const mantenerFocoEscaner = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const esInteractivo = target?.closest('button, input, select, textarea, [role="button"], .th-sortable, table');
      const hayModalAbierto = 
        mostrarModalCobro || 
        mostrarModalTicket || 
        mostrarModalReimpresion || 
        mostrarModalGranel || 
        mostrarModalTicketsPendientes || 
        mostrarDialogoPonerEnEspera || 
        mostrarModalAbrirTurno || 
        mostrarModalMovimientoCaja || 
        mostrarModalCorteCaja ||
        mostrarModalBuscarProductos ||
        mostrarModalRecargas ||
        mostrarModalVentasDelDia;

      if (!esInteractivo && !hayModalAbierto) {
        inputRef.current?.focus();
      }
    };
    window.addEventListener('click', mantenerFocoEscaner);
    return () => window.removeEventListener('click', mantenerFocoEscaner);
  }, [
    mostrarModalCobro,
    mostrarModalTicket,
    mostrarModalReimpresion,
    mostrarModalGranel,
    mostrarModalTicketsPendientes,
    mostrarDialogoPonerEnEspera,
    mostrarModalAbrirTurno,
    mostrarModalMovimientoCaja,
    mostrarModalCorteCaja,
    mostrarModalBuscarProductos,
    mostrarModalRecargas,
    mostrarModalVentasDelDia
  ]);

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
        setMostrarModalAbrirTurno(false);
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

  const abrirCobro = useCallback((modo: 'efectivo' | 'tarjeta' | 'mixto' = 'efectivo') => {
    if (!turnoActual) {
      setMostrarModalAbrirTurno(true);
      return;
    }
    if (articulos.length > 0) {
      setModoInicialCobro(modo);
      setMostrarModalCobro(true);
    }
  }, [turnoActual, articulos.length]);

  // Escuchar atajos de teclado globales (C/P/F12 Cobrar Efectivo, T Tarjeta, M Mixto, F10 Mov Caja, F9 Corte X/Z, F8 Reimprimir, F7 Pendientes, F6 En Espera, F4 Limpiar, F3/F2 Catálogo, Esc Salir)
  useEffect(() => {
    const manejarTeclasGlobales = (e: KeyboardEvent) => {
      // 1. Tecla Escape: Cerrar cualquier modal que esté abierto y devolver foco al escáner
      if (e.key === 'Escape') {
        e.preventDefault();
        setMostrarModalCobro(false);
        setMostrarModalTicket(false);
        setMostrarModalReimpresion(false);
        setMostrarModalGranel(false);
        setMostrarModalTicketsPendientes(false);
        setMostrarDialogoPonerEnEspera(false);
        setMostrarModalAbrirTurno(false);
        setMostrarModalMovimientoCaja(false);
        setMostrarModalCorteCaja(false);
        setMostrarModalBuscarProductos(false);
        setMostrarModalRecargas(false);
        setTimeout(() => inputRef.current?.focus(), 60);
        return;
      }

      // Si algún modal o diálogo está abierto, no interceptar teclas generales del mostrador
      const hayModalAbierto = 
        mostrarModalCobro || 
        mostrarModalTicket || 
        mostrarModalReimpresion || 
        mostrarModalGranel || 
        mostrarModalTicketsPendientes || 
        mostrarDialogoPonerEnEspera || 
        mostrarModalAbrirTurno || 
        mostrarModalMovimientoCaja || 
        mostrarModalCorteCaja ||
        mostrarModalBuscarProductos ||
        mostrarModalRecargas ||
        mostrarModalVentasDelDia;

      if (hayModalAbierto) {
        return;
      }

      // 2. Teclas de Función F1-F12 (Funcionan de forma DIRECTA e INDEPENDIENTE)
      if (e.key === 'F12') {
        e.preventDefault();
        abrirCobro('efectivo');
        return;
      }

      if (e.key === 'F11') {
        e.preventDefault();
        setMostrarModalVentasDelDia(true);
        return;
      }

      if (e.key === 'F10') {
        e.preventDefault();
        if (turnoActual) setMostrarModalMovimientoCaja(true);
        else setMostrarModalAbrirTurno(true);
        return;
      }

      if (e.key === 'F9') {
        e.preventDefault();
        if (turnoActual) setMostrarModalCorteCaja(true);
        else setMostrarModalAbrirTurno(true);
        return;
      }

      if (e.key === 'F8') {
        e.preventDefault();
        setMostrarModalReimpresion(true);
        return;
      }

      if (e.key === 'F7') {
        e.preventDefault();
        setMostrarModalTicketsPendientes(true);
        return;
      }

      if (e.key === 'F6') {
        e.preventDefault();
        if (articulos.length > 0) {
          setIdentificadorClienteEspera('');
          setMostrarDialogoPonerEnEspera(true);
        }
        return;
      }

      if (e.key === 'F5') {
        e.preventDefault();
        setMostrarModalRecargas(true);
        return;
      }

      if (e.key === 'F4') {
        e.preventDefault();
        if (articulos.length > 0) {
          limpiarCarrito();
        }
        return;
      }

      if (e.key === 'F3' || e.key === 'F2') {
        e.preventDefault();
        setMostrarModalBuscarProductos(true);
        return;
      }

      // 3. Teclas de Cobro Rápido (C, P, T, M, Enter) cuando no se está escribiendo en el buscador
      const target = e.target as HTMLElement | null;
      const estaEnInput = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable;
      const esInputEscanerVacio = target === inputRef.current && codigoInput.trim() === '';

      if (articulos.length > 0 && (!estaEnInput || esInputEscanerVacio)) {
        if (e.key === 'c' || e.key === 'C' || e.key === 'p' || e.key === 'P') {
          e.preventDefault();
          abrirCobro('efectivo');
        } else if (e.key === 't' || e.key === 'T') {
          e.preventDefault();
          abrirCobro('tarjeta');
        } else if (e.key === 'm' || e.key === 'M') {
          e.preventDefault();
          abrirCobro('mixto');
        } else if (e.key === 'Enter' && esInputEscanerVacio) {
          e.preventDefault();
          abrirCobro('efectivo');
        }
      }
    };
    window.addEventListener('keydown', manejarTeclasGlobales);
    return () => window.removeEventListener('keydown', manejarTeclasGlobales);
  }, [
    articulos.length, 
    limpiarCarrito, 
    turnoActual, 
    codigoInput, 
    abrirCobro,
    mostrarModalCobro, 
    mostrarModalTicket, 
    mostrarModalReimpresion, 
    mostrarModalGranel, 
    mostrarModalTicketsPendientes, 
    mostrarDialogoPonerEnEspera, 
    mostrarModalAbrirTurno, 
    mostrarModalMovimientoCaja, 
    mostrarModalCorteCaja,
    mostrarModalBuscarProductos,
    mostrarModalRecargas
  ]);

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
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-fondo)' }}>
      {/* Barra de estado superior del cajero */}
      <header style={{ 
        height: '58px', 
        backgroundColor: 'var(--color-superficie)', 
        borderBottom: '1px solid var(--color-borde)',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        padding: '0 1.5rem',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
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
          
          <h1 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-texto)', margin: 0 }}>
            <span>PUNTO DE VENTA</span>
            {turnoActual ? (
              <button
                type="button"
                onClick={() => setMostrarModalCorteCaja(true)}
                style={{
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  border: 'none',
                  backgroundColor: '#10b981',
                  color: '#ffffff',
                  padding: '0.4rem 0.85rem',
                  borderRadius: '20px',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  boxShadow: '0 2px 6px rgba(16, 185, 129, 0.35)',
                }}
                title="Caja abierta • Haz clic para arqueo o corte (F9)"
              >
                <DollarSign size={14} />
                <span>{(turnoActual.nombreCaja || 'Caja Principal')} • Turno #{turnoActual.idTurnoCaja} (${((turnoActual.efectivoActualEnCaja ?? (turnoActual as any).totalEfectivoEsperado ?? turnoActual.montoInicial) || 0).toFixed(2)})</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setMostrarModalAbrirTurno(true)}
                style={{
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  border: 'none',
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  padding: '0.4rem 0.85rem',
                  borderRadius: '20px',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  boxShadow: '0 2px 6px rgba(239, 68, 68, 0.35)',
                }}
                title="Haz clic para abrir el turno con fondo inicial"
              >
                <Lock size={14} />
                <span>Caja Cerrada (Abrir Turno)</span>
              </button>
            )}
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {/* Botón de Recargas Electrónicas y Pago de Servicios */}
          <button 
            className="btn btn-primario" 
            style={{ 
              padding: '0.42rem 0.85rem', 
              fontSize: '0.83rem', 
              gap: '0.4rem',
              backgroundColor: '#0284c7',
              borderColor: '#0284c7',
              color: '#ffffff',
              fontWeight: 700,
              boxShadow: '0 2px 6px rgba(2, 132, 199, 0.3)'
            }}
            onClick={() => setMostrarModalRecargas(true)}
            title="Recargas de tiempo aire y pago de servicios CFE, Telmex (F5)"
          >
            <Zap size={15} />
            <span>Recargas (F5)</span>
          </button>

          {/* Botón Movimiento de Caja (Entrada/Salida) */}
          <button 
            className="btn btn-secundario" 
            style={{ 
              padding: '0.42rem 0.8rem', 
              fontSize: '0.83rem', 
              gap: '0.4rem',
              borderColor: '#10b981',
              backgroundColor: '#ecfdf5',
              color: '#047857',
              fontWeight: 700,
              boxShadow: '0 1px 3px rgba(16, 185, 129, 0.15)'
            }}
            onClick={() => {
              if (turnoActual) setMostrarModalMovimientoCaja(true);
              else setMostrarModalAbrirTurno(true);
            }}
            title="Entrada o salida manual de efectivo en caja (F10)"
          >
            <DollarSign size={15} />
            <span>Mov. Caja (F10)</span>
          </button>

          {/* Botón Corte X/Z */}
          <button 
            className="btn btn-secundario" 
            style={{ 
              padding: '0.42rem 0.8rem', 
              fontSize: '0.83rem', 
              gap: '0.4rem',
              borderColor: '#f59e0b',
              backgroundColor: '#fffbeb',
              color: '#b45309',
              fontWeight: 700,
              boxShadow: '0 1px 3px rgba(245, 158, 11, 0.15)'
            }}
            onClick={() => {
              if (turnoActual) setMostrarModalCorteCaja(true);
              else setMostrarModalAbrirTurno(true);
            }}
            title="Corte X preliminar o Corte Z de cierre (F9)"
          >
            <Calculator size={15} />
            <span>Corte X/Z (F9)</span>
          </button>

          {/* Botón destacado: Ventas del Día */}
          <button 
            className="btn btn-secundario" 
            style={{ 
              padding: '0.42rem 0.85rem', 
              fontSize: '0.83rem', 
              gap: '0.4rem',
              borderColor: '#8b5cf6',
              backgroundColor: '#f5f3ff',
              color: '#6d28d9',
              fontWeight: 700,
              boxShadow: '0 2px 5px rgba(139, 92, 246, 0.2)'
            }}
            onClick={() => setMostrarModalVentasDelDia(true)}
            title="Consultar total vendido hoy, tickets y detalle (F11)"
          >
            <Calendar size={15} />
            <span>Ventas del Día (F11)</span>
          </button>

          {/* Botón de Tickets en Espera */}
          <button 
            className="btn btn-secundario" 
            style={{ 
              padding: '0.42rem 0.8rem', 
              fontSize: '0.83rem', 
              gap: '0.4rem',
              borderColor: conteoTicketsPendientes > 0 ? '#f59e0b' : undefined,
              backgroundColor: conteoTicketsPendientes > 0 ? 'rgba(245, 158, 11, 0.18)' : undefined,
              color: conteoTicketsPendientes > 0 ? '#b45309' : undefined,
              fontWeight: conteoTicketsPendientes > 0 ? 800 : 500
            }}
            onClick={() => setMostrarModalTicketsPendientes(true)}
            title="Consultar y reanudar ventas en espera (F7)"
          >
            <Clock size={15} />
            <span>En Espera ({conteoTicketsPendientes}) (F7)</span>
          </button>

          {/* Botón Reimprimir Ticket */}
          <button 
            className="btn btn-secundario" 
            style={{ padding: '0.42rem 0.75rem', fontSize: '0.83rem', gap: '0.4rem' }}
            onClick={() => setMostrarModalReimpresion(true)}
            title="Consultar y reimprimir tickets recientes (F8)"
          >
            <Printer size={15} />
            <span>Reimprimir (F8)</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--color-texto-secundario)' }}>
            <span>Cliente:</span>
            <strong style={{ color: 'var(--color-texto)' }}>{nombreCliente}</strong>
          </div>
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
                        backgroundColor: 'var(--color-superficie)',
                        border: '1px solid var(--color-borde)',
                        borderRadius: 'var(--radio-md)',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.12)',
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
                            borderBottom: '1px solid var(--color-borde)',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-fondo)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                          onClick={() => agregarDesdePredictivo(p)}
                        >
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--color-texto)', fontSize: '0.95rem' }}>
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
                <button 
                  type="button" 
                  className="btn btn-secundario" 
                  style={{ padding: '0 1.25rem', gap: '0.4rem', fontWeight: 600 }}
                  onClick={() => setMostrarModalBuscarProductos(true)}
                  title="Abrir catálogo y búsqueda avanzada de productos (F3)"
                >
                  <Package size={18} />
                  <span>Catálogo (F3)</span>
                </button>
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
                        <td className="mono" style={{ textAlign: 'right', fontWeight: 700, color: 'var(--color-primario)' }}>
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
                <span style={{ fontSize: '0.85rem', color: '#a7f3d0', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                  Total a Cobrar
                </span>
                <div className="total-caja-monto">
                  ${totalVenta.toFixed(2)}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#d1fae5', marginTop: '0.25rem' }}>
                  {cantidadArticulos} artículo(s)
                </div>
              </div>

              {/* Botones de acción de venta: Flujo ultra rápido */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '1.25rem' }}>
                {/* 1. Cobrar en Efectivo (C / P / Enter / F12) */}
                <button 
                  className="btn btn-primario" 
                  style={{ 
                    padding: '1rem', 
                    fontSize: '1.1rem', 
                    gap: '0.75rem',
                    boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)'
                  }}
                  disabled={articulos.length === 0}
                  onClick={() => abrirCobro('efectivo')}
                  title="Cobrar en efectivo en segundos. Carga el total exacto (C, P, Enter o F12)"
                >
                  <DollarSign size={22} />
                  <span style={{ fontWeight: 700 }}>💵 Cobrar Efectivo (C / P)</span>
                </button>

                {/* 2. Solo Tarjeta (T) */}
                <button 
                  className="btn" 
                  style={{ 
                    padding: '0.85rem', 
                    fontSize: '0.95rem', 
                    gap: '0.65rem',
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 600,
                    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)'
                  }}
                  disabled={articulos.length === 0}
                  onClick={() => abrirCobro('tarjeta')}
                  title="Cobro directo con tarjeta de débito o crédito (Atajo: T)"
                >
                  <CreditCard size={18} />
                  <span>💳 Solo Tarjeta (T)</span>
                </button>

                {/* 3. Pago Mixto / Vales (M) */}
                <button 
                  className="btn" 
                  style={{ 
                    padding: '0.8rem', 
                    fontSize: '0.95rem', 
                    gap: '0.65rem',
                    backgroundColor: '#7c3aed',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 600,
                    boxShadow: '0 2px 8px rgba(124, 58, 237, 0.25)'
                  }}
                  disabled={articulos.length === 0}
                  onClick={() => abrirCobro('mixto')}
                  title="Combinar Efectivo con Tarjeta, Vales o Transferencia (Atajo: M)"
                >
                  <Layers size={18} />
                  <span>🔀 Mixto / Vales (M)</span>
                </button>

                {/* 4. Poner en Espera (F6) */}
                <button 
                  className="btn btn-advertencia" 
                  style={{ padding: '0.75rem', fontSize: '0.9rem', gap: '0.5rem', marginTop: '0.25rem' }}
                  disabled={articulos.length === 0}
                  onClick={() => {
                    setIdentificadorClienteEspera('');
                    setMostrarDialogoPonerEnEspera(true);
                  }}
                  title="Poner en espera la venta actual para atender a otro cliente (F6)"
                >
                  <Clock size={16} />
                  <span>Poner en Espera (F6)</span>
                </button>

                {/* 5. Cancelar / Limpiar (F4) */}
                <button 
                  className="btn btn-secundario" 
                  style={{ padding: '0.7rem', fontSize: '0.85rem', color: 'var(--color-peligro)' }}
                  disabled={articulos.length === 0}
                  onClick={limpiarCarrito}
                  title="Limpiar carrito actual (F4)"
                >
                  <Trash2 size={15} />
                  <span>Cancelar Venta (F4)</span>
                </button>
              </div>
            </div>

            {/* Accesos rápidos de teclado */}
            <div style={{ 
              borderTop: '1px solid var(--color-borde)', 
              paddingTop: '0.85rem', 
              fontSize: '0.78rem', 
              color: 'var(--color-texto-secundario)',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.4rem'
            }}>
              <div><strong>C / P / Enter:</strong> Efectivo</div>
              <div><strong>T:</strong> Solo Tarjeta</div>
              <div><strong>M:</strong> Mixto / Vales</div>
              <div><strong>F4:</strong> Limpiar</div>
              <div><strong>F5:</strong> Recargas / Serv.</div>
              <div><strong>F6:</strong> En Espera</div>
              <div><strong>F7:</strong> Pendientes</div>
              <div><strong>F8:</strong> Reimprimir</div>
              <div><strong>F9:</strong> Corte X / Z</div>
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
        modoInicial={modoInicialCobro}
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
              backgroundColor: '#ffffff', 
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              padding: '1.75rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.2)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem' }}>
              <Clock size={24} color="#d97706" />
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a', fontWeight: 700 }}>Poner Venta en Espera</h3>
            </div>
            
            <p style={{ margin: '0 0 1rem', fontSize: '0.9rem', color: '#64748b', lineHeight: 1.5 }}>
              Total: <strong style={{ color: '#0284c7' }}>${totalVenta.toFixed(2)}</strong> ({cantidadArticulos} artículo(s)).
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
                border: '1.5px solid #cbd5e1',
                backgroundColor: '#f8fafc',
                color: '#0f172a',
                fontSize: '1rem',
                marginBottom: '1.25rem',
                outline: 'none'
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => {
                  setMostrarDialogoPonerEnEspera(false);
                  inputRef.current?.focus();
                }}
                className="btn btn-secundario"
                style={{ padding: '0.6rem 1.15rem', fontSize: '0.9rem' }}
              >
                Cancelar (Esc)
              </button>

              <button
                type="button"
                onClick={handleConfirmarPonerEnEspera}
                className="btn btn-primario"
                style={{
                  padding: '0.6rem 1.25rem',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  backgroundColor: '#d97706',
                  borderColor: '#d97706',
                  color: '#ffffff'
                }}
              >
                Guardar en Espera (Enter)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Búsqueda Avanzada / Catálogo de Productos (F3) */}
      <ModalBuscarProductos
        abierto={mostrarModalBuscarProductos}
        onCerrar={() => {
          setMostrarModalBuscarProductos(false);
          inputRef.current?.focus();
        }}
        onSeleccionarProducto={(p) => {
          if (p.permiteVentaFraccionada) {
            setProductoGranelSeleccionado(p);
            setMostrarModalGranel(true);
            reproducirBeepExito();
          } else {
            agregarArticulo({
              idProducto: p.idProducto,
              codigoBarras: p.codigoBarras,
              descripcion: p.descripcion,
              cantidad: 1,
              precioUnitario: p.precioVenta,
              permiteVentaFraccionada: false,
              existenciaDisponible: p.existenciaActual,
            });
            reproducirBeepExito();
            setMensajeNotificacion({
              tipo: 'exito',
              texto: `✓ ${p.descripcion} ($${p.precioVenta.toFixed(2)})`
            });
            setTimeout(() => setMensajeNotificacion(null), 2500);
          }
          setMostrarModalBuscarProductos(false);
          inputRef.current?.focus();
        }}
      />

      {/* Modal de Recargas Electrónicas y Pago de Servicios */}
      <ModalRecargaPdv
        abierto={mostrarModalRecargas}
        onCerrar={() => {
          setMostrarModalRecargas(false);
          inputRef.current?.focus();
        }}
        onAgregarAlCarrito={(item) => {
          agregarArticulo({
            idProducto: Math.floor(100000 + Math.random() * 900000),
            codigoBarras: item.codigoBarras,
            descripcion: item.descripcion,
            cantidad: 1,
            precioUnitario: item.monto,
            permiteVentaFraccionada: false,
            existenciaDisponible: 999,
          });
          setMensajeNotificacion({
            tipo: 'exito',
            texto: `✓ Recarga agregada a la venta: ${item.descripcion} ($${item.monto.toFixed(2)})`,
          });
          setTimeout(() => setMensajeNotificacion(null), 3000);
          inputRef.current?.focus();
        }}
      />

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

      {/* Modal de Ventas del Día y Cancelación Segura (Solo Admin) */}
      <ModalVentasDelDia
        abierto={mostrarModalVentasDelDia}
        onCerrar={() => {
          setMostrarModalVentasDelDia(false);
          inputRef.current?.focus();
        }}
        turnoActual={turnoActual}
        onVerTicket={(_folio) => {
          setMostrarModalReimpresion(true);
        }}
      />
    </div>
  );
};
