using System.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using PdvAbarrotes.Aplicacion.Comun;
using PdvAbarrotes.Aplicacion.DTOs.Ventas;
using PdvAbarrotes.Aplicacion.Interfaces;
using PdvAbarrotes.Dominio.Entidades;

namespace PdvAbarrotes.Infraestructura.Servicios;

/// <summary>
/// Implementación del servicio central de ventas, tickets térmicos e inventario atómico del PDV.
/// </summary>
public class ServicioVentas : IServicioVentas
{
    private readonly IContextoPrincipal _contexto;
    private readonly IServicioAuditoria _servicioAuditoria;
    private readonly IServicioUsuarioActual _servicioUsuarioActual;
    private readonly ILogger<ServicioVentas> _logger;

    public ServicioVentas(
        IContextoPrincipal contexto,
        IServicioAuditoria servicioAuditoria,
        IServicioUsuarioActual servicioUsuarioActual,
        ILogger<ServicioVentas> logger)
    {
        _contexto = contexto;
        _servicioAuditoria = servicioAuditoria;
        _servicioUsuarioActual = servicioUsuarioActual;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<RespuestaApi<VentaRealizadaDto>> RegistrarVentaAsync(RegistrarVentaDto peticion, CancellationToken ct = default)
    {
        if (peticion == null)
        {
            return RespuestaApi<VentaRealizadaDto>.CrearError("La petición de venta no puede ser nula.");
        }

        if (peticion.Articulos == null || !peticion.Articulos.Any())
        {
            return RespuestaApi<VentaRealizadaDto>.CrearError("No hay artículos en el carrito para procesar la venta.");
        }

        if (peticion.Articulos.Any(a => a.Cantidad <= 0))
        {
            return RespuestaApi<VentaRealizadaDto>.CrearError("Todas las partidas deben tener una cantidad mayor a cero.");
        }

        // 1. Verificación de Idempotencia para blindar cobros dobles o reintentos
        if (peticion.TokenIdempotencia != Guid.Empty)
        {
            var ventaExistente = await _contexto.Ventas
                .AsNoTracking()
                .Include(v => v.Cliente)
                .Include(v => v.Usuario)
                .FirstOrDefaultAsync(v => v.TokenIdempotencia == peticion.TokenIdempotencia, ct);

            if (ventaExistente != null)
            {
                _logger.LogInformation("Venta previamente registrada recuperada por idempotencia. Token: {Token}", peticion.TokenIdempotencia);

                var dtoExistente = new VentaRealizadaDto
                {
                    IdVenta = ventaExistente.IdVenta,
                    FolioVenta = ventaExistente.FolioVenta,
                    FechaVenta = ventaExistente.FechaVenta,
                    Subtotal = ventaExistente.Subtotal,
                    Descuento = ventaExistente.Descuento,
                    Impuesto = ventaExistente.Impuesto,
                    Total = ventaExistente.Total,
                    ImporteRecibido = ventaExistente.ImporteRecibido,
                    Cambio = ventaExistente.Cambio,
                    NumeroArticulos = ventaExistente.NumeroArticulos,
                    NombreCajero = ventaExistente.Usuario != null ? ventaExistente.Usuario.NombreCompleto : "Cajero",
                    NombreCliente = ventaExistente.Cliente != null ? ventaExistente.Cliente.NombreCompleto : "Público en General",
                    EsReintentoIdempotente = true,
                    TokenIdempotencia = ventaExistente.TokenIdempotencia
                };

                return RespuestaApi<VentaRealizadaDto>.CrearExito(dtoExistente, "Venta recuperada correctamente (Idempotente).");
            }
        }

        // 2. Resolver Cliente mostrador y Usuario actual
        var idCliente = peticion.IdCliente > 0 ? peticion.IdCliente : 1;
        var cliente = await _contexto.Clientes.AsNoTracking().FirstOrDefaultAsync(c => c.IdCliente == idCliente, ct);
        if (cliente == null)
        {
            idCliente = 1;
            cliente = await _contexto.Clientes.AsNoTracking().FirstOrDefaultAsync(c => c.IdCliente == 1, ct);
        }

        var idUsuario = _servicioUsuarioActual.IdUsuario ?? 1;
        var nombreUsuario = _servicioUsuarioActual.NombreUsuario ?? "Cajero";

        // 3. Cargar en un solo batch los productos e inventarios involucrados
        var idsProductos = peticion.Articulos.Select(a => a.IdProducto).Distinct().ToList();
        var productosDb = await _contexto.Productos
            .Where(p => idsProductos.Contains(p.IdProducto))
            .ToDictionaryAsync(p => p.IdProducto, ct);

        var inventariosDb = await _contexto.Inventarios
            .Where(i => idsProductos.Contains(i.IdProducto) && i.IdSucursal == 1)
            .ToDictionaryAsync(i => i.IdProducto, ct);

        // 4. Calcular partidas, precios vigentes y margen
        var partidasCalculadas = new List<(ItemVentaDto Solicitud, Producto Producto, decimal PrecioUnitario, decimal PrecioCosto, decimal Descuento, decimal Subtotal, decimal Ganancia)>();

        foreach (var item in peticion.Articulos)
        {
            if (!productosDb.TryGetValue(item.IdProducto, out var producto))
            {
                return RespuestaApi<VentaRealizadaDto>.CrearError($"El producto con ID {item.IdProducto} no existe en el catálogo.");
            }

            if (!producto.Activo)
            {
                return RespuestaApi<VentaRealizadaDto>.CrearError($"El producto '{producto.Descripcion}' se encuentra inactivo.");
            }

            var precioUnitario = item.PrecioUnitario > 0 ? item.PrecioUnitario : producto.PrecioVenta;
            var precioCosto = producto.PrecioCosto;
            var descuentoPartida = item.Descuento >= 0 ? item.Descuento : 0;
            var subtotalPartida = Math.Round((item.Cantidad * precioUnitario) - descuentoPartida, 2);
            var gananciaPartida = Math.Round(((precioUnitario - precioCosto) * item.Cantidad) - descuentoPartida, 2);

            partidasCalculadas.Add((item, producto, precioUnitario, precioCosto, descuentoPartida, subtotalPartida, gananciaPartida));
        }

        // 5. Totales del ticket
        var subtotal = partidasCalculadas.Sum(p => p.Subtotal);
        var descuentoGlobal = peticion.DescuentoGlobal >= 0 ? peticion.DescuentoGlobal : 0;
        var totalDescuento = partidasCalculadas.Sum(p => p.Descuento) + descuentoGlobal;
        var total = Math.Max(0, subtotal - descuentoGlobal);
        var gananciaTotal = partidasCalculadas.Sum(p => p.Ganancia) - descuentoGlobal;
        var numeroArticulos = partidasCalculadas.Sum(p => p.Solicitud.Cantidad);

        // 6. Validar pagos (Soporte integral de pagos simples y pagos mixtos)
        var pagosSolicitados = new List<VentaPagoDto>();
        if (peticion.Pagos != null && peticion.Pagos.Any())
        {
            pagosSolicitados.AddRange(peticion.Pagos.Where(p => p.Importe > 0));
        }

        decimal importeRecibido;
        decimal cambio;
        var pagosRegistrar = new List<VentaPagoDto>();

        if (!pagosSolicitados.Any())
        {
            // Pago en efectivo implícito si no se enviaron métodos desglosados
            if (peticion.ImporteRecibido < total)
            {
                return RespuestaApi<VentaRealizadaDto>.CrearError($"El importe recibido (${peticion.ImporteRecibido:N2}) es insuficiente para cubrir el total de ${total:N2}.");
            }

            importeRecibido = peticion.ImporteRecibido;
            cambio = Math.Max(0, importeRecibido - total);

            pagosRegistrar.Add(new VentaPagoDto
            {
                IdMetodoPago = 1, // Efectivo
                Importe = total,
                Referencia = "Efectivo"
            });
        }
        else
        {
            // Distinguir pagos en efectivo (IdMetodoPago == 1) y no efectivo
            var pagosNoEfectivo = pagosSolicitados.Where(p => p.IdMetodoPago != 1).ToList();
            var pagosEfectivo = pagosSolicitados.Where(p => p.IdMetodoPago == 1).ToList();

            var sumaNoEfectivo = pagosNoEfectivo.Sum(p => p.Importe);
            var sumaEfectivo = pagosEfectivo.Sum(p => p.Importe);

            // Regla contable: Los métodos electrónicos/vales no pueden exceder el total de la venta
            if (sumaNoEfectivo > total)
            {
                return RespuestaApi<VentaRealizadaDto>.CrearError(
                    $"Los métodos de pago no en efectivo (${sumaNoEfectivo:N2}) no pueden exceder el total de la venta (${total:N2}). No se permite cambio sobre tarjeta o vales.");
            }

            var sumaTotalRecibida = sumaNoEfectivo + sumaEfectivo;
            if (sumaTotalRecibida < total)
            {
                var faltante = total - sumaTotalRecibida;
                return RespuestaApi<VentaRealizadaDto>.CrearError(
                    $"El total de pagos recibidos (${sumaTotalRecibida:N2}) es insuficiente para cubrir la venta (${total:N2}). Faltante: ${faltante:N2}.");
            }

            // El cambio solo proviene del excedente entregado en efectivo
            var remanenteParaEfectivo = total - sumaNoEfectivo;
            cambio = Math.Max(0, sumaEfectivo - remanenteParaEfectivo);
            importeRecibido = sumaTotalRecibida;

            // En dbo.VentaPagos se registran los pagos no efectivo con su importe exacto
            foreach (var pne in pagosNoEfectivo)
            {
                pagosRegistrar.Add(new VentaPagoDto
                {
                    IdMetodoPago = pne.IdMetodoPago,
                    Importe = pne.Importe,
                    Referencia = pne.Referencia
                });
            }

            // Y para el efectivo, se registra el importe neto que efectivamente cubrió la venta
            if (remanenteParaEfectivo > 0)
            {
                pagosRegistrar.Add(new VentaPagoDto
                {
                    IdMetodoPago = 1,
                    Importe = remanenteParaEfectivo,
                    Referencia = pagosEfectivo.FirstOrDefault()?.Referencia ?? "Efectivo"
                });
            }
        }

        // 7. Generar folio comercial único
        var ahora = DateTime.Now;
        var sufijo = Guid.NewGuid().ToString("N")[..6].ToUpper();
        var folioVenta = $"V{ahora:yyyyMMdd}-{sufijo}";

        // 8. Obtener Tipo de Movimiento para Venta en Kardex
        var tipoVenta = await _contexto.TiposMovimientoInventario
            .FirstOrDefaultAsync(t => t.CodigoTipo == "VENTA" || t.CodigoTipo == "SALIDA_VENTA" || t.Descripcion.Contains("Venta"), ct);
        var idTipoMovimientoVenta = tipoVenta?.IdTipoMovimiento ?? 2;

        // 9. Ejecución atómica en transacción SQL Server (compatible con BD en memoria para tests)
        var esInMemory = _contexto.Database.ProviderName?.Contains("InMemory") == true;
        Microsoft.EntityFrameworkCore.Storage.IDbContextTransaction? transaccion = null;
        if (!esInMemory)
        {
            transaccion = await _contexto.Database.BeginTransactionAsync(IsolationLevel.ReadCommitted, ct);
        }

        try
        {
            var venta = new Venta
            {
                FolioVenta = folioVenta,
                IdSucursal = 1,
                IdCaja = peticion.IdCaja > 0 ? peticion.IdCaja : 1,
                IdTurnoCaja = peticion.IdTurnoCaja > 0 ? peticion.IdTurnoCaja : 1,
                IdUsuario = idUsuario,
                IdCliente = idCliente,
                FechaVenta = ahora,
                Subtotal = subtotal,
                Descuento = totalDescuento,
                Impuesto = 0,
                Total = total,
                Ganancia = gananciaTotal,
                ImporteRecibido = importeRecibido,
                Cambio = cambio,
                NumeroArticulos = numeroArticulos,
                Estatus = "Completada",
                EsCancelada = false,
                Notas = peticion.Notas,
                FechaRegistro = ahora,
                TokenIdempotencia = peticion.TokenIdempotencia != Guid.Empty ? peticion.TokenIdempotencia : Guid.NewGuid()
            };

            _contexto.Ventas.Add(venta);
            await _contexto.SaveChangesAsync(ct);

            // Renglones de detalle y descuento de existencias
            foreach (var partida in partidasCalculadas)
            {
                var detalle = new DetalleVenta
                {
                    IdVenta = venta.IdVenta,
                    IdProducto = partida.Producto.IdProducto,
                    CodigoBarras = partida.Solicitud.CodigoBarras,
                    Descripcion = partida.Producto.Descripcion,
                    Cantidad = partida.Solicitud.Cantidad,
                    PrecioCosto = partida.PrecioCosto,
                    PrecioUnitario = partida.PrecioUnitario,
                    Descuento = partida.Descuento,
                    Impuesto = 0,
                    Subtotal = partida.Subtotal,
                    Total = partida.Subtotal,
                    Ganancia = partida.Ganancia,
                    EsDevuelto = false,
                    CantidadDevuelta = 0
                };
                _contexto.DetalleVentas.Add(detalle);

                // Descuento en stock
                decimal stockAnterior = 0;
                if (inventariosDb.TryGetValue(partida.Producto.IdProducto, out var inv))
                {
                    stockAnterior = inv.ExistenciaActual;
                    inv.ExistenciaActual -= partida.Solicitud.Cantidad;
                    inv.FechaUltimaModificacion = ahora;
                }
                else
                {
                    inv = new Inventario
                    {
                        IdSucursal = 1,
                        IdProducto = partida.Producto.IdProducto,
                        ExistenciaActual = -partida.Solicitud.Cantidad,
                        FechaUltimaModificacion = ahora
                    };
                    _contexto.Inventarios.Add(inv);
                    inventariosDb[partida.Producto.IdProducto] = inv;
                }

                // Inserción en Kardex histórico
                var movimiento = new MovimientoInventario
                {
                    IdSucursal = 1,
                    IdProducto = partida.Producto.IdProducto,
                    IdTipoMovimiento = idTipoMovimientoVenta,
                    CantidadAnterior = stockAnterior,
                    CantidadMovimiento = -partida.Solicitud.Cantidad,
                    CantidadNueva = inv.ExistenciaActual,
                    PrecioCosto = partida.PrecioCosto,
                    ReferenciaModulo = "VENTA",
                    IdReferencia = venta.IdVenta,
                    Motivo = $"Venta Ticket {folioVenta}",
                    IdUsuario = idUsuario,
                    FechaMovimiento = ahora
                };
                _contexto.MovimientosInventario.Add(movimiento);
            }

            // Desglose de pagos
            foreach (var pago in pagosRegistrar)
            {
                var ventaPago = new VentaPago
                {
                    IdVenta = venta.IdVenta,
                    IdMetodoPago = pago.IdMetodoPago > 0 ? pago.IdMetodoPago : 1,
                    Importe = pago.Importe,
                    Referencia = pago.Referencia,
                    FechaRegistro = ahora
                };
                _contexto.VentaPagos.Add(ventaPago);
            }

            await _contexto.SaveChangesAsync(ct);
            if (transaccion != null)
            {
                await transaccion.CommitAsync(ct);
            }

            // Auditoría no bloqueante
            _ = _servicioAuditoria.RegistrarAsync(
                "Ventas",
                venta.IdVenta,
                "VENTA",
                null,
                $"{{\"folio\":\"{folioVenta}\",\"total\":{total},\"articulos\":{numeroArticulos},\"cliente\":{idCliente}}}",
                ct
            );

            var resultadoDto = new VentaRealizadaDto
            {
                IdVenta = venta.IdVenta,
                FolioVenta = folioVenta,
                FechaVenta = ahora,
                Subtotal = subtotal,
                Descuento = totalDescuento,
                Impuesto = 0,
                Total = total,
                ImporteRecibido = importeRecibido,
                Cambio = cambio,
                NumeroArticulos = numeroArticulos,
                NombreCajero = nombreUsuario,
                NombreCliente = cliente?.NombreCompleto ?? "Público en General",
                EsReintentoIdempotente = false,
                TokenIdempotencia = venta.TokenIdempotencia
            };

            return RespuestaApi<VentaRealizadaDto>.CrearExito(resultadoDto, "Venta registrada con éxito.");
        }
        catch (Exception ex)
        {
            if (transaccion != null)
            {
                await transaccion.RollbackAsync(ct);
            }
            _logger.LogError(ex, "Error al registrar la venta con folio {Folio}", folioVenta);
            return RespuestaApi<VentaRealizadaDto>.CrearError($"Error al procesar la venta: {ex.Message}");
        }
    }

    /// <inheritdoc />
    public async Task<RespuestaApi<TicketVentaDto>> ObtenerTicketVentaAsync(int idVenta, CancellationToken ct = default)
    {
        if (idVenta <= 0)
        {
            return RespuestaApi<TicketVentaDto>.CrearError("Identificador de venta no válido.");
        }

        var venta = await _contexto.Ventas
            .AsNoTracking()
            .Include(v => v.Cliente)
            .Include(v => v.Usuario)
            .Include(v => v.Detalles)
            .Include(v => v.Pagos)
            .FirstOrDefaultAsync(v => v.IdVenta == idVenta, ct);

        if (venta == null)
        {
            return RespuestaApi<TicketVentaDto>.CrearError("No se encontró el ticket de venta solicitado.");
        }

        var metodosPago = await _contexto.MetodosPago.AsNoTracking().ToDictionaryAsync(m => m.IdMetodoPago, m => m.Descripcion, ct);

        var ticket = new TicketVentaDto
        {
            IdVenta = venta.IdVenta,
            FolioVenta = venta.FolioVenta,
            FechaVenta = venta.FechaVenta,
            NombreNegocio = "ABARROTES ARENAS",
            DireccionNegocio = "Matriz - Tienda Central",
            TelefonoNegocio = "55-1234-5678",
            RfcNegocio = "XAXX010101000",
            NombreCajero = venta.Usuario?.NombreCompleto ?? "Cajero",
            NombreCliente = venta.Cliente?.NombreCompleto ?? "Público en General",
            Caja = $"Caja {venta.IdCaja}",
            Subtotal = venta.Subtotal,
            Descuento = venta.Descuento,
            Impuesto = venta.Impuesto,
            Total = venta.Total,
            ImporteRecibido = venta.ImporteRecibido,
            Cambio = venta.Cambio,
            TotalArticulos = venta.NumeroArticulos,
            Articulos = venta.Detalles.Select(d => new ItemTicketDto
            {
                Descripcion = d.Descripcion,
                Cantidad = d.Cantidad,
                PrecioUnitario = d.PrecioUnitario,
                Importe = d.Subtotal
            }).ToList(),
            Pagos = venta.Pagos.Select(p => new PagoTicketDto
            {
                MetodoPago = metodosPago.TryGetValue(p.IdMetodoPago, out var desc) ? desc : "Efectivo",
                Importe = p.Importe,
                Referencia = p.Referencia
            }).ToList()
        };

        return RespuestaApi<TicketVentaDto>.CrearExito(ticket);
    }

    /// <inheritdoc />
    public async Task<RespuestaApi<ResultadoPaginado<VentaResumenDto>>> ObtenerVentasRecientesAsync(FiltroVentasDto filtro, CancellationToken ct = default)
    {
        filtro ??= new FiltroVentasDto();

        var consulta = _contexto.Ventas
            .AsNoTracking()
            .Include(v => v.Cliente)
            .Include(v => v.Usuario)
            .Include(v => v.Pagos)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(filtro.TerminoBusqueda))
        {
            var termino = filtro.TerminoBusqueda.Trim().ToLower();
            consulta = consulta.Where(v =>
                v.FolioVenta.ToLower().Contains(termino) ||
                (v.Cliente != null && v.Cliente.Nombre.ToLower().Contains(termino)));
        }

        if (filtro.FechaInicio.HasValue)
        {
            consulta = consulta.Where(v => v.FechaVenta >= filtro.FechaInicio.Value);
        }

        if (filtro.FechaFin.HasValue)
        {
            consulta = consulta.Where(v => v.FechaVenta <= filtro.FechaFin.Value);
        }

        if (filtro.IdCaja.HasValue && filtro.IdCaja.Value > 0)
        {
            consulta = consulta.Where(v => v.IdCaja == filtro.IdCaja.Value);
        }

        if (filtro.IdUsuario.HasValue && filtro.IdUsuario.Value > 0)
        {
            consulta = consulta.Where(v => v.IdUsuario == filtro.IdUsuario.Value);
        }

        var total = await consulta.CountAsync(ct);

        var registrosPorPagina = filtro.RegistrosPorPagina;
        if (registrosPorPagina is not (25 or 50 or 100))
        {
            registrosPorPagina = 25;
        }

        var pagina = filtro.Pagina < 1 ? 1 : filtro.Pagina;

        var elementos = await consulta
            .OrderByDescending(v => v.FechaVenta)
            .ThenByDescending(v => v.IdVenta)
            .Skip((pagina - 1) * registrosPorPagina)
            .Take(registrosPorPagina)
            .Select(v => new VentaResumenDto
            {
                IdVenta = v.IdVenta,
                FolioVenta = v.FolioVenta,
                FechaVenta = v.FechaVenta,
                NombreCajero = v.Usuario != null ? v.Usuario.NombreCompleto : "Cajero",
                NombreCliente = v.Cliente != null ? v.Cliente.NombreCompleto : "Público en General",
                Total = v.Total,
                NumeroArticulos = v.NumeroArticulos,
                Estatus = v.Estatus,
                EsCancelada = v.EsCancelada,
                MetodosPago = string.Join(", ", v.Pagos.Select(p => $"${p.Importe:N2}"))
            })
            .ToListAsync(ct);

        var paginado = new ResultadoPaginado<VentaResumenDto>(elementos, total, pagina, registrosPorPagina);
        return RespuestaApi<ResultadoPaginado<VentaResumenDto>>.CrearExito(paginado);
    }

