using PdvAbarrotes.Aplicacion.Comun;

namespace PdvAbarrotes.Aplicacion.DTOs.Inventario;

/// <summary>
/// Filtros server-side para la consulta de existencias de inventario.
/// </summary>
public class FiltroInventarioDto : FiltroPaginacionDto
{
    public int? IdCategoria { get; set; }
    public int? IdMarca { get; set; }
    public bool? SoloBajoStock { get; set; }
    public bool? SoloActivos { get; set; } = true;
}
