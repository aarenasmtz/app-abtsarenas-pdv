namespace PdvAbarrotes.Dominio.Entidades;

/// <summary>
/// Usuario del sistema (Cajero, Administrador, etc.). Mapea a dbo.Usuarios.
/// </summary>
public class Usuario
{
    public int IdUsuario { get; set; }
    public string NombreCompleto { get; set; } = string.Empty;
    public string NombreUsuario { get; set; } = string.Empty;
    public string ClaveHash { get; set; } = string.Empty;
    public string Correo { get; set; } = string.Empty;
    public string Telefono { get; set; } = string.Empty;
    public bool EsAdministrador { get; set; }
    public bool Activo { get; set; }
    public DateTime FechaRegistro { get; set; }
}
