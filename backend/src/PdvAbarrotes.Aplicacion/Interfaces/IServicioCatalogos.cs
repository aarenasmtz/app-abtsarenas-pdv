using PdvAbarrotes.Aplicacion.DTOs.Catalogos;

namespace PdvAbarrotes.Aplicacion.Interfaces;

/// <summary>
/// Contrato de servicio para la gestión y consulta de catálogos generales (Categorías, Marcas, Unidades de Medida).
/// </summary>
public interface IServicioCatalogos
{
    /// <summary>
    /// Consulta las categorías registradas con el total de productos asignados.
    /// </summary>
    Task<IReadOnlyList<CategoriaDto>> ObtenerCategoriasAsync(bool soloActivos = false, CancellationToken cancellationToken = default);

    /// <summary>
    /// Registra o actualiza una categoría.
    /// </summary>
    Task<CategoriaDto> GuardarCategoriaAsync(int? idCategoria, CrearActualizarCatalogoDto dto, CancellationToken cancellationToken = default);

    /// <summary>
    /// Consulta las marcas registradas con el conteo de productos asociados.
    /// </summary>
    Task<IReadOnlyList<MarcaDto>> ObtenerMarcasAsync(bool soloActivos = false, CancellationToken cancellationToken = default);

    /// <summary>
    /// Registra o actualiza una marca.
    /// </summary>
    Task<MarcaDto> GuardarMarcaAsync(int? idMarca, CrearActualizarCatalogoDto dto, CancellationToken cancellationToken = default);

    /// <summary>
    /// Consulta las unidades de medida habilitadas para los productos.
    /// </summary>
    Task<IReadOnlyList<UnidadMedidaDto>> ObtenerUnidadesMedidaAsync(bool soloActivos = true, CancellationToken cancellationToken = default);
}
