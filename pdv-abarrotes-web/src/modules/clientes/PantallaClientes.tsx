import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  UserPlus,
  Search,
  DollarSign,
  CreditCard,
  Phone,
  MapPin,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Edit2,
  Receipt,
  Printer,
  X,
  BadgeCheck,
} from 'lucide-react';
import { servicioClientes } from './servicioClientes';
import type {
  ClienteDto,
  CrearClienteDto,
  ActualizarClienteDto,
  AbonoCreditoDto,
  ResultadoAbonoDto,
} from './servicioClientes';

export const PantallaClientes: React.FC = () => {
  const [clientes, setClientes] = useState<ClienteDto[]>([]);
  const [cargando, setCargando] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [mensajeAlerta, setMensajeAlerta] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);

  // Estados de modales
  const [modalClienteAbierto, setModalClienteAbierto] = useState(false);
  const [clienteAEditar, setClienteAEditar] = useState<ClienteDto | null>(null);

  const [modalAbonoAbierto, setModalAbonoAbierto] = useState(false);
  const [clienteAbono, setClienteAbono] = useState<ClienteDto | null>(null);
  const [montoAbono, setMontoAbono] = useState('');
  const [formaPagoAbono, setFormaPagoAbono] = useState<'Efectivo' | 'Transferencia' | 'Tarjeta'>('Efectivo');
  const [observacionesAbono, setObservacionesAbono] = useState('');
  const [ultimoComprobante, setUltimoComprobante] = useState<ResultadoAbonoDto | null>(null);

  // Estado del formulario de cliente
  const [formNombre, setFormNombre] = useState('');
  const [formApellidos, setFormApellidos] = useState('');
  const [formTelefono, setFormTelefono] = useState('');
  const [formCorreo, setFormCorreo] = useState('');
  const [formDireccion, setFormDireccion] = useState('');
  const [formColonia, setFormColonia] = useState('');
  const [formTieneCredito, setFormTieneCredito] = useState(false);
  const [formLimiteCredito, setFormLimiteCredito] = useState('1000');
  const [formDiasCredito, setFormDiasCredito] = useState('15');

  const cargarClientes = useCallback(async () => {
    setCargando(true);
    try {
      const lista = await servicioClientes.obtenerTodos({ busqueda });
      setClientes(lista);
    } catch {
      setMensajeAlerta({ tipo: 'error', texto: 'No se pudieron cargar los clientes del servidor.' });
    } finally {
      setCargando(false);
    }
  }, [busqueda]);

  useEffect(() => {
    cargarClientes();
  }, [cargarClientes]);

  // Limpiar y abrir modal nuevo cliente
  const abrirNuevoCliente = () => {
    setClienteAEditar(null);
    setFormNombre('');
    setFormApellidos('');
    setFormTelefono('');
    setFormCorreo('');
    setFormDireccion('');
    setFormColonia('');
    setFormTieneCredito(true);
    setFormLimiteCredito('1500');
    setFormDiasCredito('15');
    setModalClienteAbierto(true);
  };

  // Abrir modal editar cliente
  const abrirEditarCliente = (c: ClienteDto) => {
    setClienteAEditar(c);
    setFormNombre(c.nombre);
    setFormApellidos(c.apellidos || '');
    setFormTelefono(c.telefono || '');
    setFormCorreo(c.correo || '');
    setFormDireccion(c.direccion || '');
    setFormColonia(c.colonia || '');
    setFormTieneCredito(c.tieneCredito);
    setFormLimiteCredito(c.limiteCredito.toString());
    setFormDiasCredito(c.diasCredito.toString());
    setModalClienteAbierto(true);
  };

  // Guardar cliente
  const guardarCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNombre.trim()) {
      setMensajeAlerta({ tipo: 'error', texto: 'El nombre del cliente es obligatorio.' });
      return;
    }

    try {
      const datos: CrearClienteDto = {
        nombre: formNombre.trim(),
        apellidos: formApellidos.trim(),
        telefono: formTelefono.trim(),
        correo: formCorreo.trim(),
        direccion: formDireccion.trim(),
        colonia: formColonia.trim(),
        tieneCredito: formTieneCredito,
        limiteCredito: formTieneCredito ? parseFloat(formLimiteCredito) || 0 : 0,
        diasCredito: formTieneCredito ? parseInt(formDiasCredito) || 15 : 0,
      };

      if (clienteAEditar) {
        const dtoActualizar: ActualizarClienteDto = { ...datos, activo: clienteAEditar.activo };
        await servicioClientes.actualizar(clienteAEditar.idCliente, dtoActualizar);
        setMensajeAlerta({ tipo: 'exito', texto: `Cliente '${formNombre}' actualizado con éxito.` });
      } else {
        await servicioClientes.crear(datos);
        setMensajeAlerta({ tipo: 'exito', texto: `Cliente '${formNombre}' registrado exitosamente con línea de crédito activada.` });
      }

      setModalClienteAbierto(false);
      cargarClientes();
    } catch {
      setMensajeAlerta({ tipo: 'error', texto: 'Ocurrió un error al guardar el cliente.' });
    }
  };

  // Abrir modal de pago / abono a cuenta corriente
  const abrirModalAbono = (c: ClienteDto) => {
    setClienteAbono(c);
    setMontoAbono('');
    setFormaPagoAbono('Efectivo');
    setObservacionesAbono('');
    setUltimoComprobante(null);
    setModalAbonoAbierto(true);
  };

  const registrarAbono = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteAbono) return;
    const monto = parseFloat(montoAbono);
    if (isNaN(monto) || monto <= 0) {
      setMensajeAlerta({ tipo: 'error', texto: 'Ingresa un monto de abono válido mayor a $0.00.' });
      return;
    }

    try {
      const dto: AbonoCreditoDto = {
        idCliente: clienteAbono.idCliente,
        monto,
        formaPago: formaPagoAbono,
        observaciones: observacionesAbono,
      };

      const resComprobante = await servicioClientes.registrarAbono(dto);
      setUltimoComprobante(resComprobante);
      setMensajeAlerta({ tipo: 'exito', texto: `Abono de $${monto.toFixed(2)} registrado con éxito.` });
      cargarClientes();
    } catch {
      setMensajeAlerta({ tipo: 'error', texto: 'Error al registrar el abono.' });
    }
  };

  // Totales de cartera de cobranza
  const totalClientes = clientes.length;
  const clientesConCredito = clientes.filter((c) => c.tieneCredito).length;
  const saldoTotalCobrar = clientes.reduce((acc, c) => acc + (c.saldoActual || 0), 0);
  const limiteCreditoTotal = clientes.reduce((acc, c) => acc + (c.limiteCredito || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Alerta de notificación */}
      {mensajeAlerta && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.75rem 1.25rem',
            borderRadius: '10px',
            backgroundColor: mensajeAlerta.tipo === 'exito' ? '#dcfce7' : '#fee2e2',
            color: mensajeAlerta.tipo === 'exito' ? '#166534' : '#991b1b',
            border: `1px solid ${mensajeAlerta.tipo === 'exito' ? '#bbf7d0' : '#fecaca'}`,
            fontWeight: 600,
            fontSize: '0.9rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {mensajeAlerta.tipo === 'exito' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{mensajeAlerta.texto}</span>
          </div>
          <button
            onClick={() => setMensajeAlerta(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Encabezado y tarjetas de Cartera de Cobranza */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="tarjeta" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: '12px', backgroundColor: '#e0f2fe', color: '#0284c7' }}>
            <Users size={28} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-texto-secundario)', fontWeight: 600 }}>Total Clientes</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{totalClientes}</div>
          </div>
        </div>

        <div className="tarjeta" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: '12px', backgroundColor: '#fef3c7', color: '#d97706' }}>
            <CreditCard size={28} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-texto-secundario)', fontWeight: 600 }}>Cartera con Crédito</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{clientesConCredito}</div>
          </div>
        </div>

        <div className="tarjeta" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: '12px', backgroundColor: '#fee2e2', color: '#dc2626' }}>
            <DollarSign size={28} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-texto-secundario)', fontWeight: 600 }}>Saldo Pendiente por Cobrar</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#dc2626' }}>${saldoTotalCobrar.toFixed(2)}</div>
          </div>
        </div>

        <div className="tarjeta" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: '12px', backgroundColor: '#dcfce7', color: '#16a34a' }}>
            <BadgeCheck size={28} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-texto-secundario)', fontWeight: 600 }}>Límite de Crédito Total</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#16a34a' }}>${limiteCreditoTotal.toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Barra de herramientas */}
      <div className="tarjeta" style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, maxWidth: '420px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', color: 'var(--color-texto-secundario)' }} />
          <input
            type="text"
            className="input-base"
            style={{ paddingLeft: '38px', width: '100%' }}
            placeholder="Buscar por nombre, teléfono, colonia o ID..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-primario" onClick={abrirNuevoCliente} style={{ gap: '0.5rem' }}>
            <UserPlus size={18} />
            <span>Nuevo Cliente / Aperturar Crédito</span>
          </button>
        </div>
      </div>

      {/* Tabla de Clientes y Cartera de Cobranza */}
      <div className="tarjeta" style={{ overflow: 'hidden', padding: 0 }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-borde)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Cartera de Clientes & Líneas de Crédito</h3>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-texto-secundario)' }}>{clientes.length} registros</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="tabla-listado" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--color-fondo-suave)', borderBottom: '1px solid var(--color-borde)' }}>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', fontWeight: 700 }}>ID / Cliente</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', fontWeight: 700 }}>Nombre Completo</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', fontWeight: 700 }}>Contacto & Dirección</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', fontWeight: 700 }}>Línea Crédito</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', fontWeight: 700 }}>Saldo por Pagar</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', fontWeight: 700 }}>Plazo / Corte</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', fontWeight: 700 }}>Estatus</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', fontWeight: 700, textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-texto-secundario)' }}>
                    Cargando directorio de clientes...
                  </td>
                </tr>
              ) : clientes.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-texto-secundario)' }}>
                    No se encontraron clientes registrados con el criterio de búsqueda.
                  </td>
                </tr>
              ) : (
                clientes.map((c) => (
                  <tr key={c.idCliente} style={{ borderBottom: '1px solid var(--color-borde)' }}>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--color-primario)' }}>
                      #{c.numeroCliente || c.idCliente}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ fontWeight: 600 }}>{c.nombreCompleto || `${c.nombre} ${c.apellidos}`}</div>
                      {c.rfc && <span style={{ fontSize: '0.75rem', color: 'var(--color-texto-secundario)' }}>RFC: {c.rfc}</span>}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem' }}>
                      {c.telefono && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-texto)' }}>
                          <Phone size={13} style={{ color: 'var(--color-texto-secundario)' }} />
                          <span>{c.telefono}</span>
                        </div>
                      )}
                      {c.direccion && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-texto-secundario)', fontSize: '0.8rem' }}>
                          <MapPin size={13} />
                          <span>{c.direccion} {c.colonia ? `(${c.colonia})` : ''}</span>
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      {c.tieneCredito ? (
                        <span style={{ fontWeight: 700, color: '#0284c7' }}>
                          ${c.limiteCredito.toFixed(2)}
                        </span>
                      ) : (
                        <span className="badge badge-secundario" style={{ fontSize: '0.75rem' }}>Sin Crédito</span>
                      )}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      {c.saldoActual > 0 ? (
                        <span className="badge badge-peligro" style={{ fontSize: '0.85rem', fontWeight: 800 }}>
                          ${c.saldoActual.toFixed(2)}
                        </span>
                      ) : (
                        <span className="badge badge-exito" style={{ fontSize: '0.8rem' }}>
                          $0.00 (Al Día)
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem' }}>
                      {c.tieneCredito ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-texto-secundario)' }}>
                          <Calendar size={14} />
                          <span>{c.diasCredito} días corte</span>
                        </div>
                      ) : (
                        <span>-</span>
                      )}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span className={`badge ${c.activo ? 'badge-exito' : 'badge-secundario'}`}>
                        {c.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.4rem' }}>
                        {/* Botón Cobranza / Abono */}
                        {c.tieneCredito && (
                          <button
                            className="btn btn-secundario"
                            style={{
                              padding: '0.4rem 0.65rem',
                              fontSize: '0.8rem',
                              gap: '0.3rem',
                              borderColor: '#10b981',
                              color: '#047857',
                              backgroundColor: '#ecfdf5',
                              fontWeight: 700,
                            }}
                            onClick={() => abrirModalAbono(c)}
                            title="Registrar abono de crédito a la cuenta"
                          >
                            <DollarSign size={14} />
                            <span>Abonar</span>
                          </button>
                        )}

                        {/* Botón Editar */}
                        <button
                          className="btn btn-secundario"
                          style={{ padding: '0.4rem 0.65rem', fontSize: '0.8rem', gap: '0.3rem' }}
                          onClick={() => abrirEditarCliente(c)}
                          title="Editar información de cliente y crédito"
                        >
                          <Edit2 size={14} />
                          <span>Editar</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Alta / Edición de Cliente */}
      {modalClienteAbierto && (
        <div className="modal-overlay">
          <div
            className="modal-contenido"
            style={{
              maxWidth: '620px',
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '1.75rem',
              boxShadow: '0 25px 60px -15px rgba(0,0,0,0.3)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--color-borde)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ padding: '0.5rem', borderRadius: '10px', backgroundColor: '#e0f2fe', color: '#0284c7' }}>
                  <Users size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem' }}>
                    {clienteAEditar ? 'Editar Cliente' : 'Alta de Nuevo Cliente'}
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-texto-secundario)' }}>
                    Información de cobranza, contacto y línea de crédito comercial
                  </span>
                </div>
              </div>
              <button
                onClick={() => setModalClienteAbierto(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-texto-secundario)' }}
              >
                <X size={22} />
              </button>
            </div>

            <form onSubmit={guardarCliente}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Nombre(s) *
                  </label>
                  <input
                    type="text"
                    className="input-base"
                    style={{ width: '100%' }}
                    placeholder="Ej. Juan Carlos"
                    value={formNombre}
                    onChange={(e) => setFormNombre(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Apellidos
                  </label>
                  <input
                    type="text"
                    className="input-base"
                    style={{ width: '100%' }}
                    placeholder="Ej. Gómez Pérez"
                    value={formApellidos}
                    onChange={(e) => setFormApellidos(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Teléfono Celular / WhatsApp
                  </label>
                  <input
                    type="tel"
                    className="input-base"
                    style={{ width: '100%' }}
                    placeholder="Ej. 777 123 4567"
                    value={formTelefono}
                    onChange={(e) => setFormTelefono(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Correo Electrónico (Opcional)
                  </label>
                  <input
                    type="email"
                    className="input-base"
                    style={{ width: '100%' }}
                    placeholder="cliente@ejemplo.com"
                    value={formCorreo}
                    onChange={(e) => setFormCorreo(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Dirección (Calle y Número)
                  </label>
                  <input
                    type="text"
                    className="input-base"
                    style={{ width: '100%' }}
                    placeholder="Ej. Av. Hidalgo #45"
                    value={formDireccion}
                    onChange={(e) => setFormDireccion(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Colonia / Localidad
                  </label>
                  <input
                    type="text"
                    className="input-base"
                    style={{ width: '100%' }}
                    placeholder="Ej. Centro"
                    value={formColonia}
                    onChange={(e) => setFormColonia(e.target.value)}
                  />
                </div>
              </div>

              {/* Sección de Crédito y Cartera */}
              <div
                style={{
                  backgroundColor: 'var(--color-fondo-suave)',
                  border: '1px solid var(--color-borde)',
                  borderRadius: '12px',
                  padding: '1rem',
                  marginBottom: '1.5rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.85rem' }}>
                  <input
                    type="checkbox"
                    id="chkCredito"
                    checked={formTieneCredito}
                    onChange={(e) => setFormTieneCredito(e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <label htmlFor="chkCredito" style={{ fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer' }}>
                    Habilitar Línea de Crédito Comercial / Fiado
                  </label>
                </div>

                {formTieneCredito && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                        Límite de Crédito ($ MXN)
                      </label>
                      <div style={{ position: 'relative' }}>
                        <DollarSign size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: '#16a34a' }} />
                        <input
                          type="number"
                          step="50"
                          min="0"
                          className="input-base"
                          style={{ paddingLeft: '32px', width: '100%', fontWeight: 700, color: '#16a34a' }}
                          value={formLimiteCredito}
                          onChange={(e) => setFormLimiteCredito(e.target.value)}
                          required
                        />
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-texto-secundario)' }}>
                        Monto máximo que el cliente puede adeudar
                      </span>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                        Plazo de Corte y Pago (Días)
                      </label>
                      <select
                        className="input-base"
                        style={{ width: '100%' }}
                        value={formDiasCredito}
                        onChange={(e) => setFormDiasCredito(e.target.value)}
                      >
                        <option value="7">7 Días (Corte Semanal)</option>
                        <option value="15">15 Días (Corte Quincenal)</option>
                        <option value="30">30 Días (Corte Mensual)</option>
                      </select>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-texto-secundario)' }}>
                        Frecuencia recomendada para liquidación
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="btn btn-secundario"
                  onClick={() => setModalClienteAbierto(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primario" style={{ gap: '0.5rem' }}>
                  <CheckCircle2 size={18} />
                  <span>{clienteAEditar ? 'Guardar Cambios' : 'Aperturar Cliente'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Registro de Abono a Cartera de Cobranza */}
      {modalAbonoAbierto && clienteAbono && (
        <div className="modal-overlay">
          <div
            className="modal-contenido"
            style={{
              maxWidth: '520px',
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '1.75rem',
              boxShadow: '0 25px 60px -15px rgba(0,0,0,0.3)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--color-borde)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ padding: '0.5rem', borderRadius: '10px', backgroundColor: '#dcfce7', color: '#16a34a' }}>
                  <Receipt size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Abono a Cuenta / Cartera de Cobranza</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-texto-secundario)' }}>
                    Cliente: <strong>{clienteAbono.nombreCompleto}</strong> (ID #{clienteAbono.idCliente})
                  </span>
                </div>
              </div>
              <button
                onClick={() => setModalAbonoAbierto(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-texto-secundario)' }}
              >
                <X size={22} />
              </button>
            </div>

            {ultimoComprobante ? (
              /* Comprobante de Abono Realizado */
              <div>
                <div
                  style={{
                    backgroundColor: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    textAlign: 'center',
                    marginBottom: '1.25rem',
                  }}
                >
                  <CheckCircle2 size={40} style={{ color: '#16a34a', margin: '0 auto 0.5rem auto' }} />
                  <h4 style={{ margin: 0, color: '#166534', fontSize: '1.1rem' }}>¡Abono Registrado con Éxito!</h4>
                  <span style={{ fontSize: '0.85rem', color: '#15803d' }}>
                    Folio de Comprobante: <strong>{ultimoComprobante.folioAbono}</strong>
                  </span>

                  <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-around', borderTop: '1px dashed #86efac', paddingTop: '0.75rem' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-texto-secundario)' }}>Monto Abonado</span>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#16a34a' }}>
                        ${ultimoComprobante.montoAbonado.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-texto-secundario)' }}>Nuevo Saldo Deudor</span>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: ultimoComprobante.nuevoSaldo > 0 ? '#dc2626' : '#16a34a' }}>
                        ${ultimoComprobante.nuevoSaldo.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem' }}>
                  <button
                    type="button"
                    className="btn btn-secundario"
                    style={{ gap: '0.5rem', flex: 1 }}
                    onClick={() => window.print()}
                  >
                    <Printer size={16} />
                    <span>Imprimir Comprobante</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-primario"
                    style={{ flex: 1 }}
                    onClick={() => setModalAbonoAbierto(false)}
                  >
                    Finalizar
                  </button>
                </div>
              </div>
            ) : (
              /* Formulario para registrar abono */
              <form onSubmit={registrarAbono}>
                {/* Resumen del crédito actual */}
                <div
                  style={{
                    backgroundColor: 'var(--color-fondo-suave)',
                    borderRadius: '10px',
                    padding: '0.85rem 1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '1rem',
                    border: '1px solid var(--color-borde)',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-texto-secundario)' }}>Límite Otorgado</span>
                    <div style={{ fontWeight: 700 }}>${clienteAbono.limiteCredito.toFixed(2)}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-texto-secundario)' }}>Saldo Adeudado Actual</span>
                    <div style={{ fontWeight: 800, color: '#dc2626', fontSize: '1.1rem' }}>
                      ${clienteAbono.saldoActual.toFixed(2)}
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Monto a Abonar ($ MXN) *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <DollarSign size={20} style={{ position: 'absolute', left: '12px', top: '12px', color: '#16a34a' }} />
                    <input
                      type="number"
                      step="0.50"
                      min="1"
                      max={clienteAbono.saldoActual > 0 ? clienteAbono.saldoActual : undefined}
                      className="input-base"
                      style={{ paddingLeft: '38px', fontSize: '1.25rem', fontWeight: 800, width: '100%', color: '#16a34a' }}
                      placeholder="0.00"
                      value={montoAbono}
                      onChange={(e) => setMontoAbono(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                  {/* Botón rápido para abonar el saldo total */}
                  {clienteAbono.saldoActual > 0 && (
                    <button
                      type="button"
                      onClick={() => setMontoAbono(clienteAbono.saldoActual.toFixed(2))}
                      style={{
                        marginTop: '0.4rem',
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-primario)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      Liquidación total: ${clienteAbono.saldoActual.toFixed(2)}
                    </button>
                  )}
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Forma de Pago del Abono
                  </label>
                  <select
                    className="input-base"
                    style={{ width: '100%' }}
                    value={formaPagoAbono}
                    onChange={(e) => setFormaPagoAbono(e.target.value as 'Efectivo' | 'Transferencia' | 'Tarjeta')}
                  >
                    <option value="Efectivo">Efectivo en Mostrador</option>
                    <option value="Transferencia">Transferencia Bancaria (SPEI)</option>
                    <option value="Tarjeta">Tarjeta Débito / Crédito</option>
                  </select>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Observaciones / Notas (Opcional)
                  </label>
                  <input
                    type="text"
                    className="input-base"
                    style={{ width: '100%' }}
                    placeholder="Ej. Abono quincenal recibido por encargado"
                    value={observacionesAbono}
                    onChange={(e) => setObservacionesAbono(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button
                    type="button"
                    className="btn btn-secundario"
                    onClick={() => setModalAbonoAbierto(false)}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primario" style={{ gap: '0.5rem', backgroundColor: '#16a34a', borderColor: '#16a34a' }}>
                    <CheckCircle2 size={18} />
                    <span>Confirmar Abono</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
