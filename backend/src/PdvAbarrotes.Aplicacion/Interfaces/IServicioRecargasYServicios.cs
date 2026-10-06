using PdvAbarrotes.Aplicacion.DTOs.Servicios;

namespace PdvAbarrotes.Aplicacion.Interfaces;

/// <summary>
/// Contrato de servicio de aplicación para la gestión de recargas de tiempo aire y cobro de servicios.
/// Conecta el PDV con los proveedores externos mediante sus interfaces desacopladas.
/// </summary>
public interface IServicioRecargasYServicios
{
    /// <summary>
    /// Consulta el estado de configuración de los proveedores externos de recargas y servicios y el saldo en bolsa.
    /// </summary>
    Task<EstadoIntegracionServiciosDto> ObtenerEstadoIntegracionAsync(CancellationToken ct = default);

    /// <summary>
    /// Obtiene el catálogo de compañías telefónicas móviles y montos autorizados para recargas.
    /// </summary>
    Task<IReadOnlyList<CompaniaTelefonicaDto>> ObtenerCompaniasRecargasAsync(CancellationToken ct = default);

    /// <summary>
    /// Obtiene el catálogo de servicios públicos y privados autorizados para cobro en mostrador.
    /// </summary>
    Task<IReadOnlyList<CatalogoServicioDto>> ObtenerCatalogoServiciosAsync(CancellationToken ct = default);

    /// <summary>
    /// Valida y procesa una recarga de tiempo aire electrónico a través del proveedor configurado.
    /// </summary>
    Task<ResultadoRecargaDto> ProcesarRecargaAsync(SolicitudRecargaDto solicitud, CancellationToken ct = default);

    /// <summary>
    /// Valida y procesa el cobro y dispersión de un recibo de servicio público.
    /// </summary>
    Task<ResultadoPagoServicioDto> ProcesarPagoServicioAsync(SolicitudPagoServicioDto solicitud, CancellationToken ct = default);
}
