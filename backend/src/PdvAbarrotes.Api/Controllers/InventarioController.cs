using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PdvAbarrotes.Aplicacion.Comun;
using PdvAbarrotes.Aplicacion.DTOs.Inventario;
using PdvAbarrotes.Aplicacion.Interfaces;

namespace PdvAbarrotes.Api.Controllers;

/// <summary>
/// Controlador para la gestión de inventarios, Kardex histórico, ajustes de stock y alertas de resurtido.
/// </summary>
[Authorize(Roles = "Administrador,Supervisor")]
public class InventarioController : ControladorBase
{
    private readonly IServicioInventario _servicioInventario;

    public InventarioController(IServicioInventario servicioInventario)
    {
        _servicioInventario = servicioInventario;
    }

    /// <summary>
    /// Consulta el listado de existencias actuales con semáforo de estado y paginación server-side.
    /// </summary>
    [HttpGet("stock")]
    public async Task<ActionResult<RespuestaApi<ResultadoPaginado<StockProductoDto>>>> ObtenerStock(
        [FromQuery] FiltroInventarioDto filtro, 
        CancellationToken cancellationToken)
    {
        var resultado = await _servicioInventario.ObtenerStockPaginadoAsync(filtro, cancellationToken);
        return RespuestaExito(resultado);
    }

    /// <summary>
    /// Consulta el historial inmutable de movimientos en el Kardex (25/50/100 registros con filtros).
    /// </summary>
    [HttpGet("kardex")]
    public async Task<ActionResult<RespuestaApi<ResultadoPaginado<MovimientoKardexDto>>>> ObtenerKardex(
        [FromQuery] FiltroKardexDto filtro, 
        CancellationToken cancellationToken)
    {
        var resultado = await _servicioInventario.ObtenerKardexPaginadoAsync(filtro, cancellationToken);
        return RespuestaExito(resultado);
    }

    /// <summary>
    /// Realiza un ajuste manual de stock (Entrada, Salida o Reconteo Físico) con auditoría atómica.
    /// </summary>
    [HttpPost("ajuste")]
    public async Task<ActionResult<RespuestaApi<MovimientoKardexDto>>> RegistrarAjuste(
        [FromBody] RegistrarAjusteStockDto dto, 
        CancellationToken cancellationToken)
    {
        var movimiento = await _servicioInventario.RegistrarAjusteStockAsync(dto, cancellationToken);
        return RespuestaExito(movimiento, "Ajuste de inventario aplicado y registrado en Kardex exitosamente");
    }

    /// <summary>
    /// Consulta los artículos que requieren resurtido urgente (existencia menor o igual a la mínima).
    /// </summary>
    [HttpGet("alertas-bajo-stock")]
    public async Task<ActionResult<RespuestaApi<IReadOnlyList<AlertaStockDto>>>> ObtenerAlertas(
        [FromQuery] int limite = 50, 
        CancellationToken cancellationToken = default)
    {
        var alertas = await _servicioInventario.ObtenerAlertasBajoStockAsync(limite, cancellationToken);
        return RespuestaExito(alertas);
    }

    /// <summary>
    /// Consulta los tipos de movimiento de inventario disponibles para filtros y clasificación.
    /// </summary>
    [HttpGet("tipos-movimiento")]
    public async Task<ActionResult<RespuestaApi<IReadOnlyList<TipoMovimientoInventarioDto>>>> ObtenerTiposMovimiento(
        CancellationToken cancellationToken)
    {
        var tipos = await _servicioInventario.ObtenerTiposMovimientoAsync(cancellationToken);
        return RespuestaExito(tipos);
    }
}
