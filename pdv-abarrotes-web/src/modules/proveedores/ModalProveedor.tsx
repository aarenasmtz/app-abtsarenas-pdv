import React, { useState, useEffect } from 'react';
import { X, Check, Truck, AlertTriangle } from 'lucide-react';
import type { ProveedorDto, CrearProveedorDto, ActualizarProveedorDto } from './tiposProveedores';

interface PropiedadesModalProveedor {
  abierto: boolean;
  proveedorEnEdicion: ProveedorDto | null;
  onCerrar: () => void;
  onGuardar: (proveedor: CrearProveedorDto | ActualizarProveedorDto) => Promise<void>;
}

export const ModalProveedor: React.FC<PropiedadesModalProveedor> = ({
  abierto,
  proveedorEnEdicion,
  onCerrar,
  onGuardar,
}) => {
  const [nombre, setNombre] = useState('');
  const [nombreContacto, setNombreContacto] = useState('');
  const [rfc, setRfc] = useState('');
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');
  const [direccion, setDireccion] = useState('');
  const [notas, setNotas] = useState('');
  const [activo, setActivo] = useState(true);

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (proveedorEnEdicion) {
      setNombre(proveedorEnEdicion.nombre || '');
      setNombreContacto(proveedorEnEdicion.nombreContacto || '');
      setRfc(proveedorEnEdicion.rfc || '');
      setTelefono(proveedorEnEdicion.telefono || '');
      setCorreo(proveedorEnEdicion.correo || '');
      setDireccion(proveedorEnEdicion.direccion || '');
      setNotas(proveedorEnEdicion.notas || '');
      setActivo(proveedorEnEdicion.activo);
    } else {
      setNombre('');
      setNombreContacto('');
      setRfc('');
      setTelefono('');
      setCorreo('');
      setDireccion('');
      setNotas('');
      setActivo(true);
    }
    setError(null);
  }, [proveedorEnEdicion, abierto]);

  if (!abierto) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setError('El nombre comercial o razón social es obligatorio.');
      return;
    }

    setError(null);
    setGuardando(true);

    try {
      if (proveedorEnEdicion) {
        const dtoActualizar: ActualizarProveedorDto = {
          idProveedor: proveedorEnEdicion.idProveedor,
          nombre: nombre.trim(),
          nombreContacto: nombreContacto.trim() || null,
          rfc: rfc.trim().toUpperCase() || null,
          telefono: telefono.trim() || null,
          correo: correo.trim() || null,
          direccion: direccion.trim() || null,
          notas: notas.trim() || null,
          activo,
        };
        await onGuardar(dtoActualizar);
      } else {
        const dtoCrear: CrearProveedorDto = {
          nombre: nombre.trim(),
          nombreContacto: nombreContacto.trim() || null,
          rfc: rfc.trim().toUpperCase() || null,
          telefono: telefono.trim() || null,
          correo: correo.trim() || null,
          direccion: direccion.trim() || null,
          notas: notas.trim() || null,
        };
        await onGuardar(dtoCrear);
      }
      onCerrar();
    } catch (err: unknown) {
      const mensaje = err instanceof Error ? err.message : 'Error al guardar el proveedor.';
      setError(mensaje);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="modal-superposicion">
      <div className="modal-contenedor" style={{ maxWidth: '620px', width: '95%' }}>
        <div className="modal-cabecera">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ padding: '0.4rem', borderRadius: 'var(--radio-md)', backgroundColor: 'var(--color-primario-suave)', color: 'var(--color-primario)' }}>
              <Truck size={20} />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>
              {proveedorEnEdicion ? `Editar Proveedor #${proveedorEnEdicion.idProveedor}` : 'Nuevo Proveedor'}
            </h3>
          </div>
          <button className="btn-icono" onClick={onCerrar} title="Cerrar modal">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="alerta alerta-error" style={{ margin: '1rem 1.5rem 0 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="modal-cuerpo" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.25rem 1.5rem' }}>
            <div className="grupo-formulario">
              <label className="etiqueta-formulario">
                Nombre de la Empresa / Razón Social <span style={{ color: 'var(--color-peligro)' }}>*</span>
              </label>
              <input
                type="text"
                className="input-formulario"
                placeholder="Ej. Bimbo S.A. de C.V., Distribuidora Lácteos del Bajío"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                maxLength={150}
                required
                autoFocus
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              <div className="grupo-formulario">
                <label className="etiqueta-formulario">Nombre del Contacto / Vendedor</label>
                <input
                  type="text"
                  className="input-formulario"
                  placeholder="Ej. Juan Carlos Morales"
                  value={nombreContacto}
                  onChange={(e) => setNombreContacto(e.target.value)}
                  maxLength={150}
                />
              </div>

              <div className="grupo-formulario">
                <label className="etiqueta-formulario">RFC</label>
                <input
                  type="text"
                  className="input-formulario uppercase mono"
                  placeholder="Ej. BIM900101XYZ"
                  value={rfc}
                  onChange={(e) => setRfc(e.target.value)}
                  maxLength={15}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              <div className="grupo-formulario">
                <label className="etiqueta-formulario">Teléfono de Contacto</label>
                <input
                  type="tel"
                  className="input-formulario"
                  placeholder="Ej. 477 123 4567"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  maxLength={50}
                />
              </div>

              <div className="grupo-formulario">
                <label className="etiqueta-formulario">Correo Electrónico</label>
                <input
                  type="email"
                  className="input-formulario"
                  placeholder="Ej. pedidos@proveedor.com"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  maxLength={100}
                />
              </div>
            </div>

            <div className="grupo-formulario">
              <label className="etiqueta-formulario">Dirección / Sucursal de Despacho</label>
              <input
                type="text"
                className="input-formulario"
                placeholder="Ej. Blvd. Aeropuerto #1024, Col. Industrial, León, Gto."
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                maxLength={250}
              />
            </div>

            <div className="grupo-formulario">
              <label className="etiqueta-formulario">Notas u Observaciones (días de visita, condiciones de crédito)</label>
              <textarea
                className="input-formulario"
                rows={2}
                placeholder="Ej. Visita los martes a las 10:00 am. Otorga crédito a 7 días."
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                maxLength={500}
              />
            </div>

            {proveedorEnEdicion && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                <input
                  type="checkbox"
                  id="chkActivoProveedor"
                  checked={activo}
                  onChange={(e) => setActivo(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="chkActivoProveedor" style={{ cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500 }}>
                  Proveedor activo para recepción de compras y pedidos
                </label>
              </div>
            )}
          </div>

          <div className="modal-pie">
            <button type="button" className="btn btn-secundario" onClick={onCerrar} disabled={guardando}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primario" disabled={guardando}>
              <Check size={18} />
              <span>{guardando ? 'Guardando...' : proveedorEnEdicion ? 'Actualizar Proveedor' : 'Crear Proveedor'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
