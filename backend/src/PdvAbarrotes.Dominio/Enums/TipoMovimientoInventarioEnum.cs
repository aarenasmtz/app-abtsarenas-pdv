namespace PdvAbarrotes.Dominio.Enums;

/// <summary>
/// Catálogo de tipos de movimiento en el Kardex de inventario.
/// Corresponde a dbo.TiposMovimientoInventario.
/// </summary>
public enum TipoMovimientoInventarioEnum
{
    EntradaCompra = 1,
    SalidaVenta = 2,
    AjusteEntrada = 3,
    AjusteSalida = 4,
    DevolucionCliente = 5,
    DevolucionProveedor = 6,
    Merma = 7,
    InventarioInicial = 8
}
