import React from 'react';
import { 
  LayoutDashboard, 
  Package, 
  Layers, 
  ShoppingCart, 
  Users, 
  Truck, 
  DollarSign, 
  BarChart3, 
  ShieldCheck, 
  Settings, 
  Store,
  Wifi
} from 'lucide-react';

interface PropiedadesDisenoAdmin {
  moduloActivo: string;
  onSeleccionarModulo: (modulo: string) => void;
  onIrAPdv: () => void;
  servidorEnLinea: boolean;
  children: React.ReactNode;
}

export const DisenoAdmin: React.FC<PropiedadesDisenoAdmin> = ({
  moduloActivo,
  onSeleccionarModulo,
  onIrAPdv,
  servidorEnLinea,
  children,
}) => {
  const elementosMenu = [
    { id: 'dashboard', etiqueta: 'Dashboard', icono: LayoutDashboard },
    { id: 'productos', etiqueta: 'Productos', icono: Package },
    { id: 'inventario', etiqueta: 'Inventario & Kardex', icono: Layers },
    { id: 'caja', etiqueta: 'Control de Caja', icono: DollarSign },
    { id: 'compras', etiqueta: 'Compras', icono: ShoppingCart },
    { id: 'clientes', etiqueta: 'Clientes', icono: Users },
    { id: 'proveedores', etiqueta: 'Proveedores', icono: Truck },
    { id: 'reportes', etiqueta: 'Reportes & Ventas', icono: BarChart3 },
    { id: 'auditoria', etiqueta: 'Auditoría', icono: ShieldCheck },
    { id: 'configuracion', etiqueta: 'Configuración', icono: Settings },
  ];

  return (
    <div className="contenedor-app">
      {/* Barra lateral */}
      <aside className="barra-lateral">
        <div className="barra-lateral-cabecera">
          <div className="logo-icono">PA</div>
          <div>
            <h3 style={{ fontSize: '1.05rem', margin: 0 }}>Abarrotes Arenas</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-texto-secundario)' }}>
              Panel Administrativo
            </span>
          </div>
        </div>

        {/* Botón directo para ingresar a cobrar al PDV */}
        <div style={{ padding: '1rem 0.75rem 0.25rem 0.75rem' }}>
          <button 
            className="btn btn-primario" 
            style={{ width: '100%', gap: '0.6rem', padding: '0.75rem 1rem' }}
            onClick={onIrAPdv}
          >
            <Store size={18} />
            <span>Abrir Punto de Venta</span>
          </button>
        </div>

        {/* Menú de módulos */}
        <nav className="navegacion-admin">
          {elementosMenu.map((item) => {
            const Icono = item.icono;
            const esActivo = moduloActivo === item.id;
            return (
              <button
                key={item.id}
                className={`enlace-nav ${esActivo ? 'activo' : ''}`}
                onClick={() => onSeleccionarModulo(item.id)}
              >
                <Icono size={18} />
                <span>{item.etiqueta}</span>
              </button>
            );
          })}
        </nav>

        {/* Pie de barra lateral */}
        <div style={{ padding: '1rem', borderTop: '1px solid var(--color-borde)', fontSize: '0.8rem', color: 'var(--color-texto-secundario)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span className={`badge ${servidorEnLinea ? 'badge-exito' : 'badge-peligro'}`}>
              <Wifi size={12} />
              {servidorEnLinea ? 'SQL Server 2022' : 'Sin Conexión'}
            </span>
          </div>
          <span>.NET 9 + React + TS</span>
        </div>
      </aside>

      {/* Contenido principal */}
      <main className="area-contenido">
        <header className="barra-superior">
          <div>
            <h2 style={{ fontSize: '1.25rem', textTransform: 'capitalize' }}>
              Módulo: {moduloActivo}
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--color-texto-secundario)' }}>
              Sucursal Matriz | Caja 1
            </span>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--color-superficie-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
              A
            </div>
          </div>
        </header>

        <section className="cuerpo-modulo">
          {children}
        </section>
      </main>
    </div>
  );
};