    /// <inheritdoc />
    public async Task<RespuestaApi<bool>> CancelarVentaAsync(int idVenta, string motivo, CancellationToken ct = default)
    {
        if (idVenta <= 0)
        {
            return RespuestaApi<bool>.CrearError("Identificador de venta no válido.");
        }

        var venta = await _contexto.Ventas
            .Include(v => v.Detalles)
            .FirstOrDefaultAsync(v => v.IdVenta == idVenta, ct);

        if (venta == null)
        {
            return RespuestaApi<bool>.CrearError("No se encontró la venta especificada.");
        }

        if (venta.EsCancelada)
        {
            return RespuestaApi<bool>.CrearError("La venta ya ha sido cancelada previamente.");
        }

        var idUsuario = _servicioUsuarioActual.IdUsuario ?? 1;
        var ahora = DateTime.Now;

        var tipoCancelacion = await _contexto.TiposMovimientoInventario
            .FirstOrDefaultAsync(t => t.CodigoTipo == "CANCELACION_VENTA" || t.CodigoTipo == "ENTRADA_DEVOLUCION" || t.Descripcion.Contains("Cancelación"), ct);
        var idTipoMov = tipoCancelacion?.IdTipoMovimiento ?? 1; // Entrada

        var esInMemory = _contexto.Database.ProviderName?.Contains("InMemory") == true;
        Microsoft.EntityFrameworkCore.Storage.IDbContextTransaction? transaccion = null;
        if (!esInMemory)
        {
            transaccion = await _contexto.Database.BeginTransactionAsync(IsolationLevel.ReadCommitted, ct);
        }

        try
        {
            venta.EsCancelada = true;
            venta.Estatus = "Cancelada";
            venta.FechaCancelacion = ahora;
            venta.IdUsuarioCancelacion = idUsuario;
            venta.Notas = string.IsNullOrWhiteSpace(venta.Notas)
                ? $"Cancelada: {motivo}"
                : $"{venta.Notas} | Cancelada: {motivo}";

            var idsProductos = venta.Detalles.Select(d => d.IdProducto).Distinct().ToList();
            var inventariosDb = await _contexto.Inventarios
                .Where(i => idsProductos.Contains(i.IdProducto) && i.IdSucursal == venta.IdSucursal)
                .ToDictionaryAsync(i => i.IdProducto, ct);

            // Revertir inventario de cada detalle
            foreach (var detalle in venta.Detalles)
            {
                decimal stockAnterior = 0;
                if (inventariosDb.TryGetValue(detalle.IdProducto, out var inv))
                {
                    stockAnterior = inv.ExistenciaActual;
                    inv.ExistenciaActual += detalle.Cantidad;
                    inv.FechaUltimaModificacion = ahora;
                }
                else
                {
                    inv = new Inventario
                    {
                        IdSucursal = venta.IdSucursal,
                        IdProducto = detalle.IdProducto,
                        ExistenciaActual = detalle.Cantidad,
                        FechaUltimaModificacion = ahora
                    };
                    _contexto.Inventarios.Add(inv);
                    inventariosDb[detalle.IdProducto] = inv;
                }

                // Asiento de reintegro en Kardex
                var movimientoReversion = new MovimientoInventario
                {
                    IdSucursal = venta.IdSucursal,
                    IdProducto = detalle.IdProducto,
                    IdTipoMovimiento = idTipoMov,
                    CantidadAnterior = stockAnterior,
                    CantidadMovimiento = detalle.Cantidad,
                    CantidadNueva = inv.ExistenciaActual,
                    PrecioCosto = detalle.PrecioCosto,
                    ReferenciaModulo = "VENTA_CANCELADA",
                    IdReferencia = venta.IdVenta,
                    Motivo = $"Cancelación de ticket {venta.FolioVenta}: {motivo}",
                    IdUsuario = idUsuario,
                    FechaMovimiento = ahora
                };
                _contexto.MovimientosInventario.Add(movimientoReversion);
            }

            await _contexto.SaveChangesAsync(ct);
            if (transaccion != null)
            {
                await transaccion.CommitAsync(ct);
            }

            // Auditoría
            _ = _servicioAuditoria.RegistrarAsync(
                "Ventas",
                venta.IdVenta,
                "CANCELACION",
                $"{{\"folio\":\"{venta.FolioVenta}\",\"total\":{venta.Total}}}",
                $"{{\"motivo\":\"{motivo}\",\"usuarioCancelacion\":{idUsuario}}}",
                ct
            );

            return RespuestaApi<bool>.CrearExito(true, "Venta cancelada correctamente y existencias reintegradas al inventario.");
        }
        catch (Exception ex)
        {
            if (transaccion != null)
            {
                await transaccion.RollbackAsync(ct);
            }
            _logger.LogError(ex, "Error al cancelar venta {IdVenta}", idVenta);
            return RespuestaApi<bool>.CrearError($"Error al cancelar la venta: {ex.Message}");
        }
    }

    /// <inheritdoc />
    public async Task<RespuestaApi<List<MetodoPagoDto>>> ObtenerMetodosPagoActivosAsync(CancellationToken ct = default)
    {
        var metodos = await _contexto.MetodosPago
            .AsNoTracking()
            .Where(m => m.Activo)
            .OrderBy(m => m.IdMetodoPago)
            .Select(m => new MetodoPagoDto
            {
                IdMetodoPago = m.IdMetodoPago,
                CodigoMetodo = m.CodigoMetodo,
                Descripcion = m.Descripcion,
                RequiereReferencia = m.RequiereReferencia,
                Activo = m.Activo
            })
            .ToListAsync(ct);

        return RespuestaApi<List<MetodoPagoDto>>.CrearExito(metodos);
    }
}
