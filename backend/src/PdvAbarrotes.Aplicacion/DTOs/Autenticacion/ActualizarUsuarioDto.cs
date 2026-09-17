namespace PdvAbarrotes.Aplicacion.DTOs.Autenticacion;

/// <summary>
/// Parámetros para modificar los datos de un usuario existente.
/// </summary>
public class ActualizarUsuarioDto
{
    public string NombreCompleto { get; set; } = string.Empty;
    public string Correo { get; set; } = string.Empty;
    public string Telefono { get; set; } = string.Empty;
    public int IdRol { get; set; }
    public bool Activo { get; set; }
    public string? NuevaClave { get; set; } // Opcional, solo si se desea resetear
}
