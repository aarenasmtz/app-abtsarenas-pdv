import React, { useState, useEffect, useCallback } from 'react';
import { 
  Package, 
  Search, 
  Plus, 
  Edit2, 
  Power, 
  Image as ImageIcon, 
  Upload, 
  RefreshCw, 
  AlertTriangle, 
  Check, 
  X,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import { servicioProductos } from './servicioProductos';
import { servicioCatalogos } from '../catalogos/servicioCatalogos';
import type { 
  ProductoAdminDto, 
  CrearProductoDto, 
  ActualizarProductoDto 
} from './tipos';
import type { 
  CategoriaDto, 
  MarcaDto, 
  UnidadMedidaDto 
} from '../catalogos/tipos';
import { TablaPaginada } from '../../components/comun/TablaPaginada';
import type { ResultadoPaginado } from '../../types/comun';

export const PantallaProductos: React.FC = () => {
  // Estados de datos y paginación
  const [productosPaginados, setProductosPaginados] = useState<ResultadoPaginado<ProductoAdminDto>>({
    elementos: [],
    totalRegistros: 0,
    paginaActual: 1,
    registrosPorPagina: 25,
    totalPaginas: 0,
    tienePaginaAnterior: false,
    tienePaginaSiguiente: false,
  });

  const [paginaActual, setPaginaActual] = useState(1);
  const [registrosPorPagina, setRegistrosPorPagina] = useState<25 | 50 | 100>(25);
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [idCategoriaSeleccionada, setIdCategoriaSeleccionada] = useState<number | undefined>(undefined);
  const [idMarcaSeleccionada, setIdMarcaSeleccionada] = useState<number | undefined>(undefined);
  const [soloActivos, setSoloActivos] = useState<boolean | undefined>(true);
  const [soloBajoStock, setSoloBajoStock] = useState<boolean>(false);
  const [cargando, setCargando] = useState(false);
  const [mensajeAlerta, setMensajeAlerta] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);

  // Catálogos auxiliares
  const [categorias, setCategorias] = useState<CategoriaDto[]>([]);
  const [marcas, setMarcas] = useState<MarcaDto[]>([]);
  const [unidadesMedida, setUnidadesMedida] = useState<UnidadMedidaDto[]>([]);

  // Estados de modales
  const [modalAbierto, setModalAbierto] = useState(false);
  const [productoEnEdicion, setProductoEnEdicion] = useState<ProductoAdminDto | null>(null);
  const [modalImagenAbierto, setModalImagenAbierto] = useState(false);
  const [productoParaImagen, setProductoParaImagen] = useState<ProductoAdminDto | null>(null);
  const [archivoImagenSeleccionado, setArchivoImagenSeleccionado] = useState<File | null>(null);
  const [previewImagenUrl, setPreviewImagenUrl] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  // Formulario de Producto
  const [formDescripcion, setFormDescripcion] = useState('');
  const [formCodigoProducto, setFormCodigoProducto] = useState('');
  const [formCodigoBarras, setFormCodigoBarras] = useState('');
  const [formIdCategoria, setFormIdCategoria] = useState<number | undefined>(undefined);
  const [formIdMarca, setFormIdMarca] = useState<number | undefined>(undefined);
  const [formIdUnidadMedida, setFormIdUnidadMedida] = useState<number>(1);
  const [formPrecioCosto, setFormPrecioCosto] = useState<number>(0);
  const [formPrecioVenta, setFormPrecioVenta] = useState<number>(0);
  const [formPrecioMayoreo, setFormPrecioMayoreo] = useState<number>(0);
  const [formExistenciaInicial, setFormExistenciaInicial] = useState<number>(0);
  const [formExistenciaMinima, setFormExistenciaMinima] = useState<number>(5);
  const [formExistenciaMaxima, setFormExistenciaMaxima] = useState<number>(100);
  const [formPermiteFraccionada, setFormPermiteFraccionada] = useState<boolean>(false);
  const [formManejaInventario, setFormManejaInventario] = useState<boolean>(true);
  const [formActivo, setFormActivo] = useState<boolean>(true);

  // Cálculo reactivo del porcentaje de ganancia
  const margenCalculado = formPrecioCosto > 0
    ? Math.round(((formPrecioVenta - formPrecioCosto) / formPrecioCosto) * 100 * 100) / 100
    : 0;

  // Cargar catálogos iniciales
  useEffect(() => {
    const cargarCatalogos = async () => {
      try {
        const [cats, marcs, unids] = await Promise.all([
          servicioCatalogos.obtenerCategorias(),
          servicioCatalogos.obtenerMarcas(),
          servicioCatalogos.obtenerUnidadesMedida(),
        ]);
        setCategorias(cats);
        setMarcas(marcs);
        setUnidadesMedida(unids);
      } catch (err) {
        console.error('Error al cargar catálogos auxiliares:', err);
      }
    };
    cargarCatalogos();
  }, []);

  // Cargar productos con paginación server-side
  const cargarProductos = useCallback(async () => {
    try {
      setCargando(true);
      const resultado = await servicioProductos.obtenerPaginado({
        pagina: paginaActual,
        registrosPorPagina: registrosPorPagina,
        busqueda: terminoBusqueda.trim() || undefined,
        idCategoria: idCategoriaSeleccionada,
        idMarca: idMarcaSeleccionada,
        soloActivos: soloActivos,
        soloBajoStock: soloBajoStock ? true : undefined,
      });
      setProductosPaginados(resultado);
    } catch (err) {
      setMensajeAlerta({ tipo: 'error', texto: 'Error al consultar catálogo de productos.' });
    } finally {
      setCargando(false);
    }
  }, [paginaActual, registrosPorPagina, terminoBusqueda, idCategoriaSeleccionada, idMarcaSeleccionada, soloActivos, soloBajoStock]);

  useEffect(() => {
    const timer = setTimeout(() => {
      cargarProductos();
    }, 250);
    return () => clearTimeout(timer);
  }, [cargarProductos]);

  const abrirModalCrear = () => {
    setProductoEnEdicion(null);
    setFormDescripcion('');
    setFormCodigoProducto('');
    setFormCodigoBarras('');
    setFormIdCategoria(categorias.length > 0 ? categorias[0].idCategoria : undefined);
    setFormIdMarca(marcas.length > 0 ? marcas[0].idMarca : undefined);
    setFormIdUnidadMedida(unidadesMedida.length > 0 ? unidadesMedida[0].idUnidadMedida : 1);
    setFormPrecioCosto(0);
    setFormPrecioVenta(0);
    setFormPrecioMayoreo(0);
    setFormExistenciaInicial(0);
    setFormExistenciaMinima(5);
    setFormExistenciaMaxima(100);
    setFormPermiteFraccionada(false);
    setFormManejaInventario(true);
    setFormActivo(true);
    setModalAbierto(true);
  };

  const abrirModalEditar = (producto: ProductoAdminDto) => {
    setProductoEnEdicion(producto);
    setFormDescripcion(producto.descripcion);
    setFormCodigoProducto(producto.codigoProducto);
    setFormCodigoBarras(producto.codigoBarrasPrincipal);
    setFormIdCategoria(producto.idCategoria);
    setFormIdMarca(producto.idMarca);
    setFormIdUnidadMedida(producto.idUnidadMedida || 1);
    setFormPrecioCosto(producto.precioCosto);
    setFormPrecioVenta(producto.precioVenta);
    setFormPrecioMayoreo(producto.precioMayoreo);
    setFormExistenciaMinima(producto.existenciaMinima);
    setFormExistenciaMaxima(producto.existenciaMaxima);
    setFormPermiteFraccionada(producto.permiteVentaFraccionada);
    setFormManejaInventario(producto.manejaInventario);
    setFormActivo(producto.activo);
    setModalAbierto(true);
  };

  const guardarProducto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDescripcion.trim()) {
      setMensajeAlerta({ tipo: 'error', texto: 'La descripción del producto es obligatoria.' });
      return;
    }

    try {
      setGuardando(true);
      if (productoEnEdicion) {
        const dtoActualizar: ActualizarProductoDto = {
          descripcion: formDescripcion.trim(),
          codigoBarrasPrincipal: formCodigoBarras.trim(),
          idCategoria: formIdCategoria,
          idMarca: formIdMarca,
          idUnidadMedida: formIdUnidadMedida,
          precioCosto: formPrecioCosto,
          precioVenta: formPrecioVenta,
          precioMayoreo: formPrecioMayoreo > 0 ? formPrecioMayoreo : formPrecioVenta,
          porcentajeGanancia: margenCalculado,
          existenciaMinima: formExistenciaMinima,
          existenciaMaxima: formExistenciaMaxima,
          permiteVentaFraccionada: formPermiteFraccionada,
          manejaInventario: formManejaInventario,
          activo: formActivo,
        };

        await servicioProductos.actualizar(productoEnEdicion.idProducto, dtoActualizar);
        setMensajeAlerta({ tipo: 'exito', texto: 'Producto actualizado con éxito.' });
      } else {
        const dtoCrear: CrearProductoDto = {
          descripcion: formDescripcion.trim(),
          codigoProducto: formCodigoProducto.trim(),
          codigoBarras: formCodigoBarras.trim(),
          idCategoria: formIdCategoria,
          idMarca: formIdMarca,
          idUnidadMedida: formIdUnidadMedida,
          precioCosto: formPrecioCosto,
          precioVenta: formPrecioVenta,
          precioMayoreo: formPrecioMayoreo > 0 ? formPrecioMayoreo : formPrecioVenta,
          porcentajeGanancia: margenCalculado,
          existenciaInicial: formExistenciaInicial,
          existenciaMinima: formExistenciaMinima,
          existenciaMaxima: formExistenciaMaxima,
          permiteVentaFraccionada: formPermiteFraccionada,
          manejaInventario: formManejaInventario,
        };

        await servicioProductos.crear(dtoCrear);
        setMensajeAlerta({ tipo: 'exito', texto: 'Producto registrado exitosamente en el catálogo.' });
      }

      setModalAbierto(false);
      cargarProductos();
    } catch (err: any) {
      const mensaje = err.response?.data?.mensaje || 'Error al guardar el producto.';
      setMensajeAlerta({ tipo: 'error', texto: mensaje });
    } finally {
      setGuardando(false);
    }
  };

  const alternarEstado = async (producto: ProductoAdminDto) => {
    const nuevoEstado = !producto.activo;
    try {
      await servicioProductos.cambiarEstado(producto.idProducto, nuevoEstado);
      setMensajeAlerta({ 
        tipo: 'exito', 
        texto: `Producto ${nuevoEstado ? 'reactivado' : 'desactivado'} correctamente.` 
      });
      cargarProductos();
    } catch {
      setMensajeAlerta({ tipo: 'error', texto: 'No se pudo cambiar el estado del producto.' });
    }
  };

  const abrirModalImagen = (producto: ProductoAdminDto) => {
    setProductoParaImagen(producto);
    setArchivoImagenSeleccionado(null);
    setPreviewImagenUrl(producto.imagenUrl || null);
    setModalImagenAbierto(true);
  };

  const manejarSeleccionArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    if (archivo) {
      setArchivoImagenSeleccionado(archivo);
      setPreviewImagenUrl(URL.createObjectURL(archivo));
    }
  };

  const subirImagenProducto = async () => {
    if (!productoParaImagen || !archivoImagenSeleccionado) return;

    try {
      setGuardando(true);
      await servicioProductos.subirImagen(productoParaImagen.idProducto, archivoImagenSeleccionado);
      setMensajeAlerta({ tipo: 'exito', texto: 'Imagen actualizada exitosamente.' });
      setModalImagenAbierto(false);
      cargarProductos();
    } catch (err: any) {
      const msg = err.response?.data?.mensaje || 'Error al subir la imagen.';
      setMensajeAlerta({ tipo: 'error', texto: msg });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Notificación flotante */}
      {mensajeAlerta && (
        <div 
          className={`tarjeta`} 
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

      {/* Encabezado y barra de acciones */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Package size={24} color="var(--color-primario)" />
            <span>Catálogo Maestro de Productos</span>
          </h2>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--color-texto-secundario)' }}>
            Administración completa de artículos, inventarios, márgenes comerciales y fotografías.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            className="btn btn-secundario" 
            onClick={() => cargarProductos()}
            disabled={cargando}
            title="Recargar catálogo"
          >
            <RefreshCw size={16} className={cargando ? 'girar' : ''} />
            <span>Refrescar</span>
          </button>

          <button 
            className="btn btn-primario" 
            onClick={abrirModalCrear}
          >
            <Plus size={18} />
            <span>Nuevo Producto</span>
          </button>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="tarjeta" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
        <div style={{ flex: '1 1 260px', position: 'relative' }}>
          <Search 
            size={18} 
            style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-texto-secundario)' }} 
          />
          <input 
            type="text" 
            placeholder="Buscar por código de barras, clave o descripción..." 
            className="input-control" 
            style={{ paddingLeft: '2.5rem', width: '100%' }}
            value={terminoBusqueda}
            onChange={(e) => {
              setTerminoBusqueda(e.target.value);
              setPaginaActual(1);
            }}
          />
        </div>

        <div style={{ flex: '0 1 180px' }}>
          <select 
            className="input-control" 
            style={{ width: '100%' }}
            value={idCategoriaSeleccionada || ''}
            onChange={(e) => {
              const val = e.target.value ? Number(e.target.value) : undefined;
              setIdCategoriaSeleccionada(val);
              setPaginaActual(1);
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
            value={idMarcaSeleccionada || ''}
            onChange={(e) => {
              const val = e.target.value ? Number(e.target.value) : undefined;
              setIdMarcaSeleccionada(val);
              setPaginaActual(1);
            }}
          >
            <option value="">Todas las Marcas</option>
            {marcas.map(m => (
              <option key={m.idMarca} value={m.idMarca}>{m.descripcion}</option>
            ))}
          </select>
        </div>

        <div style={{ flex: '0 1 150px' }}>
          <select 
            className="input-control" 
            style={{ width: '100%' }}
            value={soloActivos === undefined ? 'todos' : soloActivos ? 'activos' : 'inactivos'}
            onChange={(e) => {
              const val = e.target.value;
              setSoloActivos(val === 'todos' ? undefined : val === 'activos');
              setPaginaActual(1);
            }}
          >
            <option value="activos">Solo Activos</option>
            <option value="inactivos">Solo Inactivos</option>
            <option value="todos">Todos los Estados</option>
          </select>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.88rem' }}>
          <input 
            type="checkbox" 
            checked={soloBajoStock}
            onChange={(e) => {
              setSoloBajoStock(e.target.checked);
              setPaginaActual(1);
            }}
          />
          <span style={{ color: soloBajoStock ? 'var(--color-advertencia)' : 'inherit' }}>
            Bajo Stock
          </span>
        </label>
      </div>

      {/* Tabla Paginada de Productos */}
      <TablaPaginada<ProductoAdminDto>
        cargando={cargando}
        columnas={[
          {
            clave: 'imagen',
            titulo: 'Foto',
            renderizar: (p) => (
              <div 
                style={{ 
                  width: '42px', 
                  height: '42px', 
                  borderRadius: 'var(--radio-md)', 
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  cursor: 'pointer',
                  border: '1px solid var(--color-borde)',
                  overflow: 'hidden'
                }}
                onClick={() => abrirModalImagen(p)}
                title="Haga clic para ver o cambiar la imagen"
              >
                {p.imagenUrl ? (
                  <img 
                    src={p.imagenUrl.startsWith('http') ? p.imagenUrl : p.imagenUrl.startsWith('/') ? p.imagenUrl : `/${p.imagenUrl}`} 
                    alt={p.descripcion}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <ImageIcon size={18} color="var(--color-texto-secundario)" />
                )}
              </div>
            )
          },
          {
            clave: 'codigoBarrasPrincipal',
            titulo: 'Código de Barras',
            renderizar: (p) => (
              <div>
                <span className="mono font-bold" style={{ color: 'var(--color-primario-hover)' }}>
                  {p.codigoBarrasPrincipal || p.codigoProducto}
                </span>
                {p.codigoProducto && p.codigoProducto !== p.codigoBarrasPrincipal && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-texto-secundario)' }}>
                    Clave: {p.codigoProducto}
                  </div>
                )}
              </div>
            )
          },
          {
            clave: 'descripcion',
            titulo: 'Descripción',
            renderizar: (p) => (
              <div>
                <div style={{ fontWeight: 600, color: 'var(--color-texto-principal)' }}>
                  {p.descripcion}
                </div>
                <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.2rem' }}>
                  {p.categoriaNombre && (
                    <span className="badge badge-secundario" style={{ fontSize: '0.7rem' }}>
                      {p.categoriaNombre}
                    </span>
                  )}
                  {p.marcaNombre && (
                    <span className="badge badge-secundario" style={{ fontSize: '0.7rem' }}>
                      {p.marcaNombre}
                    </span>
                  )}
                </div>
              </div>
            )
          },
          {
            clave: 'precioCosto',
            titulo: 'Costo',
            renderizar: (p) => (
              <span className="mono" style={{ color: 'var(--color-texto-secundario)' }}>
                ${p.precioCosto.toFixed(2)}
              </span>
            )
          },
          {
            clave: 'precioVenta',
            titulo: 'P. Venta',
            renderizar: (p) => (
              <span className="mono font-bold" style={{ color: '#34d399', fontSize: '1rem' }}>
                ${p.precioVenta.toFixed(2)}
              </span>
            )
          },
          {
            clave: 'precioMayoreo',
            titulo: 'P. Mayoreo',
            renderizar: (p) => (
              <span className="mono" style={{ color: 'var(--color-acento-hover)' }}>
                ${p.precioMayoreo.toFixed(2)}
              </span>
            )
          },
          {
            clave: 'porcentajeGanancia',
            titulo: 'Margen %',
            renderizar: (p) => (
              <span className="badge badge-exito mono" style={{ fontSize: '0.75rem' }}>
                +{p.porcentajeGanancia.toFixed(1)}%
              </span>
            )
          },
          {
            clave: 'existenciaActual',
            titulo: 'Stock',
            renderizar: (p) => {
              const bajoStock = p.manejaInventario && p.existenciaActual <= p.existenciaMinima;
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                  <span className={`mono font-bold ${bajoStock ? 'color-peligro' : ''}`}>
                    {p.existenciaActual} {p.permiteVentaFraccionada ? 'kg' : 'pza'}
                  </span>
                  {bajoStock && (
                    <span className="badge badge-peligro" style={{ fontSize: '0.65rem' }}>
                      Bajo Mín ({p.existenciaMinima})
                    </span>
                  )}
                </div>
              );
            }
          },
          {
            clave: 'activo',
            titulo: 'Estado',
            renderizar: (p) => (
              <span className={`badge ${p.activo ? 'badge-exito' : 'badge-peligro'}`}>
                {p.activo ? 'Activo' : 'Inactivo'}
              </span>
            )
          },
          {
            clave: 'acciones',
            titulo: 'Acciones',
            renderizar: (p) => (
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button 
                  className="btn btn-secundario" 
                  style={{ padding: '0.35rem 0.5rem' }}
                  title="Editar producto"
                  onClick={() => abrirModalEditar(p)}
                >
                  <Edit2 size={14} />
                </button>
                <button 
                  className="btn btn-secundario" 
                  style={{ padding: '0.35rem 0.5rem' }}
                  title="Subir / Ver fotografía"
                  onClick={() => abrirModalImagen(p)}
                >
                  <ImageIcon size={14} />
                </button>
                <button 
                  className="btn btn-secundario" 
                  style={{ 
                    padding: '0.35rem 0.5rem',
                    color: p.activo ? 'var(--color-peligro)' : 'var(--color-exito)'
                  }}
                  title={p.activo ? 'Desactivar producto' : 'Activar producto'}
                  onClick={() => alternarEstado(p)}
                >
                  <Power size={14} />
                </button>
              </div>
            )
          }
        ]}
        resultado={productosPaginados}
        onCambiarPagina={(nuevaPagina) => setPaginaActual(nuevaPagina)}
        onCambiarRegistrosPorPagina={(nuevoTam) => {
          setRegistrosPorPagina(nuevoTam);
          setPaginaActual(1);
        }}
      />

      {/* MODAL CREAR / EDITAR PRODUCTO */}
      {modalAbierto && (
        <div className="modal-overlay">
          <div className="modal-contenido" style={{ maxWidth: '780px', width: '90%' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Package size={20} color="var(--color-primario)" />
                <span>{productoEnEdicion ? 'Modificar Producto' : 'Nuevo Producto en Catálogo'}</span>
              </h3>
              <button 
                className="btn btn-secundario" 
                style={{ padding: '0.3rem 0.5rem' }}
                onClick={() => setModalAbierto(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={guardarProducto} style={{ padding: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                {/* Código de barras */}
                <div>
                  <label className="etiqueta-campo">Código de Barras Principal *</label>
                  <input 
                    type="text" 
                    className="input-control mono" 
                    placeholder="75010001..." 
                    value={formCodigoBarras}
                    onChange={(e) => setFormCodigoBarras(e.target.value)}
                    required
                  />
                </div>

                {/* Clave interna */}
                <div>
                  <label className="etiqueta-campo">Clave Interna (Opcional)</label>
                  <input 
                    type="text" 
                    className="input-control mono" 
                    placeholder="ART-001" 
                    value={formCodigoProducto}
                    onChange={(e) => setFormCodigoProducto(e.target.value)}
                  />
                </div>

                {/* Descripción */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="etiqueta-campo">Descripción Comercial *</label>
                  <input 
                    type="text" 
                    className="input-control" 
                    placeholder="Ej. REFRESCO COCA COLA 600 ML" 
                    value={formDescripcion}
                    onChange={(e) => setFormDescripcion(e.target.value)}
                    required
                  />
                </div>

                {/* Categoría */}
                <div>
                  <label className="etiqueta-campo">Categoría</label>
                  <select 
                    className="input-control"
                    value={formIdCategoria || ''}
                    onChange={(e) => setFormIdCategoria(e.target.value ? Number(e.target.value) : undefined)}
                  >
                    <option value="">-- Sin Categoría --</option>
                    {categorias.map(c => (
                      <option key={c.idCategoria} value={c.idCategoria}>{c.descripcion}</option>
                    ))}
                  </select>
                </div>

                {/* Marca */}
                <div>
                  <label className="etiqueta-campo">Marca</label>
                  <select 
                    className="input-control"
                    value={formIdMarca || ''}
                    onChange={(e) => setFormIdMarca(e.target.value ? Number(e.target.value) : undefined)}
                  >
                    <option value="">-- Sin Marca --</option>
                    {marcas.map(m => (
                      <option key={m.idMarca} value={m.idMarca}>{m.descripcion}</option>
                    ))}
                  </select>
                </div>

                {/* Unidad de Medida */}
                <div>
                  <label className="etiqueta-campo">Unidad de Medida *</label>
                  <select 
                    className="input-control"
                    value={formIdUnidadMedida}
                    onChange={(e) => setFormIdUnidadMedida(Number(e.target.value))}
                    required
                  >
                    {unidadesMedida.map(u => (
                      <option key={u.idUnidadMedida} value={u.idUnidadMedida}>
                        {u.nombre} ({u.abreviatura})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* SECCIÓN COMERCIAL Y PRECIOS */}
              <div style={{ 
                border: '1px solid var(--color-borde)', 
                borderRadius: 'var(--radio-md)', 
                padding: '1rem', 
                marginBottom: '1rem',
                backgroundColor: 'rgba(255, 255, 255, 0.02)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <DollarSign size={18} color="var(--color-exito)" />
                  <span style={{ fontWeight: 600 }}>Estructura de Precios y Margen</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label className="etiqueta-campo">Precio Costo ($)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      className="input-control mono" 
                      value={formPrecioCosto}
                      onChange={(e) => setFormPrecioCosto(Number(e.target.value))}
                    />
                  </div>

                  <div>
                    <label className="etiqueta-campo">Precio Venta ($) *</label>
                    <input 
                      type="number" 
                      step="0.01"
                      className="input-control mono" 
                      style={{ fontWeight: 700, color: '#34d399' }}
                      value={formPrecioVenta}
                      onChange={(e) => setFormPrecioVenta(Number(e.target.value))}
                      required
                    />
                  </div>

                  <div>
                    <label className="etiqueta-campo">Precio Mayoreo ($)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      className="input-control mono" 
                      value={formPrecioMayoreo}
                      onChange={(e) => setFormPrecioMayoreo(Number(e.target.value))}
                    />
                  </div>

                  <div>
                    <label className="etiqueta-campo">Margen Ganancia</label>
                    <div style={{ 
                      height: '42px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.4rem',
                      padding: '0 0.75rem', 
                      borderRadius: 'var(--radio-sm)', 
                      backgroundColor: 'rgba(16, 185, 129, 0.1)', 
                      border: '1px solid rgba(16, 185, 129, 0.2)' 
                    }}>
                      <TrendingUp size={16} color="var(--color-exito)" />
                      <span className="mono font-bold" style={{ color: '#34d399' }}>
                        +{margenCalculado}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECCIÓN INVENTARIO */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                {!productoEnEdicion && (
                  <div>
                    <label className="etiqueta-campo">Existencia Inicial</label>
                    <input 
                      type="number" 
                      step="0.01"
                      className="input-control mono" 
                      value={formExistenciaInicial}
                      onChange={(e) => setFormExistenciaInicial(Number(e.target.value))}
                    />
                  </div>
                )}

                <div>
                  <label className="etiqueta-campo">Stock Mínimo</label>
                  <input 
                    type="number" 
                    step="0.01"
                    className="input-control mono" 
                    value={formExistenciaMinima}
                    onChange={(e) => setFormExistenciaMinima(Number(e.target.value))}
                  />
                </div>

                <div>
                  <label className="etiqueta-campo">Stock Máximo</label>
                  <input 
                    type="number" 
                    step="0.01"
                    className="input-control mono" 
                    value={formExistenciaMaxima}
                    onChange={(e) => setFormExistenciaMaxima(Number(e.target.value))}
                  />
                </div>
              </div>

              {/* CONFIGURACIÓN Y TOGGLES */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={formPermiteFraccionada}
                    onChange={(e) => setFormPermiteFraccionada(e.target.checked)}
                  />
                  <span>Permite Venta a Granel / Fraccionada</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={formManejaInventario}
                    onChange={(e) => setFormManejaInventario(e.target.checked)}
                  />
                  <span>Controlar Existencias en Inventario</span>
                </label>

                {productoEnEdicion && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={formActivo}
                      onChange={(e) => setFormActivo(e.target.checked)}
                    />
                    <span>Producto Habilitado / Activo</span>
                  </label>
                )}
              </div>

              {/* ACCIONES DEL FORMULARIO */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button 
                  type="button" 
                  className="btn btn-secundario" 
                  onClick={() => setModalAbierto(false)}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primario" 
                  disabled={guardando}
                >
                  {guardando ? 'Guardando...' : productoEnEdicion ? 'Actualizar Producto' : 'Guardar Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL FOTOGRAFÍA DEL PRODUCTO (ADMINISTRATIVO) */}
      {modalImagenAbierto && productoParaImagen && (
        <div className="modal-overlay">
          <div className="modal-contenido" style={{ maxWidth: '460px', width: '90%' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ImageIcon size={20} color="var(--color-primario)" />
                <span>Fotografía del Artículo</span>
              </h3>
              <button 
                className="btn btn-secundario" 
                style={{ padding: '0.3rem 0.5rem' }}
                onClick={() => setModalImagenAbierto(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '1.25rem', textAlign: 'center' }}>
              <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>
                {productoParaImagen.descripcion}
              </p>
              <span className="mono" style={{ fontSize: '0.85rem', color: 'var(--color-texto-secundario)' }}>
                {productoParaImagen.codigoBarrasPrincipal}
              </span>

              {/* Vista previa de imagen */}
              <div style={{ 
                margin: '1.25rem auto', 
                width: '200px', 
                height: '200px', 
                borderRadius: 'var(--radio-md)', 
                backgroundColor: 'rgba(255,255,255,0.03)',
                border: '2px dashed var(--color-borde)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}>
                {previewImagenUrl ? (
                  <img 
                    src={previewImagenUrl.startsWith('blob:') || previewImagenUrl.startsWith('http') ? previewImagenUrl : previewImagenUrl.startsWith('/') ? previewImagenUrl : `/${previewImagenUrl}`} 
                    alt="Vista previa" 
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                ) : (
                  <div style={{ color: 'var(--color-texto-secundario)', fontSize: '0.85rem' }}>
                    <ImageIcon size={48} style={{ opacity: 0.5, marginBottom: '0.5rem' }} />
                    <div>Sin Fotografía Asignada</div>
                  </div>
                )}
              </div>

              {/* Selector de archivo */}
              <label className="btn btn-secundario" style={{ display: 'inline-flex', cursor: 'pointer', marginBottom: '1.25rem' }}>
                <Upload size={16} />
                <span>Seleccionar Imagen (.jpg, .png, .webp)</span>
                <input 
                  type="file" 
                  accept="image/jpeg,image/png,image/webp" 
                  onChange={manejarSeleccionArchivo} 
                  style={{ display: 'none' }} 
                />
              </label>

              {/* Botón de guardar imagen */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button 
                  type="button" 
                  className="btn btn-secundario" 
                  onClick={() => setModalImagenAbierto(false)}
                >
                  Cerrar
                </button>
                <button 
                  type="button" 
                  className="btn btn-primario" 
                  disabled={!archivoImagenSeleccionado || guardando}
                  onClick={subirImagenProducto}
                >
                  {guardando ? 'Guardando...' : 'Guardar Imagen'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
