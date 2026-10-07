import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  RefreshCw,
  Eye,
  Trash2,
  Calendar,
  AlertCircle,
  FileSpreadsheet,
  CheckSquare,
  DollarSign,
  Activity,
  Hash,
  Package,
  Truck,
  FileText,
  Boxes
} from 'lucide-react';
import { servicioPedidos } from './servicioPedidos';
import { ModalGenerarPedido } from './ModalGenerarPedido';
import { ModalDetallePedido } from './ModalDetallePedido';
import type {
  PedidoSugeridoResumenDto,
  PedidoSugeridoDto,
  FiltroPedidosSugeridosDto,
} from './tiposPedidos';

export const PantallaPedidoSugerido: React.FC = () => {
  const [pedidos, setPedidos] = useState<PedidoSugeridoResumenDto[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Paginación y filtros
  const [paginaActual, setPaginaActual] = useState<number>(1);
  const [totalRegistros, setTotalRegistros] = useState<number>(0);
  const [filtroEstado, setFiltroEstado] = useState<string>('');
  const [filtroAnio, setFiltroAnio] = useState<number | ''>('');

  // Modales
  const [modalGenerarAbierto, setModalGenerarAbierto] = useState<boolean>(false);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<PedidoSugeridoDto | null>(null);
  const [cargandoDetalle, setCargandoDetalle] = useState<boolean>(false);

  const cargarPedidos = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const filtro: FiltroPedidosSugeridosDto = {
        pagina: paginaActual,
        registrosPorPagina: 25,
        estado: filtroEstado || null,
        anio: filtroAnio === '' ? null : Number(filtroAnio),
      };

      const respuesta = await servicioPedidos.obtenerPaginado(filtro);
      setPedidos(respuesta.elementos);
      setTotalRegistros(respuesta.totalRegistros);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar historial de pedidos sugeridos.');
    } finally {
      setCargando(false);
    }
  }, [paginaActual, filtroEstado, filtroAnio]);

  useEffect(() => {
    cargarPedidos();
  }, [cargarPedidos]);

  // Abrir detalle
  const manejarVerDetalle = async (idPedido: number) => {
    setCargandoDetalle(true);
    try {
      const datos = await servicioPedidos.obtenerPorId(idPedido);
      setPedidoSeleccionado(datos);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al obtener detalle del pedido.');
    } finally {
      setCargandoDetalle(false);
    }
  };

  // Eliminar pedido
  const manejarEliminar = async (idPedido: number) => {
    if (!window.confirm(`¿Está seguro de eliminar el pedido sugerido #${idPedido}? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      await servicioPedidos.eliminarPedido(idPedido);
      cargarPedidos();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'No se pudo eliminar el pedido sugerido.');
    }
  };

  const formatearDinero = (monto: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(monto);

  const colorEstado: Record<string, { bg: string; color: string }> = {
    GENERADO: { bg: 'rgba(234, 179, 8, 0.15)', color: '#ca8a04' },
    REVISADO: { bg: 'rgba(59, 130, 246, 0.15)', color: '#2563eb' },
    PROCESADO: { bg: 'rgba(16, 185, 129, 0.15)', color: '#059669' },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      {/* Cabecera */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Calendar size={28} style={{ color: 'var(--color-primario)' }} />
            <h1 style={{ fontSize: '1.6rem', fontWeight: 700, margin: 0 }}>
              Pedido Sugerido Dominical
            </h1>
          </div>
          <p style={{ color: 'var(--color-texto-secundario)', margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>
            Reabastecimiento predictivo semanal por velocidad de venta, stock de seguridad y emisión agrupada por proveedor
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn btn-secundario"
            onClick={cargarPedidos}
            disabled={cargando}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <RefreshCw size={16} className={cargando ? 'animacion-giratoria' : ''} />
            <span>Actualizar</span>
          </button>

          <button
            type="button"
            className="btn btn-primario"
            onClick={() => setModalGenerarAbierto(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}
          >
            <Sparkles size={18} />
            <span>Nuevo Cálculo Dominical</span>
          </button>
        </div>
      </div>

      {/* Barra de filtros */}
      <div
        className="tarjeta"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
          padding: '0.875rem 1.25rem',
          margin: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-texto-secundario)' }}>
            Estado:
          </label>
          <select
            className="control-formulario"
            value={filtroEstado}
            onChange={(e) => {
              setFiltroEstado(e.target.value);
              setPaginaActual(1);
            }}
            style={{ paddingBlock: '0.35rem', fontSize: '0.85rem', width: '150px' }}
          >
            <option value="">Todos</option>
            <option value="GENERADO">GENERADO</option>
            <option value="REVISADO">REVISADO</option>
            <option value="PROCESADO">PROCESADO</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-texto-secundario)' }}>
            Año:
          </label>
          <input
            type="number"
            className="control-formulario"
            placeholder="Año (ej. 2026)"
            value={filtroAnio}
            onChange={(e) => {
              setFiltroAnio(e.target.value === '' ? '' : Number(e.target.value));
              setPaginaActual(1);
            }}
            style={{ paddingBlock: '0.35rem', fontSize: '0.85rem', width: '120px' }}
          />
        </div>

        {(filtroEstado || filtroAnio) && (
          <button
            type="button"
            className="btn btn-secundario"
            onClick={() => {
              setFiltroEstado('');
              setFiltroAnio('');
              setPaginaActual(1);
            }}
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
          >
            Limpiar Filtros
          </button>
        )}
      </div>

      {/* Alerta de error */}
      {error && (
        <div
          style={{
            padding: '1rem',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid var(--color-peligro)',
            borderRadius: '8px',
            color: 'var(--color-peligro)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.875rem',
          }}
        >
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Tabla con historial de pedidos */}
      <div className="tarjeta" style={{ padding: 0, overflow: 'hidden', margin: 0 }}>
        <div className="contenedor-tabla">
          <table className="tabla">
            <thead>
              <tr>
                <th>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <Hash size={14} color="#64748b" /> Folio / Periodo
                  </span>
                </th>
                <th>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <Calendar size={14} color="#64748b" /> Fecha de Cálculo
                  </span>
                </th>
                <th>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <Activity size={14} color="#64748b" /> Estado
                  </span>
                </th>
                <th style={{ textAlign: 'right' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', justifyContent: 'flex-end' }}>
                    <Package size={14} color="#64748b" /> Artículos
                  </span>
                </th>
                <th style={{ textAlign: 'right' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', justifyContent: 'flex-end' }}>
                    <Truck size={14} color="#64748b" /> Marcas / Prov.
                  </span>
                </th>
                <th style={{ textAlign: 'right' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', justifyContent: 'flex-end' }}>
                    <Boxes size={14} color="#64748b" /> Piezas Totales
                  </span>
                </th>
                <th style={{ textAlign: 'right' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', justifyContent: 'flex-end' }}>
                    <DollarSign size={14} color="#64748b" /> Inversión Est.
                  </span>
                </th>
                <th>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <FileText size={14} color="#64748b" /> Notas
                  </span>
                </th>
                <th style={{ textAlign: 'center', width: '130px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', justifyContent: 'center' }}>
                    <CheckSquare size={14} color="#64748b" /> Acciones
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '3rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--color-texto-secundario)' }}>
                      <RefreshCw size={20} className="animacion-giratoria" />
                      <span>Cargando historial de pedidos sugeridos...</span>
                    </div>
                  </td>
                </tr>
              ) : pedidos.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                      <FileSpreadsheet size={48} style={{ color: 'var(--color-texto-secundario)', opacity: 0.5 }} />
                      <h4 style={{ margin: 0, fontWeight: 600 }}>Sin pedidos sugeridos registrados</h4>
                      <p style={{ margin: 0, color: 'var(--color-texto-secundario)', fontSize: '0.875rem', maxWidth: '400px' }}>
                        Genere un cálculo dominical para analizar las ventas de la semana y planear las compras de abarrotes de forma automatizada.
                      </p>
                      <button
                        type="button"
                        className="btn btn-primario"
                        onClick={() => setModalGenerarAbierto(true)}
                        style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                      >
                        <Sparkles size={16} />
                        <span>Calcular Pedido Dominical Ahora</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                pedidos.map((p) => (
                  <tr key={p.idPedidoSugerido}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--color-texto-principal)' }}>
                        Pedido #{p.idPedidoSugerido}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-primario)', fontWeight: 600 }}>
                        Semana {p.semanaAnio} • {p.anio}
                      </div>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {new Date(p.fechaGeneracion).toLocaleString('es-MX', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </td>
                    <td>
                      <span
                        style={{
                          backgroundColor: colorEstado[p.estado]?.bg || 'rgba(156, 163, 175, 0.2)',
                          color: colorEstado[p.estado]?.color || '#4b5563',
                          padding: '0.2rem 0.65rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          letterSpacing: '0.04em',
                        }}
                      >
                        {p.estado}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>
                      {p.totalPartidas} productos
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {p.totalProveedores} marcas
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--color-primario)' }}>
                      {p.totalPiezas.toLocaleString('es-MX')}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--color-exito)' }}>
                      {formatearDinero(p.inversionEstimada)}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--color-texto-secundario)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.observaciones || '—'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem' }}>
                        <button
                          type="button"
                          className="btn-icono btn-icono-primario"
                          onClick={() => manejarVerDetalle(p.idPedidoSugerido)}
                          title="Ver partidas y gestionar surtido dominical"
                          disabled={cargandoDetalle}
                        >
                          <Eye size={16} />
                        </button>
                        {p.estado !== 'PROCESADO' && (
                          <button
                            type="button"
                            className="btn-icono btn-icono-peligro"
                            onClick={() => manejarEliminar(p.idPedidoSugerido)}
                            title="Eliminar pedido no procesado"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalRegistros > 25 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.75rem 1.25rem',
              borderTop: '1px solid var(--color-borde)',
            }}
          >
            <span style={{ fontSize: '0.85rem', color: 'var(--color-texto-secundario)' }}>
              Mostrando {pedidos.length} de {totalRegistros} pedidos registrados
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-secundario"
                disabled={paginaActual <= 1}
                onClick={() => setPaginaActual((p) => p - 1)}
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}
              >
                Anterior
              </button>
              <button
                type="button"
                className="btn btn-secundario"
                disabled={paginaActual * 25 >= totalRegistros}
                onClick={() => setPaginaActual((p) => p + 1)}
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Generar Pedido */}
      {modalGenerarAbierto && (
        <ModalGenerarPedido
          alCerrar={() => setModalGenerarAbierto(false)}
          alGenerarExitoso={(pedidoGenerado) => {
            setModalGenerarAbierto(false);
            cargarPedidos();
            setPedidoSeleccionado(pedidoGenerado);
          }}
        />
      )}

      {/* Modal Detalle de Pedido */}
      {pedidoSeleccionado && (
        <ModalDetallePedido
          pedidoInicial={pedidoSeleccionado}
          alCerrar={() => setPedidoSeleccionado(null)}
          alActualizar={(actualizado) => {
            setPedidoSeleccionado(actualizado);
            cargarPedidos();
          }}
        />
      )}
    </div>
  );
};
