import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, Plus, AlertCircle, Loader2, Package } from 'lucide-react';
import { servicioProductos } from '../productos/servicioProductos';
import type { ProductoCobroDto } from '../productos/tipos';
import { SortableTh } from '../../components/comun/SortableTh';
import { useTableSort } from '../../hooks/useTableSort';

interface PropiedadesModalBuscarProductos {
  abierto: boolean;
  onCerrar: () => void;
  onSeleccionarProducto: (producto: ProductoCobroDto) => void;
}

export const ModalBuscarProductos: React.FC<PropiedadesModalBuscarProductos> = ({
  abierto,
  onCerrar,
  onSeleccionarProducto
}) => {
  const [terminoBusqueda, setTerminoBusqueda] = useState<string>('');
  const [productos, setProductos] = useState<ProductoCobroDto[]>([]);
  const [cargando, setCargando] = useState<boolean>(false);
  const [paginaActual, setPaginaActual] = useState<number>(1);
  const [registrosPorPagina] = useState<number>(10);
  const inputBusquedaRef = useRef<HTMLInputElement>(null);

  // Cargar catálogo de productos activos al abrir o buscar
  useEffect(() => {
    if (!abierto) return;

    const temporizador = setTimeout(async () => {
      try {
        setCargando(true);
        const resp = await servicioProductos.obtenerPaginado({
          pagina: 1,
          registrosPorPagina: 100,
          busqueda: terminoBusqueda.trim() || undefined,
          soloActivos: true
        });

        if (resp && resp.elementos) {
          const mapeados: ProductoCobroDto[] = resp.elementos.map(p => ({
            idProducto: p.idProducto,
            codigoBarras: p.codigoBarrasPrincipal || p.codigoProducto,
            codigoProducto: p.codigoProducto,
            descripcion: p.descripcion,
            precioVenta: p.precioVenta,
            precioMayoreo: p.precioMayoreo,
            permiteVentaFraccionada: p.permiteVentaFraccionada,
            manejaInventario: p.manejaInventario,
            existenciaActual: p.existenciaActual,
            categoria: p.categoriaNombre || 'General'
          }));
          setProductos(mapeados);
          setPaginaActual(1);
        }
      } catch {
        // Silencioso
      } finally {
        setCargando(false);
      }
    }, 180);

    return () => clearTimeout(temporizador);
  }, [abierto, terminoBusqueda]);

  // Foco automático en el buscador al abrir
  useEffect(() => {
    if (abierto) {
      setTimeout(() => {
        inputBusquedaRef.current?.focus();
        inputBusquedaRef.current?.select();
      }, 100);
    }
  }, [abierto]);

  // Atajo de teclado: Escape para cerrar
  useEffect(() => {
    if (!abierto) return;
    const manejarTecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCerrar();
      }
    };
    window.addEventListener('keydown', manejarTecla);
    return () => window.removeEventListener('keydown', manejarTecla);
  }, [abierto, onCerrar]);

  // Hook de ordenamiento tri-estado
  const { sortedData, sortKey, sortDirection, handleSort } = useTableSort<ProductoCobroDto>(productos, {
    initialKey: 'descripcion',
    initialDirection: 'asc'
  });

  // Paginación de los datos ordenados
  const totalPaginas = Math.ceil(sortedData.length / registrosPorPagina) || 1;
  const elementosPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * registrosPorPagina;
    return sortedData.slice(inicio, inicio + registrosPorPagina);
  }, [sortedData, paginaActual, registrosPorPagina]);

  if (!abierto) return null;

  return (
    <div className="modal-overlay">
      <div
        className="modal-contenido"
        style={{
          maxWidth: '850px',
          width: '95%',
          backgroundColor: '#ffffff',
          borderRadius: '18px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh'
        }}
      >
        {/* Cabecera */}
        <div style={{
          padding: '1.25rem 1.5rem',
          backgroundColor: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              padding: '0.5rem',
              backgroundColor: '#ecfdf5',
              color: '#059669',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Package size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                Catálogo de Productos
              </h3>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Busca y haz clic en cualquier producto para agregarlo a la venta (Atajo: F3)
              </span>
            </div>
          </div>
          <button
            onClick={onCerrar}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#64748b',
              cursor: 'pointer',
              padding: '0.35rem',
              borderRadius: '8px'
            }}
            title="Cerrar (Esc)"
          >
            <X size={20} />
          </button>
        </div>

        {/* Barra de búsqueda */}
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
          <div style={{ position: 'relative' }}>
            <Search
              size={20}
              style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}
            />
            <input
              ref={inputBusquedaRef}
              type="text"
              value={terminoBusqueda}
              onChange={(e) => setTerminoBusqueda(e.target.value)}
              placeholder="Escribe el nombre del producto, código de barras o categoría..."
              style={{
                width: '100%',
                padding: '0.75rem 1rem 0.75rem 2.75rem',
                fontSize: '1rem',
                border: '2px solid #059669',
                borderRadius: '10px',
                backgroundColor: '#f8fafc',
                color: '#0f172a',
                outline: 'none'
              }}
            />
          </div>
        </div>

        {/* Tabla de Resultados */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 1.5rem' }}>
          {cargando ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: '#64748b' }}>
              <Loader2 size={32} className="spinner" style={{ color: '#059669', margin: '0 auto 0.5rem' }} />
              <p>Buscando productos en catálogo...</p>
            </div>
          ) : elementosPaginados.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
              <AlertCircle size={40} style={{ opacity: 0.3, margin: '0 auto 0.5rem' }} />
              <h4>No se encontraron productos</h4>
              <p style={{ fontSize: '0.85rem' }}>Prueba con otro término de búsqueda.</p>
            </div>
          ) : (
            <table className="tabla-datos" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr>
                  <SortableTh
                    sortKey="descripcion"
                    currentSortKey={sortKey}
                    currentSortDirection={sortDirection}
                    onSort={handleSort}
                    style={{ width: '40%' }}
                  >
                    Descripción
                  </SortableTh>
                  <SortableTh
                    sortKey="codigoBarras"
                    currentSortKey={sortKey}
                    currentSortDirection={sortDirection}
                    onSort={handleSort}
                    style={{ width: '20%' }}
                  >
                    Código
                  </SortableTh>
                  <SortableTh
                    sortKey="existenciaActual"
                    currentSortKey={sortKey}
                    currentSortDirection={sortDirection}
                    onSort={handleSort}
                    align="center"
                    style={{ width: '15%' }}
                  >
                    Stock
                  </SortableTh>
                  <SortableTh
                    sortKey="precioVenta"
                    currentSortKey={sortKey}
                    currentSortDirection={sortDirection}
                    onSort={handleSort}
                    align="right"
                    style={{ width: '15%' }}
                  >
                    Precio
                  </SortableTh>
                  <th style={{ width: '10%', textAlign: 'center' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {elementosPaginados.map((p) => (
                  <tr
                    key={p.idProducto}
                    style={{ cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}
                    onClick={() => {
                      onSeleccionarProducto(p);
                      onCerrar();
                    }}
                  >
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{p.descripcion}</div>
                      <span className="badge badge-secundario" style={{ fontSize: '0.7rem' }}>
                        {p.categoria}
                      </span>
                    </td>
                    <td className="mono" style={{ color: '#059669', fontWeight: 600 }}>
                      {p.codigoBarras}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="mono" style={{ fontWeight: 700 }}>
                        {p.existenciaActual} {p.permiteVentaFraccionada ? 'kg' : 'pza'}
                      </span>
                    </td>
                    <td className="mono font-bold" style={{ textAlign: 'right', fontSize: '1.05rem', color: '#0f172a' }}>
                      ${p.precioVenta.toFixed(2)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        className="btn btn-primario"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', gap: '0.3rem' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSeleccionarProducto(p);
                          onCerrar();
                        }}
                      >
                        <Plus size={14} />
                        <span>Agregar</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Paginación y Pie */}
        <div style={{
          padding: '0.9rem 1.5rem',
          backgroundColor: '#f8fafc',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Mostrando <strong>{elementosPaginados.length}</strong> de <strong>{sortedData.length}</strong> productos
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Página {paginaActual} de {totalPaginas}
            </span>
            <button
              type="button"
              className="btn btn-secundario"
              disabled={paginaActual <= 1}
              onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
              style={{ padding: '0.3rem 0.6rem' }}
            >
              Anterior
            </button>
            <button
              type="button"
              className="btn btn-secundario"
              disabled={paginaActual >= totalPaginas}
              onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))}
              style={{ padding: '0.3rem 0.6rem' }}
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalBuscarProductos;
