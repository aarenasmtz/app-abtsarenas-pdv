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
  Layers,
  Zap,
  Package,
  Calendar,
  Lock,
  Edit3,
  Tag
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
import { ModalVerificadorPrecio } from '../modules/pdv/ModalVerificadorPrecio';
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
    establecerCliente,
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
  const [mostrarModalVerificador, setMostrarModalVerificador] = useState(false);
  const [mostrarDialogoPonerEnEspera, setMostrarDialogoPonerEnEspera] = useState(false);
  const [identificadorClienteEspera, setIdentificadorClienteEspera] = useState('');
  const [conteoTicketsPendientes, setConteoTicketsPendientes] = useState(0);
  const [productoGranelSeleccionado, setProductoGranelSeleccionado] = useState<ProductoCobroDto | null>(null);
  const [ventaActual, setVentaActual] = useState<VentaRealizada | null>(null);

  // Estados para fila activa del carrito (teclas +, -, Supr)
  const [filaSeleccionada, setFilaSeleccionada] = useState<number>(0);

  // Estados para Renombrar Ticket y Atajos F#
  const [mostrarModalRenombrarTicket, setMostrarModalRenombrarTicket] = useState(false);
  const [nombreTicketInput, setNombreTicketInput] = useState('');
  const [tipoMovimientoInicial, setTipoMovimientoInicial] = useState<'ENTRADA' | 'SALIDA'>('ENTRADA');

  // Estados para Control de Caja y Turnos (Fase 10)
  const [turnoActual, setTurnoActual] = useState<TurnoCajaDto | null>(null);
  const [mostrarModalAbrirTurno, setMostrarModalAbrirTurno] = useState(false);
  const [mostrarModalMovimientoCaja, setMostrarModalMovimientoCaja] = useState(false);
  const [mostrarModalCorteCaja, setMostrarModalCorteCaja] = useState(false);
  const [mostrarModalVentasDelDia, setMostrarModalVentasDelDia] = useState(false);

  // Ajustar índice de fila activa si cambian los artículos
  useEffect(() => {
    if (articulos.length === 0) {
      setFilaSeleccionada(0);
    } else if (filaSeleccionada >= articulos.length) {
      setFilaSeleccionada(articulos.length - 1);
    }
  }, [articulos.length, filaSeleccionada]);

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

  // Escuchar atajos de teclado globales F1-F12 estrictamente mapeados según requerimiento
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
        setMostrarModalRenombrarTicket(false);
        setMostrarModalAbrirTurno(false);
        setMostrarModalMovimientoCaja(false);
        setMostrarModalCorteCaja(false);
        setMostrarModalBuscarProductos(false);
        setMostrarModalRecargas(false);
        setMostrarModalVentasDelDia(false);
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
        mostrarModalRenombrarTicket ||
        mostrarModalAbrirTurno || 
        mostrarModalMovimientoCaja || 
        mostrarModalCorteCaja ||
        mostrarModalBuscarProductos ||
        mostrarModalRecargas ||
        mostrarModalVerificador ||
        mostrarModalVentasDelDia;

      if (hayModalAbierto) {
        return;
      }

      // 2. Mapeo estricto de Teclas F1-F12 según Tabla Oficial de Punto de Venta
      // F1: PXD (Foco al escáner / Mostrador principal por defecto)
      if (e.key === 'F1') {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
        setMensajeNotificacion({ tipo: 'exito', texto: 'Mostrador principal listo para escanear (F1)' });
        setTimeout(() => setMensajeNotificacion(null), 2000);
        return;
      }

      // F2: Cobro con tarjeta
      if (e.key === 'F2') {
        e.preventDefault();
        abrirCobro('tarjeta');
        return;
      }

      // F3: Cobro Mixto
      if (e.key === 'F3') {
        e.preventDefault();
        abrirCobro('mixto');
        return;
      }

      // F4: PDX (Corte X de Caja)
      if (e.key === 'F4') {
        e.preventDefault();
        if (turnoActual) setMostrarModalCorteCaja(true);
        else setMostrarModalAbrirTurno(true);
        return;
      }

      // F5: Renombre de ticket (Modificar identificador / cliente del ticket actual)
      if (e.key === 'F5') {
        e.preventDefault();
        setNombreTicketInput(nombreCliente || 'Público en General');
        setMostrarModalRenombrarTicket(true);
        return;
      }

      // F6: En Espera (Poner en espera si hay artículos, o consultar pendientes si está vacío)
      if (e.key === 'F6') {
        e.preventDefault();
        if (articulos.length > 0) {
          setIdentificadorClienteEspera('');
          setMostrarDialogoPonerEnEspera(true);
        } else {
          setMostrarModalTicketsPendientes(true);
        }
        return;
      }

      // F7: Entradas (Modal Movimiento de Caja tipo ENTRADA)
      if (e.key === 'F7') {
        e.preventDefault();
        setTipoMovimientoInicial('ENTRADA');
        if (turnoActual) setMostrarModalMovimientoCaja(true);
        else setMostrarModalAbrirTurno(true);
        return;
      }

      // F8: Salidas (Modal Movimiento de Caja tipo SALIDA)
      if (e.key === 'F8') {
        e.preventDefault();
        setTipoMovimientoInicial('SALIDA');
        if (turnoActual) setMostrarModalMovimientoCaja(true);
        else setMostrarModalAbrirTurno(true);
        return;
      }

      // F9: Verificador de precio (Validador previo de precios)
      if (e.key === 'F9') {
        e.preventDefault();
        setMostrarModalVerificador(true);
        return;
      }

      // F10: Buscar Producto (Catálogo con favoritos)
      if (e.key === 'F10') {
        e.preventDefault();
        setMostrarModalBuscarProductos(true);
        return;
      }

      // F11: Recargas telefónicas y pago de servicios
      if (e.key === 'F11') {
        e.preventDefault();
        setMostrarModalRecargas(true);
        return;
      }

      // F12: Cobrar Efectivo
      if (e.key === 'F12') {
        e.preventDefault();
        abrirCobro('efectivo');
        return;
      }

      // 3. Teclas para manipular la fila del producto en el carrito (+, -, Supr)
      const target = e.target as HTMLElement | null;
      const estaEnInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      if (articulos.length > 0) {
        const itemActual = articulos[filaSeleccionada] || articulos[0];

        // Supr / Delete: Eliminar totalidad de producto sobre el row
        if ((e.key === 'Delete' || e.key === 'Supr') && !estaEnInput) {
          e.preventDefault();
          eliminarArticulo(itemActual.idProducto);
          reproducirBeepExito();
          setMensajeNotificacion({ tipo: 'exito', texto: `Partida "${itemActual.descripcion}" eliminada del carrito.` });
          setTimeout(() => setMensajeNotificacion(null), 2000);
          return;
        }

        // Tecla +: Aumentar piezas del producto seleccionado
        if ((e.key === '+' || e.key === '=') && !estaEnInput) {
          e.preventDefault();
          const delta = itemActual.permiteVentaFraccionada ? 0.250 : 1;
          const nuevaCantidad = Math.round((itemActual.cantidad + delta) * 1000) / 1000;
          actualizarCantidad(itemActual.idProducto, nuevaCantidad);
          reproducirBeepExito();
          return;
        }

        // Tecla -: Disminuir piezas del producto seleccionado
        if ((e.key === '-' || e.key === '_') && !estaEnInput) {
          e.preventDefault();
          const delta = itemActual.permiteVentaFraccionada ? 0.250 : 1;
          const nuevaCantidad = Math.max(0, Math.round((itemActual.cantidad - delta) * 1000) / 1000);
          if (nuevaCantidad <= 0) {
            eliminarArticulo(itemActual.idProducto);
          } else {
            actualizarCantidad(itemActual.idProducto, nuevaCantidad);
          }
          reproducirBeepExito();
          return;
        }

        // Navegación con flechas arriba/abajo en la tabla del carrito
        if (e.key === 'ArrowDown' && !estaEnInput) {
          e.preventDefault();
          setFilaSeleccionada(prev => Math.min(articulos.length - 1, prev + 1));
          return;
        }
        if (e.key === 'ArrowUp' && !estaEnInput) {
          e.preventDefault();
          setFilaSeleccionada(prev => Math.max(0, prev - 1));
          return;
        }
      }
    };
    window.addEventListener('keydown', manejarTeclasGlobales);
    return () => window.removeEventListener('keydown', manejarTeclasGlobales);
  }, [
    articulos,
    filaSeleccionada,
    limpiarCarrito, 
    turnoActual, 
    nombreCliente,
    abrirCobro,
    actualizarCantidad,
    eliminarArticulo,
    mostrarModalCobro, 
    mostrarModalTicket, 
    mostrarModalReimpresion, 
    mostrarModalGranel, 
    mostrarModalTicketsPendientes, 
    mostrarDialogoPonerEnEspera, 
    mostrarModalRenombrarTicket,
    mostrarModalAbrirTurno, 
    mostrarModalMovimientoCaja, 
    mostrarModalCorteCaja,
    mostrarModalBuscarProductos,
    mostrarModalRecargas,
    mostrarModalVerificador,
    mostrarModalVentasDelDia
  ]);

  const handleVentaCompletada = (venta: VentaRealizada, imprimirTicket: boolean = false) => {
    setMostrarModalCobro(false);
    setVentaActual(venta);
    limpiarCarrito();

    if (imprimirTicket) {
      setMostrarModalTicket(true);
    } else {
      setMostrarModalTicket(false);
      const cambioCalculado = Math.max(0, venta.importeRecibido - venta.total);
      setMensajeNotificacion({
        tipo: 'exito',
        texto: `✓ ¡Venta completada! Total: $${venta.total.toFixed(2)}${cambioCalculado > 0 ? ` • Cambio: $${cambioCalculado.toFixed(2)}` : ''}`
      });
      setTimeout(() => setMensajeNotificacion(null), 4000);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
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

  const handleConfirmarPesoGranel = (producto: ProductoCobroDto, pesoKg: number, subtotalExacto?: number) => {
    const subtotalFinal = subtotalExacto !== undefined ? subtotalExacto : Math.round(pesoKg * producto.precioVenta * 100) / 100;
    agregarArticulo({
      idProducto: producto.idProducto,
      codigoBarras: producto.codigoBarras,
      descripcion: producto.descripcion,
      cantidad: pesoKg,
      precioUnitario: producto.precioVenta,
      permiteVentaFraccionada: true,
      existenciaDisponible: producto.existenciaActual,
      subtotal: subtotalFinal,
    });
    reproducirBeepExito();
    setMensajeNotificacion({
      tipo: 'exito',
      texto: `✓ ${producto.descripcion} (${pesoKg.toFixed(3)} kg) ($${subtotalFinal.toFixed(2)})`
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
    } catch (err: unknown) {
      const errorAxios = err as { response?: { status?: number } };
      if (errorAxios?.response?.status === 401) {
        reproducirBeepError();
        setMensajeNotificacion({
          tipo: 'error',
          texto: '🔒 Tu sesión ha expirado. Redirigiendo al inicio de sesión...'
        });
        window.dispatchEvent(new CustomEvent('pdv:sesion-expirada'));
        return;
      }

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
            type="button"
            style={{ 
              backgroundColor: '#1e293b', 
              color: '#ffffff', 
              border: 'none', 
              borderRadius: '6px', 
              padding: '0.5rem 0.9rem', 
              fontSize: '0.85rem', 
              fontWeight: 600, 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.45rem', 
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.12)',
              transition: 'all 0.15s ease'
            }}
            onClick={onVolverAAdmin}
            title="Volver al panel administrativo"
          >
            <ArrowLeft size={16} />
            <span>Volver a Administración</span>
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-texto)', letterSpacing: '0.02em' }}>
              PUNTO DE VENTA
            </span>
            {turnoActual ? (
              <button
                type="button"
                onClick={() => setMostrarModalCorteCaja(true)}
                style={{
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  border: 'none',
                  backgroundColor: '#059669',
                  color: '#ffffff',
                  padding: '0.45rem 0.9rem',
                  borderRadius: '6px',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  boxShadow: '0 2px 6px rgba(5, 150, 105, 0.3)',
                }}
                title="Caja abierta • Haz clic para arqueo o corte PDX (F4)"
              >
                <DollarSign size={15} />
                <span>{(turnoActual.nombreCaja || 'Caja Principal')} • Turno #{turnoActual.idTurnoCaja} (${((turnoActual.efectivoActualEnCaja ?? (turnoActual as any).totalEfectivoEsperado ?? turnoActual.montoInicial) || 0).toFixed(2)})</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setMostrarModalAbrirTurno(true)}
                style={{
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  border: 'none',
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  padding: '0.45rem 0.9rem',
                  borderRadius: '6px',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  boxShadow: '0 2px 6px rgba(220, 38, 38, 0.3)',
                }}
                title="Haz clic para abrir el turno con fondo inicial"
              >
                <Lock size={15} />
                <span>Caja Cerrada (Abrir Turno)</span>
              </button>
            )}
          </div>
        </div>

        {/* Derecha: Renombrar Ticket / Cliente (F5) */}
        <div>
          <button
            type="button"
            onClick={() => {
              setNombreTicketInput(nombreCliente || 'Público en General');
              setMostrarModalRenombrarTicket(true);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              fontSize: '0.85rem',
              backgroundColor: '#eff6ff',
              color: '#1d4ed8',
              border: '1.5px solid #bfdbfe',
              borderRadius: '6px',
              padding: '0.45rem 0.9rem',
              cursor: 'pointer',
              fontWeight: 600,
              boxShadow: '0 1px 3px rgba(37, 99, 235, 0.1)',
              transition: 'all 0.15s ease'
            }}
            title="Renombrar ticket o asignar cliente (F5)"
          >
            <Edit3 size={15} style={{ color: '#2563eb' }} />
            <span>Ticket: <strong style={{ color: '#1e3a8a' }}>{nombreCliente}</strong></span>
            <span style={{ fontSize: '0.7rem', backgroundColor: '#2563eb', color: '#ffffff', padding: '0.12rem 0.4rem', borderRadius: '4px', fontWeight: 800 }}>F5</span>
          </button>
        </div>
      </header>

      {/* Notificación rápida flotante */}
      {mensajeNotificacion && (
        <div style={{
          backgroundColor: mensajeNotificacion.tipo === 'exito' ? '#059669' : '#dc2626',
          color: 'white',
          padding: '0.6rem 1.25rem',
          textAlign: 'center',
          fontWeight: 600,
          fontSize: '0.95rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
          zIndex: 100
        }}>
          <span>{mensajeNotificacion.texto}</span>
          {mensajeNotificacion.tipo === 'exito' && ventaActual && (
            <button
              type="button"
              onClick={() => setMostrarModalTicket(true)}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.22)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.5)',
                borderRadius: '6px',
                padding: '0.25rem 0.65rem',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                transition: 'all 0.15s ease'
              }}
              title="El cliente pidió ticket después de cobrar. Haz clic aquí o presiona F7"
            >
              <Printer size={15} />
              <span>Imprimir Ticket (F7)</span>
            </button>
          )}
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
                  title="Abrir catálogo y búsqueda avanzada de productos (F10)"
                >
                  <Package size={18} />
                  <span>Catálogo (F10)</span>
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
                  <h3>Listo para escanear (F1)</h3>
                  <p style={{ marginTop: '0.5rem', fontSize: '0.95rem' }}>
                    Pasa los productos por el lector de código de barras o usa F10 para buscar en catálogo.
                  </p>
                </div>
              ) : (
                <table className="tabla-datos">
                  <thead>
                    <tr>
                      <th style={{ width: '45%' }}>Producto</th>
                      <th style={{ width: '15%', textAlign: 'center' }}>Cantidad (+ / -)</th>
                      <th style={{ width: '15%', textAlign: 'right' }}>Precio Unit.</th>
                      <th style={{ width: '15%', textAlign: 'right' }}>Subtotal</th>
                      <th style={{ width: '10%', textAlign: 'center' }}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {articulos.map((item, index) => {
                      const estaFilaActiva = filaSeleccionada === index;
                      return (
                        <tr 
                          key={item.idProducto}
                          onClick={() => setFilaSeleccionada(index)}
                          style={{
                            backgroundColor: estaFilaActiva ? '#eff6ff' : undefined,
                            boxShadow: estaFilaActiva ? 'inset 4px 0 0 #2563eb' : undefined,
                            cursor: 'pointer',
                            transition: 'background-color 0.1s ease'
                          }}
                          title={`Fila ${index + 1}. Usa '+' para sumar, '-' para restar y 'Supr' para eliminar.`}
                        >
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              {estaFilaActiva && (
                                <span style={{ 
                                  backgroundColor: '#2563eb', 
                                  color: '#ffffff', 
                                  fontSize: '0.65rem', 
                                  fontWeight: 800, 
                                  padding: '0.1rem 0.35rem', 
                                  borderRadius: '4px' 
                                }}>
                                  ACTIVO
                                </span>
                              )}
                              <div style={{ fontWeight: 600, color: estaFilaActiva ? '#1e3a8a' : 'inherit' }}>
                                {item.descripcion}
                              </div>
                            </div>
                            <div className="mono" style={{ fontSize: '0.8rem', color: 'var(--color-texto-secundario)', marginLeft: estaFilaActiva ? '3.5rem' : '0' }}>
                              {item.codigoBarras}
                            </div>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                              <button
                                className="btn btn-secundario"
                                style={{ padding: '0.2rem 0.4rem' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFilaSeleccionada(index);
                                  const delta = item.permiteVentaFraccionada ? 0.250 : 1;
                                  const nuevaCantidad = Math.max(0, Math.round((item.cantidad - delta) * 1000) / 1000);
                                  if (nuevaCantidad <= 0) eliminarArticulo(item.idProducto);
                                  else actualizarCantidad(item.idProducto, nuevaCantidad);
                                }}
                                title="Disminuir piezas (-)"
                              >
                                <Minus size={14} />
                              </button>
                              <span className="mono" style={{ fontWeight: 700, minWidth: '40px', textAlign: 'center' }}>
                                {item.permiteVentaFraccionada ? `${item.cantidad.toFixed(3)}kg` : item.cantidad}
                              </span>
                              <button
                                className="btn btn-secundario"
                                style={{ padding: '0.2rem 0.4rem' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFilaSeleccionada(index);
                                  const delta = item.permiteVentaFraccionada ? 0.250 : 1;
                                  const nuevaCantidad = Math.round((item.cantidad + delta) * 1000) / 1000;
                                  actualizarCantidad(item.idProducto, nuevaCantidad);
                                }}
                                title="Aumentar piezas (+)"
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
                              onClick={(e) => {
                                e.stopPropagation();
                                eliminarArticulo(item.idProducto);
                              }}
                              title="Eliminar partida (Supr)"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
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

              {/* Botones de acción de venta: Mapeo exacto F12, F2, F3, F6 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '1.25rem' }}>
                {/* 1. Cobrar en Efectivo (F12) */}
                <button 
                  className="btn btn-primario" 
                  style={{ 
                    padding: '1rem', 
                    fontSize: '1.05rem', 
                    gap: '0.75rem',
                    boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)',
                    borderRadius: '6px'
                  }}
                  disabled={articulos.length === 0}
                  onClick={() => abrirCobro('efectivo')}
                  title="Cobrar en efectivo directo (F12)"
                >
                  <DollarSign size={22} />
                  <span style={{ fontWeight: 700 }}>💵 Cobro Efectivo (F12)</span>
                </button>

                {/* 2. Solo Tarjeta (F2) */}
                <button 
                  className="btn" 
                  style={{ 
                    padding: '0.85rem', 
                    fontSize: '0.95rem', 
                    gap: '0.65rem',
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 600,
                    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)'
                  }}
                  disabled={articulos.length === 0}
                  onClick={() => abrirCobro('tarjeta')}
                  title="Cobro directo con tarjeta de débito o crédito (F2)"
                >
                  <CreditCard size={18} />
                  <span>💳 Cobro Tarjeta (F2)</span>
                </button>

                {/* 3. Cobro Mixto / Vales (F3) */}
                <button 
                  className="btn" 
                  style={{ 
                    padding: '0.85rem', 
                    fontSize: '0.95rem', 
                    gap: '0.65rem',
                    backgroundColor: '#7c3aed',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 600,
                    boxShadow: '0 2px 8px rgba(124, 58, 237, 0.25)'
                  }}
                  disabled={articulos.length === 0}
                  onClick={() => abrirCobro('mixto')}
                  title="Combinar Efectivo con Tarjeta o Vales (F3)"
                >
                  <Layers size={18} />
                  <span>🔀 Cobro Mixto (F3)</span>
                </button>

                {/* 4. Poner en Espera (F6) */}
                <button 
                  className="btn btn-advertencia" 
                  style={{ padding: '0.75rem', fontSize: '0.9rem', gap: '0.5rem', marginTop: '0.25rem', borderRadius: '6px' }}
                  disabled={articulos.length === 0}
                  onClick={() => {
                    setIdentificadorClienteEspera('');
                    setMostrarDialogoPonerEnEspera(true);
                  }}
                  title="Poner en espera la venta actual para atender a otro cliente (F6)"
                >
                  <Clock size={16} />
                  <span>En Espera (F6)</span>
                </button>

                {/* 5. Cancelar / Limpiar */}
                <button 
                  className="btn btn-secundario" 
                  style={{ padding: '0.7rem', fontSize: '0.85rem', color: 'var(--color-peligro)', borderRadius: '6px' }}
                  disabled={articulos.length === 0}
                  onClick={limpiarCarrito}
                  title="Limpiar carrito actual"
                >
                  <Trash2 size={15} />
                  <span>Cancelar Venta</span>
                </button>
              </div>
            </div>

            {/* Accesos rápidos de teclado: Mapeo exacto F1 - F12 */}
            <div style={{ 
              borderTop: '1px solid var(--color-borde)', 
              paddingTop: '0.75rem', 
              fontSize: '0.72rem', 
              color: 'var(--color-texto-secundario)',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.35rem',
              lineHeight: '1.25'
            }}>
              <div><strong>F1:</strong> PXD (Mostrador)</div>
              <div><strong>F2:</strong> Cobro con tarjeta</div>
              <div><strong>F3:</strong> Cobro Mixto</div>
              <div><strong>F4:</strong> PDX (Corte de caja)</div>
              <div><strong>F5:</strong> Renombre ticket</div>
              <div><strong>F6:</strong> En Espera</div>
              <div><strong>F7:</strong> Entradas</div>
              <div><strong>F8:</strong> Salidas</div>
              <div><strong>F9:</strong> Verificador precio</div>
              <div><strong>F10:</strong> Buscar Producto</div>
              <div><strong>F11:</strong> Recargas telefónicas</div>
              <div><strong>F12:</strong> Cobrar Efectivo</div>
              <div style={{ gridColumn: 'span 2', paddingTop: '0.25rem', borderTop: '1px dashed #e2e8f0', color: '#1e3a8a', fontWeight: 600 }}>
                <strong>+ / - :</strong> Modificar piezas en fila activa | <strong>Supr:</strong> Eliminar producto
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Barra Inferior de Acciones Rápidas (Footer Dock con botones grandes F#) */}
      <footer style={{
        backgroundColor: '#ffffff',
        borderTop: '2px solid #e2e8f0',
        padding: '0.65rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: '0.65rem',
        boxShadow: '0 -3px 12px rgba(0, 0, 0, 0.05)',
        flexShrink: 0,
        zIndex: 10
      }}>
        {/* F7: Entrada de Efectivo */}
        <button 
          type="button"
          style={{ 
            padding: '0.65rem 1.15rem', 
            fontSize: '0.88rem', 
            gap: '0.45rem',
            backgroundColor: '#059669',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 5px rgba(5, 150, 105, 0.25)',
            transition: 'all 0.15s ease'
          }}
          onClick={() => {
            setTipoMovimientoInicial('ENTRADA');
            if (turnoActual) setMostrarModalMovimientoCaja(true);
            else setMostrarModalAbrirTurno(true);
          }}
          title="Registrar entrada manual de efectivo (F7)"
        >
          <Plus size={17} />
          <span>Entrada</span>
          <span style={{ fontSize: '0.7rem', backgroundColor: 'rgba(255,255,255,0.25)', padding: '0.12rem 0.35rem', borderRadius: '4px', fontWeight: 800 }}>F7</span>
        </button>

        {/* F8: Salida de Efectivo */}
        <button 
          type="button"
          style={{ 
            padding: '0.65rem 1.15rem', 
            fontSize: '0.88rem', 
            gap: '0.45rem',
            backgroundColor: '#dc2626',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 5px rgba(220, 38, 38, 0.25)',
            transition: 'all 0.15s ease'
          }}
          onClick={() => {
            setTipoMovimientoInicial('SALIDA');
            if (turnoActual) setMostrarModalMovimientoCaja(true);
            else setMostrarModalAbrirTurno(true);
          }}
          title="Registrar salida o retiro de efectivo (F8)"
        >
          <Minus size={17} />
          <span>Salidas</span>
          <span style={{ fontSize: '0.7rem', backgroundColor: 'rgba(255,255,255,0.25)', padding: '0.12rem 0.35rem', borderRadius: '4px', fontWeight: 800 }}>F8</span>
        </button>

        {/* F6: Ventas en Espera */}
        <button 
          type="button"
          style={{ 
            padding: '0.65rem 1.15rem', 
            fontSize: '0.88rem', 
            gap: '0.45rem',
            backgroundColor: conteoTicketsPendientes > 0 ? '#d97706' : '#475569',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
            transition: 'all 0.15s ease'
          }}
          onClick={() => {
            if (articulos.length > 0) {
              setIdentificadorClienteEspera('');
              setMostrarDialogoPonerEnEspera(true);
            } else {
              setMostrarModalTicketsPendientes(true);
            }
          }}
          title="Poner venta en espera o consultar cola de tickets (F6)"
        >
          <Clock size={17} />
          <span>En Espera ({conteoTicketsPendientes})</span>
          <span style={{ fontSize: '0.7rem', backgroundColor: 'rgba(255,255,255,0.25)', padding: '0.12rem 0.35rem', borderRadius: '4px', fontWeight: 800 }}>F6</span>
        </button>

        {/* F9: Verificador de Precio */}
        <button 
          type="button"
          style={{ 
            padding: '0.65rem 1.15rem', 
            fontSize: '0.88rem', 
            gap: '0.45rem',
            backgroundColor: '#7c3aed',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 5px rgba(124, 58, 237, 0.25)',
            transition: 'all 0.15s ease'
          }}
          onClick={() => setMostrarModalVerificador(true)}
          title="Verificador previo de precios y existencias (F9)"
        >
          <Tag size={17} />
          <span>Verificador</span>
          <span style={{ fontSize: '0.7rem', backgroundColor: 'rgba(255,255,255,0.25)', padding: '0.12rem 0.35rem', borderRadius: '4px', fontWeight: 800 }}>F9</span>
        </button>

        {/* F10: Catálogo y Búsqueda */}
        <button 
          type="button"
          style={{ 
            padding: '0.65rem 1.15rem', 
            fontSize: '0.88rem', 
            gap: '0.45rem',
            backgroundColor: '#0d9488',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 5px rgba(13, 148, 136, 0.25)',
            transition: 'all 0.15s ease'
          }}
          onClick={() => setMostrarModalBuscarProductos(true)}
          title="Catálogo de productos con favoritos (F10)"
        >
          <Search size={17} />
          <span>Buscar Prod</span>
          <span style={{ fontSize: '0.7rem', backgroundColor: 'rgba(255,255,255,0.25)', padding: '0.12rem 0.35rem', borderRadius: '4px', fontWeight: 800 }}>F10</span>
        </button>

        {/* F11: Recargas y Servicios */}
        <button 
          type="button"
          style={{ 
            padding: '0.65rem 1.15rem', 
            fontSize: '0.88rem', 
            gap: '0.45rem',
            backgroundColor: '#0284c7',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 5px rgba(2, 132, 199, 0.25)',
            transition: 'all 0.15s ease'
          }}
          onClick={() => setMostrarModalRecargas(true)}
          title="Recargas telefónicas y pago de servicios CFE, Telmex (F11)"
        >
          <Zap size={17} />
          <span>Recargas</span>
          <span style={{ fontSize: '0.7rem', backgroundColor: 'rgba(255,255,255,0.25)', padding: '0.12rem 0.35rem', borderRadius: '4px', fontWeight: 800 }}>F11</span>
        </button>

        {/* Ventas del Día */}
        <button 
          type="button"
          style={{ 
            padding: '0.65rem 1.15rem', 
            fontSize: '0.88rem', 
            gap: '0.45rem',
            backgroundColor: '#4f46e5',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 5px rgba(79, 70, 229, 0.25)',
            transition: 'all 0.15s ease'
          }}
          onClick={() => setMostrarModalVentasDelDia(true)}
          title="Consultar total vendido hoy, desglose y devoluciones"
        >
          <Calendar size={17} />
          <span>Ventas Día</span>
        </button>

        {/* Reimprimir Último Ticket */}
        <button 
          type="button"
          style={{ 
            padding: '0.65rem 1.15rem', 
            fontSize: '0.88rem', 
            gap: '0.45rem',
            backgroundColor: '#334155',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 5px rgba(51, 65, 85, 0.2)',
            transition: 'all 0.15s ease'
          }}
          onClick={() => setMostrarModalReimpresion(true)}
          title="Consultar y reimprimir tickets recientes"
        >
          <Printer size={17} />
          <span>Reimprimir</span>
        </button>

        {/* F4: PDX Corte de Caja */}
        <button 
          type="button"
          style={{ 
            padding: '0.65rem 1.15rem', 
            fontSize: '0.88rem', 
            gap: '0.45rem',
            backgroundColor: '#be123c',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 5px rgba(190, 18, 60, 0.25)',
            transition: 'all 0.15s ease'
          }}
          onClick={() => {
            if (turnoActual) setMostrarModalCorteCaja(true);
            else setMostrarModalAbrirTurno(true);
          }}
          title="Corte X de Caja / Arqueo (F4)"
        >
          <DollarSign size={17} />
          <span>PDX Corte</span>
          <span style={{ fontSize: '0.7rem', backgroundColor: 'rgba(255,255,255,0.25)', padding: '0.12rem 0.35rem', borderRadius: '4px', fontWeight: 800 }}>F4</span>
        </button>
      </footer>

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
        onVentaCompletada={(venta, imprimirTicket) => {
          handleVentaCompletada(venta, imprimirTicket);
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

      {/* Modal de Movimientos Manuales de Efectivo (Entrada F2 / Salida F3) */}
      <ModalMovimientoCaja
        abierto={mostrarModalMovimientoCaja}
        turno={turnoActual}
        tipoInicial={tipoMovimientoInicial}
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

      {/* Modal de Ventas del Día y Cancelación Segura (F9) */}
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

      {/* Modal Verificador de Precio / Validador previo (F9) */}
      <ModalVerificadorPrecio
        abierto={mostrarModalVerificador}
        onCerrar={() => {
          setMostrarModalVerificador(false);
          inputRef.current?.focus();
        }}
        onAgregarAlCarrito={(prod) => {
          if (prod.permiteVentaFraccionada) {
            setProductoGranelSeleccionado(prod);
            setMostrarModalGranel(true);
          } else {
            agregarArticulo({
              idProducto: prod.idProducto,
              codigoBarras: prod.codigoBarras,
              descripcion: prod.descripcion,
              cantidad: 1,
              precioUnitario: prod.precioVenta,
              permiteVentaFraccionada: false,
              existenciaDisponible: prod.existenciaActual,
            });
            reproducirBeepExito();
            setMensajeNotificacion({
              tipo: 'exito',
              texto: `✓ Agregado desde verificador: ${prod.descripcion}`
            });
            setTimeout(() => setMensajeNotificacion(null), 2500);
          }
          setMostrarModalVerificador(false);
          inputRef.current?.focus();
        }}
      />

      {/* Modal de Renombrar Ticket / Asignar Cliente (F5) */}
      {mostrarModalRenombrarTicket && (
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div
            className="modal-contenido"
            style={{
              maxWidth: '460px',
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '1.75rem',
              boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.3)',
              border: '1px solid #e2e8f0'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{
                padding: '0.6rem',
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                borderRadius: '10px',
                display: 'flex'
              }}>
                <Edit3 size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>Renombrar Ticket (F5)</h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                  Identifica la venta actual con nombre de cliente o mesa.
                </p>
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                Nombre del Cliente o Identificador:
              </label>
              <input
                type="text"
                autoFocus
                value={nombreTicketInput}
                onChange={(e) => setNombreTicketInput(e.target.value)}
                placeholder="Ej. Don Pedro / Mesa 4 / Para Llevar"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const finalNombre = nombreTicketInput.trim() || 'Público en General (Mostrador)';
                    establecerCliente(1, finalNombre);
                    setMostrarModalRenombrarTicket(false);
                    setMensajeNotificacion({ tipo: 'exito', texto: `✓ Ticket renombrado a: ${finalNombre}` });
                    setTimeout(() => setMensajeNotificacion(null), 2500);
                    inputRef.current?.focus();
                  } else if (e.key === 'Escape') {
                    e.preventDefault();
                    setMostrarModalRenombrarTicket(false);
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
                  outline: 'none'
                }}
              />
            </div>

            {/* Sugerencias rápidas */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.25rem' }}>
              {['Público en General (Mostrador)', 'Mesa 1', 'Mesa 2', 'Para Llevar', 'A Domicilio', 'Cliente Frecuente'].map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => setNombreTicketInput(sug)}
                  style={{
                    border: '1px solid #e2e8f0',
                    backgroundColor: '#f1f5f9',
                    borderRadius: '20px',
                    padding: '0.3rem 0.65rem',
                    fontSize: '0.78rem',
                    color: '#475569',
                    cursor: 'pointer',
                    fontWeight: 500
                  }}
                >
                  {sug}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => {
                  setMostrarModalRenombrarTicket(false);
                  inputRef.current?.focus();
                }}
                className="btn btn-secundario"
                style={{ padding: '0.6rem 1.15rem', fontSize: '0.9rem' }}
              >
                Cancelar (Esc)
              </button>
              <button
                type="button"
                onClick={() => {
                  const finalNombre = nombreTicketInput.trim() || 'Público en General (Mostrador)';
                  establecerCliente(1, finalNombre);
                  setMostrarModalRenombrarTicket(false);
                  setMensajeNotificacion({ tipo: 'exito', texto: `✓ Ticket renombrado a: ${finalNombre}` });
                  setTimeout(() => setMensajeNotificacion(null), 2500);
                  inputRef.current?.focus();
                }}
                className="btn btn-primario"
                style={{
                  padding: '0.6rem 1.25rem',
                  fontSize: '0.9rem',
                  fontWeight: 700
                }}
              >
                Guardar Nombre (Enter)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
