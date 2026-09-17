using PdvAbarrotes.Aplicacion.Interfaces;

namespace PdvAbarrotes.Infraestructura.Servicios;

/// <summary>
/// Implementación base temporal para el cobro de servicios.
/// Se deja desacoplado hasta que el negocio defina y contrate el proveedor comercial formal.
/// </summary>
public class ProveedorServiciosPendiente : IProveedorServicios
{
    public Task<bool> ProveedorEstaConfiguradoAsync()
    {
        return Task.FromResult(false);
    }

    public Task<string> ConsultarCatalogoServiciosAsync()
    {
        return Task.FromResult("Proveedor de pago de servicios no configurado. Pendiente de contratación externa.");
    }
}
