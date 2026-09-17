using PdvAbarrotes.Aplicacion.Comun;

namespace PdvAbarrotes.Aplicacion.DTOs.Productos;

/// <summary>
/// Parámetros de consulta y filtrado server-side para el catálogo de productos.
/// Cumple con las opciones 25/50/100 registros.
/// </summary>
public class FiltroProductosDto : FiltroPaginacionDto
{
    public int? IdCategoria { get; set; }
    public int? IdMarca { get; set; }
    public bool? SoloActivos { get; set; } = true;
    public bool? SoloBajoStock { get; set; }
}
