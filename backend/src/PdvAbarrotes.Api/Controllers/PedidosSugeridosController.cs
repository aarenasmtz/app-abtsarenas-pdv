using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PdvAbarrotes.Aplicacion.Comun;
using PdvAbarrotes.Aplicacion.DTOs.PedidosSugeridos;
using PdvAbarrotes.Aplicacion.Interfaces;

namespace PdvAbarrotes.Api.Controllers;

/// <summary>
/// Controlador para la generación y gestión del Pedido Sugerido Dominical.
/// Calcula de forma automatizada las necesidades de reabastecimiento por rotación semanal,
/// stock de seguridad y permite afinar cantidades y exportar pedidos por proveedor.
/// Ruta base: /api/v1/pedidos-sugeridos
/// </summary>
[Authorize]
public class PedidosSugeridosController : ControladorBase
{
    private readonly IServicioPedidosSugeridos _servicioPedidos;

    public PedidosSugeridosController(IServicioPedidosSugeridos servicioPedidos)
    {
        _servicioPedidos = servicioPedidos;
    }

    /// <summary>
    /// Genera y calcula un nuevo pedido sugerido dominical analizando rotación histórica y cobertura.
    /// </summary>
    [HttpPost("generar")]
    [Authorize(Roles = "Supervisor,Administrador")]
    [ProducesResponseType(typeof(RespuestaApi<PedidoSugeridoDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(RespuestaApi<PedidoSugeridoDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GenerarPedido([FromBody] GenerarPedidoSugeridoDto dto, CancellationToken ct)
    {
        try
        {
            var resultado = await _servicioPedidos.GenerarPedidoSugeridoAsync(dto, ct);
            return CreatedAtAction(
                nameof(ObtenerPorId),
                new { id = resultado.IdPedidoSugerido },
                RespuestaApi<PedidoSugeridoDto>.Satisfactorio(
                    resultado,
                    $"Pedido sugerido #{resultado.IdPedidoSugerido} generado con éxito ({resultado.TotalPartidas} artículos, {resultado.TotalPiezasSugeridas:N0} unidades calculadas)."));
        }
        catch (Exception ex)
        {
            return BadRequest(RespuestaApi<PedidoSugeridoDto>.Fallido(ex.Message));
        }
    }

    /// <summary>
    /// Consulta el historial paginado de pedidos sugeridos dominicales.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(RespuestaApi<ResultadoPaginado<PedidoSugeridoResumenDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ObtenerPaginado([FromQuery] FiltroPedidosSugeridosDto filtro, CancellationToken ct)
    {
        var resultado = await _servicioPedidos.ObtenerPedidosPaginadoAsync(filtro, ct);
        return Ok(RespuestaApi<ResultadoPaginado<PedidoSugeridoResumenDto>>.Satisfactorio(resultado));
    }

    /// <summary>
    /// Obtiene el detalle desglosado de un pedido sugerido, con desglose individual y agrupación por proveedor.
    /// </summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(RespuestaApi<PedidoSugeridoDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(RespuestaApi<PedidoSugeridoDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ObtenerPorId([FromRoute] int id, CancellationToken ct)
    {
        var pedido = await _servicioPedidos.ObtenerPedidoPorIdAsync(id, ct);
        if (pedido == null)
        {
            return NotFound(RespuestaApi<PedidoSugeridoDto>.Fallido($"Pedido sugerido #{id} no encontrado."));
        }

        return Ok(RespuestaApi<PedidoSugeridoDto>.Satisfactorio(pedido));
    }

    /// <summary>
    /// Ajusta manualmente la cantidad final de una partida calculada del pedido sugerido.
    /// </summary>
    [HttpPut("detalles/{idDetalle:int}")]
    [Authorize(Roles = "Supervisor,Administrador")]
    [ProducesResponseType(typeof(RespuestaApi<DetallePedidoSugeridoDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(RespuestaApi<DetallePedidoSugeridoDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ActualizarDetalle(
        [FromRoute] int idDetalle,
        [FromBody] ActualizarDetallePedidoSugeridoDto dto,
        CancellationToken ct)
    {
        try
        {
            var detalleActualizado = await _servicioPedidos.ActualizarCantidadDetalleAsync(idDetalle, dto, ct);
            return Ok(RespuestaApi<DetallePedidoSugeridoDto>.Satisfactorio(
                detalleActualizado,
                $"Partida #{idDetalle} actualizada correctamente."));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(RespuestaApi<DetallePedidoSugeridoDto>.Fallido(ex.Message));
        }
    }

    /// <summary>
    /// Actualiza el estado del pedido sugerido (GENERADO, REVISADO, PROCESADO) y notas.
    /// </summary>
    [HttpPatch("{id:int}/estado")]
    [Authorize(Roles = "Supervisor,Administrador")]
    [ProducesResponseType(typeof(RespuestaApi<PedidoSugeridoDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(RespuestaApi<PedidoSugeridoDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ActualizarEstado(
        [FromRoute] int id,
        [FromBody] ActualizarEstadoPedidoSugeridoDto dto,
        CancellationToken ct)
    {
        try
        {
            var pedido = await _servicioPedidos.ActualizarEstadoAsync(id, dto, ct);
            return Ok(RespuestaApi<PedidoSugeridoDto>.Satisfactorio(
                pedido,
                $"Pedido sugerido #{id} actualizado al estado {pedido.Estado}."));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(RespuestaApi<PedidoSugeridoDto>.Fallido(ex.Message));
        }
    }

    /// <summary>
    /// Elimina un pedido sugerido si aún no ha sido marcado como PROCESADO.
    /// </summary>
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Supervisor,Administrador")]
    [ProducesResponseType(typeof(RespuestaApi<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(RespuestaApi<bool>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Eliminar([FromRoute] int id, CancellationToken ct)
    {
        try
        {
            var eliminado = await _servicioPedidos.EliminarPedidoAsync(id, ct);
            if (!eliminado)
            {
                return NotFound(RespuestaApi<bool>.Fallido($"Pedido sugerido #{id} no encontrado."));
            }

            return Ok(RespuestaApi<bool>.Satisfactorio(true, $"Pedido sugerido #{id} eliminado correctamente."));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(RespuestaApi<bool>.Fallido(ex.Message));
        }
    }
}
