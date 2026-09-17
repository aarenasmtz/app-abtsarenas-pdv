namespace PdvAbarrotes.Dominio.Entidades;

/// <summary>
/// Mapeo entre un usuario y un rol de seguridad. Mapea a dbo.UsuarioRoles.
/// </summary>
public class UsuarioRol
{
    public int IdUsuarioRol { get; set; }
    public int IdUsuario { get; set; }
    public int IdRol { get; set; }

    public virtual Usuario? Usuario { get; set; }
    public virtual Rol? Rol { get; set; }
}
