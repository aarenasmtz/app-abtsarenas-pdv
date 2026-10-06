import React, { useState } from 'react';
import {
  X,
  Printer,
  Share2,
  CheckCircle,
  Truck,
  Layers,
  Search,
  Check,
  Phone,
  MessageCircle,
} from 'lucide-react';
import { servicioPedidos } from './servicioPedidos';
import type { PedidoSugeridoDto, DetallePedidoSugeridoDto } from './tiposPedidos';

interface PropsModalDetallePedido {
  pedidoInicial: PedidoSugeridoDto;
  alCerrar: () => void;
  alActualizar: (pedidoActualizado: PedidoSugeridoDto) => void;
}

export const ModalDetallePedido: React.FC<PropsModalDetallePedido> = ({
  pedidoInicial,
  alCerrar,
  alActualizar,
}) => {
  const [pedido, setPedido] = useState<PedidoSugeridoDto>(pedidoInicial);
  const [pestañaActiva, setPestañaActiva] = useState<'articulos' | 'proveedores'>('articulos');
  const [terminoBusqueda, setTerminoBusqueda] = useState<string>('');
  const [idProveedorSeleccionado, setIdProveedorSeleccionado] = useState<number | 'todos'>('todos');
  const [editandoPartida, setEditandoPartida] = useState<{ id: number; valor: string } | null>(null);
  const [guardandoAjuste, setGuardandoAjuste] = useState<boolean>(false);
  const [mensajeCopiado, setMensajeCopiado] = useState<string | null>(null);

  // Formato de moneda MXN
  const formatearDinero = (monto: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(monto);

  // Filtrado de partidas en la tabla
  const partidasFiltradas = pedido.detalles.filter((d) => {
    const coincideTexto =
      d.nombreProducto.toLowerCase().includes(terminoBusqueda.toLowerCase()) ||
      d.codigoBarras.toLowerCase().includes(terminoBusqueda.toLowerCase()) ||
      d.categoria.toLowerCase().includes(terminoBusqueda.toLowerCase()) ||
      d.nombreProveedor.toLowerCase().includes(terminoBusqueda.toLowerCase());

    const coincideProveedor =
      idProveedorSeleccionado === 'todos' || d.idProveedor === idProveedorSeleccionado;

    return coincideTexto && coincideProveedor;
  });

  // Guardar ajuste de cantidad en una partida
  const manejarGuardarAjuste = async (idDetalle: number) => {
    if (!editandoPartida || editandoPartida.id !== idDetalle) return;

    const valorNumerico = parseFloat(editandoPartida.valor);
    if (isNaN(valorNumerico) || valorNumerico < 0) {
      alert('Por favor ingrese una cantidad válida mayor o igual a 0.');
      return;
    }

    setGuardandoAjuste(true);
    try {
      await servicioPedidos.actualizarCantidadDetalle(idDetalle, {
        cantidadAjustada: valorNumerico,
      });

      // Recargar pedido completo para recalcular totales y grupos de proveedores
      const pedidoRefrescado = await servicioPedidos.obtenerPorId(pedido.idPedidoSugerido);
      setPedido(pedidoRefrescado);
      alActualizar(pedidoRefrescado);
      setEditandoPartida(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al actualizar partida.');
    } finally {
      setGuardandoAjuste(false);
    }
  };

  // Cambiar estado (GENERADO -> REVISADO -> PROCESADO)
  const manejarCambioEstado = async (nuevoEstado: string) => {
    try {
      const pedidoRefrescado = await servicioPedidos.actualizarEstado(pedido.idPedidoSugerido, {
        estado: nuevoEstado,
      });
      setPedido(pedidoRefrescado);
      alActualizar(pedidoRefrescado);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al cambiar estado.');
    }
  };

  // Generar texto para WhatsApp por proveedor
  const copiarPedidoProveedorWhatsApp = (idProv: number) => {
    const grupo = pedido.gruposPorProveedor.find((g) => g.idProveedor === idProv);
    if (!grupo) return;

    let texto = `*PEDIDO DE MERCANCÍA - ABARROTES ARENAS*\n`;
    texto += `Semana ${pedido.semanaAnio} / ${pedido.anio}\n`;
    texto += `Proveedor: *${grupo.nombreProveedor}*\n`;
    texto += `Fecha: ${new Date(pedido.fechaGeneracion).toLocaleDateString('es-MX')}\n\n`;
    texto += `*LISTA DE SURTIDO:*\n`;

    grupo.partidas.forEach((p, idx) => {
      const cantidad = p.cantidadAjustada ?? p.cantidadSugerida;
      texto += `${idx + 1}. [${cantidad} ${p.unidadMedida}] - ${p.nombreProducto} (Cód: ${p.codigoBarras})\n`;
    });

    texto += `\n*Total Artículos:* ${grupo.totalPartidas}`;
    texto += `\n*Total Piezas:* ${grupo.totalPiezas}`;
    texto += `\n*Inversión Estimada:* ${formatearDinero(grupo.inversionEstimada)}`;
    texto += `\n\n_Favor de confirmar recepción y fecha estimada de entrega. ¡Muchas gracias!_`;

    navigator.clipboard.writeText(texto).then(() => {
      setMensajeCopiado(`¡Pedido de ${grupo.nombreProveedor} copiado para WhatsApp!`);
      setTimeout(() => setMensajeCopiado(null), 3500);
    });
  };

  // Abrir WhatsApp Web directamente si tiene teléfono
  const abrirWhatsAppWeb = (idProv: number) => {
    const grupo = pedido.gruposPorProveedor.find((g) => g.idProveedor === idProv);
    if (!grupo) return;

    copiarPedidoProveedorWhatsApp(idProv);

    const telefonoLimpio = (grupo.telefono || '').replace(/\D/g, '');
    if (telefonoLimpio) {
      window.open(`https://wa.me/52${telefonoLimpio}`, '_blank');
    }
  };

  // Colores por estado
  const colorEstado: Record<string, { bg: string; color: string }> = {
    GENERADO: { bg: 'rgba(234, 179, 8, 0.15)', color: '#ca8a04' },
    REVISADO: { bg: 'rgba(59, 130, 246, 0.15)', color: '#2563eb' },
    PROCESADO: { bg: 'rgba(16, 185, 129, 0.15)', color: '#059669' },
  };

  return (
    <div className="superposicion-modal">
      <div
        className="modal-contenedor"
        style={{
          maxWidth: '1150px',
          width: '95%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Cabecera del modal */}
        <div className="modal-cabecera" style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--color-borde)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0 }}>
                  Pedido Sugerido Dominical #{pedido.idPedidoSugerido}
                </h2>
                <span
                  style={{
                    backgroundColor: colorEstado[pedido.estado]?.bg || 'rgba(156, 163, 175, 0.2)',
                    color: colorEstado[pedido.estado]?.color || '#4b5563',
                    padding: '0.2rem 0.65rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                  }}
                >
                  {pedido.estado}
                </span>
              </div>
              <p style={{ fontSize: '0.825rem', color: 'var(--color-texto-secundario)', margin: '0.25rem 0 0 0' }}>
                Semana {pedido.semanaAnio} del {pedido.anio} • Generado el{' '}
                {new Date(pedido.fechaGeneracion).toLocaleString('es-MX', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-secundario"
              onClick={() => window.print()}
              title="Imprimir pedido"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.75rem' }}
            >
              <Printer size={16} />
              <span>Imprimir</span>
            </button>
            <button type="button" className="btn-icono" onClick={alCerrar}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Notificación temporal de copiado */}
        {mensajeCopiado && (
          <div
            style={{
              backgroundColor: '#10b981',
              color: '#ffffff',
              padding: '0.65rem 1.5rem',
              textAlign: 'center',
              fontSize: '0.875rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            <Check size={18} />
            <span>{mensajeCopiado}</span>
          </div>
        )}

        {/* Resumen de totales */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            padding: '1rem 1.5rem',
            backgroundColor: 'var(--color-fondo-suave)',
            borderBottom: '1px solid var(--color-borde)',
          }}
        >
          <div className="tarjeta" style={{ padding: '0.75rem 1rem', margin: 0 }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-texto-secundario)', textTransform: 'uppercase' }}>
              Artículos a Surtir
            </span>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-texto-principal)' }}>
              {pedido.totalPartidas} productos
            </div>
          </div>

          <div className="tarjeta" style={{ padding: '0.75rem 1rem', margin: 0 }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-texto-secundario)', textTransform: 'uppercase' }}>
              Piezas / Unidades Totales
            </span>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-primario)' }}>
              {pedido.totalPiezasEfectivas.toLocaleString('es-MX')} piezas
            </div>
            {pedido.totalPiezasEfectivas !== pedido.totalPiezasSugeridas && (
              <span style={{ fontSize: '0.75rem', color: 'var(--color-texto-secundario)' }}>
                (Sugerido inicial: {pedido.totalPiezasSugeridas})
              </span>
            )}
          </div>

          <div className="tarjeta" style={{ padding: '0.75rem 1rem', margin: 0 }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-texto-secundario)', textTransform: 'uppercase' }}>
              Inversión Estimada
            </span>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-exito)' }}>
              {formatearDinero(pedido.inversionEstimadaEfectiva)}
            </div>
            {pedido.inversionEstimadaEfectiva !== pedido.inversionEstimadaSugerida && (
              <span style={{ fontSize: '0.75rem', color: 'var(--color-texto-secundario)' }}>
                (Inicial: {formatearDinero(pedido.inversionEstimadaSugerida)})
              </span>
            )}
          </div>

          <div className="tarjeta" style={{ padding: '0.75rem 1rem', margin: 0 }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-texto-secundario)', textTransform: 'uppercase' }}>
              Proveedores Involucrados
            </span>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-advertencia)' }}>
              {pedido.gruposPorProveedor.length} marcas
            </div>
          </div>
        </div>

        {/* Pestañas de vista */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.75rem 1.5rem',
            borderBottom: '1px solid var(--color-borde)',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className={`btn ${pestañaActiva === 'articulos' ? 'btn-primario' : 'btn-secundario'}`}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.45rem 1rem' }}
              onClick={() => setPestañaActiva('articulos')}
            >
              <Layers size={16} />
              <span>Desglose por Artículos ({pedido.totalPartidas})</span>
            </button>
            <button
              type="button"
              className={`btn ${pestañaActiva === 'proveedores' ? 'btn-primario' : 'btn-secundario'}`}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.45rem 1rem' }}
              onClick={() => setPestañaActiva('proveedores')}
            >
              <Truck size={16} />
              <span>Agrupado por Proveedor ({pedido.gruposPorProveedor.length})</span>
            </button>
          </div>

          {/* Filtros rápidos si está en artículos */}
          {pestañaActiva === 'articulos' && (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <div style={{ position: 'relative', width: '220px' }}>
                <Search
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--color-texto-secundario)',
                  }}
                />
                <input
                  type="text"
                  className="control-formulario"
                  placeholder="Buscar producto..."
                  value={terminoBusqueda}
                  onChange={(e) => setTerminoBusqueda(e.target.value)}
                  style={{ paddingLeft: '2.2rem', paddingBlock: '0.4rem', fontSize: '0.85rem' }}
                />
              </div>

              <select
                className="control-formulario"
                value={idProveedorSeleccionado}
                onChange={(e) =>
                  setIdProveedorSeleccionado(e.target.value === 'todos' ? 'todos' : Number(e.target.value))
                }
                style={{ width: '180px', paddingBlock: '0.4rem', fontSize: '0.85rem' }}
              >
                <option value="todos">Todos los proveedores</option>
                {pedido.gruposPorProveedor.map((g) => (
                  <option key={g.idProveedor} value={g.idProveedor}>
                    {g.nombreProveedor}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Cuerpo del modal */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem' }}>
          {/* VISTA 1: TABLA DETALLADA DE ARTÍCULOS */}
          {pestañaActiva === 'articulos' && (
            <div className="contenedor-tabla" style={{ border: '1px solid var(--color-borde)', borderRadius: '8px' }}>
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Proveedor</th>
                    <th style={{ textAlign: 'right' }}>Stock Actual</th>
                    <th style={{ textAlign: 'right' }}>Mínimo</th>
                    <th style={{ textAlign: 'right' }}>Venta/Día</th>
                    <th style={{ textAlign: 'right' }}>Demanda {pedido.detalles[0]?.diasCobertura || 7}d</th>
                    <th style={{ textAlign: 'right' }}>Sugerido</th>
                    <th style={{ textAlign: 'center', width: '140px' }}>Cantidad Final</th>
                    <th style={{ textAlign: 'right' }}>Costo Unit.</th>
                    <th style={{ textAlign: 'right' }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {partidasFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan={10} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-texto-secundario)' }}>
                        No se encontraron partidas con los filtros especificados.
                      </td>
                    </tr>
                  ) : (
                    partidasFiltradas.map((d: DetallePedidoSugeridoDto) => {
                      const estaEditando = editandoPartida?.id === d.idDetallePedidoSugerido;

                      return (
                        <tr key={d.idDetallePedidoSugerido}>
                          <td>
                            <div style={{ fontWeight: 600, color: 'var(--color-texto-principal)' }}>
                              {d.nombreProducto}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-texto-secundario)' }}>
                              Cód: {d.codigoBarras} • {d.categoria}
                            </div>
                          </td>
                          <td style={{ fontSize: '0.85rem' }}>{d.nombreProveedor}</td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>
                            {d.stockActual} {d.unidadMedida}
                          </td>
                          <td style={{ textAlign: 'right', color: 'var(--color-texto-secundario)' }}>
                            {d.stockMinimo}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            {d.ventaPromedioDiaria.toFixed(2)}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            {d.demandaEstimada.toFixed(2)}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--color-texto-secundario)' }}>
                            {d.cantidadSugerida}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {estaEditando ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', justifyContent: 'center' }}>
                                <input
                                  type="number"
                                  min="0"
                                  step={d.permiteVentaFraccionada ? '0.1' : '1'}
                                  className="control-formulario"
                                  value={editandoPartida.valor}
                                  onChange={(e) =>
                                    setEditandoPartida({ id: d.idDetallePedidoSugerido, valor: e.target.value })
                                  }
                                  style={{ width: '70px', padding: '0.2rem 0.4rem', textAlign: 'center', fontSize: '0.85rem' }}
                                  disabled={guardandoAjuste}
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  className="btn btn-primario"
                                  style={{ padding: '0.3rem', minWidth: 'auto' }}
                                  onClick={() => manejarGuardarAjuste(d.idDetallePedidoSugerido)}
                                  disabled={guardandoAjuste}
                                  title="Guardar ajuste"
                                >
                                  <Check size={14} />
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-secundario"
                                  style={{ padding: '0.3rem', minWidth: 'auto' }}
                                  onClick={() => setEditandoPartida(null)}
                                  disabled={guardandoAjuste}
                                  title="Cancelar"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ) : (
                              <div
                                onClick={() =>
                                  setEditandoPartida({
                                    id: d.idDetallePedidoSugerido,
                                    valor: String(d.cantidadAjustada ?? d.cantidadSugerida),
                                  })
                                }
                                style={{
                                  cursor: 'pointer',
                                  padding: '0.2rem 0.6rem',
                                  borderRadius: '6px',
                                  backgroundColor: d.cantidadAjustada != null ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                  border: d.cantidadAjustada != null ? '1px solid #3b82f6' : '1px dashed var(--color-borde)',
                                  fontWeight: 700,
                                  color: d.cantidadAjustada != null ? '#2563eb' : 'var(--color-texto-principal)',
                                  display: 'inline-block',
                                }}
                                title="Haga clic para editar la cantidad a pedir"
                              >
                                {d.cantidadEfectiva} {d.unidadMedida}
                              </div>
                            )}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            {formatearDinero(d.precioCostoUnitario)}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>
                            {formatearDinero(d.subtotalEfectivo)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* VISTA 2: AGRUPADO POR PROVEEDOR (ÓRDENES DE COMPRA / WHATSAPP) */}
          {pestañaActiva === 'proveedores' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {pedido.gruposPorProveedor.map((grupo) => (
                <div
                  key={grupo.idProveedor}
                  className="tarjeta"
                  style={{
                    border: '1px solid var(--color-borde)',
                    borderRadius: '8px',
                    padding: '1.25rem',
                    margin: 0,
                  }}
                >
                  {/* Encabezado del grupo */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '1rem',
                      borderBottom: '1px solid var(--color-borde)',
                      paddingBottom: '0.75rem',
                      marginBottom: '1rem',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <Truck size={20} style={{ color: 'var(--color-primario)' }} />
                        <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>
                          {grupo.nombreProveedor}
                        </h3>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-texto-secundario)', marginTop: '0.2rem', display: 'flex', gap: '1rem' }}>
                        {grupo.contacto && <span>Contacto: <strong>{grupo.contacto}</strong></span>}
                        {grupo.telefono && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <Phone size={12} /> {grupo.telefono}
                          </span>
                        )}
                        {grupo.email && <span>{grupo.email}</span>}
                      </div>
                    </div>

                    {/* Acciones de WhatsApp y copia */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button
                        type="button"
                        className="btn btn-secundario"
                        onClick={() => copiarPedidoProveedorWhatsApp(grupo.idProveedor)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.85rem' }}
                        title="Copiar texto formateado al portapapeles"
                      >
                        <Share2 size={16} />
                        <span>Copiar Texto</span>
                      </button>

                      <button
                        type="button"
                        className="btn"
                        onClick={() => abrirWhatsAppWeb(grupo.idProveedor)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          padding: '0.45rem 0.85rem',
                          backgroundColor: '#25D366',
                          color: '#ffffff',
                          border: 'none',
                          fontWeight: 600,
                        }}
                        title="Abrir WhatsApp para enviar el pedido"
                      >
                        <MessageCircle size={16} />
                        <span>Enviar WhatsApp</span>
                      </button>
                    </div>
                  </div>

                  {/* Tabla de artículos del proveedor */}
                  <div className="contenedor-tabla" style={{ marginBottom: '1rem' }}>
                    <table className="tabla">
                      <thead>
                        <tr>
                          <th>Producto</th>
                          <th style={{ textAlign: 'right' }}>Stock Actual</th>
                          <th style={{ textAlign: 'right' }}>Demanda Semanal</th>
                          <th style={{ textAlign: 'right' }}>Cant. Pedida</th>
                          <th style={{ textAlign: 'right' }}>Precio Unit.</th>
                          <th style={{ textAlign: 'right' }}>Importe</th>
                        </tr>
                      </thead>
                      <tbody>
                        {grupo.partidas.map((p) => (
                          <tr key={p.idDetallePedidoSugerido}>
                            <td>
                              <span style={{ fontWeight: 600 }}>{p.nombreProducto}</span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--color-texto-secundario)', marginLeft: '0.5rem' }}>
                                [{p.codigoBarras}]
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>{p.stockActual}</td>
                            <td style={{ textAlign: 'right' }}>{p.demandaEstimada.toFixed(2)}</td>
                            <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--color-primario)' }}>
                              {p.cantidadEfectiva} {p.unidadMedida}
                            </td>
                            <td style={{ textAlign: 'right' }}>{formatearDinero(p.precioCostoUnitario)}</td>
                            <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatearDinero(p.subtotalEfectivo)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Resumen del proveedor */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      gap: '2rem',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      paddingTop: '0.5rem',
                      borderTop: '1px solid var(--color-borde)',
                    }}
                  >
                    <span>Artículos: <strong>{grupo.totalPartidas}</strong></span>
                    <span>Piezas: <strong>{grupo.totalPiezas}</strong></span>
                    <span style={{ color: 'var(--color-exito)' }}>
                      Inversión Sugerida: <strong>{formatearDinero(grupo.inversionEstimada)}</strong>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pie de modal con gestión de flujo de estados */}
        <div
          className="modal-pie"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--color-borde)',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-texto-secundario)' }}>
              Acciones de flujo:
            </span>
            {pedido.estado === 'GENERADO' && (
              <button
                type="button"
                className="btn btn-secundario"
                onClick={() => manejarCambioEstado('REVISADO')}
                style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <CheckCircle size={15} style={{ color: '#2563eb' }} />
                <span>Marcar como Revisado</span>
              </button>
            )}
            {pedido.estado !== 'PROCESADO' && (
              <button
                type="button"
                className="btn btn-primario"
                onClick={() => manejarCambioEstado('PROCESADO')}
                style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <Check size={15} />
                <span>Marcar como Procesado (Emitido a Proveedores)</span>
              </button>
            )}
          </div>

          <button type="button" className="btn btn-secundario" onClick={alCerrar}>
            Cerrar Ventana
          </button>
        </div>
      </div>
    </div>
  );
};
