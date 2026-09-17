namespace PdvAbarrotes.Dominio.Entidades;

/// <summary>
/// Encabezado de ajuste de inventario (auditoría física o merma). Mapea a dbo.AjustesInventario.
/// </summary>
public class AjusteInventario
{
    public int IdAjusteInventario { get; set; }
    public int FolioAjuste { get; set; }
    public int IdSucursal { get; set; }
    public int IdUsuario { get; set; }
    public DateTime FechaAjuste { get; set; }
    public string Motivo { get; set; } = string.Empty;
    public string? Observaciones { get; set; }

    // Propiedades de navegación
    public virtual Usuario? Usuario { get; set; }
    public virtual ICollection<DetalleAjusteInventario> Detalles { get; set; } = new List<DetalleAjusteInventario>();
}
