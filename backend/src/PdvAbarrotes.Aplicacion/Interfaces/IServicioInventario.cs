using PdvAbarrotes.Aplicacion.Comun;
using PdvAbarrotes.Aplicacion.DTOs.Inventario;

namespace PdvAbarrotes.Aplicacion.Interfaces;

/// <summary>
/// Contrato de servicio para el control de inventarios, Kardex histórico y ajustes de stock.
/// </summary>
public interface IServicioInventario
{
    /// <summary>
    /// Consulta paginada server-side del estado de existencias de productos con semáforo de reorden.
    /// </summary>
    Task<ResultadoPaginado<StockProductoDto>> ObtenerStockPaginadoAsync(FiltroInventarioDto filtro, CancellationToken cancellationToken = default);

    /// <summary>
    /// Consulta el historial inmutable del Kardex con paginación server-side y filtros por producto, fecha y tipo.
    /// </summary>
    Task<ResultadoPaginado<MovimientoKardexDto>> ObtenerKardexPaginadoAsync(FiltroKardexDto filtro, CancellationToken cancellationToken = default);

    /// <summary>
    /// Ejecuta un ajuste manual de stock (Entrada, Salida o Reconteo Físico) de forma atómica con auditoría y Kardex.
    /// </summary>
    Task<MovimientoKardexDto> RegistrarAjusteStockAsync(RegistrarAjusteStockDto dto, CancellationToken cancellationToken = default);

    /// <summary>
    /// Consulta productos que se encuentran en nivel crítico o por debajo de la existencia mínima.
    /// </summary>
    Task<IReadOnlyList<AlertaStockDto>> ObtenerAlertasBajoStockAsync(int limite = 50, CancellationToken cancellationToken = default);

    /// <summary>
    /// Consulta los tipos de movimiento de inventario habilitados.
    /// </summary>
    Task<IReadOnlyList<TipoMovimientoInventarioDto>> ObtenerTiposMovimientoAsync(CancellationToken cancellationToken = default);
}
