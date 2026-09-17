using System.ComponentModel.DataAnnotations;

namespace PdvAbarrotes.Aplicacion.DTOs.Caja;

/// <summary>
/// DTO para registrar un movimiento manual de efectivo (entrada o salida) en el turno actual.
/// </summary>
public class RegistrarMovimientoCajaDto
{
    [Required(ErrorMessage = "El identificador del turno es requerido.")]
    public int IdTurnoCaja { get; set; }

    [Required(ErrorMessage = "El tipo de movimiento es requerido.")]
    [RegularExpression("^(ENTRADA|SALIDA|Entrada|Salida)$", ErrorMessage = "El tipo de movimiento debe ser ENTRADA o SALIDA.")]
    public string TipoMovimiento { get; set; } = string.Empty;

    [Range(0.01, 1000000, ErrorMessage = "El monto debe ser mayor a 0.")]
    public decimal Monto { get; set; }

    [Required(ErrorMessage = "La descripción o motivo del movimiento es obligatoria.")]
    [MaxLength(250, ErrorMessage = "La descripción no puede exceder 250 caracteres.")]
    public string Descripcion { get; set; } = string.Empty;
}
