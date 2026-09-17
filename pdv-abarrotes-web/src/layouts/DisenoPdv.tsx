import React, { useState, useRef, useEffect } from 'react';
import { 
  Barcode, 
  Trash2, 
  CreditCard, 
  Clock, 
  ArrowLeft, 
  Search, 
  Plus, 
  Minus
} from 'lucide-react';
import { useStoreCarritoPdv } from '../modules/pdv/storeCarrito';
import { useEscanerCodigoBarras } from '../hooks/useEscanerCodigoBarras';

interface PropiedadesDisenoPdv {
  onVolverAAdmin: () => void;
  servidorEnLinea: boolean;
}

export const DisenoPdv: React.FC<PropiedadesDisenoPdv> = ({
  onVolverAAdmin,
  servidorEnLinea
}) => {
  const [codigoInput, setCodigoInput] = useState('');
  const [mensajeNotificacion, setMensajeNotificacion] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    articulos,
    nombreCliente,
    agregarArticulo,
    actualizarCantidad,
    eliminarArticulo,
    limpiarCarrito,
    obtenerTotal,
    obtenerCantidadArticulos,
  } = useStoreCarritoPdv();

  // Escáner HID global
  useEscanerCodigoBarras({
    onCodigoEscaneado: (codigo) => {
      procesarCodigoBarras(codigo);
    },
  });

  // Mantener foco en el input del escáner
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const procesarCodigoBarras = (codigo: string) => {
    if (!codigo) return;
    
    // Simulación de lectura rápida o consulta
    agregarArticulo({
      idProducto: Math.floor(Math.random() * 1000) + 1,
      codigoBarras: codigo,
      descripcion: `Artículo Código ${codigo}`,
      cantidad: 1,
      precioUnitario: 25.00,
      permiteVentaFraccionada: false,
      existenciaDisponible: 50,
    });

    setMensajeNotificacion(`Producto agregado: ${codigo}`);
    setTimeout(() => setMensajeNotificacion(null), 2500);
    setCodigoInput('');
  };

  const manejarEnvioManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (codigoInput.trim()) {
      procesarCodigoBarras(codigoInput.trim());
    }
  };

  const totalVenta = obtenerTotal();
  const cantidadArticulos = obtenerCantidadArticulos();

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#090d16' }}>
      {/* Barra de estado superior del cajero */}
      <header style={{ 
        height: '56px', 
        backgroundColor: '#0f172a', 
        borderBottom: '1px solid var(--color-borde)',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        padding: '0 1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            className="btn btn-secundario" 
            style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
            onClick={onVolverAAdmin}
          >
            <ArrowLeft size={16} />
            <span>Volver a Administración</span>
          </button>
          
          <h1 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>PUNTO DE VENTA</span>
            <span className="badge badge-exito" style={{ fontSize: '0.75rem' }}>Caja 1 - Turno Abierto</span>
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--color-texto-secundario)' }}>
            <span>Cliente:</span>
            <strong style={{ color: '#ffffff' }}>{nombreCliente}</strong>
          </div>

          <span className={`badge ${servidorEnLinea ? 'badge-exito' : 'badge-peligro'}`}>
            {servidorEnLinea ? 'SQL Conectado' : 'Sin Conexión'}
          </span>
        </div>
      </header>

      {/* Notificación rápida flotante */}
      {mensajeNotificacion && (
        <div style={{
          backgroundColor: 'var(--color-primario)',
          color: 'white',
          padding: '0.5rem 1rem',
          textAlign: 'center',
          fontWeight: 600,
          fontSize: '0.9rem'
        }}>
          {mensajeNotificacion}
        </div>
      )}

      {/* Contenedor principal de venta */}
      <div style={{ flex: 1, padding: '1rem', overflow: 'hidden' }}>
        <div className="modo-pdv">
          {/* Panel Izquierdo: Escáner y lista de partidas */}
          <div className="pdv-panel-venta">
            <div className="pdv-buscador-barra">
              <form onSubmit={manejarEnvioManual} style={{ flex: 1, display: 'flex', gap: '0.75rem' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Barcode 
                    size={22} 
                    style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--color-texto-secundario)' }} 
                  />
                  <input
                    ref={inputRef}
                    type="text"
                    className="input-escaner input-escaner-permitido"
                    style={{ paddingLeft: '44px', width: '100%' }}
                    placeholder="Escanea el código de barras o escribe para buscar..."
                    value={codigoInput}
                    onChange={(e) => setCodigoInput(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn btn-primario" style={{ padding: '0 1.5rem' }}>
                  <Search size={18} />
                  <span>Agregar</span>
                </button>
              </form>
            </div>

            {/* Lista de productos en el ticket actual */}
            <div className="pdv-lista-articulos">
              {articulos.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--color-texto-secundario)' }}>
                  <Barcode size={64} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                  <h3>Listo para escanear</h3>
                  <p style={{ marginTop: '0.5rem', fontSize: '0.95rem' }}>
                    Pasa los productos por el lector de código de barras.
                  </p>
                </div>
              ) : (
                <table className="tabla-datos">
                  <thead>
                    <tr>
                      <th style={{ width: '45%' }}>Producto</th>
                      <th style={{ width: '15%', textAlign: 'center' }}>Cantidad</th>
                      <th style={{ width: '15%', textAlign: 'right' }}>Precio Unit.</th>
                      <th style={{ width: '15%', textAlign: 'right' }}>Subtotal</th>
                      <th style={{ width: '10%', textAlign: 'center' }}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {articulos.map((item) => (
                      <tr key={item.idProducto}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{item.descripcion}</div>
                          <div className="mono" style={{ fontSize: '0.8rem', color: 'var(--color-texto-secundario)' }}>
                            {item.codigoBarras}
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                            <button
                              className="btn btn-secundario"
                              style={{ padding: '0.2rem 0.4rem' }}
                              onClick={() => actualizarCantidad(item.idProducto, item.cantidad - 1)}
                            >
                              <Minus size={14} />
                            </button>
                            <span className="mono" style={{ fontWeight: 700, minWidth: '32px', textAlign: 'center' }}>
                              {item.cantidad}
                            </span>
                            <button
                              className="btn btn-secundario"
                              style={{ padding: '0.2rem 0.4rem' }}
                              onClick={() => actualizarCantidad(item.idProducto, item.cantidad + 1)}
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </td>
                        <td className="mono" style={{ textAlign: 'right', fontWeight: 500 }}>
                          ${item.precioUnitario.toFixed(2)}
                        </td>
                        <td className="mono" style={{ textAlign: 'right', fontWeight: 700, color: '#34d399' }}>
                          ${item.subtotal.toFixed(2)}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            className="btn btn-peligro"
                            style={{ padding: '0.35rem 0.5rem' }}
                            onClick={() => eliminarArticulo(item.idProducto)}
                            title="Eliminar partida"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Panel Derecho: Totales y Cobro */}
          <div className="pdv-panel-cobro">
            <div>
              <div className="total-caja-display">
                <span style={{ fontSize: '0.9rem', color: '#a7f3d0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Total a Cobrar
                </span>
                <div className="total-caja-monto">
                  ${totalVenta.toFixed(2)}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#6ee7b7', marginTop: '0.25rem' }}>
                  {cantidadArticulos} artículo(s)
                </div>
              </div>

              {/* Botones de acción de venta */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button 
                  className="btn btn-primario" 
                  style={{ padding: '1.1rem', fontSize: '1.15rem', gap: '0.75rem' }}
                  disabled={articulos.length === 0}
                >
                  <CreditCard size={22} />
                  <span>Cobrar (F12)</span>
                </button>

                <button 
                  className="btn btn-advertencia" 
                  style={{ padding: '0.85rem', fontSize: '1rem', gap: '0.6rem' }}
                  disabled={articulos.length === 0}
                >
                  <Clock size={18} />
                  <span>Poner en Espera (Ticket Pendiente)</span>
                </button>

                <button 
                  className="btn btn-secundario" 
                  style={{ padding: '0.75rem', fontSize: '0.95rem' }}
                  disabled={articulos.length === 0}
                  onClick={limpiarCarrito}
                >
                  <Trash2 size={16} />
                  <span>Cancelar Venta Actual</span>
                </button>
              </div>
            </div>

            {/* Accesos rápidos de teclado */}
            <div style={{ 
              borderTop: '1px solid var(--color-borde)', 
              paddingTop: '1rem', 
              fontSize: '0.8rem', 
              color: 'var(--color-texto-secundario)',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.5rem'
            }}>
              <div><strong>F1:</strong> Buscar Producto</div>
              <div><strong>F4:</strong> Cambiar Cliente</div>
              <div><strong>F7:</strong> Ver Pendientes</div>
              <div><strong>F12:</strong> Finalizar Cobro</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
