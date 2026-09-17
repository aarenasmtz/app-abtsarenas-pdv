import { useState, useEffect, useCallback } from 'react';
import { TablaPaginada } from '../../components/comun/TablaPaginada';
import { servicioUsuarios, type UsuarioItem, type CrearUsuarioSolicitud } from './servicioUsuarios';
import type { ResultadoPaginado } from '../../types/comun';
import { UserPlus, Shield, Check, X, Search } from 'lucide-react';

export function PantallaUsuarios() {
  const [resultado, setResultado] = useState<ResultadoPaginado<UsuarioItem> | undefined>(undefined);
  const [cargando, setCargando] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [registrosPorPagina, setRegistrosPorPagina] = useState<25 | 50 | 100>(25);
  const [busqueda, setBusqueda] = useState('');
  
  // Modal de nuevo usuario
  const [mostrarModal, setMostrarModal] = useState(false);
  const [nuevoUsuario, setNuevoUsuario] = useState<CrearUsuarioSolicitud>({
    nombreCompleto: '',
    nombreUsuario: '',
    clave: '',
    correo: '',
    telefono: '',
    idRol: 2, // Cajero
  });
  const [errorModal, setErrorModal] = useState<string | null>(null);

  const cargarUsuarios = useCallback(async () => {
    setCargando(true);
    try {
      const datos = await servicioUsuarios.obtenerUsuarios({
        pagina,
        registrosPorPagina,
        busqueda: busqueda.trim() || undefined,
      });
      setResultado(datos);
    } catch {
      // Manejo silencioso o estado vacío
    } finally {
      setCargando(false);
    }
  }, [pagina, registrosPorPagina, busqueda]);

  useEffect(() => {
    cargarUsuarios();
  }, [cargarUsuarios]);

  const manejarCrearUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorModal(null);
    try {
      await servicioUsuarios.crearUsuario(nuevoUsuario);
      setMostrarModal(false);
      setNuevoUsuario({
        nombreCompleto: '',
        nombreUsuario: '',
        clave: '',
        correo: '',
        telefono: '',
        idRol: 2,
      });
      cargarUsuarios();
    } catch (err: unknown) {
      setErrorModal(err instanceof Error ? err.message : 'Error al crear usuario');
    }
  };

  const alternarEstado = async (idUsuario: number, estadoActual: boolean) => {
    try {
      await servicioUsuarios.cambiarEstado(idUsuario, !estadoActual);
      cargarUsuarios();
    } catch {
      alert('No se pudo cambiar el estado del usuario');
    }
  };

  const columnas = [
    {
      clave: 'idUsuario',
      titulo: 'ID',
      renderizar: (u: UsuarioItem) => <span className="mono">#{u.idUsuario}</span>,
    },
    {
      clave: 'nombreCompleto',
      titulo: 'Nombre Completo',
      renderizar: (u: UsuarioItem) => (
        <div>
          <div style={{ fontWeight: 600 }}>{u.nombreCompleto}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-texto-secundario)' }}>{u.correo || 'Sin correo'}</div>
        </div>
      ),
    },
    {
      clave: 'nombreUsuario',
      titulo: 'Usuario',
      renderizar: (u: UsuarioItem) => <span className="mono font-bold">{u.nombreUsuario}</span>,
    },
    {
      clave: 'rol',
      titulo: 'Rol Asignado',
      renderizar: (u: UsuarioItem) => (
        <span className={`badge ${u.rol === 'Administrador' ? 'badge-advertencia' : 'badge-exito'}`}>
          <Shield size={12} />
          {u.rol}
        </span>
      ),
    },
    {
      clave: 'activo',
      titulo: 'Estado',
      renderizar: (u: UsuarioItem) => (
        <span className={`badge ${u.activo ? 'badge-exito' : 'badge-peligro'}`}>
          {u.activo ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
    {
      clave: 'acciones',
      titulo: 'Acciones',
      renderizar: (u: UsuarioItem) => (
        <button
          className={`btn ${u.activo ? 'btn-secundario' : 'btn-primario'}`}
          style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
          onClick={() => alternarEstado(u.idUsuario, u.activo)}
        >
          {u.activo ? 'Desactivar' : 'Activar'}
        </button>
      ),
    },
  ];

  return (
    <div>
      {/* Cabecera y controles */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h3 style={{ margin: 0 }}>Gestión de Usuarios y Cajeros</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-texto-secundario)', marginTop: '0.25rem' }}>
            Control de accesos y roles con paginación server-side.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--color-texto-secundario)' }} />
            <input
              type="text"
              className="input-escaner input-escaner-permitido"
              style={{ width: '220px', padding: '0.45rem 0.75rem 0.45rem 2.2rem', fontSize: '0.85rem' }}
              placeholder="Buscar por nombre..."
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value);
                setPagina(1);
              }}
            />
          </div>

          <button className="btn btn-primario" onClick={() => setMostrarModal(true)}>
            <UserPlus size={18} />
            <span>Nuevo Usuario</span>
          </button>
        </div>
      </div>

      {/* Tabla con paginación server-side */}
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

      {/* Modal de alta de usuario */}
      {mostrarModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          padding: '1rem'
        }}>
          <div className="tarjeta" style={{ width: '100%', maxWidth: '480px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0 }}>Registrar Nuevo Usuario</h3>
              <button 
                className="btn btn-secundario" 
                style={{ padding: '0.3rem 0.5rem' }}
                onClick={() => setMostrarModal(false)}
              >
                <X size={16} />
              </button>
            </div>

            {errorModal && (
              <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#f87171', padding: '0.75rem', borderRadius: 'var(--radio-md)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                {errorModal}
              </div>
            )}

            <form onSubmit={manejarCrearUsuario} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-texto-secundario)', marginBottom: '0.3rem' }}>
                  Nombre Completo
                </label>
                <input
                  type="text"
                  className="input-escaner input-escaner-permitido"
                  style={{ width: '100%', fontSize: '0.95rem' }}
                  placeholder="Ej. Juan Pérez López"
                  value={nuevoUsuario.nombreCompleto}
                  onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, nombreCompleto: e.target.value })}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-texto-secundario)', marginBottom: '0.3rem' }}>
                  Nombre de Usuario (Login)
                </label>
                <input
                  type="text"
                  className="input-escaner input-escaner-permitido"
                  style={{ width: '100%', fontSize: '0.95rem' }}
                  placeholder="Ej. juanperez"
                  value={nuevoUsuario.nombreUsuario}
                  onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, nombreUsuario: e.target.value })}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-texto-secundario)', marginBottom: '0.3rem' }}>
                  Contraseña Inicial
                </label>
                <input
                  type="password"
                  className="input-escaner input-escaner-permitido"
                  style={{ width: '100%', fontSize: '0.95rem' }}
                  placeholder="Mínimo 6 caracteres"
                  value={nuevoUsuario.clave}
                  onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, clave: e.target.value })}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-texto-secundario)', marginBottom: '0.3rem' }}>
                  Rol en el Sistema
                </label>
                <select
                  className="selector-registros"
                  style={{ width: '100%', padding: '0.65rem', fontSize: '0.95rem' }}
                  value={nuevoUsuario.idRol}
                  onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, idRol: Number(e.target.value) })}
                >
                  <option value={2}>Cajero (Cobro en caja y consultas)</option>
                  <option value={3}>Supervisor (Cortes y autorizaciones)</option>
                  <option value={1}>Administrador (Control total)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secundario" style={{ flex: 1 }} onClick={() => setMostrarModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primario" style={{ flex: 1 }}>
                  <Check size={18} />
                  <span>Guardar Usuario</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
