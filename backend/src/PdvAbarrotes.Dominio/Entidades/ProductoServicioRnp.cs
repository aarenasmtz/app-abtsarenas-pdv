namespace PdvAbarrotes.Dominio.Entidades;

/// <summary>
/// Catálogo de productos, compañías y servicios sincronizados desde Red Nacional de Pagos (pos_prices_products).
/// Mapea a dbo.CatalogoProductosServicios.
/// </summary>
public class ProductoServicioRnp
{
    public int IdCatalogoProducto { get; set; }
    public string CarrierId { get; set; } = string.Empty;       // SKU asignado en RNP
    public string Descripcion { get; set; } = string.Empty;     // Nombre comercial (ej. TELCEL, CFE, SKY)
    public string Grupo { get; set; } = string.Empty;           // 'TAE', 'SERVICIO', etc.
    public decimal Monto { get; set; }                          // Monto fijo o 0 si es monto libre / consulta
    public string? Observacion { get; set; }                    // Nota o instrucción para el cajero
    public bool PermiteConsultarAdeudo { get; set; }            // check_amount en RNP
    public int Orden { get; set; } = 1;
    public bool Activo { get; set; } = true;
    public DateTime FechaSincronizacion { get; set; } = DateTime.Now;
}
