using PdvAbarrotes.Aplicacion.DTOs.Servicios;

namespace PdvAbarrotes.Aplicacion.Interfaces;

/// <summary>
/// Contrato de cliente de comunicación SOAP hacia el Web Service de Red Nacional de Pagos (VentaMovil).
/// </summary>
public interface IProveedorRnpSoapCliente
{
    /// <summary>
    /// Envía una transacción de recarga o pago de servicio (Request_Transaction).
    /// </summary>
    Task<RnpTransactionResult> SolicitarTransaccionAsync(
        RnpRequestTransactionPayload peticion,
        CancellationToken ct = default);

    /// <summary>
    /// Consulta el estado de una transacción previamente enviada por su Folio_POS (check_transaction).
    /// </summary>
    Task<RnpTransactionResult> ConsultarEstadoTransaccionAsync(
        string folioPos,
        CancellationToken ct = default);

    /// <summary>
    /// Consulta el saldo actual en bolsa asignado a la cuenta comercial (Check_Balance).
    /// </summary>
    Task<RnpBalanceResult> ConsultarSaldoAsync(CancellationToken ct = default);

    /// <summary>
    /// Obtiene el catálogo actualizado de SKUs, operadoras, montos y servicios autorizados (pos_prices_products).
    /// </summary>
    Task<RnpPosPricesResult> ConsultarCatalogoProductosAsync(CancellationToken ct = default);

    /// <summary>
    /// Consulta el adeudo de un recibo o referencia en los servicios que lo soportan (check_service_pending_amount).
    /// </summary>
    Task<RnpPendingAmountResult> ConsultarAdeudoServicioAsync(
        string idOperadora,
        string referencia,
        CancellationToken ct = default);
}
