namespace PdvAbarrotes.Aplicacion.DTOs.Ventas;

/// <summary>
/// Desglose de cada pago aplicado a una venta (soporte para pagos simples y mixtos).
/// </summary>
public class VentaPagoDto
{
    /// <summary>
    /// Identificador del método de pago (1: Efectivo, 2: Tarjeta de Débito, 3: Tarjeta de Crédito, 4: Vales, 5: Transferencia).
    /// </summary>
    public int IdMetodoPago { get; set; }

    /// <summary>
    /// Importe entregado con este método de pago.
    /// </summary>
    public decimal Importe { get; set; }

    /// <summary>
    /// Referencia opcional (últimos 4 dígitos de tarjeta, número de autorización o folio de transferencia).
    /// </summary>
    public string? Referencia { get; set; }
}
