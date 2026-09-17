using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using PdvAbarrotes.Aplicacion.DTOs.Caja;
using PdvAbarrotes.Aplicacion.Interfaces;
using PdvAbarrotes.Dominio.Entidades;

namespace PdvAbarrotes.Infraestructura.Servicios;

/// <summary>
/// Implementación de la lógica de negocio para control de cajas, turnos, movimientos y cortes contables X/Z.
/// </summary>
public class ServicioCaja : IServicioCaja
{
    private readonly IContextoPrincipal _contexto;
    private readonly IServicioAuditoria _servicioAuditoria;
    private readonly ILogger<ServicioCaja> _logger;

    public ServicioCaja(
        IContextoPrincipal contexto,
        IServicioAuditoria servicioAuditoria,
        ILogger<ServicioCaja> logger)
    {
        _contexto = contexto;
        _servicioAuditoria = servicioAuditoria;
        _logger = logger;
    }

    public async Task<IReadOnlyList<CajaDto>> ObtenerCajasDisponiblesAsync()
    {
        var cajas = await _contexto.Cajas
            .AsNoTracking()
            .Where(c => c.Activo)
            .OrderBy(c => c.IdCaja)
            .ToListAsync();

        var turnosAbiertos = await _contexto.TurnosCaja
            .Include(t => t.Usuario)
            .AsNoTracking()
            .Where(t => t.Estatus.ToUpper() == "ABIERTO")
            .ToListAsync();

        var resultado = new List<CajaDto>();

        foreach (var caja in cajas)
        {
            var turnoAbierto = turnosAbiertos.FirstOrDefault(t => t.IdCaja == caja.IdCaja);
            resultado.Add(new CajaDto
            {
                IdCaja = caja.IdCaja,
                IdSucursal = caja.IdSucursal,
                Nombre = caja.Nombre,
                EsPrincipal = caja.EsPrincipal,
                NombreEquipo = caja.NombreEquipo,
                DireccionIp = caja.DireccionIp,
                Activo = caja.Activo,
                TieneTurnoAbierto = turnoAbierto != null,
                IdTurnoActual = turnoAbierto?.IdTurnoCaja,
                NombreCajeroActual = turnoAbierto?.Usuario?.NombreCompleto
            });
        }

        return resultado;
    }

    public async Task<TurnoCajaDto?> ObtenerTurnoActualAsync(int? idCaja = null, int? idUsuario = null)
    {
        var consulta = _contexto.TurnosCaja
            .Include(t => t.Caja)
            .Include(t => t.Usuario)
            .Where(t => t.Estatus.ToUpper() == "ABIERTO");

        if (idCaja.HasValue && idCaja.Value > 0)
        {
            consulta = consulta.Where(t => t.IdCaja == idCaja.Value);
        }

        if (idUsuario.HasValue && idUsuario.Value > 0)
        {
            consulta = consulta.Where(t => t.IdUsuario == idUsuario.Value);
        }

        var turno = await consulta
            .OrderByDescending(t => t.FechaInicio)
            .FirstOrDefaultAsync();

        if (turno == null)
        {
            return null;
        }

        // Totales en vivo para el turno
        var movimientos = await _contexto.MovimientosCaja
            .Where(m => m.IdTurnoCaja == turno.IdTurnoCaja)
            .ToListAsync();

        decimal montoInicial = movimientos
            .Where(m => m.TipoMovimiento.ToUpper() == "ENTRADA" && m.Descripcion.ToUpper().StartsWith("FONDO INICIAL"))
            .Sum(m => m.Monto);

        decimal entradasEfectivo = movimientos
            .Where(m => m.TipoMovimiento.ToUpper() == "ENTRADA" && !m.Descripcion.ToUpper().StartsWith("FONDO INICIAL"))
            .Sum(m => m.Monto);

        decimal salidasEfectivo = movimientos
            .Where(m => m.TipoMovimiento.ToUpper() == "SALIDA" || m.TipoMovimiento.ToUpper() == "DEVOLUCION")
            .Sum(m => m.Monto);

        // Ventas y pagos en efectivo
        var ventasTurno = await _contexto.Ventas
            .Include(v => v.Pagos)
            .Where(v => v.IdTurnoCaja == turno.IdTurnoCaja && !v.EsCancelada)
            .ToListAsync();

        decimal ventasEfectivo = 0m;
        foreach (var venta in ventasTurno)
        {
            if (venta.Pagos.Any())
            {
                ventasEfectivo += venta.Pagos.Where(p => p.IdMetodoPago == 1).Sum(p => p.Importe);
            }
            else
            {
                ventasEfectivo += venta.Total;
            }
        }

        return new TurnoCajaDto
        {
            IdTurnoCaja = turno.IdTurnoCaja,
            IdCaja = turno.IdCaja,
            NombreCaja = turno.Caja?.Nombre ?? $"Caja #{turno.IdCaja}",
            IdUsuario = turno.IdUsuario,
            NombreUsuario = turno.Usuario?.NombreCompleto ?? $"Usuario #{turno.IdUsuario}",
            FechaInicio = turno.FechaInicio,
            FechaCierre = turno.FechaCierre,
            Estatus = turno.Estatus.ToUpper(),
            MontoInicial = montoInicial,
            VentasEfectivo = ventasEfectivo,
            EntradasEfectivo = entradasEfectivo,
            SalidasEfectivo = salidasEfectivo,
            TotalTransacciones = ventasTurno.Count
        };
    }

