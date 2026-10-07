import React, { useState, useEffect, useCallback } from 'react';
import { 
  Boxes, 
  History, 
  AlertTriangle, 
  Search, 
  RefreshCw, 
  PlusCircle, 
  MinusCircle, 
  Sliders, 
  Check, 
  X, 
  ArrowUpRight, 
  ArrowDownRight,
  TrendingDown,
  Calendar,
  Layers
} from 'lucide-react';
import { servicioInventario } from './servicioInventario';
import { servicioCatalogos } from '../catalogos/servicioCatalogos';
import { servicioProductos } from '../productos/servicioProductos';
import type { 
  StockProductoDto, 
  MovimientoKardexDto, 
  AlertaStockDto, 
  TipoMovimientoInventarioDto,
  RegistrarAjusteStockDto 
} from './tipos';
import type { CategoriaDto, MarcaDto } from '../catalogos/tipos';
import type { ResultadoBusquedaPdvDto } from '../productos/tipos';
import { TablaPaginada } from '../../components/comun/TablaPaginada';
import type { ResultadoPaginado } from '../../types/comun';

export const PantallaInventario: React.FC = () => {
  // Pestaña activa: 'stock' | 'kardex' | 'alertas'
  const [pestanaActiva, setPestanaActiva] = useState<'stock' | 'kardex' | 'alertas'>('stock');

  // Estados para Control de Stock
  const [stockPaginado, setStockPaginado] = useState<ResultadoPaginado<StockProductoDto>>({
    elementos: [],
    totalRegistros: 0,
    paginaActual: 1,
    registrosPorPagina: 25,
    totalPaginas: 0,
    tienePaginaAnterior: false,
    tienePaginaSiguiente: false,
  });
  const [paginaStock, setPaginaStock] = useState(1);
  const [tamanoStock, setTamanoStock] = useState<25 | 50 | 100>(25);
  const [busquedaStock, setBusquedaStock] = useState('');
  const [idCategoriaStock, setIdCategoriaStock] = useState<number | undefined>(undefined);
  const [idMarcaStock, setIdMarcaStock] = useState<number | undefined>(undefined);
  const [soloBajoStock, setSoloBajoStock] = useState(false);

  // Estados para Kardex Histórico
  const [kardexPaginado, setKardexPaginado] = useState<ResultadoPaginado<MovimientoKardexDto>>({
    elementos: [],
    totalRegistros: 0,
    paginaActual: 1,
    registrosPorPagina: 25,
    totalPaginas: 0,
    tienePaginaAnterior: false,
    tienePaginaSiguiente: false,
  });
  const [paginaKardex, setPaginaKardex] = useState(1);
  const [tamanoKardex, setTamanoKardex] = useState<25 | 50 | 100>(25);
  const [busquedaKardex, setBusquedaKardex] = useState('');
  const [idTipoMovimientoKardex, setIdTipoMovimientoKardex] = useState<number | undefined>(undefined);
  const [fechaInicioKardex, setFechaInicioKardex] = useState<string>('');
  const [fechaFinKardex, setFechaFinKardex] = useState<string>('');

  // Estados para Alertas
  const [alertas, setAlertas] = useState<AlertaStockDto[]>([]);

  // Catálogos
  const [categorias, setCategorias] = useState<CategoriaDto[]>([]);
  const [marcas, setMarcas] = useState<MarcaDto[]>([]);
  const [tiposMovimiento, setTiposMovimiento] = useState<TipoMovimientoInventarioDto[]>([]);

  // Estados generales
  const [cargando, setCargando] = useState(false);
  const [mensajeAlerta, setMensajeAlerta] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);

  // Modal de Ajuste de Stock
  const [modalAjusteAbierto, setModalAjusteAbierto] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState<{ idProducto: number; descripcion: string; codigoBarras: string; stockActual: number } | null>(null);
  const [busquedaModal, setBusquedaModal] = useState('');
  const [coincidenciasModal, setCoincidenciasModal] = useState<ResultadoBusquedaPdvDto[]>([]);
  const [tipoAjuste, setTipoAjuste] = useState<'ENTRADA' | 'SALIDA' | 'RECONTEO_FISICO'>('ENTRADA');
  const [cantidadAjuste, setCantidadAjuste] = useState<number>(1);
  const [motivoAjuste, setMotivoAjuste] = useState('Reabastecimiento directo');
  const [observacionesAjuste, setObservacionesAjuste] = useState('');
  const [guardandoAjuste, setGuardandoAjuste] = useState(false);

  // Cargar catálogos iniciales
  useEffect(() => {
    const cargarDatosIniciales = async () => {
      try {
        const [cats, marcs, tipos] = await Promise.all([
          servicioCatalogos.obtenerCategorias(),
          servicioCatalogos.obtenerMarcas(),
          servicioInventario.obtenerTiposMovimiento(),
        ]);
        setCategorias(cats);
        setMarcas(marcs);
        setTiposMovimiento(tipos);
      } catch (err) {
        console.error('Error al cargar catálogos auxiliares:', err);
      }
    };
    cargarDatosIniciales();
  }, []);

  // Cargar Stock
  const cargarStock = useCallback(async () => {
    try {
      setCargando(true);
      const res = await servicioInventario.obtenerStockPaginado({
        pagina: paginaStock,
        registrosPorPagina: tamanoStock,
        busqueda: busquedaStock.trim() || undefined,
        idCategoria: idCategoriaStock,
        idMarca: idMarcaStock,
        soloBajoStock: soloBajoStock ? true : undefined,
      });
      setStockPaginado(res);
    } catch {
      setMensajeAlerta({ tipo: 'error', texto: 'Error al consultar existencias de inventario.' });
    } finally {
      setCargando(false);
    }
  }, [paginaStock, tamanoStock, busquedaStock, idCategoriaStock, idMarcaStock, soloBajoStock]);

  // Cargar Kardex
  const cargarKardex = useCallback(async () => {
    try {
      setCargando(true);
      const res = await servicioInventario.obtenerKardexPaginado({
        pagina: paginaKardex,
        registrosPorPagina: tamanoKardex,
        busqueda: busquedaKardex.trim() || undefined,
        idTipoMovimiento: idTipoMovimientoKardex,
        fechaInicio: fechaInicioKardex || undefined,
        fechaFin: fechaFinKardex || undefined,
      });
      setKardexPaginado(res);
    } catch {
      setMensajeAlerta({ tipo: 'error', texto: 'Error al consultar movimientos del Kardex.' });
    } finally {
      setCargando(false);
    }
  }, [paginaKardex, tamanoKardex, busquedaKardex, idTipoMovimientoKardex, fechaInicioKardex, fechaFinKardex]);

  // Cargar Alertas
  const cargarAlertas = useCallback(async () => {
    try {
      setCargando(true);
      const res = await servicioInventario.obtenerAlertasBajoStock(100);
      setAlertas(res);
    } catch {
      setMensajeAlerta({ tipo: 'error', texto: 'Error al consultar alertas de resurtido.' });
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (pestanaActiva === 'stock') {
        cargarStock();
      } else if (pestanaActiva === 'kardex') {
        cargarKardex();
      } else if (pestanaActiva === 'alertas') {
        cargarAlertas();
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [pestanaActiva, cargarStock, cargarKardex, cargarAlertas]);

  // Búsqueda para modal de ajuste cuando no hay producto preseleccionado
  useEffect(() => {
    if (!busquedaModal.trim() || productoSeleccionado) {
      setCoincidenciasModal([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const resultados = await servicioProductos.buscarPdv(busquedaModal, 6);
        setCoincidenciasModal(resultados);
      } catch {
        setCoincidenciasModal([]);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [busquedaModal, productoSeleccionado]);

  const abrirModalAjusteConProducto = (p: { idProducto: number; descripcion: string; codigoBarras: string; existenciaActual: number }) => {
    setProductoSeleccionado({
      idProducto: p.idProducto,
      descripcion: p.descripcion,
      codigoBarras: p.codigoBarras,
      stockActual: p.existenciaActual,
    });
    setCantidadAjuste(1);
    setTipoAjuste('ENTRADA');
    setMotivoAjuste('Reabastecimiento directo');
    setObservacionesAjuste('');
    setModalAjusteAbierto(true);
  };

  const abrirModalAjusteNuevo = () => {
    setProductoSeleccionado(null);
    setBusquedaModal('');
    setCoincidenciasModal([]);
    setCantidadAjuste(1);
    setTipoAjuste('ENTRADA');
    setMotivoAjuste('Reabastecimiento directo');
    setObservacionesAjuste('');
    setModalAjusteAbierto(true);
  };

  // Cálculo del nuevo stock previsto
  const calcularNuevoStockPrevisto = () => {
    if (!productoSeleccionado) return 0;
    const actual = productoSeleccionado.stockActual;
    if (tipoAjuste === 'ENTRADA') return actual + (cantidadAjuste || 0);
    if (tipoAjuste === 'SALIDA') return Math.max(0, actual - (cantidadAjuste || 0));
    if (tipoAjuste === 'RECONTEO_FISICO') return cantidadAjuste || 0;
    return actual;
  };

  const guardarAjuste = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productoSeleccionado) {
      setMensajeAlerta({ tipo: 'error', texto: 'Debe seleccionar un producto para realizar el ajuste.' });
      return;
    }

    if (cantidadAjuste < 0) {
      setMensajeAlerta({ tipo: 'error', texto: 'La cantidad del ajuste no puede ser negativa.' });
      return;
    }

    try {
      setGuardandoAjuste(true);
      const dto: RegistrarAjusteStockDto = {
        idProducto: productoSeleccionado.idProducto,
        tipoAjuste,
        cantidadAjuste,
        motivo: motivoAjuste.trim(),
        observaciones: observacionesAjuste.trim() || undefined,
      };

      await servicioInventario.registrarAjuste(dto);
      setMensajeAlerta({ 
        tipo: 'exito', 
        texto: `Ajuste de inventario aplicado exitosamente para ${productoSeleccionado.descripcion}.` 
      });

      setModalAjusteAbierto(false);
      if (pestanaActiva === 'stock') cargarStock();
      if (pestanaActiva === 'kardex') cargarKardex();
      if (pestanaActiva === 'alertas') cargarAlertas();
    } catch (err: any) {
      const msg = err.response?.data?.mensaje || 'Error al aplicar el ajuste de stock.';
      setMensajeAlerta({ tipo: 'error', texto: msg });
    } finally {
      setGuardandoAjuste(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Notificación flotante */}
      {mensajeAlerta && (
        <div 
          className="tarjeta" 
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: '0.85rem 1.25rem',
            borderLeft: `4px solid ${mensajeAlerta.tipo === 'exito' ? 'var(--color-exito)' : 'var(--color-peligro)'}`,
            backgroundColor: mensajeAlerta.tipo === 'exito' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {mensajeAlerta.tipo === 'exito' ? <Check size={18} color="var(--color-exito)" /> : <AlertTriangle size={18} color="var(--color-peligro)" />}
            <span style={{ fontSize: '0.9rem' }}>{mensajeAlerta.texto}</span>
          </div>
          <button 
            style={{ background: 'none', border: 'none', color: 'var(--color-texto-secundario)', cursor: 'pointer' }}
            onClick={() => setMensajeAlerta(null)}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Encabezado y pestañas */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Boxes size={24} color="var(--color-primario)" />
            <span>Módulo de Inventario y Kardex</span>
          </h2>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--color-texto-secundario)' }}>
            Supervisión de stock, historial inmutable de movimientos y alertas de reorden.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            className="btn btn-secundario" 
            onClick={() => {
              if (pestanaActiva === 'stock') cargarStock();
              if (pestanaActiva === 'kardex') cargarKardex();
              if (pestanaActiva === 'alertas') cargarAlertas();
            }}
            disabled={cargando}
            title="Refrescar datos"
          >
            <RefreshCw size={16} className={cargando ? 'girar' : ''} />
            <span>Refrescar</span>
          </button>

          <button 
            className="btn btn-primario" 
            onClick={abrirModalAjusteNuevo}
          >
            <Sliders size={18} />
            <span>Ajustar Stock</span>
          </button>
        </div>
      </div>

      {/* Barra de pestañas */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--color-borde)', paddingBottom: '0.5rem' }}>
        <button 
          className={`btn ${pestanaActiva === 'stock' ? 'btn-primario' : 'btn-secundario'}`}
          onClick={() => setPestanaActiva('stock')}
        >
          <Layers size={16} />
          <span>Control de Existencias</span>
        </button>

        <button 
          className={`btn ${pestanaActiva === 'kardex' ? 'btn-primario' : 'btn-secundario'}`}
          onClick={() => setPestanaActiva('kardex')}
        >
          <History size={16} />
          <span>Kardex Histórico</span>
        </button>

        <button 
          className={`btn ${pestanaActiva === 'alertas' ? 'btn-primario' : 'btn-secundario'}`}
          onClick={() => setPestanaActiva('alertas')}
        >
          <TrendingDown size={16} />
          <span>Alertas de Reorden</span>
          {alertas.length > 0 && (
            <span className="badge badge-peligro" style={{ marginLeft: '0.35rem', fontSize: '0.7rem' }}>
              {alertas.length}
            </span>
          )}
        </button>
      </div>

      {/* PESTAÑA 1: CONTROL DE EXISTENCIAS (STOCK) */}
      {pestanaActiva === 'stock' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Filtros de Stock */}
          <div className="tarjeta" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
            <div style={{ flex: '1 1 260px', position: 'relative' }}>
              <Search 
                size={18} 
                style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-texto-secundario)' }} 
              />
              <input 
                type="text" 
                placeholder="Buscar por descripción, código o código de barras..." 
                className="input-control" 
                style={{ paddingLeft: '2.5rem', width: '100%' }}
                value={busquedaStock}
                onChange={(e) => {
                  setBusquedaStock(e.target.value);
                  setPaginaStock(1);
                }}
              />
            </div>

            <div style={{ flex: '0 1 180px' }}>
              <select 
                className="input-control" 
                style={{ width: '100%' }}
                value={idCategoriaStock || ''}
                onChange={(e) => {
                  const val = e.target.value ? Number(e.target.value) : undefined;
                  setIdCategoriaStock(val);
                  setPaginaStock(1);
                }}
              >
                <option value="">Todas las Categorías</option>
                {categorias.map(c => (
                  <option key={c.idCategoria} value={c.idCategoria}>{c.descripcion}</option>
                ))}
              </select>
            </div>

            <div style={{ flex: '0 1 180px' }}>
              <select 
                className="input-control" 
                style={{ width: '100%' }}
                value={idMarcaStock || ''}
                onChange={(e) => {
                  const val = e.target.value ? Number(e.target.value) : undefined;
                  setIdMarcaStock(val);
                  setPaginaStock(1);
                }}
              >
                <option value="">Todas las Marcas</option>
                {marcas.map(m => (
                  <option key={m.idMarca} value={m.idMarca}>{m.descripcion}</option>
                ))}
              </select>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.88rem' }}>
              <input 
                type="checkbox" 
                checked={soloBajoStock}
                onChange={(e) => {
                  setSoloBajoStock(e.target.checked);
                  setPaginaStock(1);
                }}
              />
              <span style={{ color: soloBajoStock ? 'var(--color-advertencia)' : 'inherit' }}>
                Solo Bajo Stock
              </span>
            </label>
          </div>

          {/* Tabla Paginada de Stock */}
          <TablaPaginada<StockProductoDto>
            cargando={cargando}
            columnas={[
              {
                clave: 'codigoBarras',
                titulo: 'Código',
                renderizar: (p) => (
                  <div>
                    <span className="mono font-bold" style={{ color: 'var(--color-primario-hover)' }}>
                      {p.codigoBarras || p.codigoProducto}
                    </span>
                  </div>
                )
              },
              {
                clave: 'descripcion',
                titulo: 'Descripción',
                renderizar: (p) => (
                  <div>
                    <div style={{ fontWeight: 600 }}>{p.descripcion}</div>
                    <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.2rem' }}>
                      <span className="badge badge-secundario" style={{ fontSize: '0.7rem' }}>
                        {p.categoria}
                      </span>
                      {p.marca && p.marca !== 'SIN MARCA' && (
                        <span className="badge badge-secundario" style={{ fontSize: '0.7rem' }}>
                          {p.marca}
                        </span>
                      )}
                    </div>
                  </div>
                )
              },
              {
                clave: 'precioCosto',
                titulo: 'Costo',
                renderizar: (p) => <span className="mono">${p.precioCosto.toFixed(2)}</span>
              },
              {
                clave: 'precioVenta',
                titulo: 'P. Venta',
                renderizar: (p) => <span className="mono font-bold" style={{ color: '#34d399' }}>${p.precioVenta.toFixed(2)}</span>
              },
              {
                clave: 'existenciaActual',
                titulo: 'Existencia Actual',
                renderizar: (p) => {
                  let estiloBadge = 'badge-exito';
                  if (p.estadoStock === 'Critico') estiloBadge = 'badge-peligro';
                  else if (p.estadoStock === 'Bajo') estiloBadge = 'badge-advertencia';
                  else if (p.estadoStock === 'Excedido') estiloBadge = 'badge-secundario';

                  return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="mono font-bold" style={{ fontSize: '1.05rem' }}>
                        {p.existenciaActual} {p.permiteVentaFraccionada ? 'kg' : 'pza'}
                      </span>
                      <span className={`badge ${estiloBadge}`} style={{ fontSize: '0.65rem' }}>
                        {p.estadoStock}
                      </span>
                    </div>
                  );
                }
              },
              {
                clave: 'limites',
                titulo: 'Mín / Máx',
                renderizar: (p) => (
                  <span className="mono" style={{ fontSize: '0.85rem', color: 'var(--color-texto-secundario)' }}>
                    Mín: {p.existenciaMinima} | Máx: {p.existenciaMaxima}
                  </span>
                )
              },
              {
                clave: 'acciones',
                titulo: 'Ajuste',
                renderizar: (p) => (
                  <button 
                    className="btn btn-secundario" 
                    style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem' }}
                    onClick={() => abrirModalAjusteConProducto(p)}
                    title="Ajustar stock de este artículo"
                  >
                    <Sliders size={14} />
                    <span>Ajustar</span>
                  </button>
                )
              }
            ]}
            resultado={stockPaginado}
            onCambiarPagina={(p) => setPaginaStock(p)}
            onCambiarRegistrosPorPagina={(tam) => {
              setTamanoStock(tam);
              setPaginaStock(1);
            }}
          />
        </div>
      )}

      {/* PESTAÑA 2: KARDEX HISTÓRICO */}
      {pestanaActiva === 'kardex' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Filtros del Kardex */}
          <div className="tarjeta" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
            <div style={{ flex: '1 1 240px', position: 'relative' }}>
              <Search 
                size={18} 
                style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-texto-secundario)' }} 
              />
              <input 
                type="text" 
                placeholder="Buscar por producto o motivo..." 
                className="input-control" 
                style={{ paddingLeft: '2.5rem', width: '100%' }}
                value={busquedaKardex}
                onChange={(e) => {
                  setBusquedaKardex(e.target.value);
                  setPaginaKardex(1);
                }}
              />
            </div>

            <div style={{ flex: '0 1 200px' }}>
              <select 
                className="input-control" 
                style={{ width: '100%' }}
                value={idTipoMovimientoKardex || ''}
                onChange={(e) => {
                  const val = e.target.value ? Number(e.target.value) : undefined;
                  setIdTipoMovimientoKardex(val);
                  setPaginaKardex(1);
                }}
              >
                <option value="">Todos los Movimientos</option>
                {tiposMovimiento.map(t => (
                  <option key={t.idTipoMovimiento} value={t.idTipoMovimiento}>{t.descripcion}</option>
                ))}
              </select>
            </div>

            <div className="filtro-fecha-grupo">
              <Calendar size={15} style={{ color: '#2563eb' }} />
              <label>Desde:</label>
              <input 
                type="date" 
                className="filtro-fecha-input" 
                value={fechaInicioKardex}
                onChange={(e) => {
                  setFechaInicioKardex(e.target.value);
                  setPaginaKardex(1);
                }}
                title="Fecha Inicio"
              />
            </div>

            <div className="filtro-fecha-grupo">
              <Calendar size={15} style={{ color: '#2563eb' }} />
              <label>Hasta:</label>
              <input 
                type="date" 
                className="filtro-fecha-input" 
                value={fechaFinKardex}
                onChange={(e) => {
                  setFechaFinKardex(e.target.value);
                  setPaginaKardex(1);
                }}
                title="Fecha Fin"
              />
            </div>
          </div>

          {/* Tabla Paginada de Kardex */}
          <TablaPaginada<MovimientoKardexDto>
            cargando={cargando}
            columnas={[
              {
                clave: 'fechaMovimiento',
                titulo: 'Fecha / Hora',
                renderizar: (m) => (
                  <span className="mono" style={{ fontSize: '0.8rem', color: 'var(--color-texto-secundario)' }}>
                    {new Date(m.fechaMovimiento).toLocaleString()}
                  </span>
                )
              },
              {
                clave: 'descripcionProducto',
                titulo: 'Producto',
                renderizar: (m) => (
                  <div>
                    <div style={{ fontWeight: 600 }}>{m.descripcionProducto}</div>
                    <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--color-primario-hover)' }}>
                      {m.codigoBarras}
                    </span>
                  </div>
                )
              },
              {
                clave: 'tipoMovimiento',
                titulo: 'Tipo Movimiento',
                renderizar: (m) => {
                  const esEntrada = m.efectoStock > 0;
                  const esSalida = m.efectoStock < 0;

                  return (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                      {esEntrada && <ArrowUpRight size={14} color="var(--color-exito)" />}
                      {esSalida && <ArrowDownRight size={14} color="var(--color-peligro)" />}
                      <span className={`badge ${esEntrada ? 'badge-exito' : esSalida ? 'badge-peligro' : 'badge-secundario'}`} style={{ fontSize: '0.75rem' }}>
                        {m.tipoMovimiento}
                      </span>
                    </div>
                  );
                }
              },
              {
                clave: 'cantidadAnterior',
                titulo: 'Stock Ant.',
                renderizar: (m) => <span className="mono">{m.cantidadAnterior}</span>
              },
              {
                clave: 'cantidadMovimiento',
                titulo: 'Movimiento',
                renderizar: (m) => (
                  <span className={`mono font-bold ${m.efectoStock > 0 ? 'color-exito' : m.efectoStock < 0 ? 'color-peligro' : ''}`}>
                    {m.efectoStock > 0 ? `+${m.cantidadMovimiento}` : m.efectoStock < 0 ? `-${m.cantidadMovimiento}` : `${m.cantidadMovimiento}`}
                  </span>
                )
              },
              {
                clave: 'cantidadNueva',
                titulo: 'Nuevo Stock',
                renderizar: (m) => <span className="mono font-bold" style={{ color: '#34d399' }}>{m.cantidadNueva}</span>
              },
              {
                clave: 'motivo',
                titulo: 'Motivo / Referencia',
                renderizar: (m) => (
                  <div>
                    <span style={{ fontSize: '0.85rem' }}>{m.motivo || 'Operación regular'}</span>
                    {m.referenciaModulo && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--color-texto-secundario)' }}>
                        Módulo: {m.referenciaModulo}
                      </div>
                    )}
                  </div>
                )
              },
              {
                clave: 'usuario',
                titulo: 'Usuario',
                renderizar: (m) => (
                  <span className="badge badge-secundario" style={{ fontSize: '0.75rem' }}>
                    {m.usuario}
                  </span>
                )
              }
            ]}
            resultado={kardexPaginado}
            onCambiarPagina={(p) => setPaginaKardex(p)}
            onCambiarRegistrosPorPagina={(tam) => {
              setTamanoKardex(tam);
              setPaginaKardex(1);
            }}
          />
        </div>
      )}

      {/* PESTAÑA 3: ALERTAS DE REORDEN */}
      {pestanaActiva === 'alertas' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="tarjeta" style={{ backgroundColor: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <AlertTriangle size={24} color="var(--color-peligro)" />
              <div>
                <h3 style={{ margin: 0 }}>Artículos por debajo del Stock de Seguridad</h3>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--color-texto-secundario)' }}>
                  Se encontraron {alertas.length} productos que requieren reabastecimiento o compra urgente.
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
            {alertas.map((a) => (
              <div 
                key={a.idProducto} 
                className="tarjeta" 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'space-between',
                  borderLeft: `4px solid ${a.nivelAlerta === 'CRITICO' ? 'var(--color-peligro)' : 'var(--color-advertencia)'}`
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <span className={`badge ${a.nivelAlerta === 'CRITICO' ? 'badge-peligro' : 'badge-advertencia'}`}>
                      {a.nivelAlerta === 'CRITICO' ? '¡AGOTADO / CRÍTICO!' : 'BAJO STOCK'}
                    </span>
                    <span className="badge badge-secundario" style={{ fontSize: '0.7rem' }}>
                      {a.categoria}
                    </span>
                  </div>

                  <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem' }}>{a.descripcion}</h4>
                  <div className="mono" style={{ fontSize: '0.8rem', color: 'var(--color-primario-hover)' }}>
                    {a.codigoBarras}
                  </div>

                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr 1fr', 
                    gap: '0.5rem', 
                    margin: '1rem 0',
                    padding: '0.75rem',
                    backgroundColor: 'rgba(255,255,255,0.02)',
                    borderRadius: 'var(--radio-sm)'
                  }}>
                    <div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-texto-secundario)' }}>Existencia</span>
                      <div className="mono font-bold" style={{ color: a.existenciaActual <= 0 ? 'var(--color-peligro)' : 'var(--color-advertencia)' }}>
                        {a.existenciaActual}
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-texto-secundario)' }}>Mínimo</span>
                      <div className="mono">{a.existenciaMinima}</div>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-texto-secundario)' }}>Faltante Mín.</span>
                      <div className="mono font-bold" style={{ color: '#34d399' }}>
                        +{a.faltanteParaMinimo}
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button 
                    className="btn btn-primario" 
                    style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
                    onClick={() => abrirModalAjusteConProducto({
                      idProducto: a.idProducto,
                      descripcion: a.descripcion,
                      codigoBarras: a.codigoBarras,
                      existenciaActual: a.existenciaActual,
                    })}
                  >
                    <Sliders size={14} />
                    <span>Ajustar Stock</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL DE AJUSTE RÁPIDO DE STOCK */}
      {modalAjusteAbierto && (
        <div className="modal-overlay">
          <div className="modal-contenido" style={{ maxWidth: '560px', width: '90%' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sliders size={20} color="var(--color-primario)" />
                <span>Ajuste de Existencias de Inventario</span>
              </h3>
              <button 
                className="btn btn-secundario" 
                style={{ padding: '0.3rem 0.5rem' }}
                onClick={() => setModalAjusteAbierto(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={guardarAjuste} style={{ padding: '1.25rem' }}>
              {/* Selección de producto si no estaba preseleccionado */}
              {!productoSeleccionado ? (
                <div style={{ marginBottom: '1.25rem', position: 'relative' }}>
                  <label className="etiqueta-campo">Buscar Artículo a Ajustar *</label>
                  <input 
                    type="text" 
                    className="input-control" 
                    placeholder="Escriba código de barras o nombre del producto..."
                    value={busquedaModal}
                    onChange={(e) => setBusquedaModal(e.target.value)}
                  />

                  {coincidenciasModal.length > 0 && (
                    <div style={{ 
                      position: 'absolute', 
                      top: '100%', 
                      left: 0, 
                      right: 0, 
                      zIndex: 200, 
                      backgroundColor: '#1e293b', 
                      border: '1px solid var(--color-borde)', 
                      borderRadius: 'var(--radio-md)',
                      maxHeight: '200px',
                      overflowY: 'auto'
                    }}>
                      {coincidenciasModal.map(c => (
                        <div 
                          key={c.idProducto}
                          style={{ padding: '0.6rem 0.85rem', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                          onClick={() => {
                            setProductoSeleccionado({
                              idProducto: c.idProducto,
                              descripcion: c.descripcion,
                              codigoBarras: c.codigoBarras,
                              stockActual: c.existenciaActual,
                            });
                            setCoincidenciasModal([]);
                          }}
                        >
                          <div style={{ fontWeight: 600 }}>{c.descripcion}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-texto-secundario)' }}>
                            Código: {c.codigoBarras} | Stock: {c.existenciaActual}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ 
                  padding: '0.85rem 1rem', 
                  borderRadius: 'var(--radio-md)', 
                  backgroundColor: 'rgba(255,255,255,0.03)', 
                  border: '1px solid var(--color-borde)',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{productoSeleccionado.descripcion}</div>
                    <div className="mono" style={{ fontSize: '0.8rem', color: 'var(--color-primario-hover)' }}>
                      {productoSeleccionado.codigoBarras}
                    </div>
                  </div>
                  <button 
                    type="button" 
                    className="btn btn-secundario" 
                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                    onClick={() => setProductoSeleccionado(null)}
                  >
                    Cambiar
                  </button>
                </div>
              )}

              {/* Selector de Tipo de Ajuste */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label className="etiqueta-campo">Tipo de Operación *</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className={`btn ${tipoAjuste === 'ENTRADA' ? 'btn-primario' : 'btn-secundario'}`}
                    style={{ justifyContent: 'center' }}
                    onClick={() => setTipoAjuste('ENTRADA')}
                  >
                    <PlusCircle size={16} />
                    <span>Entrada (+)</span>
                  </button>

                  <button
                    type="button"
                    className={`btn ${tipoAjuste === 'SALIDA' ? 'btn-peligro' : 'btn-secundario'}`}
                    style={{ justifyContent: 'center', backgroundColor: tipoAjuste === 'SALIDA' ? 'var(--color-peligro)' : undefined }}
                    onClick={() => setTipoAjuste('SALIDA')}
                  >
                    <MinusCircle size={16} />
                    <span>Salida (-)</span>
                  </button>

                  <button
                    type="button"
                    className={`btn ${tipoAjuste === 'RECONTEO_FISICO' ? 'btn-primario' : 'btn-secundario'}`}
                    style={{ justifyContent: 'center' }}
                    onClick={() => setTipoAjuste('RECONTEO_FISICO')}
                  >
                    <Sliders size={16} />
                    <span>Físico (=)</span>
                  </button>
                </div>
              </div>

              {/* Cantidad y Vista Previa del Cálculo */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <label className="etiqueta-campo">
                    {tipoAjuste === 'RECONTEO_FISICO' ? 'Conteo Físico Real *' : 'Cantidad a Ajustar *'}
                  </label>
                  <input 
                    type="number" 
                    step="0.01" 
                    min="0.01" 
                    className="input-control mono" 
                    value={cantidadAjuste}
                    onChange={(e) => setCantidadAjuste(Number(e.target.value))}
                    required
                  />
                </div>

                <div>
                  <label className="etiqueta-campo">Nuevo Stock Calculado</label>
                  <div style={{ 
                    height: '42px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    padding: '0 0.85rem',
                    borderRadius: 'var(--radio-sm)',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.2)'
                  }}>
                    <span className="mono font-bold" style={{ color: '#34d399', fontSize: '1.1rem' }}>
                      {calcularNuevoStockPrevisto()} unidades
                    </span>
                  </div>
                </div>
              </div>

              {/* Motivo del Ajuste */}
              <div style={{ marginBottom: '1rem' }}>
                <label className="etiqueta-campo">Motivo del Ajuste *</label>
                <select 
                  className="input-control" 
                  value={motivoAjuste}
                  onChange={(e) => setMotivoAjuste(e.target.value)}
                  required
                >
                  <option value="Reabastecimiento directo">Reabastecimiento directo</option>
                  <option value="Merma por caducidad">Merma por caducidad</option>
                  <option value="Mercancía dañada / rotura">Mercancía dañada / rotura</option>
                  <option value="Ajuste por conteo físico">Ajuste por conteo físico</option>
                  <option value="Consumo interno del negocio">Consumo interno del negocio</option>
                  <option value="Corrección de captura">Corrección de captura</option>
                </select>
              </div>

              {/* Observaciones */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label className="etiqueta-campo">Observaciones Adicionales</label>
                <textarea 
                  className="input-control" 
                  rows={2} 
                  placeholder="Detalles sobre el lote, proveedor o motivo..."
                  value={observacionesAjuste}
                  onChange={(e) => setObservacionesAjuste(e.target.value)}
                />
              </div>

              {/* Botones de acción */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button 
                  type="button" 
                  className="btn btn-secundario" 
                  onClick={() => setModalAjusteAbierto(false)}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primario" 
                  disabled={guardandoAjuste || !productoSeleccionado}
                >
                  {guardandoAjuste ? 'Guardando Ajuste...' : 'Aplicar Ajuste'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
