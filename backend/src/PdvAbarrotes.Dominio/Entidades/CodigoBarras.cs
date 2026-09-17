namespace PdvAbarrotes.Dominio.Entidades;

/// <summary>
/// Código de barras asociado a un producto. Mapea a dbo.CodigosBarras.
/// </summary>
public class CodigoBarras
{
    public int IdCodigoBarras { get; set; }
    public int IdProducto { get; set; }
    public string CodigoValor { get; set; } = string.Empty; // Mapea a columna CodigoBarras
    public bool EsPrincipal { get; set; }
    public bool Activo { get; set; }
    public DateTime FechaRegistro { get; set; }

    public virtual Producto? Producto { get; set; }
}
