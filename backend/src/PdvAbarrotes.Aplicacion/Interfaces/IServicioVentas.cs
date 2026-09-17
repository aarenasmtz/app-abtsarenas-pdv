using PdvAbarrotes.Aplicacion.Comun;
using PdvAbarrotes.Aplicacion.DTOs.Ventas;

namespace PdvAbarrotes.Aplicacion.Interfaces;

/// <summary>
/// Contrato para el servicio central de procesamiento de ventas y tickets en el PDV.
/// </summary>
public interface IServicioVentas
{
    /// <summary>
    /// Procesa y registra una venta atómicamente con actualización de inventarios, pagos e idempotencia.
    /// </summary>
    Task<RespuestaApi<VentaRealizadaDto>> RegistrarVentaAsync(RegistrarVentaDto peticion, CancellationToken ct = default);

    /// <summary>
    /// Obtiene la estructura formateada de un ticket para impresión térmica (58mm / 80mm).
    /// </summary>
    Task<RespuestaApi<TicketVentaDto>> ObtenerTicketVentaAsync(int idVenta, CancellationToken ct = default);

    /// <summary>
    /// Obtiene las ventas recientes paginadas para consulta rápida o reimpresión de tickets en la terminal de cobro.
    /// </summary>
    Task<RespuestaApi<ResultadoPaginado<VentaResumenDto>>> ObtenerVentasRecientesAsync(FiltroVentasDto filtro, CancellationToken ct = default);

    /// <summary>
    /// Cancela una venta registrada revirtiendo atómicamente el inventario y registrando la auditoría correspondiente.
    /// </summary>
    Task<RespuestaApi<bool>> CancelarVentaAsync(int idVenta, string motivo, CancellationToken ct = default);
}
