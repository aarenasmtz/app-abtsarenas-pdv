namespace PdvAbarrotes.Aplicacion.DTOs.Autenticacion;

/// <summary>
/// Respuesta satisfactoria de autenticación con token JWT y datos de sesión.
/// </summary>
public class RespuestaLoginDto
{
    public string Token { get; set; } = string.Empty;
    public int IdUsuario { get; set; }
    public string NombreCompleto { get; set; } = string.Empty;
    public string NombreUsuario { get; set; } = string.Empty;
    public string Rol { get; set; } = string.Empty;
    public DateTime FechaExpiracion { get; set; }
}
