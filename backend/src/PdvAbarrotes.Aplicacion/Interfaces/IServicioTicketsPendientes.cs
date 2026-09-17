using PdvAbarrotes.Aplicacion.Comun;
using PdvAbarrotes.Aplicacion.DTOs.Ventas;

namespace PdvAbarrotes.Aplicacion.Interfaces;

/// <summary>
/// Contrato de servicio para la gestión de ventas en espera (tickets pendientes).
/// </summary>
public interface IServicioTicketsPendientes
{
    /// <summary>
    /// Guarda temporalmente los productos en cola de espera liberando la caja para otros cobros.
    /// </summary>
    Task<RespuestaApi<TicketPendienteDto>> GuardarTicketPendienteAsync(CrearTicketPendienteDto peticion, CancellationToken ct = default);

    /// <summary>
    /// Consulta los tickets pendientes activos ordenados cronológicamente.
    /// </summary>
    Task<RespuestaApi<List<TicketPendienteDto>>> ObtenerTicketsPendientesActivosAsync(int? idCaja = null, CancellationToken ct = default);

    /// <summary>
    /// Recupera los artículos de un ticket pendiente para cargarlos al carrito y lo desactiva de la cola de espera.
    /// </summary>
    Task<RespuestaApi<TicketPendienteDto>> RecuperarTicketPendienteAsync(int idTicketPendiente, CancellationToken ct = default);

    /// <summary>
    /// Descarta y anula un ticket pendiente si el cliente no regresó.
    /// </summary>
    Task<RespuestaApi<bool>> DescartarTicketPendienteAsync(int idTicketPendiente, CancellationToken ct = default);
}
