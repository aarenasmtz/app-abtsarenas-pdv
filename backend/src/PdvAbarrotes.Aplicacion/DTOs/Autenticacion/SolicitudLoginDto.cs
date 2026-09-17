namespace PdvAbarrotes.Aplicacion.DTOs.Autenticacion;

/// <summary>
/// Solicitud de credenciales para inicio de sesión en el sistema.
/// </summary>
public class SolicitudLoginDto
{
    public string NombreUsuario { get; set; } = string.Empty;
    public string Clave { get; set; } = string.Empty;
}