    public async Task<TurnoCajaDto> AbrirTurnoAsync(AbrirTurnoDto dto, int idUsuario)
    {
        var caja = await _contexto.Cajas.FindAsync(dto.IdCaja);
        if (caja == null || !caja.Activo)
        {
            throw new InvalidOperationException($"La caja #{dto.IdCaja} no existe o no se encuentra activa.");
        }

        // Verificar si la caja ya tiene un turno abierto
        var turnoCajaAbierto = await _contexto.TurnosCaja
            .AnyAsync(t => t.IdCaja == dto.IdCaja && t.Estatus.ToUpper() == "ABIERTO");
        if (turnoCajaAbierto)
        {
            throw new InvalidOperationException($"La caja '{caja.Nombre}' ya cuenta con un turno abierto.");
        }

        // Verificar si el usuario ya tiene un turno abierto en alguna caja
        var turnoUsuarioAbierto = await _contexto.TurnosCaja
            .AnyAsync(t => t.IdUsuario == idUsuario && t.Estatus.ToUpper() == "ABIERTO");
        if (turnoUsuarioAbierto)
        {
            throw new InvalidOperationException("El usuario ya tiene un turno activo en otra caja. Cierre el turno anterior antes de iniciar uno nuevo.");
        }

        var ahora = DateTime.Now;
        var nuevoTurno = new TurnoCaja
        {
            IdCaja = dto.IdCaja,
            IdUsuario = idUsuario,
            FechaInicio = ahora,
            FechaCierre = null,
            Estatus = "ABIERTO"
        };

        _contexto.TurnosCaja.Add(nuevoTurno);
        await _contexto.SaveChangesAsync();

        // Registrar fondo inicial como movimiento de caja si es mayor a cero
        if (dto.MontoInicial > 0)
        {
            var movimientoFondo = new MovimientoCaja
            {
                IdTurnoCaja = nuevoTurno.IdTurnoCaja,
                IdCaja = dto.IdCaja,
                TipoMovimiento = "ENTRADA",
                Monto = dto.MontoInicial,
                Descripcion = $"FONDO INICIAL DE APERTURA (Turno #{nuevoTurno.IdTurnoCaja})",
                FechaMovimiento = ahora
            };
            _contexto.MovimientosCaja.Add(movimientoFondo);
            await _contexto.SaveChangesAsync();
        }

        await _servicioAuditoria.RegistrarAsync(
            "TurnosCaja",
            nuevoTurno.IdTurnoCaja,
            "APERTURA_TURNO",
            null,
            $"Caja: {caja.Nombre}, Fondo: ${dto.MontoInicial:N2}"
        );

        var usuario = await _contexto.Usuarios.FindAsync(idUsuario);

        return new TurnoCajaDto
        {
            IdTurnoCaja = nuevoTurno.IdTurnoCaja,
            IdCaja = nuevoTurno.IdCaja,
            NombreCaja = caja.Nombre,
            IdUsuario = idUsuario,
            NombreUsuario = usuario?.NombreCompleto ?? string.Empty,
            FechaInicio = nuevoTurno.FechaInicio,
            FechaCierre = null,
            Estatus = "ABIERTO",
            MontoInicial = dto.MontoInicial,
            VentasEfectivo = 0,
            EntradasEfectivo = 0,
            SalidasEfectivo = 0,
            TotalTransacciones = 0
        };
    }

