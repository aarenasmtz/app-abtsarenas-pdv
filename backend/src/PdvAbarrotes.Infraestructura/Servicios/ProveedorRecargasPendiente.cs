using PdvAbarrotes.Aplicacion.Interfaces;

namespace PdvAbarrotes.Infraestructura.Servicios;

/// <summary>
/// Implementación base temporal para el proveedor de recargas.
/// Se deja desacoplado hasta que el negocio defina y contrate el proveedor comercial formal.
/// </summary>
public class ProveedorRecargasPendiente : IProveedorRecargas
{
    public Task<bool> ProveedorEstaConfiguradoAsync()
    {
        return Task.FromResult(false);
    }

    public Task<string> ConsultarSaldoProveedorAsync()
    {
        return Task.FromResult("Proveedor de recargas no configurado. Pendiente de contratación externa.");
    }
}
