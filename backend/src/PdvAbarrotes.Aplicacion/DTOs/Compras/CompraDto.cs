namespace PdvAbarrotes.Aplicacion.DTOs.Compras;

/// <summary>
/// DTO con la cabecera y desglose completo de una compra registrada.
/// </summary>
public class CompraDto
{
    public int IdCompra { get; set; }
    public int FolioCompra { get; set; }
    public int? IdProveedor { get; set; }
    public string NombreProveedor { get; set; } = string.Empty;
    public int IdUsuario { get; set; }
    public string NombreUsuario { get; set; } = string.Empty;
    public DateTime FechaCompra { get; set; }
    public decimal TotalCompra { get; set; }
    public string Estatus { get; set; } = string.Empty;
    public string? Observaciones { get; set; }
    public DateTime FechaRegistro { get; set; }
    public int TotalPartidas { get; set; }
    public List<DetalleCompraDto> Detalles { get; set; } = new();
}
