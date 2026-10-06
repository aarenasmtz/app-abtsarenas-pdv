using PdvAbarrotes.Aplicacion.Comun;
using PdvAbarrotes.Aplicacion.DTOs.PedidosSugeridos;

namespace PdvAbarrotes.Aplicacion.Interfaces;

/// <summary>
/// Contrato de servicio para el cálculo y gestión de pedidos sugeridos dominicales.
/// </summary>
public interface IServicioPedidosSugeridos
{
    /// <summary>
    /// Genera y calcula un nuevo pedido sugerido dominical basado en el historial de ventas, stock mínimo y rotación.
    /// </summary>
    Task<PedidoSugeridoDto> GenerarPedidoSugeridoAsync(GenerarPedidoSugeridoDto dto, CancellationToken ct = default);

    /// <summary>
    /// Consulta el listado histórico de pedidos sugeridos con paginación y filtros.
    /// </summary>
    Task<ResultadoPaginado<PedidoSugeridoResumenDto>> ObtenerPedidosPaginadoAsync(FiltroPedidosSugeridosDto filtro, CancellationToken ct = default);

    /// <summary>
    /// Obtiene el detalle completo de un pedido sugerido por su identificador, con desglose por producto y agrupado por proveedor.
    /// </summary>
    Task<PedidoSugeridoDto?> ObtenerPedidoPorIdAsync(int idPedidoSugerido, CancellationToken ct = default);

    /// <summary>
    /// Ajusta manualmente la cantidad a pedir de una partida específica dentro de un pedido sugerido.
    /// </summary>
    Task<DetallePedidoSugeridoDto> ActualizarCantidadDetalleAsync(int idDetalle, ActualizarDetallePedidoSugeridoDto dto, CancellationToken ct = default);

    /// <summary>
    /// Cambia el estado de un pedido sugerido (GENERADO -> REVISADO -> PROCESADO) y actualiza observaciones.
    /// </summary>
    Task<PedidoSugeridoDto> ActualizarEstadoAsync(int idPedidoSugerido, ActualizarEstadoPedidoSugeridoDto dto, CancellationToken ct = default);

    /// <summary>
    /// Elimina un pedido sugerido si aún se encuentra en estado no procesado.
    /// </summary>
    Task<bool> EliminarPedidoAsync(int idPedidoSugerido, CancellationToken ct = default);
}
