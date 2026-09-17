namespace PdvAbarrotes.Aplicacion.DTOs.Ventas;

/// <summary>
/// Solicitud de registro de venta enviada desde el terminal de cobro PDV.
/// </summary>
public class RegistrarVentaDto
{
    /// <summary>
    /// Token UUID único de idempotencia generado por el frontend para blindar contra dobles clics.
    /// </summary>
    public Guid TokenIdempotencia { get; set; } = Guid.NewGuid();

    /// <summary>
    /// Identificador del cliente. Por defecto 1 (Público en General / Venta Mostrador).
    /// </summary>
    public int IdCliente { get; set; } = 1;

    /// <summary>
    /// Identificador de la caja física donde se cobra. Por defecto 1 (Caja Principal).
    /// </summary>
    public int IdCaja { get; set; } = 1;

    /// <summary>
    /// Identificador del turno activo de caja. Por defecto 1 o turno vigente.
    /// </summary>
    public int IdTurnoCaja { get; set; } = 1;

    /// <summary>
    /// Descuento global adicional aplicado al ticket completo si corresponde.
    /// </summary>
    public decimal DescuentoGlobal { get; set; } = 0;

    /// <summary>
    /// Importe total de dinero entregado por el cliente.
    /// </summary>
    public decimal ImporteRecibido { get; set; }

    /// <summary>
    /// Notas adicionales del ticket.
    /// </summary>
    public string? Notas { get; set; }

    /// <summary>
    /// Partidas o productos vendidos.
    /// </summary>
    public List<ItemVentaDto> Articulos { get; set; } = new();

    /// <summary>
    /// Desglose de métodos de pago aplicados.
    /// </summary>
    public List<VentaPagoDto> Pagos { get; set; } = new();
}
