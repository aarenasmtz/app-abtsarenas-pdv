using System.ComponentModel.DataAnnotations;

namespace PdvAbarrotes.Aplicacion.DTOs.Caja;

/// <summary>
/// DTO para la apertura de turno con fondo inicial.
/// </summary>
public class AbrirTurnoDto
{
    [Required(ErrorMessage = "La caja es requerida.")]
    public int IdCaja { get; set; }

    [Range(0, 1000000, ErrorMessage = "El monto inicial debe ser mayor o igual a 0.")]
    public decimal MontoInicial { get; set; }
}
