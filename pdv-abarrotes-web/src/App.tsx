import { useState, useEffect, lazy, Suspense } from 'react';
import { DisenoAdmin } from './layouts/DisenoAdmin';
import { DisenoPdv } from './layouts/DisenoPdv';
import { PantallaLogin } from './modules/autenticacion/PantallaLogin';
import { useStoreAutenticacion } from './modules/autenticacion/storeAutenticacion';
import clienteApi from './api/clienteApi';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { ControladorError } from './components/comun/ControladorError';

// Carga perezosa (Lazy loading) de módulos administrativos pesados para descarga ultrarrápida del PDV
const PantallaDashboard = lazy(() =>
  import('./modules/dashboard/PantallaDashboard').then((m) => ({ default: m.PantallaDashboard }))
);
const PantallaUsuarios = lazy(() =>
  import('./modules/usuarios/PantallaUsuarios').then((m) => ({ default: m.PantallaUsuarios }))
);
const PantallaAuditoria = lazy(() =>
  import('./modules/auditoria/PantallaAuditoria').then((m) => ({ default: m.PantallaAuditoria }))
);
const PantallaProductos = lazy(() =>
  import('./modules/productos/PantallaProductos').then((m) => ({ default: m.PantallaProductos }))
);
const PantallaInventario = lazy(() =>
  import('./modules/inventario/PantallaInventario').then((m) => ({ default: m.PantallaInventario }))
);
const PantallaProveedores = lazy(() =>
  import('./modules/proveedores/PantallaProveedores').then((m) => ({ default: m.PantallaProveedores }))
);
const PantallaCompras = lazy(() =>
  import('./modules/compras/PantallaCompras').then((m) => ({ default: m.PantallaCompras }))
);
const PantallaPedidoSugerido = lazy(() =>
  import('./modules/pedidos/PantallaPedidoSugerido').then((m) => ({ default: m.PantallaPedidoSugerido }))
);
const PantallaRecargasYServicios = lazy(() =>
  import('./modules/servicios/PantallaRecargasYServicios').then((m) => ({ default: m.PantallaRecargasYServicios }))
);
const PantallaReportes = lazy(() =>
  import('./modules/reportes/PantallaReportes').then((m) => ({ default: m.PantallaReportes }))
);
const PantallaControlCaja = lazy(() =>
  import('./modules/caja/PantallaControlCaja').then((m) => ({ default: m.PantallaControlCaja }))
);
const PantallaClientes = lazy(() =>
  import('./modules/clientes/PantallaClientes').then((m) => ({ default: m.PantallaClientes }))
);
const PantallaConfiguracion = lazy(() =>
  import('./modules/configuracion/PantallaConfiguracion').then((m) => ({ default: m.PantallaConfiguracion }))
);


// Componente de espera para carga bajo demanda
const CargadorModulo = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '0.75rem', color: 'var(--color-texto-secundario)' }}>
    <RefreshCw size={24} className="animacion-giratoria" />
    <span style={{ fontSize: '0.95rem', fontWeight: 500 }}>Cargando módulo...</span>
  </div>
);

