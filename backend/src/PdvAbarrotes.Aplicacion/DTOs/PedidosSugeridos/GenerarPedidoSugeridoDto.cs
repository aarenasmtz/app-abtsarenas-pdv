namespace PdvAbarrotes.Aplicacion.DTOs.PedidosSugeridos;

/// <summary>
/// Parámetros para la generación del cálculo de pedido sugerido dominical.
/// </summary>
public class GenerarPedidoSugeridoDto
{
    public int IdSucursal { get; set; } = 1;

    /// <summary>
    /// Ventana de días históricos de venta a analizar (por defecto 14 días para una muestra representativa).
    /// </summary>
    public int DiasAnalisisHistorial { get; set; } = 14;

    /// <summary>
    /// Días de stock a cubrir para el pedido sugerido (por defecto 7 días de semana completa).
    /// </summary>
    public int DiasCobertura { get; set; } = 7;

    /// <summary>
    /// Filtrar opcionalmente por un proveedor predeterminado en específico.
    /// </summary>
    public int? IdProveedor { get; set; }

    /// <summary>
    /// Filtrar opcionalmente por una categoría en específico.
    /// </summary>
    public int? IdCategoria { get; set; }

    /// <summary>
    /// Si es true, solo incluye partidas con CantidadSugerida mayor a 0 (reabastecimiento necesario).
    /// </summary>
    public bool SoloConSugerenciaPositiva { get; set; } = true;

    /// <summary>
    /// Observaciones o notas adicionales del pedido.
    /// </summary>
    public string? Observaciones { get; set; }
}