    public async Task<MovimientoCajaDto> RegistrarMovimientoAsync(RegistrarMovimientoCajaDto dto, int idUsuario)
    {
        var turno = await _contexto.TurnosCaja.FindAsync(dto.IdTurnoCaja);
        if (turno == null || turno.Estatus.ToUpper() != "ABIERTO")
        {
            throw new InvalidOperationException($"El turno #{dto.IdTurnoCaja} no existe o no se encuentra abierto.");
        }

        string tipoNormalizado = dto.TipoMovimiento.Trim().ToUpper();
        if (tipoNormalizado != "ENTRADA" && tipoNormalizado != "SALIDA")
        {
            throw new ArgumentException("El tipo de movimiento debe ser ENTRADA o SALIDA.");
        }

        if (dto.Monto <= 0)
        {
            throw new ArgumentException("El monto del movimiento debe ser superior a cero.");
        }

        // Si es una salida, verificar que no supere el efectivo disponible en caja
        if (tipoNormalizado == "SALIDA")
        {
            var turnoActual = await ObtenerTurnoActualAsync(turno.IdCaja, turno.IdUsuario);
            if (turnoActual != null && dto.Monto > turnoActual.EfectivoActualEnCaja)
            {
                throw new InvalidOperationException($"Fondos insuficientes en caja. Efectivo disponible: ${turnoActual.EfectivoActualEnCaja:N2}, monto a retirar: ${dto.Monto:N2}.");
            }
        }

        var ahora = DateTime.Now;
        var movimiento = new MovimientoCaja
        {
            IdTurnoCaja = turno.IdTurnoCaja,
            IdCaja = turno.IdCaja,
            TipoMovimiento = tipoNormalizado,
            Monto = dto.Monto,
            Descripcion = dto.Descripcion.Trim(),
            FechaMovimiento = ahora
        };

        _contexto.MovimientosCaja.Add(movimiento);
        await _contexto.SaveChangesAsync();

        await _servicioAuditoria.RegistrarAsync(
            "MovimientosCaja",
            movimiento.IdMovimientoCaja,
            $"MOVIMIENTO_{tipoNormalizado}",
            null,
            $"Turno #{turno.IdTurnoCaja}, Monto: ${dto.Monto:N2}, Motivo: {dto.Descripcion}"
        );

        return new MovimientoCajaDto
        {
            IdMovimientoCaja = movimiento.IdMovimientoCaja,
            IdTurnoCaja = movimiento.IdTurnoCaja,
            IdCaja = movimiento.IdCaja,
            TipoMovimiento = movimiento.TipoMovimiento,
            Monto = movimiento.Monto,
            Descripcion = movimiento.Descripcion,
            FechaMovimiento = movimiento.FechaMovimiento
        };
    }

    public async Task<IReadOnlyList<MovimientoCajaDto>> ObtenerMovimientosTurnoAsync(int idTurnoCaja)
    {
        var movimientos = await _contexto.MovimientosCaja
            .AsNoTracking()
            .Where(m => m.IdTurnoCaja == idTurnoCaja)
            .OrderByDescending(m => m.FechaMovimiento)
            .ToListAsync();

        return movimientos.Select(m => new MovimientoCajaDto
        {
            IdMovimientoCaja = m.IdMovimientoCaja,
            IdTurnoCaja = m.IdTurnoCaja,
            IdCaja = m.IdCaja,
            TipoMovimiento = m.TipoMovimiento,
            Monto = m.Monto,
            Descripcion = m.Descripcion,
            FechaMovimiento = m.FechaMovimiento
        }).ToList();
    }

    public async Task<ResumenCorteDto> CalcularCorteXAsync(int idTurnoCaja)
    {
        var turno = await _contexto.TurnosCaja
            .Include(t => t.Caja)
            .Include(t => t.Usuario)
            .FirstOrDefaultAsync(t => t.IdTurnoCaja == idTurnoCaja);

        if (turno == null)
        {
            throw new KeyNotFoundException($"El turno #{idTurnoCaja} no fue encontrado.");
        }

        return await ConstruirResumenTurnoAsync(turno, "X", totalContado: 0m, observaciones: null);
    }

