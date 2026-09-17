import { useState, type FormEvent } from 'react';
import { LogIn, Lock, User, AlertCircle, ShieldCheck } from 'lucide-react';
import { useStoreAutenticacion } from './storeAutenticacion';

export function PantallaLogin() {
  const [nombreUsuario, setNombreUsuario] = useState('admin');
  const [clave, setClave] = useState('Admin123*');
  const { iniciarSesion, cargando, error } = useStoreAutenticacion();

  const manejarEnvio = async (e: FormEvent) => {
    e.preventDefault();
    if (!nombreUsuario.trim() || !clave.trim()) return;
    await iniciarSesion({ nombreUsuario: nombreUsuario.trim(), clave: clave.trim() });
  };

  const seleccionarUsuarioRapido = (usr: string, pass: string) => {
    setNombreUsuario(usr);
    setClave(pass);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#090d16',
      padding: '1.5rem'
    }}>
      <div className="tarjeta" style={{
        width: '100%',
        maxWidth: '440px',
        backgroundColor: '#0f172a',
        border: '1px solid #334155',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4)',
        padding: '2.5rem'
      }}>
        {/* Cabecera del login */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, var(--color-primario), #2563eb)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem auto',
            color: 'white'
          }}>
            <ShieldCheck size={32} />
          </div>
          <h2 style={{ fontSize: '1.6rem', margin: 0, fontWeight: 800 }}>Abarrotes Arenas</h2>
          <p style={{ color: 'var(--color-texto-secundario)', fontSize: '0.9rem', marginTop: '0.35rem' }}>
            Acceso Seguro al Punto de Venta
          </p>
        </div>

        {/* Mensaje de error si falla */}
        {error && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#f87171',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radio-md)',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.9rem'
          }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={manejarEnvio} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-texto-secundario)', marginBottom: '0.4rem', fontWeight: 600 }}>
              Nombre de Usuario
            </label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--color-texto-secundario)' }} />
              <input
                type="text"
                className="input-escaner input-escaner-permitido"
                style={{ width: '100%', paddingLeft: '40px', fontSize: '1rem' }}
                placeholder="Ej. admin o cajero"
                value={nombreUsuario}
                onChange={(e) => setNombreUsuario(e.target.value)}
                autoFocus
                required
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-texto-secundario)', marginBottom: '0.4rem', fontWeight: 600 }}>
              Contraseña
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--color-texto-secundario)' }} />
              <input
                type="password"
                className="input-escaner input-escaner-permitido"
                style={{ width: '100%', paddingLeft: '40px', fontSize: '1rem' }}
                placeholder="Ingresa tu contraseña"
                value={clave}
                onChange={(e) => setClave(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primario"
            style={{ width: '100%', padding: '0.85rem', fontSize: '1.05rem', marginTop: '0.5rem', gap: '0.5rem' }}
            disabled={cargando}
          >
            <LogIn size={20} />
            <span>{cargando ? 'Autenticando...' : 'Iniciar Sesión'}</span>
          </button>
        </form>

        {/* Accesos rápidos para desarrollo */}
        <div style={{ marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid var(--color-borde)', textAlign: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-texto-secundario)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Accesos de prueba rápidos
          </span>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '0.6rem' }}>
            <button
              type="button"
              className="btn btn-secundario"
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.65rem' }}
              onClick={() => seleccionarUsuarioRapido('admin', 'Admin123*')}
            >
              Admin (Admin123*)
            </button>
            <button
              type="button"
              className="btn btn-secundario"
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.65rem' }}
              onClick={() => seleccionarUsuarioRapido('cajero', 'Cajero123*')}
            >
              Cajero (Cajero123*)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
