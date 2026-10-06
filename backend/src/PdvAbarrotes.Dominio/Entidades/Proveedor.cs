namespace PdvAbarrotes.Dominio.Entidades;

/// <summary>
/// Proveedor comercial de abarrotes y mercancías. Mapea a dbo.Proveedores.
/// </summary>
public class Proveedor
{
    public int IdProveedor { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? NombreContacto { get; set; }
    public string? Rfc { get; set; }
    public string? Telefono { get; set; }
    public string? Correo { get; set; }
    public string? Direccion { get; set; }
    public string? Notas { get; set; }
    public bool Activo { get; set; }
    public DateTime FechaRegistro { get; set; }
}
