import { useState, type FormEvent } from 'react';
import { LogIn, Lock, User, AlertCircle, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { useStoreAutenticacion } from './storeAutenticacion';

export function PantallaLogin() {
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [clave, setClave] = useState('');
  const [mostrarClave, setMostrarClave] = useState(false);
  const { iniciarSesion, cargando, error } = useStoreAutenticacion();

  const manejarEnvio = async (e: FormEvent) => {
    e.preventDefault();
    if (!nombreUsuario.trim() || !clave.trim()) return;
    await iniciarSesion({ nombreUsuario: nombreUsuario.trim(), clave: clave.trim() });
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--color-fondo)',
        padding: '1.5rem',
      }}
    >
      <div
        className="tarjeta"
        style={{
          width: '100%',
          maxWidth: '420px',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 20px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04)',
          padding: '2.5rem',
        }}
      >
        {/* Cabecera del login */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, var(--color-primario), #2563eb)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem auto',
              color: 'white',
              boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)',
            }}
          >
            <ShieldCheck size={32} />
          </div>
          <h2 style={{ fontSize: '1.5rem', margin: 0, fontWeight: 800, color: '#0f172a' }}>
            Abarrotes Arenas
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.88rem', marginTop: '0.35rem' }}>
            Acceso Seguro al Punto de Venta
          </p>
        </div>

        {/* Mensaje de error si falla */}
        {error && (
          <div
            style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fca5a5',
              color: '#dc2626',
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.88rem',
            }}
          >
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Formulario de Acceso */}
        <form onSubmit={manejarEnvio} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="grupo-formulario">
            <label className="etiqueta-formulario">
              <span>Nombre de Usuario</span>
            </label>
            <div style={{ position: 'relative' }}>
              <User
                size={18}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8',
                }}
              />
              <input
                type="text"
                autoComplete="username"
                className="control-formulario"
                style={{ paddingLeft: '38px', fontSize: '0.95rem' }}
                placeholder="Ingresa tu usuario"
                value={nombreUsuario}
                onChange={(e) => setNombreUsuario(e.target.value)}
                autoFocus
                required
              />
            </div>
          </div>

          <div className="grupo-formulario">
            <label className="etiqueta-formulario">
              <span>Contraseña</span>
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={18}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8',
                }}
              />
              <input
                type={mostrarClave ? 'text' : 'password'}
                autoComplete="current-password"
                className="control-formulario"
                style={{ paddingLeft: '38px', paddingRight: '40px', fontSize: '0.95rem' }}
                placeholder="Ingresa tu contraseña"
                value={clave}
                onChange={(e) => setClave(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setMostrarClave(!mostrarClave)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94a3b8',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                }}
                tabIndex={-1}
              >
                {mostrarClave ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primario"
            style={{
              width: '100%',
              padding: '0.85rem',
              fontSize: '1rem',
              fontWeight: 700,
              marginTop: '0.5rem',
              gap: '0.5rem',
              boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)',
            }}
            disabled={cargando || !nombreUsuario.trim() || !clave.trim()}
          >
            {cargando ? (
              <>
                <div
                  className="animacion-giratoria"
                  style={{
                    width: '18px',
                    height: '18px',
                    border: '2px solid #ffffff',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                  }}
                />
                <span>Autenticando...</span>
              </>
            ) : (
              <>
                <LogIn size={18} />
                <span>Iniciar Sesión</span>
              </>
            )}
          </button>
        </form>

        <div
          style={{
            marginTop: '2rem',
            paddingTop: '1rem',
            borderTop: '1px solid #f1f5f9',
            textAlign: 'center',
            fontSize: '0.78rem',
            color: '#94a3b8',
          }}
        >
          <span>Punto de Venta Autorizado · Todos los accesos son auditados</span>
        </div>
      </div>
    </div>
  );
}
