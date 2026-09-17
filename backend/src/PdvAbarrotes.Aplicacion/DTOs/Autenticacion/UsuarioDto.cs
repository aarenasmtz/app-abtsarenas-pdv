namespace PdvAbarrotes.Aplicacion.DTOs.Autenticacion;

/// <summary>
/// Modelo de datos público de un usuario del sistema para listados y perfiles.
/// </summary>
public class UsuarioDto
{
    public int IdUsuario { get; set; }
    public string NombreCompleto { get; set; } = string.Empty;
    public string NombreUsuario { get; set; } = string.Empty;
    public string Correo { get; set; } = string.Empty;
    public string Telefono { get; set; } = string.Empty;
    public bool EsAdministrador { get; set; }
    public bool Activo { get; set; }
    public string Rol { get; set; } = "Cajero";
    public DateTime FechaRegistro { get; set; }
}
