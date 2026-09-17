import { useState, useEffect, useCallback } from 'react';
import { TablaPaginada } from '../../components/comun/TablaPaginada';
import { servicioAuditoria, type RegistroAuditoria } from './servicioAuditoria';
import type { ResultadoPaginado } from '../../types/comun';
import { ShieldCheck, Search, Filter } from 'lucide-react';

export function PantallaAuditoria() {
  const [resultado, setResultado] = useState<ResultadoPaginado<RegistroAuditoria> | undefined>(undefined);
  const [cargando, setCargando] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [registrosPorPagina, setRegistrosPorPagina] = useState<25 | 50 | 100>(25);
  const [busqueda, setBusqueda] = useState('');
  const [tablaFiltro, setTablaFiltro] = useState('');
  const [accionFiltro, setAccionFiltro] = useState('');

  const cargarAuditoria = useCallback(async () => {
    setCargando(true);
    try {
      const datos = await servicioAuditoria.consultarBitacora({
        pagina,
        registrosPorPagina,
        busqueda: busqueda.trim() || undefined,
        tabla: tablaFiltro || undefined,
        accion: accionFiltro || undefined,
      });
      setResultado(datos);
    } catch {
      // Manejo de error
    } finally {
      setCargando(false);
    }
  }, [pagina, registrosPorPagina, busqueda, tablaFiltro, accionFiltro]);

  useEffect(() => {
    cargarAuditoria();
  }, [cargarAuditoria]);

  const formatearFecha = (fechaStr: string) => {
    try {
      const fecha = new Date(fechaStr);
      return fecha.toLocaleString('es-MX', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return fechaStr;
    }
  };

  const obtenerColorAccion = (accion: string) => {
    if (accion.includes('CREAR') || accion.includes('INSERT')) return 'badge-exito';
    if (accion.includes('ELIMINAR') || accion.includes('CANCEL') || accion.includes('DESACTIVAR')) return 'badge-peligro';
    if (accion.includes('MODIFICAR') || accion.includes('UPDATE') || accion.includes('AJUSTE')) return 'badge-advertencia';
    return 'badge-exito';
  };

  const columnas = [
    {
      clave: 'fechaHora',
      titulo: 'Fecha y Hora',
      renderizar: (r: RegistroAuditoria) => (
        <span className="mono" style={{ fontSize: '0.85rem' }}>
          {formatearFecha(r.fechaHora)}
        </span>
      ),
    },
    {
      clave: 'usuario',
      titulo: 'Usuario',
      renderizar: (r: RegistroAuditoria) => (
        <strong style={{ color: '#ffffff' }}>{r.usuario}</strong>
      ),
    },
    {
      clave: 'accion',
      titulo: 'Acción',
      renderizar: (r: RegistroAuditoria) => (
        <span className={`badge ${obtenerColorAccion(r.accion)}`}>
          {r.accion}
        </span>
      ),
    },
    {
      clave: 'tabla',
      titulo: 'Entidad / ID',
      renderizar: (r: RegistroAuditoria) => (
        <div>
          <span style={{ fontWeight: 600 }}>{r.tabla}</span>
          <span className="mono" style={{ color: 'var(--color-texto-secundario)', marginLeft: '0.35rem' }}>
            #{r.idRegistro}
          </span>
        </div>
      ),
    },
    {
      clave: 'valorAnterior',
      titulo: 'Valor Anterior',
      renderizar: (r: RegistroAuditoria) => (
        <div style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.85rem', color: '#94a3b8' }}>
          {r.valorAnterior || <span style={{ color: '#475569' }}>-</span>}
        </div>
      ),
    },
    {
      clave: 'valorNuevo',
      titulo: 'Valor Nuevo / Detalle',
      renderizar: (r: RegistroAuditoria) => (
        <div style={{ maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.85rem', color: '#f8fafc' }}>
          {r.valorNuevo || <span style={{ color: '#475569' }}>-</span>}
        </div>
      ),
    },
    {
      clave: 'direccionIp',
      titulo: 'IP',
      renderizar: (r: RegistroAuditoria) => (
        <span className="mono" style={{ fontSize: '0.8rem', color: 'var(--color-texto-secundario)' }}>
          {r.direccionIp || 'Local'}
        </span>
      ),
    },
  ];

  return (
    <div>
      {/* Cabecera del módulo */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={22} color="var(--color-primario)" />
            <span>Bitácora de Auditoría del Sistema</span>
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-texto-secundario)', marginTop: '0.25rem' }}>
            Trazabilidad granular de operaciones, cambios de precios, mermas y accesos.
          </p>
        </div>

        {/* Filtros */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--color-texto-secundario)' }} />
            <input
              type="text"
              className="input-escaner input-escaner-permitido"
              style={{ width: '180px', padding: '0.45rem 0.75rem 0.45rem 2.2rem', fontSize: '0.85rem' }}
              placeholder="Buscar término..."
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value);
                setPagina(1);
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Filter size={16} color="var(--color-texto-secundario)" />
            <select
              className="selector-registros"
              style={{ fontSize: '0.85rem' }}
              value={tablaFiltro}
              onChange={(e) => {
                setTablaFiltro(e.target.value);
                setPagina(1);
              }}
            >
              <option value="">Todas las tablas</option>
              <option value="Usuarios">Usuarios</option>
              <option value="Productos">Productos</option>
              <option value="Inventario">Inventario</option>
              <option value="Ventas">Ventas</option>
              <option value="Caja">Caja</option>
            </select>

            <select
              className="selector-registros"
              style={{ fontSize: '0.85rem' }}
              value={accionFiltro}
              onChange={(e) => {
                setAccionFiltro(e.target.value);
                setPagina(1);
              }}
            >
              <option value="">Todas las acciones</option>
              <option value="INICIO_SESION">Inicios de Sesión</option>
              <option value="CREAR_USUARIO">Creación Usuario</option>
              <option value="MODIFICAR_USUARIO">Modificación Usuario</option>
              <option value="CAMBIO_PRECIO">Cambio de Precio</option>
              <option value="AJUSTE_STOCK">Ajuste de Stock</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla paginada */}
      <TablaPaginada
        columnas={columnas}
        resultado={resultado}
        cargando={cargando}
        onCambiarPagina={(p) => setPagina(p)}
        onCambiarRegistrosPorPagina={(tam) => {
          setRegistrosPorPagina(tam);
          setPagina(1);
        }}
      />
    </div>
  );
}
