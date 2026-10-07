import { useState, useEffect, useCallback } from 'react';
import { TablaPaginada } from '../../components/comun/TablaPaginada';
import {
  servicioUsuarios,
  type UsuarioItem,
  type CrearUsuarioSolicitud,
  type ActualizarUsuarioSolicitud,
} from './servicioUsuarios';
import type { ResultadoPaginado } from '../../types/comun';
import {
  UserPlus,
  Shield,
  Check,
  X,
  Search,
  Edit2,
  KeyRound,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export function PantallaUsuarios() {
  const [resultado, setResultado] = useState<ResultadoPaginado<UsuarioItem> | undefined>(undefined);
  const [cargando, setCargando] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [registrosPorPagina, setRegistrosPorPagina] = useState<25 | 50 | 100>(25);
  const [busqueda, setBusqueda] = useState('');
  const [mensajeAlerta, setMensajeAlerta] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);

  // Modal de nuevo usuario
  const [mostrarModalAlta, setMostrarModalAlta] = useState(false);
  const [nuevoUsuario, setNuevoUsuario] = useState<CrearUsuarioSolicitud>({
    nombreCompleto: '',
    nombreUsuario: '',
    clave: '',
    correo: '',
    telefono: '',
    idRol: 2, // Cajero por defecto
  });

  // Modal de edición de usuario
  const [mostrarModalEditar, setMostrarModalEditar] = useState(false);
  const [usuarioAEditar, setUsuarioAEditar] = useState<UsuarioItem | null>(null);
  const [formEditar, setFormEditar] = useState<{
    nombreCompleto: string;
    correo: string;
    telefono: string;
    idRol: number;
    activo: boolean;
    nuevaClave: string;
  }>({
    nombreCompleto: '',
    correo: '',
    telefono: '',
    idRol: 2,
    activo: true,
    nuevaClave: '',
  });

  const [errorModal, setErrorModal] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

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
      // Silencioso
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
    setGuardando(true);
    try {
      await servicioUsuarios.crearUsuario(nuevoUsuario);
      setMostrarModalAlta(false);
      setNuevoUsuario({
        nombreCompleto: '',
        nombreUsuario: '',
        clave: '',
        correo: '',
        telefono: '',
        idRol: 2,
      });
      setMensajeAlerta({ tipo: 'exito', texto: 'Usuario registrado exitosamente.' });
      cargarUsuarios();
    } catch (err: unknown) {
      setErrorModal(err instanceof Error ? err.message : 'Error al crear usuario.');
    } finally {
      setGuardando(false);
    }
  };

  const abrirEdicion = (u: UsuarioItem) => {
    setUsuarioAEditar(u);
    setErrorModal(null);
    const idRolCalculado = u.rol === 'Administrador' ? 1 : u.rol === 'Supervisor' ? 3 : 2;
    setFormEditar({
      nombreCompleto: u.nombreCompleto,
      correo: u.correo || '',
      telefono: u.telefono || '',
      idRol: idRolCalculado,
      activo: u.activo,
      nuevaClave: '',
    });
    setMostrarModalEditar(true);
  };

  const manejarGuardarEdicion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioAEditar) return;
    setErrorModal(null);
    setGuardando(true);

    try {
      const datos: ActualizarUsuarioSolicitud = {
        nombreCompleto: formEditar.nombreCompleto,
        correo: formEditar.correo,
        telefono: formEditar.telefono,
        idRol: formEditar.idRol,
        activo: formEditar.activo,
        ...(formEditar.nuevaClave ? { nuevaClave: formEditar.nuevaClave } : {}),
      };

      await servicioUsuarios.actualizarUsuario(usuarioAEditar.idUsuario, datos);
      setMostrarModalEditar(false);
      setMensajeAlerta({
        tipo: 'exito',
        texto: `Usuario '${usuarioAEditar.nombreUsuario}' actualizado correctamente con rol asignado.`,
      });
      cargarUsuarios();
    } catch (err: unknown) {
      setErrorModal(err instanceof Error ? err.message : 'Error al actualizar el usuario.');
    } finally {
      setGuardando(false);
    }
  };

  const alternarEstado = async (idUsuario: number, estadoActual: boolean) => {
    try {
      await servicioUsuarios.cambiarEstado(idUsuario, !estadoActual);
      setMensajeAlerta({
        tipo: 'exito',
        texto: `Estado del usuario #${idUsuario} actualizado a ${!estadoActual ? 'Activo' : 'Inactivo'}.`,
      });
      cargarUsuarios();
    } catch {
      setMensajeAlerta({ tipo: 'error', texto: 'No se pudo cambiar el estado del usuario.' });
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
      titulo: 'Rol & Permisos',
      renderizar: (u: UsuarioItem) => (
        <span
          className={`badge ${
            u.rol === 'Administrador'
              ? 'badge-advertencia'
              : u.rol === 'Supervisor'
              ? 'badge-primario'
              : 'badge-exito'
          }`}
          style={{ gap: '0.35rem' }}
        >
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
      titulo: 'Acciones (ABC)',
      renderizar: (u: UsuarioItem) => (
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button
            className="btn btn-secundario"
            style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', gap: '0.3rem' }}
            onClick={() => abrirEdicion(u)}
            title="Editar roles, datos y contraseña"
          >
            <Edit2 size={13} />
            <span>Editar</span>
          </button>
          <button
            className={`btn ${u.activo ? 'btn-secundario' : 'btn-primario'}`}
            style={{
              padding: '0.3rem 0.6rem',
              fontSize: '0.8rem',
              color: u.activo ? '#dc2626' : undefined,
              borderColor: u.activo ? '#fca5a5' : undefined,
            }}
            onClick={() => alternarEstado(u.idUsuario, u.activo)}
          >
            {u.activo ? 'Desactivar' : 'Activar'}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      {/* Alerta de notificación */}
      {mensajeAlerta && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.75rem 1.25rem',
            borderRadius: '10px',
            backgroundColor: mensajeAlerta.tipo === 'exito' ? '#dcfce7' : '#fee2e2',
            color: mensajeAlerta.tipo === 'exito' ? '#166534' : '#991b1b',
            border: `1px solid ${mensajeAlerta.tipo === 'exito' ? '#bbf7d0' : '#fecaca'}`,
            fontWeight: 600,
            fontSize: '0.9rem',
            marginBottom: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {mensajeAlerta.tipo === 'exito' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{mensajeAlerta.texto}</span>
          </div>
          <button
            onClick={() => setMensajeAlerta(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Cabecera y controles */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>Gestión de Usuarios, Cajeros y Roles (ABC)</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-texto-secundario)', marginTop: '0.25rem' }}>
            Altas, bajas, modificación de roles (Administrador, Cajero, Supervisor) y permisos de venta
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--color-texto-secundario)' }} />
            <input
              type="text"
              className="input-base"
              style={{ width: '220px', paddingLeft: '32px', fontSize: '0.85rem' }}
              placeholder="Buscar por nombre..."
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value);
                setPagina(1);
              }}
            />
          </div>

          <button className="btn btn-primario" onClick={() => setMostrarModalAlta(true)} style={{ gap: '0.45rem' }}>
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

      {/* Modal 1: Alta de nuevo usuario */}
      {mostrarModalAlta && (
        <div className="modal-overlay">
          <div className="modal-contenido" style={{ maxWidth: '500px', backgroundColor: '#ffffff', borderRadius: '16px', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--color-borde)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ padding: '0.5rem', borderRadius: '10px', backgroundColor: '#e0f2fe', color: '#0284c7' }}>
                  <UserPlus size={22} />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Registrar Nuevo Usuario</h3>
              </div>
              <button
                className="btn btn-secundario"
                style={{ padding: '0.3rem 0.5rem', border: 'none', background: 'none' }}
                onClick={() => setMostrarModalAlta(false)}
              >
                <X size={20} />
              </button>
            </div>

            {errorModal && (
              <div style={{ padding: '0.75rem', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>
                {errorModal}
              </div>
            )}

            <form onSubmit={manejarCrearUsuario} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Nombre Completo *</label>
                <input
                  type="text"
                  required
                  className="input-base"
                  style={{ width: '100%' }}
                  placeholder="Ej. Roberto Gómez Bolaños"
                  value={nuevoUsuario.nombreCompleto}
                  onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, nombreCompleto: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Usuario (Login) *</label>
                  <input
                    type="text"
                    required
                    className="input-base"
                    style={{ width: '100%' }}
                    placeholder="cajero1"
                    value={nuevoUsuario.nombreUsuario}
                    onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, nombreUsuario: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Contraseña *</label>
                  <input
                    type="password"
                    required
                    className="input-base"
                    style={{ width: '100%' }}
                    placeholder="••••••••"
                    value={nuevoUsuario.clave}
                    onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, clave: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Rol Asignado *</label>
                <select
                  className="input-base"
                  style={{ width: '100%' }}
                  value={nuevoUsuario.idRol}
                  onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, idRol: Number(e.target.value) })}
                >
                  <option value={1}>Administrador (Acceso Total y Cancelaciones)</option>
                  <option value={2}>Cajero (Venta en Mostrador, Corte y Cobro)</option>
                  <option value={3}>Supervisor (Cortes e Inventario)</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Correo Electrónico</label>
                  <input
                    type="email"
                    className="input-base"
                    style={{ width: '100%' }}
                    placeholder="cajero@tienda.com"
                    value={nuevoUsuario.correo}
                    onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, correo: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Teléfono</label>
                  <input
                    type="tel"
                    className="input-base"
                    style={{ width: '100%' }}
                    placeholder="777 123 4567"
                    value={nuevoUsuario.telefono}
                    onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, telefono: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secundario" onClick={() => setMostrarModalAlta(false)}>
                  Cancelar
                </button>
                <button type="submit" disabled={guardando} className="btn btn-primario" style={{ gap: '0.4rem' }}>
                  <Check size={18} />
                  <span>{guardando ? 'Guardando...' : 'Crear Usuario'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Modificación / Edición de Usuario (Rol, Permisos, Clave) */}
      {mostrarModalEditar && usuarioAEditar && (
        <div className="modal-overlay">
          <div className="modal-contenido" style={{ maxWidth: '520px', backgroundColor: '#ffffff', borderRadius: '16px', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--color-borde)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ padding: '0.5rem', borderRadius: '10px', backgroundColor: '#fef3c7', color: '#d97706' }}>
                  <Edit2 size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Modificar Usuario & Roles</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-texto-secundario)' }}>
                    Usuario: <strong>{usuarioAEditar.nombreUsuario}</strong> (ID #{usuarioAEditar.idUsuario})
                  </span>
                </div>
              </div>
              <button
                className="btn btn-secundario"
                style={{ padding: '0.3rem 0.5rem', border: 'none', background: 'none' }}
                onClick={() => setMostrarModalEditar(false)}
              >
                <X size={20} />
              </button>
            </div>

            {errorModal && (
              <div style={{ padding: '0.75rem', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>
                {errorModal}
              </div>
            )}

            <form onSubmit={manejarGuardarEdicion} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Nombre Completo *</label>
                <input
                  type="text"
                  required
                  className="input-base"
                  style={{ width: '100%' }}
                  value={formEditar.nombreCompleto}
                  onChange={(e) => setFormEditar({ ...formEditar, nombreCompleto: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Rol del Usuario *</label>
                  <select
                    className="input-base"
                    style={{ width: '100%', fontWeight: 700 }}
                    value={formEditar.idRol}
                    onChange={(e) => setFormEditar({ ...formEditar, idRol: Number(e.target.value) })}
                  >
                    <option value={1}>Administrador (Total)</option>
                    <option value={2}>Cajero (Caja & Venta)</option>
                    <option value={3}>Supervisor</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Estado de la Cuenta</label>
                  <select
                    className="input-base"
                    style={{ width: '100%' }}
                    value={formEditar.activo ? 'true' : 'false'}
                    onChange={(e) => setFormEditar({ ...formEditar, activo: e.target.value === 'true' })}
                  >
                    <option value="true">Activo</option>
                    <option value="false">Inactivo / Bloqueado</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Correo Electrónico</label>
                  <input
                    type="email"
                    className="input-base"
                    style={{ width: '100%' }}
                    value={formEditar.correo}
                    onChange={(e) => setFormEditar({ ...formEditar, correo: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Teléfono</label>
                  <input
                    type="tel"
                    className="input-base"
                    style={{ width: '100%' }}
                    value={formEditar.telefono}
                    onChange={(e) => setFormEditar({ ...formEditar, telefono: e.target.value })}
                  />
                </div>
              </div>

              {/* Resetear contraseña */}
              <div style={{ backgroundColor: 'var(--color-fondo-suave)', padding: '0.85rem', borderRadius: '10px', border: '1px solid var(--color-borde)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  <KeyRound size={15} style={{ color: '#d97706' }} />
                  <span>Restablecer Contraseña (Dejar en blanco para no cambiar)</span>
                </label>
                <input
                  type="password"
                  className="input-base"
                  style={{ width: '100%' }}
                  placeholder="Nueva contraseña opcional..."
                  value={formEditar.nuevaClave}
                  onChange={(e) => setFormEditar({ ...formEditar, nuevaClave: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secundario" onClick={() => setMostrarModalEditar(false)}>
                  Cancelar
                </button>
                <button type="submit" disabled={guardando} className="btn btn-primario" style={{ gap: '0.4rem' }}>
                  <Check size={18} />
                  <span>{guardando ? 'Guardando...' : 'Guardar Cambios'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
