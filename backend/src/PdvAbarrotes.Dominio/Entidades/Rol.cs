namespace PdvAbarrotes.Dominio.Entidades;

/// <summary>
/// Rol de seguridad. Mapea a dbo.Roles.
/// </summary>
public class Rol
{
    public int IdRol { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Descripcion { get; set; } = string.Empty;
    public bool Activo { get; set; }
}