export function App() {
  const { estaAutenticado, cargarSesionInicial, cerrarSesion } = useStoreAutenticacion();
  const [modo, setModo] = useState<'pdv' | 'admin'>('admin');
  const [moduloActivo, setModuloActivo] = useState('dashboard');
  const [servidorEnLinea, setServidorEnLinea] = useState<boolean>(false);

  // Inicializar sesión guardada y escuchar expiración por error 401
  useEffect(() => {
    cargarSesionInicial();

    const manejarSesionExpirada = () => {
      cerrarSesion();
    };

    window.addEventListener('pdv:sesion-expirada', manejarSesionExpirada);
    return () => {
      window.removeEventListener('pdv:sesion-expirada', manejarSesionExpirada);
    };
  }, [cargarSesionInicial, cerrarSesion]);

  // Verificar conexión con la API y SQL Server (solo cuando hay sesión activa en el PDV)
  useEffect(() => {
    if (!estaAutenticado) return;

    const verificarConectividad = async () => {
      try {
        const respuesta = await clienteApi.get('/diagnostico/estado');
        if (respuesta.data && respuesta.data.exito) {
          setServidorEnLinea(true);
        } else {
          setServidorEnLinea(false);
        }
      } catch {
        setServidorEnLinea(false);
      }
    };

    verificarConectividad();
    const intervalo = setInterval(verificarConectividad, 60000);
    return () => clearInterval(intervalo);
  }, [estaAutenticado]);

  // Si no está autenticado, mostrar pantalla de inicio de sesión
  if (!estaAutenticado) {
    return <PantallaLogin />;
  }

  // Si está en modo Punto de Venta (caja rápida de mostrador)
  if (modo === 'pdv') {
    return (
      <ControladorError 
        alVolver={() => setModo('admin')}
        mensajeTitulo="No se pudo cargar el Punto de Venta"
      >
        <DisenoPdv 
          onVolverAAdmin={() => setModo('admin')} 
          servidorEnLinea={servidorEnLinea} 
        />
      </ControladorError>
    );
  }

  return (
    <DisenoAdmin
      moduloActivo={moduloActivo}
      onSeleccionarModulo={setModuloActivo}
      onIrAPdv={() => setModo('pdv')}
      servidorEnLinea={servidorEnLinea}
    >
      <Suspense fallback={<CargadorModulo />}>
        {moduloActivo === 'dashboard' && (
          <PantallaDashboard 
            onIrAPdv={() => setModo('pdv')}
            onIrAReportes={() => setModuloActivo('reportes')}
          />
        )}

        {moduloActivo === 'usuarios' && <PantallaUsuarios />}

        {moduloActivo === 'auditoria' && <PantallaAuditoria />}

        {moduloActivo === 'productos' && <PantallaProductos />}

        {moduloActivo === 'inventario' && <PantallaInventario />}

        {moduloActivo === 'proveedores' && <PantallaProveedores />}

        {moduloActivo === 'compras' && <PantallaCompras />}

        {moduloActivo === 'pedidos-sugeridos' && <PantallaPedidoSugerido />}

        {moduloActivo === 'servicios' && <PantallaRecargasYServicios />}

        {moduloActivo === 'reportes' && <PantallaReportes />}

        {moduloActivo === 'caja' && <PantallaControlCaja />}

        {moduloActivo === 'clientes' && <PantallaClientes />}

        {moduloActivo === 'configuracion' && <PantallaConfiguracion />}

        {moduloActivo !== 'dashboard' && 
         moduloActivo !== 'productos' && 
         moduloActivo !== 'usuarios' && 
         moduloActivo !== 'auditoria' && 
         moduloActivo !== 'inventario' && 
         moduloActivo !== 'proveedores' && 
         moduloActivo !== 'compras' && 
         moduloActivo !== 'pedidos-sugeridos' && 
         moduloActivo !== 'servicios' && 
         moduloActivo !== 'reportes' && 
         moduloActivo !== 'caja' && 
         moduloActivo !== 'clientes' && 
         moduloActivo !== 'configuracion' && (
          <div className="tarjeta" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
            <AlertTriangle size={48} style={{ color: 'var(--color-advertencia)', marginBottom: '1rem', opacity: 0.8 }} />
            <h3>Módulo '{moduloActivo}' Preparado para Implementación</h3>
            <p style={{ color: 'var(--color-texto-secundario)', marginTop: '0.5rem', maxWidth: '500px', marginInline: 'auto' }}>
              La estructura modular, DTOs, entidades y servicios base en español ya se encuentran listos para poblar la funcionalidad detallada de este módulo.
            </p>
          </div>
        )}
      </Suspense>
    </DisenoAdmin>
  );
}

export default App;
