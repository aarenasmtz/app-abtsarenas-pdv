using System.ComponentModel.DataAnnotations;

namespace PdvAbarrotes.Aplicacion.DTOs.Compras;

/// <summary>
/// Partida de producto individual recibida en una compra de mercancía.
/// </summary>
public class PartidaCompraDto
{
    [Required(ErrorMessage = "El producto es obligatorio.")]
    public int IdProducto { get; set; }

    [Range(0.0001, 100000, ErrorMessage = "La cantidad debe ser mayor a 0.")]
    public decimal Cantidad { get; set; }

    [Range(0.01, 1000000, ErrorMessage = "El costo unitario debe ser mayor a 0.")]
    public decimal CostoUnitario { get; set; }

    /// <summary>
    /// Si es true, actualiza el precio de costo del producto en el catálogo maestro con el nuevo costo o costo ponderado.
    /// </summary>
    public bool ActualizarPrecioCosto { get; set; } = true;
}
