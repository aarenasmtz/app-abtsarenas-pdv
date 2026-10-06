using System.ComponentModel.DataAnnotations;

namespace PdvAbarrotes.Aplicacion.DTOs.Compras;

/// <summary>
/// DTO para el registro atómico de una compra o recepción de mercancía de proveedor.
/// </summary>
public class RegistrarCompraDto
{
    public int? IdProveedor { get; set; }

    public DateTime? FechaCompra { get; set; }

    [MaxLength(250, ErrorMessage = "Las observaciones no pueden exceder 250 caracteres.")]
    public string? Observaciones { get; set; }

    [Required(ErrorMessage = "Debe incluir al menos un artículo o partida de compra.")]
    [MinLength(1, ErrorMessage = "Debe incluir al menos un artículo o partida de compra.")]
    public List<PartidaCompraDto> Partidas { get; set; } = new();
}
