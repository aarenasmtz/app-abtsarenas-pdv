import React, { useState, useEffect, useCallback } from 'react';
import { 
  Truck, 
  Search, 
  Plus, 
  Edit2, 
  Power, 
  RefreshCw, 
  AlertTriangle, 
  Check, 
  X,
  Phone,
  Mail,
  ShoppingBag
} from 'lucide-react';
import { servicioProveedores } from './servicioProveedores';
import type { ProveedorDto, CrearProveedorDto, ActualizarProveedorDto } from './tiposProveedores';
import { ModalProveedor } from './ModalProveedor';
import { TablaPaginada } from '../../components/comun/TablaPaginada';
import type { ResultadoPaginado } from '../../types/comun';

export const PantallaProveedores: React.FC = () => {
  const [proveedoresPaginados, setProveedoresPaginados] = useState<ResultadoPaginado<ProveedorDto>>({
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
  const [soloActivos, setSoloActivos] = useState<boolean | undefined>(true);
  const [cargando, setCargando] = useState(false);
  const [mensajeAlerta, setMensajeAlerta] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);

  // Estados de modal
  const [modalAbierto, setModalAbierto] = useState(false);
  const [proveedorEnEdicion, setProveedorEnEdicion] = useState<ProveedorDto | null>(null);

  const cargarProveedores = useCallback(async () => {
    setCargando(true);
    try {
      const resultado = await servicioProveedores.obtenerPaginado({
        pagina: paginaActual,
        registrosPorPagina,
        terminoBusqueda: terminoBusqueda.trim() || undefined,
        soloActivos,
      });
      setProveedoresPaginados(resultado);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al consultar proveedores.';
      setMensajeAlerta({ tipo: 'error', texto: msg });
    } finally {
      setCargando(false);
    }
  }, [paginaActual, registrosPorPagina, terminoBusqueda, soloActivos]);

  useEffect(() => {
    cargarProveedores();
  }, [cargarProveedores]);

  const manejarNuevoProveedor = () => {
    setProveedorEnEdicion(null);
    setModalAbierto(true);
  };

  const manejarEditarProveedor = (proveedor: ProveedorDto) => {
    setProveedorEnEdicion(proveedor);
    setModalAbierto(true);
  };

  const manejarGuardarProveedor = async (datos: CrearProveedorDto | ActualizarProveedorDto) => {
    if ('idProveedor' in datos) {
      await servicioProveedores.actualizar(datos.idProveedor, datos as ActualizarProveedorDto);
      setMensajeAlerta({ tipo: 'exito', texto: `Proveedor '${datos.nombre}' actualizado correctamente.` });
    } else {
      await servicioProveedores.crear(datos as CrearProveedorDto);
      setMensajeAlerta({ tipo: 'exito', texto: `Proveedor '${datos.nombre}' registrado con éxito.` });
    }
    await cargarProveedores();
  };

  const [proveedorParaBaja, setProveedorParaBaja] = useState<ProveedorDto | null>(null);

  const solicitarAlternarEstado = (proveedor: ProveedorDto) => {
    setProveedorParaBaja(proveedor);
  };

  const ejecutarAlternarEstado = async () => {
    if (!proveedorParaBaja) return;
    const nuevoEstado = !proveedorParaBaja.activo;
    const nombre = proveedorParaBaja.nombre;
    const id = proveedorParaBaja.idProveedor;
    setProveedorParaBaja(null);

    try {
      await servicioProveedores.cambiarEstado(id, nuevoEstado);
      setMensajeAlerta({
        tipo: 'exito',
        texto: `Proveedor '${nombre}' ${nuevoEstado ? 'activado' : 'desactivado (baja lógica)'} con éxito.`,
      });
      await cargarProveedores();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cambiar estado del proveedor.';
      setMensajeAlerta({ tipo: 'error', texto: msg });
    }
  };


  const columnas = [
    {
      clave: 'idProveedor',
      titulo: 'ID',
      renderizar: (p: ProveedorDto) => <span className="mono">#{p.idProveedor}</span>,
    },
    {
      clave: 'nombre',
      titulo: 'Empresa / Razón Social',
      renderizar: (p: ProveedorDto) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--color-texto)' }}>{p.nombre}</div>
          {p.rfc && (
            <div style={{ fontSize: '0.78rem', color: 'var(--color-texto-secundario)' }} className="mono">
              RFC: {p.rfc}
            </div>
          )}
        </div>
      ),
    },
    {
      clave: 'contacto',
      titulo: 'Contacto y Teléfono',
      renderizar: (p: ProveedorDto) => (
        <div>
          <div style={{ fontSize: '0.88rem' }}>{p.nombreContacto || <span style={{ color: 'var(--color-texto-apagado)' }}>Sin asignar</span>}</div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.8rem', color: 'var(--color-texto-secundario)', marginTop: '2px' }}>
            {p.telefono && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                <Phone size={12} /> {p.telefono}
              </span>
            )}
            {p.correo && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                <Mail size={12} /> {p.correo}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      clave: 'direccion',
      titulo: 'Dirección / Ubicación',
      renderizar: (p: ProveedorDto) => (
        <div style={{ fontSize: '0.85rem', maxWidth: '280px', color: 'var(--color-texto-secundario)' }}>
          {p.direccion || <span style={{ color: 'var(--color-texto-apagado)' }}>No registrada</span>}
        </div>
      ),
    },
    {
      clave: 'totalComprasRegistradas',
      titulo: 'Compras',
      renderizar: (p: ProveedorDto) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <ShoppingBag size={14} color="var(--color-primario)" />
          <span className="mono font-bold">{p.totalComprasRegistradas}</span>
        </div>
      ),
    },
    {
      clave: 'activo',
      titulo: 'Estado',
      renderizar: (p: ProveedorDto) => (
        <span className={`badge ${p.activo ? 'badge-exito' : 'badge-peligro'}`}>
          {p.activo ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
    {
      clave: 'acciones',
      titulo: 'Acciones',
      renderizar: (p: ProveedorDto) => (
        <div style={{ display: 'flex', gap: '0.35rem' }}>
          <button
            className="btn-icono"
            title="Editar Proveedor"
            onClick={() => manejarEditarProveedor(p)}
          >
            <Edit2 size={16} />
          </button>
          <button
            className={`btn-icono ${p.activo ? 'btn-icono-peligro' : 'btn-icono-exito'}`}
            title={p.activo ? 'Desactivar Proveedor (Baja Lógica)' : 'Activar Proveedor'}
            onClick={() => solicitarAlternarEstado(p)}
          >
            <Power size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      {/* Cabecera del Módulo */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Truck size={26} color="var(--color-primario)" />
            <span>Catálogo de Proveedores</span>
          </h2>
          <p style={{ margin: '0.25rem 0 0 0', color: 'var(--color-texto-secundario)', fontSize: '0.9rem' }}>
            Gestión comercial de distribuidores, condiciones de entrega, contactos y trazabilidad de compras de mercancía.
          </p>
        </div>

        <button className="btn btn-primario" onClick={manejarNuevoProveedor}>
          <Plus size={18} />
          <span>Nuevo Proveedor</span>
        </button>
      </div>

      {/* Alerta de Notificación */}
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

      {/* Filtros y Buscador */}
      <div className="tarjeta" style={{ marginBottom: '1.25rem', padding: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1 1 300px', position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-texto-secundario)' }} />
            <input
              type="text"
              className="input-formulario"
              style={{ paddingLeft: '2.5rem', width: '100%' }}
              placeholder="Buscar por nombre, razón social, RFC o contacto..."
              value={terminoBusqueda}
              onChange={(e) => {
                setTerminoBusqueda(e.target.value);
                setPaginaActual(1);
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--color-texto-secundario)' }}>Estado:</label>
            <select
              className="input-formulario"
              style={{ width: 'auto', minWidth: '140px' }}
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

          <button
            className="btn btn-secundario"
            onClick={cargarProveedores}
            title="Recargar listado"
            style={{ padding: '0.65rem 0.85rem' }}
          >
            <RefreshCw size={16} className={cargando ? 'animacion-rotar' : ''} />
          </button>
        </div>
      </div>

      {/* Tabla Paginada Server-Side */}
      <div className="tarjeta" style={{ padding: 0, overflow: 'hidden' }}>
        <TablaPaginada
          columnas={columnas}
          resultado={proveedoresPaginados}
          cargando={cargando}
          onCambiarPagina={(nuevaPagina) => setPaginaActual(nuevaPagina)}
          onCambiarRegistrosPorPagina={(nuevosRegistros) => {
            setRegistrosPorPagina(nuevosRegistros);
            setPaginaActual(1);
          }}
        />
      </div>

      {/* Modal de Proveedor (Alta / Edición) */}
      <ModalProveedor
        abierto={modalAbierto}
        proveedorEnEdicion={proveedorEnEdicion}
        onCerrar={() => setModalAbierto(false)}
        onGuardar={manejarGuardarProveedor}
      />

      {/* Modal de Confirmación de Baja Lógica / Cambio de Estado */}
      {proveedorParaBaja && (
        <div className="modal-superposicion">
          <div className="modal-contenedor" style={{ maxWidth: '460px', padding: 0 }}>
            <div className="modal-cabecera">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div
                  style={{
                    padding: '0.4rem',
                    borderRadius: '8px',
                    backgroundColor: proveedorParaBaja.activo ? '#fee2e2' : '#dcfce7',
                    color: proveedorParaBaja.activo ? '#dc2626' : '#16a34a',
                  }}
                >
                  <AlertTriangle size={22} />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>
                  {proveedorParaBaja.activo ? 'Desactivar Proveedor (Baja Lógica)' : 'Reactivar Proveedor'}
                </h3>
              </div>
              <button className="btn-icono" onClick={() => setProveedorParaBaja(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-cuerpo" style={{ fontSize: '0.92rem', lineHeight: 1.5 }}>
              <p style={{ margin: 0 }}>
                {proveedorParaBaja.activo ? (
                  <>
                    ¿Estás seguro de que deseas dar de <strong>baja lógica</strong> al proveedor{' '}
                    <strong>{proveedorParaBaja.nombre}</strong> (ID #{proveedorParaBaja.idProveedor})?
                    <br /><br />
                    <span style={{ fontSize: '0.82rem', color: 'var(--color-texto-secundario)' }}>
                      El proveedor ya no aparecerá como opción activa al registrar nuevas compras o pedidos, pero se conservará su historial contable.
                    </span>
                  </>
                ) : (
                  <>
                    ¿Deseas <strong>reactivar</strong> al proveedor <strong>{proveedorParaBaja.nombre}</strong>?
                    Volverá a estar disponible en el catálogo de compras y pedidos sugeridos.
                  </>
                )}
              </p>
            </div>

            <div className="modal-pie">
              <button
                type="button"
                className="btn btn-secundario"
                onClick={() => setProveedorParaBaja(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={`btn ${proveedorParaBaja.activo ? 'btn-peligro' : 'btn-primario'}`}
                style={{
                  backgroundColor: proveedorParaBaja.activo ? '#dc2626' : '#16a34a',
                  borderColor: proveedorParaBaja.activo ? '#dc2626' : '#16a34a',
                  color: '#ffffff',
                }}
                onClick={ejecutarAlternarEstado}
              >
                {proveedorParaBaja.activo ? 'Confirmar Baja Lógica' : 'Confirmar Reactivación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
