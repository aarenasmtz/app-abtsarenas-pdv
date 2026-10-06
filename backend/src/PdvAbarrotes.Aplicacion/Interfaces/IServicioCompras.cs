using PdvAbarrotes.Aplicacion.Comun;
using PdvAbarrotes.Aplicacion.DTOs.Compras;

namespace PdvAbarrotes.Aplicacion.Interfaces;

/// <summary>
/// Contrato para el registro y consulta de compras y recepción de mercancía de proveedores.
/// </summary>
public interface IServicioCompras
{
    /// <summary>
    /// Registra atómicamente una compra de mercancía, actualiza inventarios y Kardex, y recalcula el costo ponderado.
    /// </summary>
    Task<CompraDto> RegistrarCompraAsync(RegistrarCompraDto dto, int idUsuario, CancellationToken ct = default);

    /// <summary>
    /// Consulta el historial de compras paginado con filtros por proveedor, fechas o término.
    /// </summary>
    Task<ResultadoPaginado<CompraDto>> ObtenerComprasPaginadoAsync(FiltroComprasDto filtro, CancellationToken ct = default);

    /// <summary>
    /// Obtiene el detalle desglosado de una orden de compra o recepción de mercancía.
    /// </summary>
    Task<CompraDto?> ObtenerCompraPorIdAsync(int id, CancellationToken ct = default);
}