    public async Task<ResumenCorteDto> CerrarTurnoCorteZAsync(CerrarTurnoDto dto, int idUsuario)
    {
        var turno = await _contexto.TurnosCaja
            .Include(t => t.Caja)
            .Include(t => t.Usuario)
            .FirstOrDefaultAsync(t => t.IdTurnoCaja == dto.IdTurnoCaja);

        if (turno == null)
        {
            throw new KeyNotFoundException($"El turno #{dto.IdTurnoCaja} no fue encontrado.");
        }

        if (turno.Estatus.ToUpper() != "ABIERTO")
        {
            throw new InvalidOperationException($"El turno #{dto.IdTurnoCaja} ya se encuentra cerrado.");
        }

        var ahora = DateTime.Now;
        var resumen = await ConstruirResumenTurnoAsync(turno, "Z", dto.TotalContado, dto.Observaciones);

        // Registrar registro definitivo en dbo.CortesCaja
        var corteZ = new CorteCaja
        {
            IdTurnoCaja = turno.IdTurnoCaja,
            IdCaja = turno.IdCaja,
            IdUsuario = idUsuario,
            FechaCorte = ahora,
            TipoCorte = "Z",
            MontoInicial = resumen.MontoInicial,
            VentasEfectivo = resumen.VentasEfectivo,
            VentasTarjeta = resumen.VentasTarjeta,
            VentasVales = resumen.VentasVales,
            VentasCredito = resumen.VentasCredito,
            EntradasEfectivo = resumen.EntradasEfectivo,
            SalidasEfectivo = resumen.SalidasEfectivo,
            TotalEsperado = resumen.TotalEsperadoEnCaja,
            TotalContado = dto.TotalContado,
            Diferencia = resumen.Diferencia,
            Observaciones = dto.Observaciones
        };

        _contexto.CortesCaja.Add(corteZ);

        // Actualizar estatus y fecha de cierre del turno
        turno.Estatus = "CERRADO";
        turno.FechaCierre = ahora;

        await _contexto.SaveChangesAsync();

        resumen.IdCorteCaja = corteZ.IdCorteCaja;
        resumen.EstatusTurno = "CERRADO";

        await _servicioAuditoria.RegistrarAsync(
            "CortesCaja",
            corteZ.IdCorteCaja,
            "CORTE_Z_CIERRE",
            null,
            $"Turno #{turno.IdTurnoCaja}, Esperado: ${resumen.TotalEsperadoEnCaja:N2}, Contado: ${dto.TotalContado:N2}, Dif: ${resumen.Diferencia:N2}"
        );

        return resumen;
    }

    public async Task<IReadOnlyList<CorteCajaDto>> ObtenerHistorialCortesAsync(int? idCaja = null, DateTime? fechaInicio = null, DateTime? fechaFin = null)
    {
        var consulta = _contexto.CortesCaja
            .Include(c => c.Caja)
            .Include(c => c.Usuario)
            .AsNoTracking()
            .AsQueryable();

        if (idCaja.HasValue && idCaja.Value > 0)
        {
            consulta = consulta.Where(c => c.IdCaja == idCaja.Value);
        }

        if (fechaInicio.HasValue)
        {
            consulta = consulta.Where(c => c.FechaCorte >= fechaInicio.Value);
        }

        if (fechaFin.HasValue)
        {
            var fechaHasta = fechaFin.Value.Date.AddDays(1).AddTicks(-1);
            consulta = consulta.Where(c => c.FechaCorte <= fechaHasta);
        }

        var lista = await consulta
            .OrderByDescending(c => c.FechaCorte)
            .Take(100)
            .ToListAsync();

        return lista.Select(c => new CorteCajaDto
        {
            IdCorteCaja = c.IdCorteCaja,
            IdTurnoCaja = c.IdTurnoCaja,
            IdCaja = c.IdCaja,
            NombreCaja = c.Caja?.Nombre ?? $"Caja #{c.IdCaja}",
            IdUsuario = c.IdUsuario,
            NombreUsuario = c.Usuario?.NombreCompleto ?? $"Usuario #{c.IdUsuario}",
            FechaCorte = c.FechaCorte,
            TipoCorte = c.TipoCorte,
            MontoInicial = c.MontoInicial,
            VentasEfectivo = c.VentasEfectivo,
            VentasTarjeta = c.VentasTarjeta,
            VentasVales = c.VentasVales,
            VentasCredito = c.VentasCredito,
            EntradasEfectivo = c.EntradasEfectivo,
            SalidasEfectivo = c.SalidasEfectivo,
            TotalEsperado = c.TotalEsperado,
            TotalContado = c.TotalContado,
            Diferencia = c.Diferencia,
            Observaciones = c.Observaciones
        }).ToList();
    }

