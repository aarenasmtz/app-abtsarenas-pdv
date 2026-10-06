import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Search, 
  Barcode, 
  Check, 
  AlertTriangle, 
  ShoppingCart, 
  FileText,
  Loader2
} from 'lucide-react';
import { servicioProveedores } from '../proveedores/servicioProveedores';
import type { ProveedorDto } from '../proveedores/tiposProveedores';
import { servicioProductos } from '../productos/servicioProductos';
import type { ResultadoBusquedaPdvDto } from '../productos/tipos';
import { servicioCompras } from './servicioCompras';
import type { RegistrarCompraDto, PartidaCompraDto } from './tiposCompras';

interface PropiedadesModalNuevaCompra {
  abierto: boolean;
  onCerrar: () => void;
  onCompraRegistrada: () => void;
}

export const ModalNuevaCompra: React.FC<PropiedadesModalNuevaCompra> = ({
  abierto,
  onCerrar,
  onCompraRegistrada,
}) => {
  // Proveedores
  const [proveedores, setProveedores] = useState<ProveedorDto[]>([]);
  const [idProveedor, setIdProveedor] = useState<number | undefined>(undefined);
  const [observaciones, setObservaciones] = useState('');
  const [fechaCompra, setFechaCompra] = useState<string>(new Date().toISOString().substring(0, 10));

  // Búsqueda de productos
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [resultadosBusqueda, setResultadosBusqueda] = useState<ResultadoBusquedaPdvDto[]>([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState<ResultadoBusquedaPdvDto | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [mostrarDropdown, setMostrarDropdown] = useState(false);

  // Campos de la partida en captura
  const [cantidad, setCantidad] = useState<number>(1);
  const [costoUnitario, setCostoUnitario] = useState<number>(0);
  const [actualizarPrecioCosto, setActualizarPrecioCosto] = useState<boolean>(true);

  // Lista de partidas agregadas
  const [partidas, setPartidas] = useState<PartidaCompraDto[]>([]);

  // Estados de proceso
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputBusquedaRef = useRef<HTMLInputElement>(null);

  // Cargar lista de proveedores activos
  useEffect(() => {
    if (abierto) {
      servicioProveedores.obtenerActivos()
        .then(setProveedores)
        .catch(() => {});
      
      // Resetear estado
      setIdProveedor(undefined);
      setObservaciones('');
      setFechaCompra(new Date().toISOString().substring(0, 10));
      setTerminoBusqueda('');
      setResultadosBusqueda([]);
      setProductoSeleccionado(null);
      setCantidad(1);
      setCostoUnitario(0);
      setActualizarPrecioCosto(true);
      setPartidas([]);
      setError(null);
    }
  }, [abierto]);

  // Búsqueda predictiva con debounce
  useEffect(() => {
    if (!terminoBusqueda.trim() || productoSeleccionado) {
      setResultadosBusqueda([]);
      setMostrarDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setBuscando(true);
      try {
        const res = await servicioProductos.buscarPdv(terminoBusqueda, 10);
        setResultadosBusqueda(res);
        setMostrarDropdown(res.length > 0);
      } catch {
        setResultadosBusqueda([]);
      } finally {
        setBuscando(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [terminoBusqueda, productoSeleccionado]);

  const seleccionarProducto = async (prod: ResultadoBusquedaPdvDto) => {
    setProductoSeleccionado(prod);
    setTerminoBusqueda(prod.descripcion);
    setCantidad(1);
    setMostrarDropdown(false);
    try {
      const detalle = await servicioProductos.obtenerPorId(prod.idProducto);
      setCostoUnitario(detalle.precioCosto || 0);
    } catch {
      setCostoUnitario(0);
    }
  };

  const agregarPartida = () => {
    if (!productoSeleccionado) {
      setError('Debes buscar y seleccionar un producto antes de agregarlo.');
      return;
    }

    if (cantidad <= 0) {
      setError('La cantidad recibida debe ser mayor a cero.');
      return;
    }

    if (costoUnitario <= 0) {
      setError('El costo unitario debe ser mayor a cero.');
      return;
    }

    setError(null);

    // Verificar si ya está en la lista de partidas
    const indiceExistente = partidas.findIndex(p => p.idProducto === productoSeleccionado.idProducto);
    if (indiceExistente >= 0) {
      // Actualizar cantidad y costo
      const partidasActualizadas = [...partidas];
      const partidaVieja = partidasActualizadas[indiceExistente];
      const nuevaCantidad = partidaVieja.cantidad + cantidad;
      partidasActualizadas[indiceExistente] = {
        ...partidaVieja,
        cantidad: nuevaCantidad,
        costoUnitario,
        subtotal: Number((nuevaCantidad * costoUnitario).toFixed(2)),
        actualizarPrecioCosto,
      };
      setPartidas(partidasActualizadas);
    } else {
      const nuevaPartida: PartidaCompraDto = {
        idProducto: productoSeleccionado.idProducto,
        descripcion: productoSeleccionado.descripcion,
        codigoBarras: productoSeleccionado.codigoBarras || '',
        cantidad,
        costoUnitario,
        subtotal: Number((cantidad * costoUnitario).toFixed(2)),
        actualizarPrecioCosto,
      };
      setPartidas([...partidas, nuevaPartida]);
    }

    // Limpiar selector para el siguiente producto
    setProductoSeleccionado(null);
    setTerminoBusqueda('');
    setCantidad(1);
    setCostoUnitario(0);
    if (inputBusquedaRef.current) {
      inputBusquedaRef.current.focus();
    }
  };

  const eliminarPartida = (indice: number) => {
    setPartidas(partidas.filter((_, i) => i !== indice));
  };

  const totalCompra = partidas.reduce((acc, curr) => acc + (curr.subtotal || curr.cantidad * curr.costoUnitario), 0);
  const totalPiezas = partidas.reduce((acc, curr) => acc + curr.cantidad, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (partidas.length === 0) {
      setError('Debes incluir al menos un producto recibido en la compra.');
      return;
    }

    setError(null);
    setGuardando(true);

    try {
      const dto: RegistrarCompraDto = {
        idProveedor: idProveedor || null,
        fechaCompra: fechaCompra ? new Date(fechaCompra).toISOString() : null,
        observaciones: observaciones.trim() || null,
        partidas: partidas.map(p => ({
          idProducto: p.idProducto,
          cantidad: p.cantidad,
          costoUnitario: p.costoUnitario,
          actualizarPrecioCosto: p.actualizarPrecioCosto,
        })),
      };

      await servicioCompras.registrarCompra(dto);
      onCompraRegistrada();
      onCerrar();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al registrar la compra.';
      setError(msg);
    } finally {
      setGuardando(false);
    }
  };

  if (!abierto) return null;

  return (
    <div className="modal-superposicion">
      <div className="modal-contenedor" style={{ maxWidth: '880px', width: '95%' }}>
        <div className="modal-cabecera">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ padding: '0.4rem', borderRadius: 'var(--radio-md)', backgroundColor: 'var(--color-primario-suave)', color: 'var(--color-primario)' }}>
              <ShoppingCart size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Registrar Compra y Recepción de Mercancía</h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-texto-secundario)' }}>
                Abastece almacén, registra entradas de Kardex y recalcula costos ponderados automáticamente.
              </span>
            </div>
          </div>
          <button className="btn-icono" onClick={onCerrar} title="Cerrar modal">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="alerta alerta-error" style={{ margin: '1rem 1.5rem 0 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="modal-cuerpo" style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', maxHeight: '72vh', overflowY: 'auto' }}>
            {/* Sección 1: Datos de Cabecera (Proveedor, Fecha, Factura) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', backgroundColor: 'var(--color-fondo-suave)', padding: '1rem', borderRadius: 'var(--radio-md)' }}>
              <div className="grupo-formulario">
                <label className="etiqueta-formulario">Proveedor Comercial</label>
                <select
                  className="input-formulario"
                  value={idProveedor || ''}
                  onChange={(e) => setIdProveedor(e.target.value ? Number(e.target.value) : undefined)}
                >
                  <option value="">-- Proveedor General / Mostrador --</option>
                  {proveedores.map((p) => (
                    <option key={p.idProveedor} value={p.idProveedor}>
                      {p.nombre} {p.rfc ? `(${p.rfc})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grupo-formulario">
                <label className="etiqueta-formulario">Fecha de Compra / Emisión</label>
                <input
                  type="date"
                  className="input-formulario"
                  value={fechaCompra}
                  onChange={(e) => setFechaCompra(e.target.value)}
                  required
                />
              </div>

              <div className="grupo-formulario">
                <label className="etiqueta-formulario">No. Factura / Remisión / Nota</label>
                <input
                  type="text"
                  className="input-formulario"
                  placeholder="Ej. Factura F-84920"
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  maxLength={250}
                />
              </div>
            </div>

            {/* Sección 2: Entrada rápida de artículos */}
            <div style={{ border: '1px solid var(--color-borde)', borderRadius: 'var(--radio-md)', padding: '1rem', backgroundColor: 'var(--color-superficie)' }}>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Barcode size={18} color="var(--color-primario)" />
                <span>Agregar Producto a la Recepción</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 2fr) minmax(110px, 1fr) minmax(130px, 1fr) auto', gap: '0.75rem', alignItems: 'flex-end' }}>
                {/* Buscador de producto con dropdown */}
                <div style={{ position: 'relative' }}>
                  <label className="etiqueta-formulario">Producto o Código</label>
                  <div style={{ position: 'relative' }}>
                    <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-texto-secundario)' }} />
                    <input
                      ref={inputBusquedaRef}
                      type="text"
                      className="input-formulario"
                      style={{ paddingLeft: '2.2rem', paddingRight: buscando ? '2.2rem' : undefined }}
                      placeholder="Escribe descripción o escanea código..."
                      value={terminoBusqueda}
                      onChange={(e) => {
                        setTerminoBusqueda(e.target.value);
                        if (productoSeleccionado) setProductoSeleccionado(null);
                      }}
                      onFocus={() => {
                        if (resultadosBusqueda.length > 0 && !productoSeleccionado) {
                          setMostrarDropdown(true);
                        }
                      }}
                    />
                    {buscando && (
                      <Loader2
                        size={16}
                        className="animacion-rotar"
                        style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-primario)' }}
                      />
                    )}
                  </div>

                  {mostrarDropdown && resultadosBusqueda.length > 0 && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        zIndex: 30,
                        backgroundColor: 'var(--color-fondo-panel)',
                        border: '1px solid var(--color-borde)',
                        borderRadius: 'var(--radio-md)',
                        marginTop: '4px',
                        maxHeight: '220px',
                        overflowY: 'auto',
                        boxShadow: 'var(--sombra-lg)',
                      }}
                    >
                      {resultadosBusqueda.map((prod) => (
                        <div
                          key={prod.idProducto}
                          onClick={() => seleccionarProducto(prod)}
                          style={{
                            padding: '0.6rem 0.85rem',
                            cursor: 'pointer',
                            borderBottom: '1px solid var(--color-borde)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-fondo-suave)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <div>
                            <div style={{ fontWeight: 500, fontSize: '0.88rem' }}>{prod.descripcion}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-texto-secundario)' }} className="mono">
                              Código: {prod.codigoBarras || '-'} | Stock actual: {prod.existenciaActual}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-texto-secundario)' }}>Precio Venta</div>
                            <div className="mono font-bold">${prod.precioVenta.toFixed(2)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Cantidad */}
                <div>
                  <label className="etiqueta-formulario">Cantidad</label>
                  <input
                    type="number"
                    step="any"
                    min="0.001"
                    className="input-formulario mono text-center"
                    value={cantidad || ''}
                    onChange={(e) => setCantidad(parseFloat(e.target.value) || 0)}
                  />
                </div>

                {/* Costo Unitario */}
                <div>
                  <label className="etiqueta-formulario">Costo Unitario ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="input-formulario mono text-right"
                    value={costoUnitario || ''}
                    onChange={(e) => setCostoUnitario(parseFloat(e.target.value) || 0)}
                  />
                </div>

                {/* Botón Agregar Partida */}
                <div>
                  <button
                    type="button"
                    className="btn btn-primario"
                    onClick={agregarPartida}
                    style={{ padding: '0.65rem 1rem', height: '42px', gap: '0.4rem' }}
                  >
                    <Plus size={18} />
                    <span>Agregar</span>
                  </button>
                </div>
              </div>

              {/* Checkbox de costo promedio ponderado */}
              <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                <input
                  type="checkbox"
                  id="chkActualizarCosto"
                  checked={actualizarPrecioCosto}
                  onChange={(e) => setActualizarPrecioCosto(e.target.checked)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="chkActualizarCosto" style={{ cursor: 'pointer', color: 'var(--color-texto-secundario)' }}>
                  Actualizar costo del producto en el catálogo mediante cálculo de <strong>Costo Promedio Ponderado</strong>
                </label>
              </div>
            </div>

            {/* Sección 3: Tabla de Partidas en curso */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <FileText size={16} color="var(--color-primario)" />
                  <span>Partidas Recibidas ({partidas.length})</span>
                </h4>
                {partidas.length > 0 && (
                  <button
                    type="button"
                    className="btn-link"
                    style={{ color: 'var(--color-peligro)', fontSize: '0.8rem' }}
                    onClick={() => setPartidas([])}
                  >
                    Vaciar lista
                  </button>
                )}
              </div>

              <div style={{ border: '1px solid var(--color-borde)', borderRadius: 'var(--radio-md)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--color-fondo-suave)', textAlign: 'left', borderBottom: '1px solid var(--color-borde)' }}>
                      <th style={{ padding: '0.6rem 0.75rem', width: '40px' }}>#</th>
                      <th style={{ padding: '0.6rem 0.75rem' }}>Producto</th>
                      <th style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }}>Cant.</th>
                      <th style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }}>Costo Unit.</th>
                      <th style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }}>Subtotal</th>
                      <th style={{ padding: '0.6rem 0.75rem', textAlign: 'center', width: '50px' }}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {partidas.length > 0 ? (
                      partidas.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--color-borde)' }}>
                          <td style={{ padding: '0.6rem 0.75rem', color: 'var(--color-texto-secundario)' }}>{idx + 1}</td>
                          <td style={{ padding: '0.6rem 0.75rem' }}>
                            <div style={{ fontWeight: 500 }}>{item.descripcion}</div>
                            {item.codigoBarras && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--color-texto-secundario)' }} className="mono">
                                Código: {item.codigoBarras}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }} className="mono font-bold">
                            {item.cantidad.toLocaleString('es-MX', { maximumFractionDigits: 3 })}
                          </td>
                          <td style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }} className="mono">
                            ${item.costoUnitario.toFixed(2)}
                          </td>
                          <td style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }} className="mono font-bold text-primario">
                            ${((item.subtotal || item.cantidad * item.costoUnitario)).toFixed(2)}
                          </td>
                          <td style={{ padding: '0.6rem 0.75rem', textAlign: 'center' }}>
                            <button
                              type="button"
                              className="btn-icono btn-icono-peligro"
                              onClick={() => eliminarPartida(idx)}
                              title="Quitar partida"
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--color-texto-secundario)' }}>
                          <ShoppingCart size={32} style={{ margin: '0 auto 0.5rem auto', opacity: 0.3 }} />
                          <div>No hay partidas capturadas. Busca un producto arriba para comenzar a recibir.</div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Resumen Totalizador */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--color-fondo-suave)', padding: '1rem', borderRadius: 'var(--radio-md)', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-texto-secundario)' }}>Renglones: </span>
                  <span className="mono font-bold">{partidas.length}</span>
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-texto-secundario)' }}>Piezas / Unidades: </span>
                  <span className="mono font-bold">{totalPiezas.toLocaleString('es-MX', { maximumFractionDigits: 3 })}</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1rem', fontWeight: 600 }}>Total de la Compra:</span>
                <span className="mono font-bold" style={{ fontSize: '1.45rem', color: 'var(--color-exito)' }}>
                  ${totalCompra.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          <div className="modal-pie">
            <button type="button" className="btn btn-secundario" onClick={onCerrar} disabled={guardando}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primario" disabled={guardando || partidas.length === 0}>
              <Check size={18} />
              <span>{guardando ? 'Procesando e ingresando a Kardex...' : 'Confirmar y Recibir Mercancía'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
