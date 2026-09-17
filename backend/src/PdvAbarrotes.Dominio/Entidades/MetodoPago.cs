namespace PdvAbarrotes.Dominio.Entidades;

/// <summary>
/// Catálogo de métodos de pago. Mapea a dbo.MetodosPago.
/// </summary>
public class MetodoPago
{
    public int IdMetodoPago { get; set; }
    public string Codigo { get; set; } = string.Empty;
    public string Descripcion { get; set; } = string.Empty;
    public bool Activo { get; set; }
}
