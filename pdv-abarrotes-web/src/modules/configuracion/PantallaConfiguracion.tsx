import React, { useState } from 'react';
import {
  Settings,
  Store,
  Sliders,
  Save,
  CheckCircle2,
  Receipt,
  DollarSign,
} from 'lucide-react';

interface ConfiguracionTienda {
  nombreTienda: string;
  rfc: string;
  direccion: string;
  telefono: string;
  correo: string;
  pieTicket: string;
  politicaDevolucion: string;
  anchoTicket: '58mm' | '80mm';
  impresionAutomatica: boolean;
  permitirVentaSinStock: boolean;
  sonidoEscaner: boolean;
  fondoCajaSugerido: number;
  diasCorteCredito: number;
}

const CONFIG_DEFAULT: ConfiguracionTienda = {
  nombreTienda: 'Abarrotes Arenas',
  rfc: 'XAXX010101000',
  direccion: 'Calle Principal #123, Cuernavaca, Morelos',
  telefono: '777 555 1234',
  correo: 'contacto@abarrotesarenas.com',
  pieTicket: '¡Gracias por su compra en Abarrotes Arenas! Vuelva pronto.',
  politicaDevolucion: 'Cambios únicamente con ticket dentro de las 24 horas posteriores.',
  anchoTicket: '80mm',
  impresionAutomatica: true,
  permitirVentaSinStock: true,
  sonidoEscaner: true,
  fondoCajaSugerido: 700.0,
  diasCorteCredito: 15,
};

