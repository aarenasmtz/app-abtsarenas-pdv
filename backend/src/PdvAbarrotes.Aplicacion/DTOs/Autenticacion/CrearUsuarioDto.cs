namespace PdvAbarrotes.Aplicacion.DTOs.Autenticacion;

/// <summary>
/// Parámetros para dar de alta a un nuevo usuario o cajero en el sistema.
/// </summary>
public class CrearUsuarioDto
{
    public string NombreCompleto { get; set; } = string.Empty;
    public string NombreUsuario { get; set; } = string.Empty;
    public string Clave { get; set; } = string.Empty;
    public string Correo { get; set; } = string.Empty;
    public string Telefono { get; set; } = string.Empty;
    public int IdRol { get; set; } = 2; // Por defecto Cajero (IdRol = 2)
}
