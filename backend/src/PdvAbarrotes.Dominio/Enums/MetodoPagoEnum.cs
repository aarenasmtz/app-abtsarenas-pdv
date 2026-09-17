namespace PdvAbarrotes.Dominio.Enums;

/// <summary>
/// Catálogo de métodos de pago soportados por el punto de venta.
/// Corresponde a los registros de la tabla dbo.MetodosPago.
/// </summary>
public enum MetodoPagoEnum
{
    Efectivo = 1,
    Tarjeta = 2,
    Credito = 3,
    Vales = 4,
    Transferencia = 5
}
