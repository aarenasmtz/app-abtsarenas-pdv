using System.ComponentModel.DataAnnotations;

namespace PdvAbarrotes.Aplicacion.DTOs.Caja;

/// <summary>
/// DTO para el cierre de turno y corte Z con arqueo ciego.
/// </summary>
public class CerrarTurnoDto
{
    [Required(ErrorMessage = "El identificador del turno es requerido.")]
    public int IdTurnoCaja { get; set; }

    [Range(0, 10000000, ErrorMessage = "El total contado debe ser mayor o igual a 0.")]
    public decimal TotalContado { get; set; }

    [MaxLength(250, ErrorMessage = "Las observaciones no pueden exceder 250 caracteres.")]
    public string? Observaciones { get; set; }
}
