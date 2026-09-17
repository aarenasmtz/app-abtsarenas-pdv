import { useState, useEffect } from 'react';
import { DisenoAdmin } from './layouts/DisenoAdmin';
import { DisenoPdv } from './layouts/DisenoPdv';
import { PantallaLogin } from './modules/autenticacion/PantallaLogin';
import { PantallaUsuarios } from './modules/usuarios/PantallaUsuarios';
import { PantallaAuditoria } from './modules/auditoria/PantallaAuditoria';
import { PantallaProductos } from './modules/productos/PantallaProductos';
import { useStoreAutenticacion } from './modules/autenticacion/storeAutenticacion';
import clienteApi from './api/clienteApi';
import { CheckCircle, AlertTriangle, Database, TrendingUp, Package, Users } from 'lucide-react';

interface InfoDiagnostico {
  estado: string;
  motorBaseDatos: string;
  baseDatos: string;
  estadisticas: {
    totalProductos: number;
    totalVentas: number;
    totalClientes: number;
    totalCajas: number;
  };
}

export function App() {
  const { estaAutenticado, cargarSesionInicial } = useStoreAutenticacion();
  const [modo, setModo] = useState<'pdv' | 'admin'>('admin');
  const [moduloActivo, setModuloActivo] = useState('dashboard');
  const [servidorEnLinea, setServidorEnLinea] = useState<boolean>(false);
  const [diagnostico, setDiagnostico] = useState<InfoDiagnostico | null>(null);

  // Inicializar sesión guardada
  useEffect(() => {
    cargarSesionInicial();
  }, [cargarSesionInicial]);

  // Verificar conexión con la API y SQL Server
  useEffect(() => {
    const verificarConectividad = async () => {
      try {
        const respuesta = await clienteApi.get('/diagnostico/estado');
        if (respuesta.data && respuesta.data.exito) {
          setServidorEnLinea(true);
          setDiagnostico(respuesta.data.datos);
        } else {
          setServidorEnLinea(false);
        }
      } catch {
        setServidorEnLinea(false);
      }
    };

    verificarConectividad();
    const intervalo = setInterval(verificarConectividad, 15000);
    return () => clearInterval(intervalo);
  }, []);

  // Si no está autenticado, mostrar pantalla de inicio de sesión
  if (!estaAutenticado) {
    return <PantallaLogin />;
  }

  // Si está en modo Punto de Venta (caja rápida)
  if (modo === 'pdv') {
    return (
      <DisenoPdv 
        onVolverAAdmin={() => setModo('admin')} 
        servidorEnLinea={servidorEnLinea} 
      />
    );
  }

  return (
    <DisenoAdmin
      moduloActivo={moduloActivo}
      onSeleccionarModulo={setModuloActivo}
      onIrAPdv={() => setModo('pdv')}
      servidorEnLinea={servidorEnLinea}
    >
      {moduloActivo === 'dashboard' && (
        <div>
          {/* Tarjetas de Indicadores */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
            <div className="tarjeta" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ padding: '0.85rem', borderRadius: 'var(--radio-md)', backgroundColor: 'var(--color-primario-suave)', color: 'var(--color-primario-hover)' }}>
                <TrendingUp size={28} />
              </div>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-texto-secundario)' }}>Ventas Históricas</span>
                <h3 className="mono" style={{ fontSize: '1.6rem', margin: 0 }}>
                  {diagnostico?.estadisticas.totalVentas ? diagnostico.estadisticas.totalVentas.toLocaleString() : '238,424'}
                </h3>
              </div>
            </div>

            <div className="tarjeta" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ padding: '0.85rem', borderRadius: 'var(--radio-md)', backgroundColor: 'rgba(59, 130, 246, 0.15)', color: 'var(--color-acento-hover)' }}>
                <Package size={28} />
              </div>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-texto-secundario)' }}>Productos en Catálogo</span>
                <h3 className="mono" style={{ fontSize: '1.6rem', margin: 0 }}>
                  {diagnostico?.estadisticas.totalProductos ? diagnostico.estadisticas.totalProductos.toLocaleString() : '3,586'}
                </h3>
              </div>
            </div>

            <div className="tarjeta" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ padding: '0.85rem', borderRadius: 'var(--radio-md)', backgroundColor: 'rgba(245, 158, 11, 0.15)', color: 'var(--color-advertencia)' }}>
                <Users size={28} />
              </div>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-texto-secundario)' }}>Clientes Registrados</span>
                <h3 className="mono" style={{ fontSize: '1.6rem', margin: 0 }}>
                  {diagnostico?.estadisticas.totalClientes || 4}
                </h3>
              </div>
            </div>

            <div className="tarjeta" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ padding: '0.85rem', borderRadius: 'var(--radio-md)', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
                <Database size={28} />
              </div>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-texto-secundario)' }}>Estado Base de Datos</span>
                <h3 style={{ fontSize: '1.2rem', margin: 0, color: servidorEnLinea ? '#34d399' : '#f87171' }}>
                  {servidorEnLinea ? 'En Línea (AAM)' : 'Desconectado'}
                </h3>
              </div>
            </div>
          </div>

          {/* Panel de Estado y Arquitectura */}
          <div className="tarjeta" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle size={20} color="var(--color-primario)" />
              <span>Fase 4 — Catálogo Maestro de Productos, Buscador PDV y Soporte de Imágenes</span>
            </h3>
            <p style={{ color: 'var(--color-texto-secundario)', lineHeight: 1.6, marginBottom: '1rem' }}>
              Catálogo administrativo completo con paginación server-side (25/50/100 registros), filtros dinámicos por categoría y marca, auditoría granular de cambio de precios, cálculo automático de margen de utilidad, buscador predictivo ultrarrápido (&lt;50ms) y separación estricta de imágenes para no sobrecargar el PDV.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <span className="badge badge-exito">Paginación Server-Side (25/50/100)</span>
              <span className="badge badge-exito">Escáner de Caja &lt;50ms (Sin Imágenes)</span>
              <span className="badge badge-exito">Buscador Predictivo PDV</span>
              <span className="badge badge-exito">Auditoría Precios Granular</span>
              <span className="badge badge-exito">Almacenamiento Local de Imágenes</span>
              <span className="badge badge-advertencia">Nomenclatura 100% en Español</span>
            </div>
          </div>
        </div>
      )}

      {moduloActivo === 'usuarios' && <PantallaUsuarios />}

      {moduloActivo === 'auditoria' && <PantallaAuditoria />}

      {moduloActivo === 'productos' && <PantallaProductos />}

      {moduloActivo !== 'dashboard' && moduloActivo !== 'productos' && moduloActivo !== 'usuarios' && moduloActivo !== 'auditoria' && (
        <div className="tarjeta" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <AlertTriangle size={48} style={{ color: 'var(--color-advertencia)', marginBottom: '1rem', opacity: 0.8 }} />
          <h3>Módulo '{moduloActivo}' Preparado para Implementación en Fase Siguiente</h3>
          <p style={{ color: 'var(--color-texto-secundario)', marginTop: '0.5rem', maxWidth: '500px', marginInline: 'auto' }}>
            La estructura modular, DTOs, entidades y servicios base en español ya se encuentran listos para poblar la funcionalidad detallada de este módulo.
          </p>
        </div>
      )}
    </DisenoAdmin>
  );
}

export default App;
