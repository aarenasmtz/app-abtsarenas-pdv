namespace PdvAbarrotes.Dominio.Entidades;

/// <summary>
/// Proveedor de productos. Mapea a dbo.Proveedores.
/// </summary>
public class Proveedor
{
    public int IdProveedor { get; set; }
    public string Clave { get; set; } = string.Empty;
    public string NombreComercial { get; set; } = string.Empty;
    public string RazonSocial { get; set; } = string.Empty;
    public string? Rfc { get; set; }
    public string Telefono { get; set; } = string.Empty;
    public string Correo { get; set; } = string.Empty;
    public string Direccion { get; set; } = string.Empty;
    public int DiasCredito { get; set; }
    public bool Activo { get; set; }
    public DateTime FechaRegistro { get; set; }
}
