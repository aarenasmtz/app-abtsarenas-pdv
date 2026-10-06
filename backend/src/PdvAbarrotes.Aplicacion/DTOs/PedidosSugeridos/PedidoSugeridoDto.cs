namespace PdvAbarrotes.Aplicacion.DTOs.PedidosSugeridos;

/// <summary>
/// DTO con la información completa de una sesión de pedido sugerido dominical.
/// </summary>
public class PedidoSugeridoDto
{
    public int IdPedidoSugerido { get; set; }
    public int IdSucursal { get; set; }
    public DateTime FechaGeneracion { get; set; }
    public int SemanaAnio { get; set; }
    public int Anio { get; set; }
    public string Estado { get; set; } = string.Empty; // GENERADO, REVISADO, PROCESADO
    public string? Observaciones { get; set; }

    public int TotalPartidas { get; set; }
    public decimal TotalPiezasSugeridas { get; set; }
    public decimal TotalPiezasEfectivas { get; set; }
    public decimal InversionEstimadaSugerida { get; set; }
    public decimal InversionEstimadaEfectiva { get; set; }

    public List<DetallePedidoSugeridoDto> Detalles { get; set; } = new();
    public List<ProveedorPedidoSugeridoGrupoDto> GruposPorProveedor { get; set; } = new();
}
