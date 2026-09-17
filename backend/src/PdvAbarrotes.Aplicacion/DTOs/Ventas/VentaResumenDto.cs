namespace PdvAbarrotes.Aplicacion.DTOs.Ventas;

/// <summary>
/// Vista resumida de una venta para listados rápidos de consulta y reimpresión de tickets.
/// </summary>
public class VentaResumenDto
{
    public int IdVenta { get; set; }
    public string FolioVenta { get; set; } = string.Empty;
    public DateTime FechaVenta { get; set; }
    public string NombreCajero { get; set; } = string.Empty;
    public string NombreCliente { get; set; } = string.Empty;
    public decimal Total { get; set; }
    public decimal NumeroArticulos { get; set; }
    public string Estatus { get; set; } = string.Empty;
    public bool EsCancelada { get; set; }
    public string MetodosPago { get; set; } = string.Empty;
}
