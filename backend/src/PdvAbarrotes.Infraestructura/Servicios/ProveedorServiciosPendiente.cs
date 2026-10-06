using PdvAbarrotes.Aplicacion.DTOs.Servicios;
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

    public Task<ResultadoPagoServicioDto> EjecutarPagoServicioAsync(SolicitudPagoServicioDto solicitud, CancellationToken ct = default)
    {
        return Task.FromResult(new ResultadoPagoServicioDto
        {
            Exito = false,
            Mensaje = "El proveedor externo de pago de servicios no está configurado. Requiere contratar el servicio comercial (ej. CFE/Agua/Telefonía) y configurar las credenciales de API.",
            MontoPagado = solicitud.MontoRecibo,
            ComisionCobrada = solicitud.Comision,
            Servicio = solicitud.CodigoServicio,
            Referencia = solicitud.ReferenciaRecibo,
            FechaHora = DateTime.Now
        });
    }
}
