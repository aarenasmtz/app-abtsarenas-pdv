import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ResultadoPaginado } from '../../types/comun';

interface Columna<T> {
  clave: string;
  titulo: string;
  renderizar?: (item: T) => React.ReactNode;
}

interface PropiedadesTablaPaginada<T> {
  columnas: Columna<T>[];
  resultado?: ResultadoPaginado<T>;
  cargando?: boolean;
  onCambiarPagina: (nuevaPagina: number) => void;
  onCambiarRegistrosPorPagina: (tamano: 25 | 50 | 100) => void;
}

export function TablaPaginada<T extends { [key: string]: unknown }>({
  columnas,
  resultado,
  cargando = false,
  onCambiarPagina,
  onCambiarRegistrosPorPagina,
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
            {columnas.map((col) => (
              <th key={col.clave}>{col.titulo}</th>
            ))}
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
              <tr key={(item.id as React.Key) || index}>
                {columnas.map((col) => (
                  <td key={col.clave}>
                    {col.renderizar ? col.renderizar(item) : (item[col.clave] as React.ReactNode)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {resultado && (
        <div className="paginador-barra">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--color-texto-secundario)' }}>
              Mostrando {elementos.length} de {resultado.totalRegistros} registros | Por página:
            </span>
            <select
              className="selector-registros"
              value={resultado.registrosPorPagina}
              onChange={(e) => onCambiarRegistrosPorPagina(Number(e.target.value) as 25 | 50 | 100)}
            >
              <option value={25}>25 por página (Recomendado)</option>
              <option value={50}>50 por página</option>
              <option value={100}>100 por página (Máximo)</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--color-texto-secundario)', marginRight: '0.5rem' }}>
              Página {resultado.paginaActual} de {resultado.totalPaginas || 1}
            </span>

            <button
              className="btn btn-secundario"
              style={{ padding: '0.35rem 0.65rem' }}
              disabled={!resultado.tienePaginaAnterior}
              onClick={() => onCambiarPagina(resultado.paginaActual - 1)}
              title="Página anterior"
            >
              <ChevronLeft size={18} />
            </button>

            <button
              className="btn btn-secundario"
              style={{ padding: '0.35rem 0.65rem' }}
              disabled={!resultado.tienePaginaSiguiente}
              onClick={() => onCambiarPagina(resultado.paginaActual + 1)}
              title="Página siguiente"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
