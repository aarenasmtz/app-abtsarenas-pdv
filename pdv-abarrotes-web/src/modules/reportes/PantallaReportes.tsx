import React, { useState, useEffect, useCallback } from 'react';
import { 
  BarChart3, 
  Search, 
  RefreshCw, 
  AlertTriangle, 
  Receipt, 
  Printer, 
  Download, 
  PieChart
} from 'lucide-react';
import { servicioReportes } from './servicioReportes';
import { servicioCaja } from '../caja/servicioCaja';
import type { 
  ReporteVentaItemDto, 
  ResumenReporteVentasDto, 
  ReporteUtilidadItemDto 
} from './tiposReportes';
import type { CorteCajaDto } from '../caja/tiposCaja';
import { TablaPaginada } from '../../components/comun/TablaPaginada';
import type { ResultadoPaginado } from '../../types/comun';
import { Calendar, UserCheck } from 'lucide-react';

export const PantallaReportes: React.FC = () => {
  const [pestanaActiva, setPestanaActiva] = useState<'ventas' | 'cortes_dia' | 'utilidades'>('ventas');
  const [cortes, setCortes] = useState<CorteCajaDto[]>([]);

  // Filtros de fecha y búsqueda
  const [fechaInicio, setFechaInicio] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().substring(0, 10);
  });
  const [fechaFin, setFechaFin] = useState<string>(() => new Date().toISOString().substring(0, 10));
  const [terminoBusqueda, setTerminoBusqueda] = useState<string>('');
  const [filtroCanceladas, setFiltroCanceladas] = useState<string>('todas');

  // Paginación de ventas
  const [paginaActual, setPaginaActual] = useState<number>(1);
  const [registrosPorPagina, setRegistrosPorPagina] = useState<25 | 50 | 100>(25);
  const [ventasPaginadas, setVentasPaginadas] = useState<ResultadoPaginado<ReporteVentaItemDto>>({
    elementos: [],
    totalRegistros: 0,
    paginaActual: 1,
    registrosPorPagina: 25,
    totalPaginas: 0,
    tienePaginaAnterior: false,
    tienePaginaSiguiente: false,
  });

  // Resumen del periodo
  const [resumenVentas, setResumenVentas] = useState<ResumenReporteVentasDto | null>(null);

  // Reporte de utilidades
  const [utilidades, setUtilidades] = useState<ReporteUtilidadItemDto[]>([]);

  // Estados de carga
  const [cargando, setCargando] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar datos de la pestaña de ventas
  const cargarVentas = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const fIni = fechaInicio ? `${fechaInicio}T00:00:00` : undefined;
      const fFin = fechaFin ? `${fechaFin}T23:59:59` : undefined;
      const soloCanc = filtroCanceladas === 'canceladas' ? true : filtroCanceladas === 'activas' ? false : undefined;

      const [paged, summary] = await Promise.all([
        servicioReportes.obtenerReporteVentasPaginado({
          pagina: paginaActual,
          registrosPorPagina,
          fechaInicio: fIni,
          fechaFin: fFin,
          soloCanceladas: soloCanc,
          terminoBusqueda: terminoBusqueda.trim() || undefined,
        }),
        servicioReportes.obtenerResumenVentas({
          pagina: 1,
          registrosPorPagina: 25,
          fechaInicio: fIni,
          fechaFin: fFin,
          soloCanceladas: soloCanc,
          terminoBusqueda: terminoBusqueda.trim() || undefined,
        }),
      ]);

      setVentasPaginadas(paged);
      setResumenVentas(summary);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al consultar reporte de ventas.';
      setError(msg);
    } finally {
      setCargando(false);
    }
  }, [paginaActual, registrosPorPagina, fechaInicio, fechaFin, filtroCanceladas, terminoBusqueda]);

  // Cargar datos de utilidades
  const cargarUtilidades = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const fIni = fechaInicio ? `${fechaInicio}T00:00:00` : undefined;
      const fFin = fechaFin ? `${fechaFin}T23:59:59` : undefined;
      const items = await servicioReportes.obtenerReporteUtilidades(fIni, fFin, 50);
      setUtilidades(items);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al consultar reporte de utilidades.';
      setError(msg);
    } finally {
      setCargando(false);
    }
  }, [fechaInicio, fechaFin]);

  const cargarCortes = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const resp = await servicioCaja.obtenerHistorialCortes();
      if (resp.exito && resp.datos) {
        setCortes(resp.datos);
      }
    } catch {
      // Silencioso
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    if (pestanaActiva === 'ventas') {
      cargarVentas();
    } else if (pestanaActiva === 'cortes_dia') {
      cargarCortes();
      cargarVentas();
    } else {
      cargarUtilidades();
    }
  }, [pestanaActiva, cargarVentas, cargarCortes, cargarUtilidades]);


  // Atajos rápidos de fecha
  const aplicarRangoRapido = (opcion: 'hoy' | 'ayer' | 'semana' | 'mes') => {
    const hoy = new Date();
    const formato = (f: Date) => f.toISOString().substring(0, 10);

    if (opcion === 'hoy') {
      const f = formato(hoy);
      setFechaInicio(f);
      setFechaFin(f);
    } else if (opcion === 'ayer') {
      const ayer = new Date(hoy);
      ayer.setDate(ayer.getDate() - 1);
      const f = formato(ayer);
      setFechaInicio(f);
      setFechaFin(f);
    } else if (opcion === 'semana') {
      const hace7 = new Date(hoy);
      hace7.setDate(hace7.getDate() - 7);
      setFechaInicio(formato(hace7));
      setFechaFin(formato(hoy));
    } else if (opcion === 'mes') {
      const hace30 = new Date(hoy);
      hace30.setDate(hace30.getDate() - 30);
      setFechaInicio(formato(hace30));
      setFechaFin(formato(hoy));
    }
    setPaginaActual(1);
  };

  const formatearMoneda = (val: number) => {
    return `$${val.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatearFechaHora = (fechaStr: string) => {
    try {
      const f = new Date(fechaStr);
      return f.toLocaleString('es-MX', {
        dateStyle: 'short',
        timeStyle: 'short',
      });
    } catch {
      return fechaStr;
    }
  };

  // Exportar a CSV simple
  const exportarCsv = () => {
    if (pestanaActiva === 'ventas') {
      if (ventasPaginadas.elementos.length === 0) return;
      const cabeceras = ['Folio,Fecha,Cajero,Articulos,MetodosPago,Total,Ganancia,Margen%,Estatus'];
      const filas = ventasPaginadas.elementos.map(v => 
        `"${v.folioVenta}","${v.fechaVenta}","${v.cajero}",${v.numeroArticulos},"${v.metodosPago}",${v.total},${v.ganancia},${v.margenPorcentaje},"${v.estatus}"`
      );
      const blob = new Blob([[...cabeceras, ...filas].join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `reporte_ventas_${fechaInicio}_al_${fechaFin}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      if (utilidades.length === 0) return;
      const cabeceras = ['Codigo,Producto,Categoria,CantidadVendida,CostoTotal,VentaTotal,UtilidadBruta,Margen%'];
      const filas = utilidades.map(u => 
        `"${u.codigoBarras}","${u.descripcion}","${u.categoria}",${u.cantidadVendida},${u.costoTotal},${u.ventaTotal},${u.utilidadBruta},${u.margenPorcentaje}`
      );
      const blob = new Blob([[...cabeceras, ...filas].join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `reporte_utilidades_${fechaInicio}_al_${fechaFin}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const columnasVentas = [
    {
      clave: 'folioVenta',
      titulo: 'Folio',
      renderizar: (v: ReporteVentaItemDto) => (
        <span className="mono font-bold" style={{ color: 'var(--color-primario)' }}>
          #{v.folioVenta}
        </span>
      ),
    },
    {
      clave: 'fechaVenta',
      titulo: 'Fecha y Hora',
      renderizar: (v: ReporteVentaItemDto) => (
        <div style={{ fontSize: '0.85rem' }}>{formatearFechaHora(v.fechaVenta)}</div>
      ),
    },
    {
      clave: 'cajero',
      titulo: 'Cajero / Usuario',
      renderizar: (v: ReporteVentaItemDto) => (
        <span style={{ fontSize: '0.88rem' }}>{v.cajero}</span>
      ),
    },
    {
      clave: 'metodosPago',
      titulo: 'Método de Pago',
      renderizar: (v: ReporteVentaItemDto) => (
        <span className="badge badge-secundario" style={{ fontSize: '0.75rem' }}>
          {v.metodosPago || 'Efectivo'}
        </span>
      ),
    },
    {
      clave: 'numeroArticulos',
      titulo: 'Artículos',
      renderizar: (v: ReporteVentaItemDto) => (
        <span className="mono">{v.numeroArticulos.toLocaleString('es-MX', { maximumFractionDigits: 2 })}</span>
      ),
    },
    {
      clave: 'total',
      titulo: 'Total Vendido',
      renderizar: (v: ReporteVentaItemDto) => (
        <span className="mono font-bold" style={{ fontSize: '0.95rem' }}>
          {formatearMoneda(v.total)}
        </span>
      ),
    },
    {
      clave: 'ganancia',
      titulo: 'Utilidad Neta',
      renderizar: (v: ReporteVentaItemDto) => (
        <span className="mono font-bold" style={{ color: 'var(--color-exito)' }}>
          {formatearMoneda(v.ganancia)}
        </span>
      ),
    },
    {
      clave: 'margenPorcentaje',
      titulo: 'Margen',
      renderizar: (v: ReporteVentaItemDto) => (
        <span className="badge badge-exito" style={{ fontSize: '0.75rem' }}>
          {v.margenPorcentaje}%
        </span>
      ),
    },
    {
      clave: 'estatus',
      titulo: 'Estado',
      renderizar: (v: ReporteVentaItemDto) => (
        <span className={`badge ${v.esCancelada ? 'badge-peligro' : 'badge-exito'}`}>
          {v.estatus}
        </span>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Cabecera */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <BarChart3 size={26} color="var(--color-primario)" />
            <span>Reportes Gerenciales y Rentabilidad</span>
          </h2>
          <p style={{ margin: '0.25rem 0 0 0', color: 'var(--color-texto-secundario)', fontSize: '0.9rem' }}>
            Auditoría de tickets emitidos, utilidades netas centavo a centavo y análisis de rotación de productos.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secundario" onClick={() => window.print()} title="Imprimir vista">
            <Printer size={16} />
            <span>Imprimir</span>
          </button>
          <button className="btn btn-secundario" onClick={exportarCsv} title="Descargar como CSV">
            <Download size={16} />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* Selector de Pestañas */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--color-borde)', paddingBottom: '0.5rem' }}>
        <button
          className={`btn ${pestanaActiva === 'ventas' ? 'btn-primario' : 'btn-secundario'}`}
          onClick={() => setPestanaActiva('ventas')}
          style={{ gap: '0.4rem' }}
        >
          <Receipt size={16} />
          <span>Historial de Ventas y Tickets</span>
        </button>

        <button
          className={`btn ${pestanaActiva === 'cortes_dia' ? 'btn-primario' : 'btn-secundario'}`}
          onClick={() => setPestanaActiva('cortes_dia')}
          style={{ gap: '0.4rem' }}
        >
          <Calendar size={16} />
          <span>Ventas por Día & Cortes de Cajero</span>
        </button>

        <button
          className={`btn ${pestanaActiva === 'utilidades' ? 'btn-primario' : 'btn-secundario'}`}
          onClick={() => setPestanaActiva('utilidades')}
          style={{ gap: '0.4rem' }}
        >
          <PieChart size={16} />
          <span>Rentabilidad por Producto</span>
        </button>
      </div>

      {error && (
        <div className="alerta alerta-error" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Barra de Filtros de Fechas y Rango */}
      <div className="tarjeta" style={{ padding: '1rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Accesos rápidos de rango */}
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
            <button className="btn btn-secundario" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }} onClick={() => aplicarRangoRapido('hoy')}>Hoy</button>
            <button className="btn btn-secundario" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }} onClick={() => aplicarRangoRapido('ayer')}>Ayer</button>
            <button className="btn btn-secundario" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }} onClick={() => aplicarRangoRapido('semana')}>Últimos 7 días</button>
            <button className="btn btn-secundario" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }} onClick={() => aplicarRangoRapido('mes')}>Últimos 30 días</button>
          </div>

          {/* Selectores de Fechas Personalizadas */}
          <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="filtro-fecha-grupo">
              <Calendar size={15} style={{ color: '#2563eb' }} />
              <label>Desde:</label>
              <input
                type="date"
                className="filtro-fecha-input"
                value={fechaInicio}
                onChange={(e) => {
                  setFechaInicio(e.target.value);
                  setPaginaActual(1);
                }}
              />
            </div>

            <div className="filtro-fecha-grupo">
              <Calendar size={15} style={{ color: '#2563eb' }} />
              <label>Hasta:</label>
              <input
                type="date"
                className="filtro-fecha-input"
                value={fechaFin}
                onChange={(e) => {
                  setFechaFin(e.target.value);
                  setPaginaActual(1);
                }}
              />
            </div>

            {pestanaActiva === 'ventas' && (
              <>
                <select
                  className="input-formulario"
                  style={{ width: 'auto', padding: '0.45rem 0.65rem' }}
                  value={filtroCanceladas}
                  onChange={(e) => {
                    setFiltroCanceladas(e.target.value);
                    setPaginaActual(1);
                  }}
                >
                  <option value="todas">Todas las ventas</option>
                  <option value="activas">Solo completadas</option>
                  <option value="canceladas">Solo canceladas</option>
                </select>

                <div style={{ position: 'relative' }}>
                  <Search size={14} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-texto-secundario)' }} />
                  <input
                    type="text"
                    className="input-formulario"
                    placeholder="Folio o cajero..."
                    style={{ paddingLeft: '1.8rem', paddingRight: '0.65rem', paddingBlock: '0.45rem', width: '150px' }}
                    value={terminoBusqueda}
                    onChange={(e) => {
                      setTerminoBusqueda(e.target.value);
                      setPaginaActual(1);
                    }}
                  />
                </div>
              </>
            )}

            <button
              className="btn btn-secundario"
              onClick={pestanaActiva === 'ventas' ? cargarVentas : cargarUtilidades}
              title="Recargar"
              style={{ padding: '0.45rem 0.65rem' }}
            >
              <RefreshCw size={14} className={cargando ? 'animacion-rotar' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* Contenido Pestaña 1: Ventas */}
      {pestanaActiva === 'ventas' && (
        <>
          {/* Tarjetas de Resumen Global del Periodo */}
          {resumenVentas && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div className="tarjeta" style={{ padding: '1rem' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--color-texto-secundario)' }}>Total Facturado</span>
                <h3 className="mono" style={{ fontSize: '1.5rem', margin: '0.3rem 0 0 0', color: 'var(--color-primario)' }}>
                  {formatearMoneda(resumenVentas.totalVentas)}
                </h3>
              </div>

              <div className="tarjeta" style={{ padding: '1rem' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--color-texto-secundario)' }}>Utilidad Neta</span>
                <h3 className="mono" style={{ fontSize: '1.5rem', margin: '0.3rem 0 0 0', color: 'var(--color-exito)' }}>
                  {formatearMoneda(resumenVentas.totalGanancia)}
                </h3>
              </div>

              <div className="tarjeta" style={{ padding: '1rem' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--color-texto-secundario)' }}>Margen Promedio</span>
                <h3 className="mono" style={{ fontSize: '1.5rem', margin: '0.3rem 0 0 0', color: 'var(--color-advertencia)' }}>
                  {resumenVentas.margenPromedioPorcentaje}%
                </h3>
              </div>

              <div className="tarjeta" style={{ padding: '1rem' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--color-texto-secundario)' }}>Tickets Emitidos</span>
                <h3 className="mono" style={{ fontSize: '1.5rem', margin: '0.3rem 0 0 0' }}>
                  {resumenVentas.totalTickets.toLocaleString()}
                </h3>
              </div>

              <div className="tarjeta" style={{ padding: '1rem' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--color-texto-secundario)' }}>Ticket Promedio</span>
                <h3 className="mono" style={{ fontSize: '1.5rem', margin: '0.3rem 0 0 0' }}>
                  {formatearMoneda(resumenVentas.ticketPromedio)}
                </h3>
              </div>

              {resumenVentas.ticketsCancelados > 0 && (
                <div className="tarjeta" style={{ padding: '1rem', borderLeft: '4px solid var(--color-peligro)' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--color-peligro)' }}>Cancelaciones</span>
                  <h3 className="mono" style={{ fontSize: '1.5rem', margin: '0.3rem 0 0 0', color: 'var(--color-peligro)' }}>
                    {resumenVentas.ticketsCancelados} ({formatearMoneda(resumenVentas.montoCancelado)})
                  </h3>
                </div>
              )}
            </div>
          )}

          {/* Tabla Paginada de Ventas */}
          <div className="tarjeta" style={{ padding: 0, overflow: 'hidden' }}>
            <TablaPaginada
              columnas={columnasVentas}
              resultado={ventasPaginadas}
              cargando={cargando}
              onCambiarPagina={(p) => setPaginaActual(p)}
              onCambiarRegistrosPorPagina={(r) => {
                setRegistrosPorPagina(r);
                setPaginaActual(1);
              }}
            />
          </div>
        </>
      )}

      {/* Contenido Pestaña: Ventas por Día & Cortes de Cajero (Arqueos) */}
      {pestanaActiva === 'cortes_dia' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Banner de explicación amigable para control familiar */}
          <div
            style={{
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '12px',
              padding: '1rem 1.25rem',
              display: 'flex',
              gap: '1rem',
              alignItems: 'center',
            }}
          >
            <div style={{ padding: '0.5rem', borderRadius: '10px', backgroundColor: '#dcfce7', color: '#16a34a' }}>
              <UserCheck size={26} />
            </div>
            <div>
              <h4 style={{ margin: 0, color: '#166534', fontSize: '1.05rem', fontWeight: 700 }}>
                Control Diario de Ventas por Cajero y Arqueos de Caja
              </h4>
              <p style={{ margin: '0.2rem 0 0 0', color: '#15803d', fontSize: '0.85rem' }}>
                Aquí puedes consultar turno por turno cuánto vendió cada cajero, con cuánto fondo arrancó, cuánto dinero en efectivo debía haber en el cajón y si hubo faltante o sobrante al hacer el corte.
              </p>
            </div>
          </div>

          {/* Tarjetas de Resumen del Periodo */}
          {resumenVentas && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div className="tarjeta" style={{ padding: '1rem' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--color-texto-secundario)', fontWeight: 600 }}>Total Vendido en el Periodo</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primario)', marginTop: '0.25rem' }}>
                  {formatearMoneda(resumenVentas.totalVentas)}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-texto-secundario)' }}>{resumenVentas.totalTickets} tickets generados</span>
              </div>

              <div className="tarjeta" style={{ padding: '1rem' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--color-texto-secundario)', fontWeight: 600 }}>Ingresos en Efectivo</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#16a34a', marginTop: '0.25rem' }}>
                  {formatearMoneda(resumenVentas.desgloseMetodosPago?.find(m => m.metodoPago?.toLowerCase().includes('efectivo'))?.total ?? resumenVentas.desgloseMetodosPago?.find(m => m.metodoPago?.toLowerCase().includes('efectivo'))?.montoTotal ?? resumenVentas.totalVentas)}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-texto-secundario)' }}>Dinero cobrado en caja</span>
              </div>

              <div className="tarjeta" style={{ padding: '1rem' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--color-texto-secundario)', fontWeight: 600 }}>Ventas con Tarjeta</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0284c7', marginTop: '0.25rem' }}>
                  {formatearMoneda(resumenVentas.desgloseMetodosPago?.find(m => m.metodoPago?.toLowerCase().includes('tarjeta'))?.total ?? resumenVentas.desgloseMetodosPago?.find(m => m.metodoPago?.toLowerCase().includes('tarjeta'))?.montoTotal ?? 0)}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-texto-secundario)' }}>Terminal bancaria</span>
              </div>

              <div className="tarjeta" style={{ padding: '1rem' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--color-texto-secundario)', fontWeight: 600 }}>Cortes Realizados</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.25rem' }}>
                  {cortes.length}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-texto-secundario)' }}>Turnos auditados</span>
              </div>
            </div>
          )}

          {/* Tabla de Cortes de Cajero */}
          <div className="tarjeta" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-borde)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Historial de Cortes de Turno y Arqueos Físicos</h4>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-texto-secundario)' }}>
                  Detalle de dinero contado vs dinero en sistema para cada cajero
                </span>
              </div>
              <button className="btn btn-secundario" style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', gap: '0.35rem' }} onClick={cargarCortes}>
                <RefreshCw size={14} className={cargando ? 'animacion-giratoria' : ''} />
                <span>Actualizar</span>
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--color-fondo-suave)', textAlign: 'left', borderBottom: '1px solid var(--color-borde)' }}>
                    <th style={{ padding: '0.75rem 0.85rem' }}>Turno #</th>
                    <th style={{ padding: '0.75rem 0.85rem' }}>Fecha y Hora</th>
                    <th style={{ padding: '0.75rem 0.85rem' }}>Cajero Responsable</th>
                    <th style={{ padding: '0.75rem 0.85rem' }}>Terminal</th>
                    <th style={{ padding: '0.75rem 0.85rem', textAlign: 'right' }}>Fondo Inicial</th>
                    <th style={{ padding: '0.75rem 0.85rem', textAlign: 'right' }}>Ventas del Turno</th>
                    <th style={{ padding: '0.75rem 0.85rem', textAlign: 'right' }}>Efectivo Sistema</th>
                    <th style={{ padding: '0.75rem 0.85rem', textAlign: 'right' }}>Efectivo Contado</th>
                    <th style={{ padding: '0.75rem 0.85rem', textAlign: 'center' }}>Diferencia</th>
                    <th style={{ padding: '0.75rem 0.85rem', textAlign: 'center' }}>Tipo</th>
                  </tr>
                </thead>
                <tbody>
                  {cortes.length > 0 ? (
                    cortes.map((c) => (
                      <tr key={c.idCorteCaja} style={{ borderBottom: '1px solid var(--color-borde)' }}>
                        <td style={{ padding: '0.75rem 0.85rem', fontWeight: 700 }} className="mono">
                          #{c.idTurnoCaja}
                        </td>
                        <td style={{ padding: '0.75rem 0.85rem', fontSize: '0.82rem', color: 'var(--color-texto-secundario)' }}>
                          {new Date(c.fechaHora || c.fechaCorte || new Date()).toLocaleString('es-MX', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </td>
                        <td style={{ padding: '0.75rem 0.85rem', fontWeight: 600 }}>
                          {c.nombreUsuario}
                        </td>
                        <td style={{ padding: '0.75rem 0.85rem' }}>
                          <span className="badge badge-secundario" style={{ fontSize: '0.75rem' }}>
                            {c.nombreCaja}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 0.85rem', textAlign: 'right' }} className="mono">
                          ${(c.montoInicial ?? 0).toFixed(2)}
                        </td>
                        <td style={{ padding: '0.75rem 0.85rem', textAlign: 'right', fontWeight: 700 }} className="mono">
                          ${(c.totalVentasEfectivo ?? c.ventasEfectivo ?? 0).toFixed(2)}
                        </td>
                        <td style={{ padding: '0.75rem 0.85rem', textAlign: 'right' }} className="mono">
                          ${(c.totalEfectivoEsperado ?? c.totalEsperado ?? 0).toFixed(2)}
                        </td>
                        <td style={{ padding: '0.75rem 0.85rem', textAlign: 'right', fontWeight: 700, color: 'var(--color-primario)' }} className="mono">
                          ${(c.montoFinalReal ?? c.totalContado ?? 0).toFixed(2)}
                        </td>
                        <td style={{ padding: '0.75rem 0.85rem', textAlign: 'center' }}>
                          {Math.abs(c.diferencia) < 0.01 ? (
                            <span className="badge badge-exito" style={{ fontSize: '0.78rem' }}>
                              Exacto ($0.00)
                            </span>
                          ) : c.diferencia < 0 ? (
                            <span className="badge badge-peligro" style={{ fontSize: '0.78rem', fontWeight: 800 }}>
                              Faltó -${Math.abs(c.diferencia).toFixed(2)}
                            </span>
                          ) : (
                            <span className="badge badge-primario" style={{ fontSize: '0.78rem', fontWeight: 800 }}>
                              Sobró +${c.diferencia.toFixed(2)}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '0.75rem 0.85rem', textAlign: 'center' }}>
                          <span className={`badge ${c.tipoCorte === 'Z' ? 'badge-advertencia' : 'badge-secundario'}`} style={{ fontSize: '0.75rem' }}>
                            {c.tipoCorte === 'Z' ? 'Corte Z (Cierre)' : 'Corte X (Parcial)'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={10} style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-texto-secundario)' }}>
                        No hay registros de cortes de caja en el historial reciente.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}


      {/* Contenido Pestaña 2: Rentabilidad por Producto */}
      {pestanaActiva === 'utilidades' && (
        <div className="tarjeta" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-borde)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>Desglose de Costo vs Venta vs Utilidad</h4>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-texto-secundario)' }}>Top 50 artículos ordenados por mayor utilidad neta generada</span>
            </div>
            <span className="badge badge-secundario">{utilidades.length} artículos</span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-fondo-suave)', textAlign: 'left', borderBottom: '1px solid var(--color-borde)' }}>
                  <th style={{ padding: '0.65rem 0.85rem' }}>Código</th>
                  <th style={{ padding: '0.65rem 0.85rem' }}>Descripción del Producto</th>
                  <th style={{ padding: '0.65rem 0.85rem' }}>Categoría</th>
                  <th style={{ padding: '0.65rem 0.85rem', textAlign: 'right' }}>Unidades</th>
                  <th style={{ padding: '0.65rem 0.85rem', textAlign: 'right' }}>Costo Total</th>
                  <th style={{ padding: '0.65rem 0.85rem', textAlign: 'right' }}>Venta Total</th>
                  <th style={{ padding: '0.65rem 0.85rem', textAlign: 'right' }}>Utilidad Neta</th>
                  <th style={{ padding: '0.65rem 0.85rem', textAlign: 'right' }}>Margen (%)</th>
                </tr>
              </thead>
              <tbody>
                {utilidades.length > 0 ? (
                  utilidades.map((item, idx) => (
                    <tr key={item.idProducto || idx} style={{ borderBottom: '1px solid var(--color-borde)' }}>
                      <td style={{ padding: '0.65rem 0.85rem' }} className="mono">{item.codigoBarras || '-'}</td>
                      <td style={{ padding: '0.65rem 0.85rem', fontWeight: 500 }}>{item.descripcion}</td>
                      <td style={{ padding: '0.65rem 0.85rem', color: 'var(--color-texto-secundario)' }}>{item.categoria}</td>
                      <td style={{ padding: '0.65rem 0.85rem', textAlign: 'right' }} className="mono">
                        {item.cantidadVendida.toLocaleString('es-MX', { maximumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '0.65rem 0.85rem', textAlign: 'right' }} className="mono">
                        {formatearMoneda(item.costoTotal)}
                      </td>
                      <td style={{ padding: '0.65rem 0.85rem', textAlign: 'right' }} className="mono font-bold">
                        {formatearMoneda(item.ventaTotal)}
                      </td>
                      <td style={{ padding: '0.65rem 0.85rem', textAlign: 'right', color: 'var(--color-exito)' }} className="mono font-bold">
                        {formatearMoneda(item.utilidadBruta)}
                      </td>
                      <td style={{ padding: '0.65rem 0.85rem', textAlign: 'right' }}>
                        <span className="badge badge-exito" style={{ fontSize: '0.75rem' }}>
                          {item.margenPorcentaje}%
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--color-texto-secundario)' }}>
                      No hay ventas registradas en el rango de fechas seleccionado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
