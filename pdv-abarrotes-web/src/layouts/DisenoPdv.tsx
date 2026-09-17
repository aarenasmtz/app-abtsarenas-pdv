import React, { useState, useRef, useEffect } from 'react';
import { 
  Barcode, 
  Trash2, 
  CreditCard, 
  Clock, 
  ArrowLeft, 
  Search, 
  Plus, 
  Minus,
  Printer
} from 'lucide-react';
import { useStoreCarritoPdv } from '../modules/pdv/storeCarrito';
import { useEscanerCodigoBarras } from '../hooks/useEscanerCodigoBarras';
import { servicioProductos } from '../modules/productos/servicioProductos';
import type { ResultadoBusquedaPdvDto } from '../modules/productos/tipos';
import { ModalCobro } from '../modules/pdv/ModalCobro';
import { ModalTicket } from '../modules/pdv/ModalTicket';
import { ModalReimpresion } from '../modules/pdv/ModalReimpresion';
import { ModalPesajeGranel } from '../modules/pdv/ModalPesajeGranel';
import { reproducirBeepExito, reproducirBeepError } from '../utils/sonidosPdv';
import type { ProductoCobroDto } from '../modules/productos/tipos';
import type { VentaRealizada } from '../modules/ventas/tipos';

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

  // Estados para modales de cobro, tickets y reimpresión
  const [mostrarModalCobro, setMostrarModalCobro] = useState(false);
  const [mostrarModalTicket, setMostrarModalTicket] = useState(false);
  const [mostrarModalReimpresion, setMostrarModalReimpresion] = useState(false);
  const [mostrarModalGranel, setMostrarModalGranel] = useState(false);
  const [productoGranelSeleccionado, setProductoGranelSeleccionado] = useState<ProductoCobroDto | null>(null);
  const [ventaActual, setVentaActual] = useState<VentaRealizada | null>(null);

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

  // Escuchar atajos de teclado globales (F12 Cobrar, F8 Reimprimir, F4 Limpiar)
  useEffect(() => {
    const manejarTeclasGlobales = (e: KeyboardEvent) => {
      if (e.key === 'F12') {
        e.preventDefault();
        if (articulos.length > 0) {
          setMostrarModalCobro(true);
        }
      } else if (e.key === 'F8') {
        e.preventDefault();
        setMostrarModalReimpresion(true);
      } else if (e.key === 'F4') {
        e.preventDefault();
        if (articulos.length > 0) {
          limpiarCarrito();
        }
      }
    };
    window.addEventListener('keydown', manejarTeclasGlobales);
    return () => window.removeEventListener('keydown', manejarTeclasGlobales);
  }, [articulos.length, limpiarCarrito]);

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
            <span className="badge badge-exito" style={{ fontSize: '0.75rem' }}>Caja 1 - Turno Abierto</span>
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
                >
                  <Clock size={18} />
                  <span>Poner en Espera (Ticket Pendiente)</span>
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
              paddingTop: '1rem', 
              fontSize: '0.8rem', 
              color: 'var(--color-texto-secundario)',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.5rem'
            }}>
              <div><strong>F4:</strong> Limpiar Venta</div>
              <div><strong>F8:</strong> Reimprimir Ticket</div>
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
        onCerrar={() => {
          setMostrarModalCobro(false);
          inputRef.current?.focus();
        }}
        onVentaCompletada={handleVentaCompletada}
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
    </div>
  );
};
