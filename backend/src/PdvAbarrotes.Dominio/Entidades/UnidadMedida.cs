namespace PdvAbarrotes.Dominio.Entidades;

/// <summary>
/// Unidad de medida (Pieza, Kg, Litro, etc.). Mapea a dbo.UnidadesMedida.
/// </summary>
public class UnidadMedida
{
    public int IdUnidadMedida { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Abreviatura { get; set; } = string.Empty;
    public bool PermiteDecimales { get; set; }
    public decimal FactorConversion { get; set; }
    public bool Activo { get; set; }

    public virtual ICollection<Producto> Productos { get; set; } = new List<Producto>();
}
