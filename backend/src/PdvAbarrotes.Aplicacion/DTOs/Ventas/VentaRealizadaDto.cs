namespace PdvAbarrotes.Aplicacion.DTOs.Ventas;

/// <summary>
/// Resultado del procesamiento exitoso de una venta en el PDV.
/// </summary>
public class VentaRealizadaDto
{
    /// <summary>
    /// Identificador único asignado a la venta en la base de datos.
    /// </summary>
    public int IdVenta { get; set; }

    /// <summary>
    /// Folio fiscal/comercial generado para el ticket (ej. V-20260917-0001).
    /// </summary>
    public string FolioVenta { get; set; } = string.Empty;

    /// <summary>
    /// Fecha y hora exacta de registro de la venta.
    /// </summary>
    public DateTime FechaVenta { get; set; }

    /// <summary>
    /// Subtotal acumulado antes de descuentos e impuestos.
    /// </summary>
    public decimal Subtotal { get; set; }

    /// <summary>
    /// Total de descuentos otorgados.
    /// </summary>
    public decimal Descuento { get; set; }

    /// <summary>
    /// Impuestos calculados.
    /// </summary>
    public decimal Impuesto { get; set; }

    /// <summary>
    /// Total final neto cobrado.
    /// </summary>
    public decimal Total { get; set; }

    /// <summary>
    /// Importe entregado por el cliente.
    /// </summary>
    public decimal ImporteRecibido { get; set; }

    /// <summary>
    /// Cambio o vuelto devuelto al cliente.
    /// </summary>
    public decimal Cambio { get; set; }

    /// <summary>
    /// Suma total de unidades de productos vendidas.
    /// </summary>
    public decimal NumeroArticulos { get; set; }

    /// <summary>
    /// Nombre del cajero o usuario que realizó la venta.
    /// </summary>
    public string NombreCajero { get; set; } = string.Empty;

    /// <summary>
    /// Nombre del cliente asignado.
    /// </summary>
    public string NombreCliente { get; set; } = string.Empty;

    /// <summary>
    /// Indica si esta venta fue recuperada por coincidencia de idempotencia previa.
    /// </summary>
    public bool EsReintentoIdempotente { get; set; }

    /// <summary>
    /// Token de idempotencia asociado a la venta.
    /// </summary>
    public Guid? TokenIdempotencia { get; set; }
}