export const PantallaConfiguracion: React.FC = () => {
  const [config, setConfig] = useState<ConfiguracionTienda>(() => {
    const guardada = localStorage.getItem('configuracion_pdv_arenas');
    if (guardada) {
      try {
        return { ...CONFIG_DEFAULT, ...JSON.parse(guardada) };
      } catch {
        return CONFIG_DEFAULT;
      }
    }
    return CONFIG_DEFAULT;
  });

  const [pestañaActiva, setPestañaActiva] = useState<'tienda' | 'tickets' | 'pdv'>('tienda');
  const [guardadoExito, setGuardadoExito] = useState(false);

  const guardarCambios = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('configuracion_pdv_arenas', JSON.stringify(config));
    setGuardadoExito(true);
    setTimeout(() => setGuardadoExito(false), 3500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Notificación de guardado exitoso */}
      {guardadoExito && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.85rem 1.25rem',
            borderRadius: '12px',
            backgroundColor: '#dcfce7',
            color: '#166534',
            border: '1px solid #bbf7d0',
            fontWeight: 700,
            fontSize: '0.95rem',
          }}
        >
          <CheckCircle2 size={20} />
          <span>¡Configuraciones guardadas y aplicadas correctamente en el sistema!</span>
        </div>
      )}

      {/* Cabecera del módulo */}
      <div className="tarjeta" style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: '12px', backgroundColor: '#f1f5f9', color: 'var(--color-primario)' }}>
            <Settings size={28} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800 }}>Configuración General del Negocio</h2>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-texto-secundario)' }}>
              Parámetros de la tienda, formato de tickets térmicos y políticas operativas de caja
            </span>
          </div>
        </div>

        <button onClick={guardarCambios} className="btn btn-primario" style={{ gap: '0.5rem', padding: '0.65rem 1.25rem' }}>
          <Save size={18} />
          <span>Guardar Cambios</span>
        </button>
      </div>

      {/* Pestañas de navegación */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--color-borde)', paddingBottom: '0.5rem' }}>
        <button
          className={`btn ${pestañaActiva === 'tienda' ? 'btn-primario' : 'btn-secundario'}`}
          onClick={() => setPestañaActiva('tienda')}
          style={{ gap: '0.45rem', fontSize: '0.9rem' }}
        >
          <Store size={18} />
          <span>Datos del Negocio</span>
        </button>
        <button
          className={`btn ${pestañaActiva === 'tickets' ? 'btn-primario' : 'btn-secundario'}`}
          onClick={() => setPestañaActiva('tickets')}
          style={{ gap: '0.45rem', fontSize: '0.9rem' }}
        >
          <Receipt size={18} />
          <span>Formato de Ticket Térmico</span>
        </button>
        <button
          className={`btn ${pestañaActiva === 'pdv' ? 'btn-primario' : 'btn-secundario'}`}
          onClick={() => setPestañaActiva('pdv')}
          style={{ gap: '0.45rem', fontSize: '0.9rem' }}
        >
          <Sliders size={18} />
          <span>Operación de Caja & PDV</span>
        </button>
      </div>

      {/* Formulario */}
      <form onSubmit={guardarCambios}>
        {/* Pestaña 1: Datos del Negocio */}
        {pestañaActiva === 'tienda' && (
          <div className="tarjeta" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, borderBottom: '1px solid var(--color-borde)', paddingBottom: '0.75rem' }}>
              Identidad y Datos Fiscales / Comerciales
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                  Nombre Comercial de la Tienda *
                </label>
                <input
                  type="text"
                  className="input-base"
                  style={{ width: '100%' }}
                  value={config.nombreTienda}
                  onChange={(e) => setConfig({ ...config, nombreTienda: e.target.value })}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                  RFC / Registro Fiscal
                </label>
                <input
                  type="text"
                  className="input-base"
                  style={{ width: '100%' }}
                  value={config.rfc}
                  onChange={(e) => setConfig({ ...config, rfc: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                Dirección Completa de la Sucursal *
              </label>
              <input
                type="text"
                className="input-base"
                style={{ width: '100%' }}
                value={config.direccion}
                onChange={(e) => setConfig({ ...config, direccion: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                  Teléfono / WhatsApp de Atención
                </label>
                <input
                  type="tel"
                  className="input-base"
                  style={{ width: '100%' }}
                  value={config.telefono}
                  onChange={(e) => setConfig({ ...config, telefono: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                  Correo Electrónico de la Tienda
                </label>
                <input
                  type="email"
                  className="input-base"
                  style={{ width: '100%' }}
                  value={config.correo}
                  onChange={(e) => setConfig({ ...config, correo: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}

        {/* Pestaña 2: Formato de Ticket */}
        {pestañaActiva === 'tickets' && (
          <div className="tarjeta" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, borderBottom: '1px solid var(--color-borde)', paddingBottom: '0.75rem' }}>
              Personalización de Ticket de Venta
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                  Ancho de Impresora Térmica
                </label>
                <select
                  className="input-base"
                  style={{ width: '100%' }}
                  value={config.anchoTicket}
                  onChange={(e) => setConfig({ ...config, anchoTicket: e.target.value as '58mm' | '80mm' })}
                >
                  <option value="80mm">80 mm (Estándar Punto de Venta)</option>
                  <option value="58mm">58 mm (Impresora Portátil / Mini)</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingTop: '1.5rem' }}>
                <input
                  type="checkbox"
                  id="chkImpresionAuto"
                  checked={config.impresionAutomatica}
                  onChange={(e) => setConfig({ ...config, impresionAutomatica: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="chkImpresionAuto" style={{ fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}>
                  Imprimir ticket automáticamente al confirmar cobro
                </label>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                Mensaje de Despedida (Pie de Ticket)
              </label>
              <textarea
                className="input-base"
                rows={2}
                style={{ width: '100%', resize: 'vertical' }}
                value={config.pieTicket}
                onChange={(e) => setConfig({ ...config, pieTicket: e.target.value })}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                Políticas de Cambio o Devolución
              </label>
              <textarea
                className="input-base"
                rows={2}
                style={{ width: '100%', resize: 'vertical' }}
                value={config.politicaDevolucion}
                onChange={(e) => setConfig({ ...config, politicaDevolucion: e.target.value })}
              />
            </div>
          </div>
        )}

        {/* Pestaña 3: Operación de Caja & PDV */}
        {pestañaActiva === 'pdv' && (
          <div className="tarjeta" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, borderBottom: '1px solid var(--color-borde)', paddingBottom: '0.75rem' }}>
              Políticas de Caja y Cobranza
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                  Fondo Inicial Sugerido al Abrir Turno ($ MXN)
                </label>
                <div style={{ position: 'relative' }}>
                  <DollarSign size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: '#16a34a' }} />
                  <input
                    type="number"
                    step="50"
                    min="0"
                    className="input-base"
                    style={{ paddingLeft: '32px', width: '100%', fontWeight: 700 }}
                    value={config.fondoCajaSugerido}
                    onChange={(e) => setConfig({ ...config, fondoCajaSugerido: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                  Plazo por Defecto para Crédito Comercial (Días)
                </label>
                <input
                  type="number"
                  min="1"
                  max="90"
                  className="input-base"
                  style={{ width: '100%' }}
                  value={config.diasCorteCredito}
                  onChange={(e) => setConfig({ ...config, diasCorteCredito: parseInt(e.target.value) || 15 })}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <input
                  type="checkbox"
                  id="chkSinStock"
                  checked={config.permitirVentaSinStock}
                  onChange={(e) => setConfig({ ...config, permitirVentaSinStock: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="chkSinStock" style={{ fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}>
                  Permitir venta de productos cuando no haya existencias registradas (inventario bajo cero)
                </label>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <input
                  type="checkbox"
                  id="chkBeep"
                  checked={config.sonidoEscaner}
                  onChange={(e) => setConfig({ ...config, sonidoEscaner: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="chkBeep" style={{ fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}>
                  Emitir sonido de confirmación (Beep acústico) al escanear código de barras o cobrar
                </label>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
          <button type="submit" className="btn btn-primario" style={{ gap: '0.5rem', padding: '0.75rem 1.75rem', fontSize: '1rem' }}>
            <Save size={20} />
            <span>Guardar Todas las Configuraciones</span>
          </button>
        </div>
      </form>
    </div>
  );
};
