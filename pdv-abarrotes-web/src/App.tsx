import { useState, useEffect } from 'react';
import { DisenoAdmin } from './layouts/DisenoAdmin';
import { DisenoPdv } from './layouts/DisenoPdv';
import { TablaPaginada } from './components/comun/TablaPaginada';
import { PantallaLogin } from './modules/autenticacion/PantallaLogin';
import { PantallaUsuarios } from './modules/usuarios/PantallaUsuarios';
import { PantallaAuditoria } from './modules/auditoria/PantallaAuditoria';
import { useStoreAutenticacion } from './modules/autenticacion/storeAutenticacion';
import type { ResultadoPaginado } from './types/comun';
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

  // Estado para la tabla paginada de demostración de productos
  const [paginaActual, setPaginaActual] = useState(1);
  const [registrosPorPagina, setRegistrosPorPagina] = useState<25 | 50 | 100>(25);

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

  // Datos de demostración para el catálogo de productos
  const datosDemostracion: ResultadoPaginado<{ id: number; codigo: string; descripcion: string; precio: number; stock: number; categoria: string }> = {
    paginaActual,
    registrosPorPagina,
    totalRegistros: diagnostico?.estadisticas.totalProductos || 3586,
    totalPaginas: Math.ceil((diagnostico?.estadisticas.totalProductos || 3586) / registrosPorPagina),
    tienePaginaAnterior: paginaActual > 1,
    tienePaginaSiguiente: true,
    elementos: [
      { id: 1, codigo: '7501055310884', descripcion: 'COCA COLA 600ML NO RETORNABLE', precio: 19.00, stock: 45, categoria: 'Refrescos' },
      { id: 2, codigo: '7501000111209', descripcion: 'LECHE LALA ENTERA 1L TETRAPAK', precio: 28.50, stock: 24, categoria: 'Lácteos' },
      { id: 3, codigo: '7501030424513', descripcion: 'SABRITAS ORIGINAL 45G', precio: 18.00, stock: 32, categoria: 'Botanas' },
      { id: 4, codigo: '7501000153100', descripcion: 'PAN BLANCO BIMBO GRANDE 680G', precio: 45.00, stock: 15, categoria: 'Panadería' },
      { id: 5, codigo: '7501008001014', descripcion: 'ACEITE 1-2-3 VEGETAL 1L', precio: 38.00, stock: 18, categoria: 'Abarrotes' },
    ]
  };

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
              <span>Fase 3 — Autenticación JWT, Usuarios, Roles y Auditoría Activa</span>
            </h3>
            <p style={{ color: 'var(--color-texto-secundario)', lineHeight: 1.6, marginBottom: '1rem' }}>
              La autenticación mediante JWT Bearer está activa. Los usuarios cuentan con roles estrictos (Administrador, Cajero, Supervisor) y cada evento relevante genera un registro detallado en la bitácora de auditoría con el usuario extraído del token criptográfico.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <span className="badge badge-exito">JWT Bearer Auth</span>
              <span className="badge badge-exito">BCrypt Password Hashing</span>
              <span className="badge badge-exito">Auditoría Granular (BitacoraAuditoria)</span>
              <span className="badge badge-exito">Control de Acceso por Roles</span>
              <span className="badge badge-advertencia">Nomenclatura 100% en Español</span>
            </div>
          </div>
        </div>
      )}

      {moduloActivo === 'usuarios' && <PantallaUsuarios />}

      {moduloActivo === 'auditoria' && <PantallaAuditoria />}

      {moduloActivo === 'productos' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ margin: 0 }}>Catálogo de Productos</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-texto-secundario)', marginTop: '0.25rem' }}>
                Gestión administrativa con soporte de imágenes y paginación server-side.
              </p>
            </div>
            <button className="btn btn-primario">
              + Nuevo Producto
            </button>
          </div>

          <TablaPaginada
            columnas={[
              { clave: 'codigo', titulo: 'Código de Barras' },
              { clave: 'descripcion', titulo: 'Descripción del Artículo' },
              { clave: 'categoria', titulo: 'Categoría' },
              { clave: 'precio', titulo: 'Precio Venta', renderizar: (p) => <span className="mono font-bold">${p.precio.toFixed(2)}</span> },
              { clave: 'stock', titulo: 'Existencia', renderizar: (p) => <span className="badge badge-exito mono">{p.stock} pza</span> },
            ]}
            resultado={datosDemostracion}
            onCambiarPagina={(p) => setPaginaActual(p)}
            onCambiarRegistrosPorPagina={(tam) => {
              setRegistrosPorPagina(tam);
              setPaginaActual(1);
            }}
          />
        </div>
      )}

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
