namespace PdvAbarrotes.Aplicacion.DTOs.Catalogos;

/// <summary>
/// Modelo para crear o actualizar un elemento de catálogo simple (Categoría, Marca).
/// </summary>
public class CrearActualizarCatalogoDto
{
    public string Descripcion { get; set; } = string.Empty;
    public bool Activo { get; set; } = true;
}
