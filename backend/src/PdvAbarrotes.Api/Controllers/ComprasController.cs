using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PdvAbarrotes.Aplicacion.Comun;
using PdvAbarrotes.Aplicacion.DTOs.Compras;
using PdvAbarrotes.Aplicacion.Interfaces;

namespace PdvAbarrotes.Api.Controllers;

/// <summary>
/// Controlador para el registro de compras, recepción de mercancía y consulta del historial de abastecimiento.
/// Ruta base: /api/v1/compras
/// </summary>
[Authorize]
public class ComprasController : ControladorBase
{
    private readonly IServicioCompras _servicioCompras;
    private readonly IServicioUsuarioActual _servicioUsuarioActual;

    public ComprasController(
        IServicioCompras servicioCompras,
        IServicioUsuarioActual servicioUsuarioActual)
    {
        _servicioCompras = servicioCompras;
        _servicioUsuarioActual = servicioUsuarioActual;
    }

    /// <summary>
    /// Registra una nueva compra de mercancía: actualiza inventario, genera Kardex
    /// y recalcula el costo promedio ponderado si se solicita en cada partida.
    /// </summary>
    /// <param name="dto">Datos de la compra con lista de partidas (productos, cantidades y costos).</param>
    /// <param name="ct">Token de cancelación.</param>
    [HttpPost]
    [Authorize(Roles = "Supervisor,Administrador")]
    [ProducesResponseType(typeof(RespuestaApi<CompraDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(RespuestaApi<CompraDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RegistrarCompra([FromBody] RegistrarCompraDto dto, CancellationToken ct)
    {
        if (!ModelState.IsValid)
        {
            var errores = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage)
                .ToList();
            return BadRequest(RespuestaApi<CompraDto>.Fallido("Datos de compra inválidos.", errores));
        }

        try
        {
            int idUsuario = _servicioUsuarioActual.IdUsuario ?? 0;
            var compraRegistrada = await _servicioCompras.RegistrarCompraAsync(dto, idUsuario, ct);
            return CreatedAtAction(
                nameof(ObtenerPorId),
                new { id = compraRegistrada.IdCompra },
                RespuestaApi<CompraDto>.Satisfactorio(
                    compraRegistrada,
                    $"Compra folio #{compraRegistrada.FolioCompra} registrada correctamente. Total: ${compraRegistrada.TotalCompra:N2}"));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(RespuestaApi<CompraDto>.Fallido(ex.Message));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(RespuestaApi<CompraDto>.Fallido(ex.Message));
        }
        catch (Exception ex)
        {
            return StatusCode(500, RespuestaApi<object>.Fallido($"Error interno al registrar la compra: {ex.Message}"));
        }
    }

    /// <summary>
    /// Consulta el historial de compras con filtros por proveedor, fechas y término de búsqueda, con paginación.
    /// </summary>
    /// <param name="filtro">Filtros: idProveedor, fechaInicio, fechaFin, terminoBusqueda, página y tamaño.</param>
    /// <param name="ct">Token de cancelación.</param>
    [HttpGet]
    [Authorize(Roles = "Supervisor,Administrador")]
    [ProducesResponseType(typeof(RespuestaApi<ResultadoPaginado<CompraDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ObtenerPaginado([FromQuery] FiltroComprasDto filtro, CancellationToken ct)
    {
        try
        {
            var resultado = await _servicioCompras.ObtenerComprasPaginadoAsync(filtro, ct);
            return Ok(RespuestaApi<ResultadoPaginado<CompraDto>>.Satisfactorio(
                resultado,
                $"Se encontraron {resultado.TotalRegistros} compras."));
        }
        catch (Exception ex)
        {
            return StatusCode(500, RespuestaApi<object>.Fallido($"Error interno al consultar compras: {ex.Message}"));
        }
    }

    /// <summary>
    /// Obtiene el detalle completo de una compra, incluyendo todas sus partidas con descripción de productos.
    /// </summary>
    /// <param name="id">Identificador único de la compra.</param>
    /// <param name="ct">Token de cancelación.</param>
    [HttpGet("{id:int}")]
    [Authorize(Roles = "Supervisor,Administrador")]
    [ProducesResponseType(typeof(RespuestaApi<CompraDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(RespuestaApi<CompraDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ObtenerPorId([FromRoute] int id, CancellationToken ct)
    {
        try
        {
            var compra = await _servicioCompras.ObtenerCompraPorIdAsync(id, ct);
            if (compra == null)
            {
                return NotFound(RespuestaApi<CompraDto>.Fallido($"La compra #{id} no fue encontrada."));
            }

            return Ok(RespuestaApi<CompraDto>.Satisfactorio(compra, "Compra encontrada."));
        }
        catch (Exception ex)
        {
            return StatusCode(500, RespuestaApi<object>.Fallido($"Error interno al consultar la compra: {ex.Message}"));
        }
    }
}
