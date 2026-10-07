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

    /// <summary>
    /// Consulta el adeudo de un recibo o servicio en los convenios que lo permiten.
    /// </summary>
    Task<ResultadoConsultaAdeudoDto> ConsultarAdeudoServicioAsync(SolicitudConsultaAdeudoDto solicitud, CancellationToken ct = default);

    /// <summary>
    /// Sincroniza el catálogo completo de 400+ productos y servicios desde el proveedor RNP a la base de datos.
    /// </summary>
    Task<int> SincronizarCatalogoRnpAsync(CancellationToken ct = default);

    /// <summary>
    /// Obtiene las transacciones registradas de recargas y pagos de servicios con filtros.
    /// </summary>
    Task<IReadOnlyList<TransaccionServicioDetalleDto>> ConsultarTransaccionesAsync(FiltroTransaccionesServiciosDto filtro, CancellationToken ct = default);

    /// <summary>
    /// Obtiene el registro de eventos de la bitácora operativa de servicios.
    /// </summary>
    Task<IReadOnlyList<RegistroBitacoraDto>> ConsultarBitacoraAsync(string? folioPos, int limite = 50, CancellationToken ct = default);

    /// <summary>
    /// Obtiene el log de errores técnicos de la integración.
    /// </summary>
    Task<IReadOnlyList<RegistroLogErrorDto>> ConsultarLogErroresAsync(string? folioPos, int limite = 50, CancellationToken ct = default);

    /// <summary>
    /// Consulta el saldo detallado de la bolsa RNP (Balance, compras, ventas, comisión).
    /// </summary>
    Task<RnpBalanceResult> ConsultarSaldoBolsaDetalladoAsync(CancellationToken ct = default);
}
