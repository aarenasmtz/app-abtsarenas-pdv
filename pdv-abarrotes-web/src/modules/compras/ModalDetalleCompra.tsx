import React from 'react';
import { X, ShoppingCart, Calendar, User, Truck, Printer, FileText } from 'lucide-react';
import type { CompraDto } from './tiposCompras';

interface PropiedadesModalDetalleCompra {
  abierto: boolean;
  compra: CompraDto | null;
  onCerrar: () => void;
}

export const ModalDetalleCompra: React.FC<PropiedadesModalDetalleCompra> = ({
  abierto,
  compra,
  onCerrar,
}) => {
  if (!abierto || !compra) return null;

  const formatearFecha = (fechaStr: string) => {
    try {
      const fecha = new Date(fechaStr);
      return fecha.toLocaleString('es-MX', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return fechaStr;
    }
  };

  const formatearMoneda = (monto: number) => {
    return `$${monto.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleImprimir = () => {
    window.print();
  };

  return (
    <div className="modal-superposicion">
      <div className="modal-contenedor" style={{ maxWidth: '780px', width: '95%' }}>
        <div className="modal-cabecera">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ padding: '0.4rem', borderRadius: 'var(--radio-md)', backgroundColor: 'var(--color-primario-suave)', color: 'var(--color-primario)' }}>
              <ShoppingCart size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem' }}>
                Detalle de Compra Folio #{compra.folioCompra}
              </h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--color-texto-secundario)' }}>
                ID Sistema: #{compra.idCompra} | Estatus: {compra.estatus}
              </span>
            </div>
          </div>
          <button className="btn-icono" onClick={onCerrar} title="Cerrar modal">
            <X size={20} />
          </button>
        </div>

        <div className="modal-cuerpo" style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Tarjeta de Resumen de Cabecera */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', backgroundColor: 'var(--color-fondo-suave)', padding: '1rem', borderRadius: 'var(--radio-md)' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-texto-secundario)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Truck size={13} /> Proveedor
              </div>
              <div style={{ fontWeight: 600, marginTop: '2px' }}>{compra.nombreProveedor || 'Proveedor General'}</div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-texto-secundario)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={13} /> Fecha de Compra
              </div>
              <div style={{ fontWeight: 600, marginTop: '2px' }}>{formatearFecha(compra.fechaCompra)}</div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-texto-secundario)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <User size={13} /> Usuario Receptor
              </div>
              <div style={{ fontWeight: 600, marginTop: '2px' }}>{compra.nombreUsuario || 'Administrador'}</div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-texto-secundario)' }}>Total Compra</div>
              <div className="mono font-bold" style={{ fontSize: '1.25rem', color: 'var(--color-exito)' }}>
                {formatearMoneda(compra.totalCompra)}
              </div>
            </div>
          </div>

          {compra.observaciones && (
            <div style={{ fontSize: '0.85rem', color: 'var(--color-texto-secundario)', backgroundColor: 'var(--color-superficie)', padding: '0.6rem 0.85rem', borderRadius: 'var(--radio-sm)', borderLeft: '3px solid var(--color-primario)' }}>
              <span style={{ fontWeight: 600, color: 'var(--color-texto)' }}>Observaciones / Factura:</span> {compra.observaciones}
            </div>
          )}

          {/* Tabla de Partidas Recibidas */}
          <div>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <FileText size={16} color="var(--color-primario)" />
              <span>Partidas Recibidas en Almacén ({compra.detalles?.length || 0})</span>
            </h4>

            <div style={{ overflowX: 'auto', border: '1px solid var(--color-borde)', borderRadius: 'var(--radio-md)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--color-fondo-suave)', textAlign: 'left', borderBottom: '1px solid var(--color-borde)' }}>
                    <th style={{ padding: '0.65rem 0.85rem', width: '50px' }}>#</th>
                    <th style={{ padding: '0.65rem 0.85rem' }}>Código</th>
                    <th style={{ padding: '0.65rem 0.85rem' }}>Producto</th>
                    <th style={{ padding: '0.65rem 0.85rem', textAlign: 'right' }}>Cantidad</th>
                    <th style={{ padding: '0.65rem 0.85rem', textAlign: 'right' }}>Costo Unitario</th>
                    <th style={{ padding: '0.65rem 0.85rem', textAlign: 'right' }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {compra.detalles && compra.detalles.length > 0 ? (
                    compra.detalles.map((det, index) => (
                      <tr key={det.idDetalleCompra || index} style={{ borderBottom: '1px solid var(--color-borde)' }}>
                        <td style={{ padding: '0.65rem 0.85rem', color: 'var(--color-texto-secundario)' }}>{det.numeroRenglon || index + 1}</td>
                        <td style={{ padding: '0.65rem 0.85rem' }} className="mono">{det.codigoBarras || '-'}</td>
                        <td style={{ padding: '0.65rem 0.85rem', fontWeight: 500 }}>{det.descripcionProducto}</td>
                        <td style={{ padding: '0.65rem 0.85rem', textAlign: 'right' }} className="mono font-bold">
                          {det.cantidadRecibida.toLocaleString('es-MX', { maximumFractionDigits: 3 })}
                        </td>
                        <td style={{ padding: '0.65rem 0.85rem', textAlign: 'right' }} className="mono">
                          {formatearMoneda(det.costoUnitario)}
                        </td>
                        <td style={{ padding: '0.65rem 0.85rem', textAlign: 'right' }} className="mono font-bold text-primario">
                          {formatearMoneda(det.totalRenglon)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-texto-secundario)' }}>
                        No hay partidas asociadas.
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr style={{ backgroundColor: 'var(--color-fondo-suave)', fontWeight: 'bold' }}>
                    <td colSpan={3} style={{ padding: '0.75rem 0.85rem', textAlign: 'right' }}>Total de Compra:</td>
                    <td style={{ padding: '0.75rem 0.85rem', textAlign: 'right' }} className="mono">
                      {compra.detalles?.reduce((acc, curr) => acc + curr.cantidadRecibida, 0).toLocaleString('es-MX', { maximumFractionDigits: 3 })}
                    </td>
                    <td></td>
                    <td style={{ padding: '0.75rem 0.85rem', textAlign: 'right', fontSize: '1.05rem', color: 'var(--color-exito)' }} className="mono">
                      {formatearMoneda(compra.totalCompra)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        <div className="modal-pie">
          <button type="button" className="btn btn-secundario" onClick={handleImprimir}>
            <Printer size={16} />
            <span>Imprimir Formato</span>
          </button>
          <button type="button" className="btn btn-primario" onClick={onCerrar}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
