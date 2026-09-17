using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using PdvAbarrotes.Aplicacion.Comun;
using PdvAbarrotes.Aplicacion.DTOs.Ventas;
using PdvAbarrotes.Aplicacion.Interfaces;
using PdvAbarrotes.Dominio.Entidades;
using PdvAbarrotes.Infraestructura.Persistencia;

namespace PdvAbarrotes.Infraestructura.Servicios;

/// <summary>
/// Servicio para la administración y control de ventas en espera (tickets pendientes).
/// </summary>
public class ServicioTicketsPendientes : IServicioTicketsPendientes
{
    private readonly ContextoPrincipal _contexto;
    private readonly IServicioAuditoria _servicioAuditoria;
    private readonly IServicioUsuarioActual _servicioUsuarioActual;
    private readonly ILogger<ServicioTicketsPendientes> _logger;

    public ServicioTicketsPendientes(
        ContextoPrincipal contexto,
        IServicioAuditoria servicioAuditoria,
        IServicioUsuarioActual servicioUsuarioActual,
        ILogger<ServicioTicketsPendientes> logger)
    {
        _contexto = contexto;
        _servicioAuditoria = servicioAuditoria;
        _servicioUsuarioActual = servicioUsuarioActual;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<RespuestaApi<TicketPendienteDto>> GuardarTicketPendienteAsync(CrearTicketPendienteDto peticion, CancellationToken ct = default)
    {
        if (peticion == null || peticion.Articulos == null || !peticion.Articulos.Any())
        {
            return RespuestaApi<TicketPendienteDto>.CrearError("No se puede poner en espera una venta sin artículos.");
        }

        var idUsuario = _servicioUsuarioActual.IdUsuario ?? 1;
        var ahora = DateTime.Now;

        var total = peticion.Articulos.Sum(a => a.Cantidad * a.PrecioUnitario);
        var identificador = string.IsNullOrWhiteSpace(peticion.IdentificadorCliente)
            ? $"Espera {ahora:HH:mm:ss}"
            : peticion.IdentificadorCliente.Trim();

        var ticket = new TicketPendiente
        {
            IdCaja = peticion.IdCaja > 0 ? peticion.IdCaja : 1,
            IdUsuario = idUsuario,
            IdCliente = peticion.IdCliente > 0 ? peticion.IdCliente : 1,
            IdentificadorCliente = identificador,
            Total = total,
            FechaRegistro = ahora,
            Activo = true
        };

        _contexto.TicketsPendientes.Add(ticket);
        await _contexto.SaveChangesAsync(ct);

        foreach (var art in peticion.Articulos)
        {
            var detalle = new DetalleTicketPendiente
            {
                IdTicketPendiente = ticket.IdTicketPendiente,
                IdProducto = art.IdProducto,
                Cantidad = art.Cantidad,
                PrecioUnitario = art.PrecioUnitario,
                Subtotal = Math.Round(art.Cantidad * art.PrecioUnitario, 2),
                Notas = art.Notas
            };
            _contexto.DetalleTicketsPendientes.Add(detalle);
        }

        await _contexto.SaveChangesAsync(ct);

        // Auditoría no bloqueante
        _ = _servicioAuditoria.RegistrarAsync(
            "TicketsPendientes",
            ticket.IdTicketPendiente,
            "SUSPENDER_VENTA",
            null,
            $"{{\"identificador\":\"{identificador}\",\"articulos\":{peticion.Articulos.Count},\"total\":{total}}}",
            ct
        );

        var dto = new TicketPendienteDto
        {
            IdTicketPendiente = ticket.IdTicketPendiente,
            IdCaja = ticket.IdCaja,
            IdUsuario = ticket.IdUsuario,
            NombreUsuario = _servicioUsuarioActual.NombreUsuario ?? "Cajero",
            IdCliente = ticket.IdCliente,
            IdentificadorCliente = ticket.IdentificadorCliente,
            Total = ticket.Total,
            CantidadArticulos = peticion.Articulos.Sum(a => a.Cantidad),
            FechaRegistro = ticket.FechaRegistro,
            Activo = ticket.Activo,
            Articulos = peticion.Articulos
        };

        return RespuestaApi<TicketPendienteDto>.CrearExito(dto, "Venta puesta en espera correctamente.");
    }

    /// <inheritdoc />
    public async Task<RespuestaApi<List<TicketPendienteDto>>> ObtenerTicketsPendientesActivosAsync(int? idCaja = null, CancellationToken ct = default)
    {
        var consulta = _contexto.TicketsPendientes
            .AsNoTracking()
            .Where(t => t.Activo);

        if (idCaja.HasValue && idCaja.Value > 0)
        {
            consulta = consulta.Where(t => t.IdCaja == idCaja.Value);
        }

        var tickets = await consulta
            .OrderByDescending(t => t.FechaRegistro)
            .Include(t => t.Detalles)
                .ThenInclude(d => d.Producto)
            .ToListAsync(ct);

        // Obtener nombres de usuarios
        var idsUsuarios = tickets.Select(t => t.IdUsuario).Distinct().ToList();
        var usuarios = await _contexto.Usuarios
            .AsNoTracking()
            .Where(u => idsUsuarios.Contains(u.IdUsuario))
            .ToDictionaryAsync(u => u.IdUsuario, u => u.NombreCompleto, ct);

        var resultado = tickets.Select(t => new TicketPendienteDto
        {
            IdTicketPendiente = t.IdTicketPendiente,
            IdCaja = t.IdCaja,
            IdUsuario = t.IdUsuario,
            NombreUsuario = usuarios.TryGetValue(t.IdUsuario, out var nombre) ? nombre : "Cajero",
            IdCliente = t.IdCliente,
            IdentificadorCliente = t.IdentificadorCliente,
            Total = t.Total,
            CantidadArticulos = t.Detalles.Sum(d => d.Cantidad),
            FechaRegistro = t.FechaRegistro,
            Activo = t.Activo,
            Articulos = t.Detalles.Select(d => new ItemTicketPendienteDto
            {
                IdProducto = d.IdProducto,
                CodigoBarras = d.Producto?.CodigoProducto ?? string.Empty,
                Descripcion = d.Producto?.Descripcion ?? "Producto",
                Cantidad = d.Cantidad,
                PrecioUnitario = d.PrecioUnitario,
                Subtotal = d.Subtotal,
                Notas = d.Notas
            }).ToList()
        }).ToList();

        return RespuestaApi<List<TicketPendienteDto>>.CrearExito(resultado);
    }

    /// <inheritdoc />
    public async Task<RespuestaApi<TicketPendienteDto>> RecuperarTicketPendienteAsync(int idTicketPendiente, CancellationToken ct = default)
    {
        var ticket = await _contexto.TicketsPendientes
            .Include(t => t.Detalles)
                .ThenInclude(d => d.Producto)
            .FirstOrDefaultAsync(t => t.IdTicketPendiente == idTicketPendiente && t.Activo, ct);

        if (ticket == null)
        {
            return RespuestaApi<TicketPendienteDto>.CrearError("El ticket en espera no existe o ya fue reanudado/descartado.");
        }

        // Marcar como inactivo para removerlo de la lista de espera
        ticket.Activo = false;
        await _contexto.SaveChangesAsync(ct);

        // Auditoría no bloqueante
        _ = _servicioAuditoria.RegistrarAsync(
            "TicketsPendientes",
            ticket.IdTicketPendiente,
            "REANUDAR_VENTA",
            "{\"activo\":true}",
            "{\"activo\":false}",
            ct
        );

        var dto = new TicketPendienteDto
        {
            IdTicketPendiente = ticket.IdTicketPendiente,
            IdCaja = ticket.IdCaja,
            IdUsuario = ticket.IdUsuario,
            NombreUsuario = _servicioUsuarioActual.NombreUsuario ?? "Cajero",
            IdCliente = ticket.IdCliente,
            IdentificadorCliente = ticket.IdentificadorCliente,
            Total = ticket.Total,
            CantidadArticulos = ticket.Detalles.Sum(d => d.Cantidad),
            FechaRegistro = ticket.FechaRegistro,
            Activo = ticket.Activo,
            Articulos = ticket.Detalles.Select(d => new ItemTicketPendienteDto
            {
                IdProducto = d.IdProducto,
                CodigoBarras = d.Producto?.CodigoProducto ?? string.Empty,
                Descripcion = d.Producto?.Descripcion ?? "Producto",
                Cantidad = d.Cantidad,
                PrecioUnitario = d.PrecioUnitario,
                Subtotal = d.Subtotal,
                Notas = d.Notas
            }).ToList()
        };

        return RespuestaApi<TicketPendienteDto>.CrearExito(dto, "Ticket en espera reanudado para cobro.");
    }

    /// <inheritdoc />
    public async Task<RespuestaApi<bool>> DescartarTicketPendienteAsync(int idTicketPendiente, CancellationToken ct = default)
    {
        var ticket = await _contexto.TicketsPendientes
            .FirstOrDefaultAsync(t => t.IdTicketPendiente == idTicketPendiente && t.Activo, ct);

        if (ticket == null)
        {
            return RespuestaApi<bool>.CrearError("El ticket en espera no existe o ya fue cerrado.");
        }

        ticket.Activo = false;
        await _contexto.SaveChangesAsync(ct);

        _ = _servicioAuditoria.RegistrarAsync(
            "TicketsPendientes",
            ticket.IdTicketPendiente,
            "DESCARTAR_VENTA_ESPERA",
            "{\"activo\":true}",
            "{\"activo\":false}",
            ct
        );

        return RespuestaApi<bool>.CrearExito(true, "Ticket en espera descartado correctamente.");
    }
}
