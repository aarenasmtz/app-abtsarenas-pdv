import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ResultadoPaginado } from '../../types/comun';
import { SortableTh } from './SortableTh';
import type { SortDirection } from '../../hooks/useTableSort';

export interface Columna<T> {
  clave: string;
  titulo: string;
  renderizar?: (item: T) => React.ReactNode;
  ordenable?: boolean;
  alineacion?: 'left' | 'center' | 'right';
  ancho?: string;
}

export interface PropiedadesTablaPaginada<T> {
  columnas: Columna<T>[];
  resultado?: ResultadoPaginado<T>;
  cargando?: boolean;
  onCambiarPagina: (nuevaPagina: number) => void;
  onCambiarRegistrosPorPagina: (tamano: 25 | 50 | 100) => void;
  sortKey?: string | null;
  sortDirection?: SortDirection;
  onSort?: (clave: string) => void;
}

export function TablaPaginada<T>({
  columnas,
  resultado,
  cargando = false,
  onCambiarPagina,
  onCambiarRegistrosPorPagina,
  sortKey = null,
  sortDirection = null,
  onSort,
}: PropiedadesTablaPaginada<T>) {
  if (cargando) {
    return (
      <div className="tarjeta" style={{ textAlign: 'center', padding: '3rem' }}>
        <p style={{ color: 'var(--color-texto-secundario)' }}>Cargando registros desde el servidor...</p>
      </div>
    );
  }

  const elementos = resultado?.elementos || [];

  return (
    <div className="tabla-contenedor">
      <table className="tabla-datos">
        <thead>
          <tr>
            {columnas.map((col) => {
              if (col.ordenable && onSort) {
                return (
                  <SortableTh
                    key={col.clave}
                    sortKey={col.clave}
                    currentSortKey={sortKey}
                    currentSortDirection={sortDirection}
                    onSort={onSort}
                    align={col.alineacion || 'left'}
                    style={{ width: col.ancho }}
                  >
                    {col.titulo}
                  </SortableTh>
                );
              }
              return (
                <th
                  key={col.clave}
                  style={{
                    textAlign: col.alineacion || 'left',
                    width: col.ancho,
                    padding: '0.75rem 1rem'
                  }}
                >
                  {col.titulo}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {elementos.length === 0 ? (
            <tr>
              <td colSpan={columnas.length} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--color-texto-secundario)' }}>
                No se encontraron registros en el sistema.
              </td>
            </tr>
          ) : (
            elementos.map((item, index) => (
              <tr key={((item as any).id || (item as any).idProducto || (item as any).idUsuario || index) as React.Key}>
                {columnas.map((col) => (
                  <td
                    key={col.clave}
                    style={{
                      textAlign: col.alineacion || 'left'
                    }}
                  >
                    {col.renderizar ? col.renderizar(item) : ((item as any)[col.clave] as React.ReactNode)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {resultado && (
        <div className="table-pagination-container">
          <div className="table-pagination-info">
            <span>
              Mostrando <strong>{elementos.length}</strong> de <strong>{resultado.totalRegistros}</strong> registros
            </span>
            <span style={{ margin: '0 0.5rem', color: 'var(--color-borde)' }}>|</span>
            <div className="table-pagination-size">
              <span>Por página:</span>
              <select
                className="table-pagination-select"
                value={resultado.registrosPorPagina}
                onChange={(e) => onCambiarRegistrosPorPagina(Number(e.target.value) as 25 | 50 | 100)}
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <div className="table-pagination-controls">
            <span style={{ fontSize: '0.85rem', color: 'var(--color-texto-secundario)', marginRight: '0.5rem' }}>
              Página <strong>{resultado.paginaActual}</strong> de <strong>{resultado.totalPaginas || 1}</strong>
            </span>

            <div className="table-pagination-nav">
              <button
                className="pagination-btn"
                disabled={!resultado.tienePaginaAnterior}
                onClick={() => onCambiarPagina(resultado.paginaActual - 1)}
                title="Página anterior"
              >
                <ChevronLeft size={16} />
              </button>

              <button
                className="pagination-btn"
                disabled={!resultado.tienePaginaSiguiente}
                onClick={() => onCambiarPagina(resultado.paginaActual + 1)}
                title="Página siguiente"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TablaPaginada;
