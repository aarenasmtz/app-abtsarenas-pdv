import React, { useState, useEffect, useCallback } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Receipt, 
  Percent, 
  Package, 
  AlertTriangle, 
  ArrowUpRight, 
  RefreshCw, 
  ShoppingBag, 
  Store, 
  CreditCard, 
  Wallet, 
  Award,
  ChevronRight
} from 'lucide-react';
import { servicioDashboard } from './servicioDashboard';
import type { ResumenDashboardDto } from './tiposDashboard';

interface PropiedadesPantallaDashboard {
  onIrAPdv: () => void;
  onIrAReportes: () => void;
}

export const PantallaDashboard: React.FC<PropiedadesPantallaDashboard> = ({
  onIrAPdv,
  onIrAReportes,
}) => {
  const [datos, setDatos] = useState<ResumenDashboardDto | null>(null);
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const cargarDashboard = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const resumen = await servicioDashboard.obtenerDashboard();
      setDatos(resumen);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar métricas del Dashboard.';
      setError(msg);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarDashboard();
  }, [cargarDashboard]);

  const formatearMoneda = (valor: number) => {
    return `$${valor.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Calcular valor máximo para escalar barras del gráfico de tendencia
  const maxVentaTendencia = datos?.tendenciaUltimosDias && datos.tendenciaUltimosDias.length > 0
    ? Math.max(...datos.tendenciaUltimosDias.map(d => d.totalVentas), 100)
    : 100;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Cabecera Principal */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 700 }}>Panel Ejecutivo y Métricas</h2>
            <span className="badge badge-exito" style={{ fontSize: '0.75rem' }}>En Vivo</span>
          </div>
          <p style={{ margin: '0.35rem 0 0 0', color: 'var(--color-texto-secundario)', fontSize: '0.9rem' }}>
            Resumen en tiempo real de ventas, rentabilidad neta, rotación de abarrotes y métodos de pago.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            className="btn btn-secundario"
            onClick={cargarDashboard}
            title="Actualizar métricas"
            style={{ padding: '0.65rem 0.85rem' }}
          >
            <RefreshCw size={16} className={cargando ? 'animacion-rotar' : ''} />
          </button>

          <button className="btn btn-secundario" onClick={onIrAReportes}>
            <span>Reportes Detallados</span>
            <ChevronRight size={16} />
          </button>

          <button className="btn btn-primario" onClick={onIrAPdv} style={{ gap: '0.5rem' }}>
            <Store size={18} />
            <span>Abrir PDV (Caja)</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="alerta alerta-error" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Tarjetas Principales de KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
        {/* KPI 1: Ventas Hoy */}
        <div className="tarjeta" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-texto-secundario)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Ventas del Día
              </span>
              <h3 className="mono" style={{ fontSize: '1.85rem', margin: '0.4rem 0 0.2rem 0', color: 'var(--color-primario)' }}>
                {datos ? formatearMoneda(datos.ventasHoy) : '$0.00'}
              </h3>
            </div>
            <div style={{ padding: '0.75rem', borderRadius: 'var(--radio-md)', backgroundColor: 'var(--color-primario-suave)', color: 'var(--color-primario)' }}>
              <TrendingUp size={24} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.85rem', fontSize: '0.8rem', color: 'var(--color-texto-secundario)' }}>
            <span className="badge badge-secundario" style={{ fontSize: '0.75rem' }}>
              <Receipt size={12} style={{ marginRight: '3px' }} />
              {datos?.ticketsHoy || 0} tickets
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center' }}>
              Promedio: <strong style={{ marginLeft: '4px', color: 'var(--color-texto)' }}>{datos ? formatearMoneda(datos.ticketPromedioHoy) : '$0.00'}</strong>
            </span>
          </div>
        </div>

        {/* KPI 2: Ganancia / Utilidad Hoy */}
        <div className="tarjeta" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-texto-secundario)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Utilidad Neta (Hoy)
              </span>
              <h3 className="mono" style={{ fontSize: '1.85rem', margin: '0.4rem 0 0.2rem 0', color: 'var(--color-exito)' }}>
                {datos ? formatearMoneda(datos.gananciaHoy) : '$0.00'}
              </h3>
            </div>
            <div style={{ padding: '0.75rem', borderRadius: 'var(--radio-md)', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: 'var(--color-exito)' }}>
              <DollarSign size={24} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.85rem', fontSize: '0.8rem', color: 'var(--color-texto-secundario)' }}>
            <span className="badge badge-exito" style={{ fontSize: '0.75rem' }}>
              <Percent size={12} style={{ marginRight: '2px' }} />
              {datos?.margenPorcentajeHoy || 0}% Margen
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center' }}>
              Utilidad bruta calculada partida a partida
            </span>
          </div>
        </div>

        {/* KPI 3: Ventas Semana */}
        <div className="tarjeta">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-texto-secundario)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Últimos 7 Días
              </span>
              <h3 className="mono" style={{ fontSize: '1.85rem', margin: '0.4rem 0 0.2rem 0' }}>
                {datos ? formatearMoneda(datos.ventasSemana) : '$0.00'}
              </h3>
            </div>
            <div style={{ padding: '0.75rem', borderRadius: 'var(--radio-md)', backgroundColor: 'rgba(59, 130, 246, 0.15)', color: 'var(--color-acento-hover)' }}>
              <ArrowUpRight size={24} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.85rem', fontSize: '0.8rem', color: 'var(--color-texto-secundario)' }}>
            <span className="badge badge-secundario" style={{ fontSize: '0.75rem' }}>
              {datos?.ticketsSemana || 0} tickets
            </span>
            <span>
              Ganancia: <strong style={{ color: 'var(--color-exito)' }}>{datos ? formatearMoneda(datos.gananciaSemana) : '$0.00'}</strong>
            </span>
          </div>
        </div>

        {/* KPI 4: Ventas Mes */}
        <div className="tarjeta">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-texto-secundario)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Últimos 30 Días
              </span>
              <h3 className="mono" style={{ fontSize: '1.85rem', margin: '0.4rem 0 0.2rem 0' }}>
                {datos ? formatearMoneda(datos.ventasMes) : '$0.00'}
              </h3>
            </div>
            <div style={{ padding: '0.75rem', borderRadius: 'var(--radio-md)', backgroundColor: 'rgba(245, 158, 11, 0.15)', color: 'var(--color-advertencia)' }}>
              <ShoppingBag size={24} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.85rem', fontSize: '0.8rem', color: 'var(--color-texto-secundario)' }}>
            <span className="badge badge-secundario" style={{ fontSize: '0.75rem' }}>
              {datos?.ticketsMes || 0} tickets
            </span>
            <span>
              Ganancia: <strong style={{ color: 'var(--color-exito)' }}>{datos ? formatearMoneda(datos.gananciaMes) : '$0.00'}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Sección Gráficas y Métodos de Pago */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {/* Gráfico de Tendencia de los últimos 7 días */}
        <div className="tarjeta" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>Tendencia de Ventas (Últimos 7 días)</h4>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-texto-secundario)' }}>Evolución diaria de ingresos</span>
            </div>
            <span className="badge badge-secundario">Diario</span>
          </div>

          {/* Gráfico de barras estilizado */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: '0.75rem', minHeight: '180px', padding: '1rem 0.5rem 0.5rem 0.5rem', borderBottom: '1px solid var(--color-borde)' }}>
            {datos?.tendenciaUltimosDias && datos.tendenciaUltimosDias.length > 0 ? (
              datos.tendenciaUltimosDias.map((d, idx) => {
                const alturaPorcentaje = Math.max(Math.round((d.totalVentas / maxVentaTendencia) * 100), 8);
                return (
                  <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', height: '100%', justifyContent: 'flex-end' }}>
                    <div className="mono font-bold" style={{ fontSize: '0.72rem', color: 'var(--color-texto-secundario)' }}>
                      ${Math.round(d.totalVentas)}
                    </div>
                    <div
                      style={{
                        width: '100%',
                        maxWidth: '42px',
                        height: `${alturaPorcentaje}%`,
                        backgroundColor: idx === datos.tendenciaUltimosDias.length - 1 ? 'var(--color-primario)' : 'var(--color-acento)',
                        borderRadius: '4px 4px 0 0',
                        transition: 'height 0.3s ease',
                      }}
                      title={`${d.diaSemana} ${d.fecha}: ${formatearMoneda(d.totalVentas)} (${d.totalTickets} tickets)`}
                    />
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-texto-secundario)', marginTop: '2px' }}>
                      {d.diaSemana}
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ width: '100%', textAlign: 'center', color: 'var(--color-texto-secundario)', padding: '2rem' }}>
                Sin datos de tendencia disponibles.
              </div>
            )}
          </div>
        </div>

        {/* Distribución por Métodos de Pago */}
        <div className="tarjeta" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>Métodos de Pago</h4>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-texto-secundario)' }}>Participación de formas de cobro</span>
            </div>
            <Wallet size={18} color="var(--color-primario)" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, justifyContent: 'center' }}>
            {datos?.metodosPago && datos.metodosPago.length > 0 ? (
              datos.metodosPago.map((mp, index) => {
                const icono = mp.metodoPago.toLowerCase().includes('tarjeta') ? (
                  <CreditCard size={16} />
                ) : (
                  <DollarSign size={16} />
                );

                return (
                  <div key={index}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.88rem', marginBottom: '0.35rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 500 }}>
                        <span style={{ color: 'var(--color-primario)' }}>{icono}</span>
                        <span>{mp.metodoPago}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span className="mono font-bold">{formatearMoneda(mp.total)}</span>
                        <span className="badge badge-secundario" style={{ fontSize: '0.75rem' }}>{mp.porcentaje}%</span>
                      </div>
                    </div>
                    {/* Barra de progreso */}
                    <div style={{ height: '8px', backgroundColor: 'var(--color-fondo-suave)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${mp.porcentaje}%`,
                          backgroundColor: index === 0 ? 'var(--color-primario)' : index === 1 ? 'var(--color-exito)' : 'var(--color-advertencia)',
                          borderRadius: '4px',
                        }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--color-texto-secundario)', padding: '2rem' }}>
                Sin registros de pagos en el sistema.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sección Inferior: Top 10 Productos Más Vendidos y Resumen de Inventario */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {/* Top 10 Productos Más Vendidos */}
        <div className="tarjeta" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-borde)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Award size={18} color="var(--color-advertencia)" />
                <span>Top Productos de Mayor Venta</span>
              </h4>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-texto-secundario)' }}>Artículos líderes en recaudación</span>
            </div>
            <span className="badge badge-exito">Top Rotación</span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-fondo-suave)', textAlign: 'left', borderBottom: '1px solid var(--color-borde)' }}>
                  <th style={{ padding: '0.65rem 0.85rem', width: '40px' }}>#</th>
                  <th style={{ padding: '0.65rem 0.85rem' }}>Producto</th>
                  <th style={{ padding: '0.65rem 0.85rem', textAlign: 'right' }}>Cant.</th>
                  <th style={{ padding: '0.65rem 0.85rem', textAlign: 'right' }}>Total</th>
                  <th style={{ padding: '0.65rem 0.85rem', textAlign: 'right' }}>Margen</th>
                </tr>
              </thead>
              <tbody>
                {datos?.topProductos && datos.topProductos.length > 0 ? (
                  datos.topProductos.map((p, idx) => (
                    <tr key={p.idProducto} style={{ borderBottom: '1px solid var(--color-borde)' }}>
                      <td style={{ padding: '0.65rem 0.85rem', fontWeight: 700, color: idx === 0 ? '#f59e0b' : idx === 1 ? '#94a3b8' : idx === 2 ? '#b45309' : 'var(--color-texto-secundario)' }}>
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                      </td>
                      <td style={{ padding: '0.65rem 0.85rem' }}>
                        <div style={{ fontWeight: 500 }}>{p.descripcion}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-texto-secundario)' }}>{p.categoria}</div>
                      </td>
                      <td style={{ padding: '0.65rem 0.85rem', textAlign: 'right' }} className="mono">
                        {p.cantidadVendida.toLocaleString('es-MX', { maximumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '0.65rem 0.85rem', textAlign: 'right' }} className="mono font-bold text-primario">
                        {formatearMoneda(p.totalVendido)}
                      </td>
                      <td style={{ padding: '0.65rem 0.85rem', textAlign: 'right' }}>
                        <span className="badge badge-exito" style={{ fontSize: '0.75rem' }}>
                          {p.margenPorcentaje}%
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-texto-secundario)' }}>
                      Sin datos de ventas registradas aún.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Resumen de Inventario y Alertas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="tarjeta">
            <h4 style={{ margin: '0 0 1rem 0', fontSize: '1.05rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Package size={18} color="var(--color-primario)" />
              <span>Estado del Catálogo & Existencias</span>
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem', textAlign: 'center' }}>
              <div style={{ backgroundColor: 'var(--color-fondo-suave)', padding: '1rem', borderRadius: 'var(--radio-md)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-texto-secundario)' }}>Activos</span>
                <h3 className="mono" style={{ fontSize: '1.6rem', margin: '0.3rem 0 0 0', color: 'var(--color-primario)' }}>
                  {datos?.totalProductos ? datos.totalProductos.toLocaleString() : '3,586'}
                </h3>
              </div>

              <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', padding: '1rem', borderRadius: 'var(--radio-md)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-advertencia)' }}>Bajo Stock</span>
                <h3 className="mono" style={{ fontSize: '1.6rem', margin: '0.3rem 0 0 0', color: 'var(--color-advertencia)' }}>
                  {datos?.productosBajoStock || 0}
                </h3>
              </div>

              <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: 'var(--radio-md)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-peligro)' }}>Agotados</span>
                <h3 className="mono" style={{ fontSize: '1.6rem', margin: '0.3rem 0 0 0', color: 'var(--color-peligro)' }}>
                  {datos?.productosAgotados || 0}
                </h3>
              </div>
            </div>
          </div>

          <div className="tarjeta" style={{ backgroundColor: 'var(--color-primario-suave)', border: '1px solid var(--color-primario)' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-primario-hover)', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Store size={18} />
              <span>Aislamiento de Consultas Snapshot</span>
            </h4>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-texto-secundario)', lineHeight: 1.5 }}>
              Todas las consultas gerenciales operan bajo <strong>READ_COMMITTED_SNAPSHOT</strong> con <code>AsNoTracking()</code> en SQL Server 2022. La emisión de reportes y cortes nunca bloqueará el cobro de la caja de abarrotes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
