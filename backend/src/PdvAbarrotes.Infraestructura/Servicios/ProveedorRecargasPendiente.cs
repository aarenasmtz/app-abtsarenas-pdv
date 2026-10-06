using PdvAbarrotes.Aplicacion.DTOs.Servicios;
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

    public Task<ResultadoRecargaDto> EjecutarRecargaAsync(SolicitudRecargaDto solicitud, CancellationToken ct = default)
    {
        return Task.FromResult(new ResultadoRecargaDto
        {
            Exito = false,
            Mensaje = "El proveedor externo de recargas de tiempo aire no está configurado. Requiere contratar el servicio comercial (ej. TAE México, Qiubo o RecargaPlus) y configurar las credenciales de API.",
            Monto = solicitud.Monto,
            NumeroTelefono = solicitud.NumeroTelefono,
            Compania = solicitud.CodigoCompania,
            FechaHora = DateTime.Now
        });
    }
}
