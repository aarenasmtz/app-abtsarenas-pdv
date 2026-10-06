using System.ComponentModel.DataAnnotations;

namespace PdvAbarrotes.Aplicacion.DTOs.Proveedores;

/// <summary>
/// DTO para crear un nuevo proveedor en el catálogo.
/// </summary>
public class CrearProveedorDto
{
    [Required(ErrorMessage = "El nombre de la empresa o proveedor es obligatorio.")]
    [MaxLength(150, ErrorMessage = "El nombre no puede exceder 150 caracteres.")]
    public string Nombre { get; set; } = string.Empty;

    [MaxLength(150, ErrorMessage = "El nombre del contacto no puede exceder 150 caracteres.")]
    public string? NombreContacto { get; set; }

    [MaxLength(15, ErrorMessage = "El RFC no puede exceder 15 caracteres.")]
    public string? Rfc { get; set; }

    [MaxLength(50, ErrorMessage = "El teléfono no puede exceder 50 caracteres.")]
    public string? Telefono { get; set; }

    [EmailAddress(ErrorMessage = "El formato de correo no es válido.")]
    [MaxLength(100, ErrorMessage = "El correo no puede exceder 100 caracteres.")]
    public string? Correo { get; set; }

    [MaxLength(250, ErrorMessage = "La dirección no puede exceder 250 caracteres.")]
    public string? Direccion { get; set; }

    [MaxLength(500, ErrorMessage = "Las notas no pueden exceder 500 caracteres.")]
    public string? Notas { get; set; }
}
