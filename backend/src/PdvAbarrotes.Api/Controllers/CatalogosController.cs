using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PdvAbarrotes.Aplicacion.Comun;
using PdvAbarrotes.Aplicacion.DTOs.Catalogos;
using PdvAbarrotes.Aplicacion.Interfaces;

namespace PdvAbarrotes.Api.Controllers;

/// <summary>
/// Controlador para consulta y administración de catálogos generales (Categorías, Marcas, Unidades de Medida).
/// </summary>
[Authorize]
public class CatalogosController : ControladorBase
{
    private readonly IServicioCatalogos _servicioCatalogos;

    public CatalogosController(IServicioCatalogos servicioCatalogos)
    {
        _servicioCatalogos = servicioCatalogos;
    }

    /// <summary>
    /// Consulta el listado de categorías disponibles.
    /// </summary>
    [HttpGet("categorias")]
    public async Task<ActionResult<RespuestaApi<IReadOnlyList<CategoriaDto>>>> ObtenerCategorias(
        [FromQuery] bool soloActivos = false, 
        CancellationToken cancellationToken = default)
    {
        var categorias = await _servicioCatalogos.ObtenerCategoriasAsync(soloActivos, cancellationToken);
        return RespuestaExito(categorias);
    }

    /// <summary>
    /// Crea o actualiza una categoría de productos (Exclusivo Administrador).
    /// </summary>
    [HttpPost("categorias")]
    [Authorize(Roles = "Administrador")]
    public async Task<ActionResult<RespuestaApi<CategoriaDto>>> GuardarCategoria(
        [FromBody] CrearActualizarCatalogoDto dto,
        [FromQuery] int? idCategoria,
        CancellationToken cancellationToken)
    {
        var categoria = await _servicioCatalogos.GuardarCategoriaAsync(idCategoria, dto, cancellationToken);
        return RespuestaExito(categoria, "Categoría guardada correctamente");
    }

    /// <summary>
    /// Consulta el listado de marcas registradas.
    /// </summary>
    [HttpGet("marcas")]
    public async Task<ActionResult<RespuestaApi<IReadOnlyList<MarcaDto>>>> ObtenerMarcas(
        [FromQuery] bool soloActivos = false, 
        CancellationToken cancellationToken = default)
    {
        var marcas = await _servicioCatalogos.ObtenerMarcasAsync(soloActivos, cancellationToken);
        return RespuestaExito(marcas);
    }

    /// <summary>
    /// Crea o actualiza una marca de productos (Exclusivo Administrador).
    /// </summary>
    [HttpPost("marcas")]
    [Authorize(Roles = "Administrador")]
    public async Task<ActionResult<RespuestaApi<MarcaDto>>> GuardarMarca(
        [FromBody] CrearActualizarCatalogoDto dto,
        [FromQuery] int? idMarca,
        CancellationToken cancellationToken)
    {
        var marca = await _servicioCatalogos.GuardarMarcaAsync(idMarca, dto, cancellationToken);
        return RespuestaExito(marca, "Marca guardada correctamente");
    }

    /// <summary>
    /// Consulta las unidades de medida habilitadas en el sistema.
    /// </summary>
    [HttpGet("unidades-medida")]
    public async Task<ActionResult<RespuestaApi<IReadOnlyList<UnidadMedidaDto>>>> ObtenerUnidadesMedida(
        [FromQuery] bool soloActivos = true, 
        CancellationToken cancellationToken = default)
    {
        var unidades = await _servicioCatalogos.ObtenerUnidadesMedidaAsync(soloActivos, cancellationToken);
        return RespuestaExito(unidades);
    }
}
