import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShoppingCart, 
  Search, 
  Plus, 
  Eye, 
  RefreshCw, 
  AlertTriangle, 
  Check, 
  X,
  Calendar
} from 'lucide-react';
import { servicioCompras } from './servicioCompras';
import { servicioProveedores } from '../proveedores/servicioProveedores';
import type { CompraDto } from './tiposCompras';
import type { ProveedorDto } from '../proveedores/tiposProveedores';
import { ModalNuevaCompra } from './ModalNuevaCompra';
import { ModalDetalleCompra } from './ModalDetalleCompra';
import { TablaPaginada } from '../../components/comun/TablaPaginada';
import type { ResultadoPaginado } from '../../types/comun';

export const PantallaCompras: React.FC = () => {
  const [comprasPaginadas, setComprasPaginadas] = useState<ResultadoPaginado<CompraDto>>({
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
  const [idProveedorSeleccionado, setIdProveedorSeleccionado] = useState<number | undefined>(undefined);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mensajeAlerta, setMensajeAlerta] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);

  // Catálogo de proveedores para el filtro
  const [proveedores, setProveedores] = useState<ProveedorDto[]>([]);

  // Modales
  const [modalNuevaCompraAbierto, setModalNuevaCompraAbierto] = useState(false);
  const [modalDetalleAbierto, setModalDetalleAbierto] = useState(false);
  const [compraSeleccionada, setCompraSeleccionada] = useState<CompraDto | null>(null);

  // Cargar catálogo de proveedores
  useEffect(() => {
    servicioProveedores.obtenerActivos()
      .then(setProveedores)
      .catch(() => {});
  }, []);

  const cargarCompras = useCallback(async () => {
    setCargando(true);
    try {
      const resultado = await servicioCompras.obtenerPaginado({
        pagina: paginaActual,
        registrosPorPagina,
        idProveedor: idProveedorSeleccionado,
        fechaInicio: fechaInicio ? `${fechaInicio}T00:00:00` : undefined,
        fechaFin: fechaFin ? `${fechaFin}T23:59:59` : undefined,
        terminoBusqueda: terminoBusqueda.trim() || undefined,
      });
      setComprasPaginadas(resultado);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al consultar historial de compras.';
      setMensajeAlerta({ tipo: 'error', texto: msg });
    } finally {
      setCargando(false);
    }
  }, [paginaActual, registrosPorPagina, idProveedorSeleccionado, fechaInicio, fechaFin, terminoBusqueda]);

  useEffect(() => {
    cargarCompras();
  }, [cargarCompras]);

  const verDetalleCompra = async (compra: CompraDto) => {
    try {
      const detalleCompleto = await servicioCompras.obtenerPorId(compra.idCompra);
      setCompraSeleccionada(detalleCompleto);
      setModalDetalleAbierto(true);
    } catch {
      setCompraSeleccionada(compra);
      setModalDetalleAbierto(true);
    }
  };

  const formatearFecha = (fechaStr: string) => {
    try {
      const f = new Date(fechaStr);
      return f.toLocaleString('es-MX', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return fechaStr;
    }
  };

  const formatearMoneda = (val: number) => {
    return `$${val.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const columnas = [
    {
      clave: 'folioCompra',
      titulo: 'Folio',
      renderizar: (c: CompraDto) => (
        <span className="mono font-bold" style={{ color: 'var(--color-primario)' }}>
          #{c.folioCompra}
        </span>
      ),
    },
    {
      clave: 'fechaCompra',
      titulo: 'Fecha de Compra',
      renderizar: (c: CompraDto) => (
        <div style={{ fontSize: '0.88rem' }}>
          {formatearFecha(c.fechaCompra)}
        </div>
      ),
    },
    {
      clave: 'proveedor',
      titulo: 'Proveedor Comercial',
      renderizar: (c: CompraDto) => (
        <div>
          <div style={{ fontWeight: 600 }}>{c.nombreProveedor || 'Proveedor General'}</div>
          {c.observaciones && (
            <div style={{ fontSize: '0.78rem', color: 'var(--color-texto-secundario)' }}>
              Ref: {c.observaciones}
            </div>
          )}
        </div>
      ),
    },
    {
      clave: 'usuario',
      titulo: 'Receptor',
      renderizar: (c: CompraDto) => (
        <span style={{ fontSize: '0.85rem', color: 'var(--color-texto-secundario)' }}>
          {c.nombreUsuario || 'Administrador'}
        </span>
      ),
    },
    {
      clave: 'partidas',
      titulo: 'Partidas',
      renderizar: (c: CompraDto) => (
        <span className="mono font-bold">{c.totalPartidas}</span>
      ),
    },
    {
      clave: 'totalCompra',
      titulo: 'Total Invertido',
      renderizar: (c: CompraDto) => (
        <span className="mono font-bold text-primario" style={{ fontSize: '0.95rem' }}>
          {formatearMoneda(c.totalCompra)}
        </span>
      ),
    },
    {
      clave: 'estatus',
      titulo: 'Estatus',
      renderizar: (c: CompraDto) => (
        <span className={`badge ${c.estatus === 'RECIBIDA' ? 'badge-exito' : 'badge-advertencia'}`}>
          {c.estatus || 'RECIBIDA'}
        </span>
      ),
    },
    {
      clave: 'acciones',
      titulo: 'Acciones',
      renderizar: (c: CompraDto) => (
        <button
          className="btn-icono"
          title="Ver desglose de partidas"
          onClick={() => verDetalleCompra(c)}
        >
          <Eye size={16} />
        </button>
      ),
    },
  ];

  return (
    <div>
      {/* Cabecera */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <ShoppingCart size={26} color="var(--color-primario)" />
            <span>Módulo de Compras y Abastecimiento</span>
          </h2>
          <p style={{ margin: '0.25rem 0 0 0', color: 'var(--color-texto-secundario)', fontSize: '0.9rem' }}>
            Recepción de facturas de mercancía, cálculo de costo promedio ponderado y afectación atómica al inventario y Kardex.
          </p>
        </div>

        <button className="btn btn-primario" onClick={() => setModalNuevaCompraAbierto(true)}>
          <Plus size={18} />
          <span>Registrar Compra</span>
        </button>
      </div>

      {/* Banner Informativo: Explicación del funcionamiento de Compras para la tienda */}
      <div
        style={{
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '12px',
          padding: '1rem 1.25rem',
          marginBottom: '1.25rem',
          display: 'flex',
          gap: '1rem',
          alignItems: 'flex-start',
        }}
      >
        <div style={{ padding: '0.4rem', borderRadius: '8px', backgroundColor: '#dbeafe', color: '#1d4ed8', marginTop: '2px' }}>
          <ShoppingCart size={22} />
        </div>
        <div style={{ fontSize: '0.88rem', color: '#1e3a8a', lineHeight: 1.5 }}>
          <strong style={{ display: 'block', fontSize: '0.95rem', marginBottom: '0.2rem', color: '#1e40af' }}>
            💡 ¿Para qué sirve el Módulo de Compras en tu Tienda?
          </strong>
          Este módulo se utiliza cuando recibes mercancía de tus proveedores mayoristas (por ejemplo, el camión de Bimbo, Sabritas, Coca-Cola o abarrotes generales):
          <ul style={{ margin: '0.4rem 0 0 1.2rem', padding: 0 }}>
            <li><strong>Aumenta el inventario automáticamente:</strong> Cada cantidad recibida se suma de inmediato a tus existencias en mostrador.</li>
            <li><strong>Actualiza costos de adquisición:</strong> Registra el costo al que te vendió el proveedor para calcular tu margen de ganancia real en los reportes de ventas.</li>
            <li><strong>Historial y auditoría:</strong> Consulta facturas, notas de remisión pasadas y desgloses de compra haciendo clic en <em>"Ver Detalle"</em> (se abre en modal flotante).</li>
          </ul>
        </div>
      </div>

      {/* Alerta de notificación */}
      {mensajeAlerta && (
        <div
          className={`alerta ${mensajeAlerta.tipo === 'exito' ? 'alerta-exito' : 'alerta-error'}`}
          style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {mensajeAlerta.tipo === 'exito' ? <Check size={18} /> : <AlertTriangle size={18} />}
            <span>{mensajeAlerta.texto}</span>
          </div>
          <button className="btn-icono" onClick={() => setMensajeAlerta(null)}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Barra de Filtros */}
      <div className="tarjeta" style={{ marginBottom: '1.25rem', padding: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', alignItems: 'center' }}>
          {/* Búsqueda por folio u observaciones */}
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-texto-secundario)' }} />
            <input
              type="text"
              className="input-formulario"
              style={{ paddingLeft: '2.2rem', width: '100%' }}
              placeholder="Buscar por folio o nota..."
              value={terminoBusqueda}
              onChange={(e) => {
                setTerminoBusqueda(e.target.value);
                setPaginaActual(1);
              }}
            />
          </div>

          {/* Filtro por proveedor */}
          <div>
            <select
              className="input-formulario"
              value={idProveedorSeleccionado || ''}
              onChange={(e) => {
                setIdProveedorSeleccionado(e.target.value ? Number(e.target.value) : undefined);
                setPaginaActual(1);
              }}
            >
              <option value="">-- Todos los Proveedores --</option>
              {proveedores.map((p) => (
                <option key={p.idProveedor} value={p.idProveedor}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Fecha Inicio */}
          <div className="filtro-fecha-grupo">
            <Calendar size={15} style={{ color: '#2563eb' }} />
            <label>Desde:</label>
            <input
              type="date"
              className="filtro-fecha-input"
              value={fechaInicio}
              onChange={(e) => {
                setFechaInicio(e.target.value);
                setPaginaActual(1);
              }}
              title="Fecha inicial"
            />
          </div>

          {/* Fecha Fin */}
          <div className="filtro-fecha-grupo">
            <Calendar size={15} style={{ color: '#2563eb' }} />
            <label>Hasta:</label>
            <input
              type="date"
              className="filtro-fecha-input"
              value={fechaFin}
              onChange={(e) => {
                setFechaFin(e.target.value);
                setPaginaActual(1);
              }}
              title="Fecha final"
            />
          </div>

          {/* Botones de acción */}
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            {(terminoBusqueda || idProveedorSeleccionado || fechaInicio || fechaFin) && (
              <button
                className="btn btn-secundario"
                style={{ padding: '0.65rem 0.85rem' }}
                onClick={() => {
                  setTerminoBusqueda('');
                  setIdProveedorSeleccionado(undefined);
                  setFechaInicio('');
                  setFechaFin('');
                  setPaginaActual(1);
                }}
                title="Limpiar filtros"
              >
                Limpiar
              </button>
            )}

            <button
              className="btn btn-secundario"
              onClick={cargarCompras}
              title="Recargar historial"
              style={{ padding: '0.65rem 0.85rem' }}
            >
              <RefreshCw size={16} className={cargando ? 'animacion-rotar' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* Tabla Server-Side de Compras */}
      <div className="tarjeta" style={{ padding: 0, overflow: 'hidden' }}>
        <TablaPaginada
          columnas={columnas}
          resultado={comprasPaginadas}
          cargando={cargando}
          onCambiarPagina={(p) => setPaginaActual(p)}
          onCambiarRegistrosPorPagina={(r) => {
            setRegistrosPorPagina(r);
            setPaginaActual(1);
          }}
        />
      </div>

      {/* Modal Nueva Compra */}
      <ModalNuevaCompra
        abierto={modalNuevaCompraAbierto}
        onCerrar={() => setModalNuevaCompraAbierto(false)}
        onCompraRegistrada={() => {
          setMensajeAlerta({ tipo: 'exito', texto: 'Compra registrada con éxito. Inventario y Kardex actualizados.' });
          cargarCompras();
        }}
      />

      {/* Modal Detalle de Compra */}
      <ModalDetalleCompra
        abierto={modalDetalleAbierto}
        compra={compraSeleccionada}
        onCerrar={() => {
          setModalDetalleAbierto(false);
          setCompraSeleccionada(null);
        }}
      />
    </div>
  );
};
