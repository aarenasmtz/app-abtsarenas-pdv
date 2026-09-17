namespace PdvAbarrotes.Aplicacion.DTOs.Catalogos;

/// <summary>
/// Modelo de transferencia de datos para unidades de medida de productos.
/// </summary>
public class UnidadMedidaDto
{
    public int IdUnidadMedida { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Abreviatura { get; set; } = string.Empty;
    public bool PermiteDecimales { get; set; }
    public decimal FactorConversion { get; set; }
    public bool Activo { get; set; }
}