    private async Task<ResumenCorteDto> ConstruirResumenTurnoAsync(TurnoCaja turno, string tipoCorte, decimal totalContado, string? observaciones)
    {
        var movimientos = await _contexto.MovimientosCaja
            .Where(m => m.IdTurnoCaja == turno.IdTurnoCaja)
            .ToListAsync();

        decimal montoInicial = movimientos
            .Where(m => m.TipoMovimiento.ToUpper() == "ENTRADA" && m.Descripcion.ToUpper().StartsWith("FONDO INICIAL"))
            .Sum(m => m.Monto);

        decimal entradasEfectivo = movimientos
            .Where(m => m.TipoMovimiento.ToUpper() == "ENTRADA" && !m.Descripcion.ToUpper().StartsWith("FONDO INICIAL"))
            .Sum(m => m.Monto);

        decimal salidasEfectivo = movimientos
            .Where(m => m.TipoMovimiento.ToUpper() == "SALIDA" || m.TipoMovimiento.ToUpper() == "DEVOLUCION")
            .Sum(m => m.Monto);

        var ventas = await _contexto.Ventas
            .Include(v => v.Pagos)
            .Where(v => v.IdTurnoCaja == turno.IdTurnoCaja && !v.EsCancelada)
            .ToListAsync();

        decimal ventasEfectivo = 0m;
        decimal ventasTarjeta = 0m;
        decimal ventasVales = 0m;
        decimal ventasTransferencia = 0m;
        decimal ventasCredito = 0m;

        foreach (var venta in ventas)
        {
            if (venta.Pagos.Any())
            {
                foreach (var pago in venta.Pagos)
                {
                    switch (pago.IdMetodoPago)
                    {
                        case 1: // Efectivo
                            ventasEfectivo += pago.Importe;
                            break;
                        case 2: // Tarjeta
                            ventasTarjeta += pago.Importe;
                            break;
                        case 3: // Vales
                            ventasVales += pago.Importe;
                            break;
                        case 4: // Credito
                            ventasCredito += pago.Importe;
                            break;
                        case 5: // Transferencia
                            ventasTransferencia += pago.Importe;
                            break;
                        default:
                            ventasEfectivo += pago.Importe;
                            break;
                    }
                }
            }
            else
            {
                // Para ventas sin desglose detallado de pagos, considerar efectivo por defecto
                ventasEfectivo += venta.Total;
            }
        }

        decimal totalVentas = ventas.Sum(v => v.Total);
        decimal totalEsperadoEnCaja = montoInicial + ventasEfectivo + entradasEfectivo - salidasEfectivo;
        decimal diferencia = totalContado - totalEsperadoEnCaja;

        return new ResumenCorteDto
        {
            IdTurnoCaja = turno.IdTurnoCaja,
            IdCaja = turno.IdCaja,
            NombreCaja = turno.Caja?.Nombre ?? $"Caja #{turno.IdCaja}",
            IdUsuario = turno.IdUsuario,
            NombreUsuario = turno.Usuario?.NombreCompleto ?? $"Usuario #{turno.IdUsuario}",
            FechaInicio = turno.FechaInicio,
            FechaCorte = DateTime.Now,
            TipoCorte = tipoCorte,
            MontoInicial = montoInicial,
            VentasEfectivo = ventasEfectivo,
            VentasTarjeta = ventasTarjeta,
            VentasTransferencia = ventasTransferencia,
            VentasVales = ventasVales,
            VentasCredito = ventasCredito,
            TotalVentas = totalVentas,
            EntradasEfectivo = entradasEfectivo,
            SalidasEfectivo = salidasEfectivo,
            TotalEsperadoEnCaja = totalEsperadoEnCaja,
            TotalContado = totalContado,
            Diferencia = diferencia,
            Observaciones = observaciones,
            TotalTransacciones = ventas.Count,
            EstatusTurno = turno.Estatus.ToUpper()
        };
    }
}
