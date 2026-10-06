import React, { useState, useEffect } from 'react';
import { X, Sparkles, AlertCircle, Calendar, ShieldCheck, Filter } from 'lucide-react';
import { servicioPedidos } from './servicioPedidos';
import { servicioProveedores } from '../proveedores/servicioProveedores';
import type { ProveedorDto } from '../proveedores/tiposProveedores';
import type { PedidoSugeridoDto } from './tiposPedidos';

interface PropsModalGenerarPedido {
  alCerrar: () => void;
  alGenerarExitoso: (pedidoGenerado: PedidoSugeridoDto) => void;
}

export const ModalGenerarPedido: React.FC<PropsModalGenerarPedido> = ({
  alCerrar,
  alGenerarExitoso,
}) => {
  const [diasAnalisis, setDiasAnalisis] = useState<number>(14);
  const [diasCobertura, setDiasCobertura] = useState<number>(7);
  const [idProveedor, setIdProveedor] = useState<number | ''>('');
  const [soloConSugerencia, setSoloConSugerencia] = useState<boolean>(true);
  const [observaciones, setObservaciones] = useState<string>('');

  const [proveedores, setProveedores] = useState<ProveedorDto[]>([]);
  const [cargandoProveedores, setCargandoProveedores] = useState<boolean>(true);
  const [procesando, setProcesando] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cargarProveedores = async () => {
      try {
        const datos = await servicioProveedores.obtenerActivos();
        setProveedores(datos);
      } catch {
        console.warn('No se pudieron cargar proveedores para el filtro opcional.');
      } finally {
        setCargandoProveedores(false);
      }
    };
    cargarProveedores();
  }, []);

  const manejarEnvio = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setProcesando(true);

    try {
      const pedido = await servicioPedidos.generarPedido({
        idSucursal: 1,
        diasAnalisisHistorial: Number(diasAnalisis),
        diasCobertura: Number(diasCobertura),
        idProveedor: idProveedor === '' ? null : Number(idProveedor),
        soloConSugerenciaPositiva: soloConSugerencia,
        observaciones: observaciones.trim() || null,
      });

      alGenerarExitoso(pedido);
    } catch (err: unknown) {
      const mensaje = err instanceof Error ? err.message : 'Error al procesar el pedido sugerido.';
      setError(mensaje);
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="superposicion-modal">
      <div className="modal-contenedor" style={{ maxWidth: '640px', width: '90%' }}>
        {/* Cabecera */}
        <div className="modal-cabecera">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                background: 'rgba(59, 130, 246, 0.1)',
                padding: '0.5rem',
                borderRadius: '8px',
                color: 'var(--color-primario)',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Sparkles size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>
                Generar Pedido Sugerido Dominical
              </h2>
              <p
                style={{
                  fontSize: '0.825rem',
                  color: 'var(--color-texto-secundario)',
                  margin: '0.2rem 0 0 0',
                }}
              >
                Cálculo inteligente de reabastecimiento por velocidad de venta y stock de seguridad
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn-icono"
            onClick={alCerrar}
            disabled={procesando}
          >
            <X size={20} />
          </button>
        </div>

        {/* Mensaje de error */}
        {error && (
          <div
            style={{
              margin: '1rem 1.5rem 0',
              padding: '0.75rem 1rem',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid var(--color-peligro)',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'var(--color-peligro)',
              fontSize: '0.875rem',
            }}
          >
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={manejarEnvio}>
          <div className="modal-cuerpo" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.5rem' }}>
            {/* Info explicativa de la fórmula */}
            <div
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: '8px',
                padding: '0.875rem 1rem',
                fontSize: '0.85rem',
                color: 'var(--color-texto-principal)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: '#059669', marginBottom: '0.35rem' }}>
                <ShieldCheck size={18} />
                <span>Algoritmo de Rotación y Cobertura Arenas</span>
              </div>
              <p style={{ margin: 0, color: 'var(--color-texto-secundario)', lineHeight: 1.4 }}>
                Sugerido = <strong>(Venta Promedio Diaria × Días Cobertura + Stock Mínimo) − Stock Actual</strong>.
                Redondea piezas automáticamente para evitar compras fraccionadas indebidas.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {/* Días de análisis histórico */}
              <div className="grupo-formulario">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 500, fontSize: '0.875rem' }}>
                  <Calendar size={16} style={{ color: 'var(--color-primario)' }} />
                  Ventana de Ventas (Historial)
                </label>
                <select
                  className="control-formulario"
                  value={diasAnalisis}
                  onChange={(e) => setDiasAnalisis(Number(e.target.value))}
                  disabled={procesando}
                  style={{ marginTop: '0.4rem' }}
                >
                  <option value={7}>Últimos 7 días (Rotación inmediata)</option>
                  <option value={14}>Últimos 14 días (Recomendado / 2 semanas)</option>
                  <option value={21}>Últimos 21 días (3 semanas)</option>
                  <option value={28}>Últimos 28 días (Mes completo)</option>
                </select>
                <small style={{ color: 'var(--color-texto-secundario)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                  Periodo para calcular la velocidad de venta diaria
                </small>
              </div>

              {/* Días de cobertura */}
              <div className="grupo-formulario">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 500, fontSize: '0.875rem' }}>
                  <Calendar size={16} style={{ color: 'var(--color-exito)' }} />
                  Días de Cobertura (Reabastecer)
                </label>
                <select
                  className="control-formulario"
                  value={diasCobertura}
                  onChange={(e) => setDiasCobertura(Number(e.target.value))}
                  disabled={procesando}
                  style={{ marginTop: '0.4rem' }}
                >
                  <option value={3}>3 días (Fin de semana / Rápido)</option>
                  <option value={7}>7 días (Semana completa estándar)</option>
                  <option value={10}>10 días (Semana con colchón extra)</option>
                  <option value={14}>14 días (Quincena)</option>
                </select>
                <small style={{ color: 'var(--color-texto-secundario)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                  Días de venta esperada que debe cubrir el pedido
                </small>
              </div>
            </div>

            {/* Proveedor opcional */}
            <div className="grupo-formulario">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 500, fontSize: '0.875rem' }}>
                <Filter size={16} />
                Filtrar por Proveedor (Opcional)
              </label>
              <select
                className="control-formulario"
                value={idProveedor}
                onChange={(e) => setIdProveedor(e.target.value === '' ? '' : Number(e.target.value))}
                disabled={procesando || cargandoProveedores}
                style={{ marginTop: '0.4rem' }}
              >
                <option value="">Todos los Proveedores (Cálculo Global Dominical)</option>
                {proveedores.map((p) => (
                  <option key={p.idProveedor} value={p.idProveedor}>
                    {p.nombre} {p.nombreContacto ? `(${p.nombreContacto})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Checkbox solo con sugerencia positiva */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0' }}>
              <input
                type="checkbox"
                id="soloConSugerencia"
                checked={soloConSugerencia}
                onChange={(e) => setSoloConSugerencia(e.target.checked)}
                disabled={procesando}
                style={{ width: '1.1rem', height: '1.1rem', cursor: 'pointer' }}
              />
              <label htmlFor="soloConSugerencia" style={{ cursor: 'pointer', fontSize: '0.875rem', userSelect: 'none' }}>
                <strong>Solo incluir productos con necesidad de compra</strong> (omite artículos con stock suficiente)
              </label>
            </div>

            {/* Observaciones */}
            <div className="grupo-formulario">
              <label style={{ fontWeight: 500, fontSize: '0.875rem' }}>
                Observaciones o Notas
              </label>
              <input
                type="text"
                className="control-formulario"
                placeholder="Ej. Pedido semanal preventivo para inicio de quincena"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                disabled={procesando}
                maxLength={500}
                style={{ marginTop: '0.4rem' }}
              />
            </div>
          </div>

          {/* Pie de modal */}
          <div className="modal-pie" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', padding: '1rem 1.5rem' }}>
            <button
              type="button"
              className="btn btn-secundario"
              onClick={alCerrar}
              disabled={procesando}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primario"
              disabled={procesando}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              {procesando ? (
                <>
                  <div className="animacion-giratoria" style={{ width: '16px', height: '16px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%' }} />
                  <span>Calculando Pedido...</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>Calcular Sugerido Ahora</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
