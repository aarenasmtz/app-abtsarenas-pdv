using PdvAbarrotes.Aplicacion.DTOs.Servicios;

namespace PdvAbarrotes.Aplicacion.Interfaces;

/// <summary>
/// Contrato para integración con proveedor de cobro de servicios (Luz, Agua, Gas, etc.).
/// NOTA DE ARQUITECTURA: Queda pendiente la definición del proveedor externo comercial.
/// Esta interfaz define la abstracción requerida para enchufar el SDK/API REST del proveedor contratado.
/// </summary>
public interface IProveedorServicios
{
    Task<bool> ProveedorEstaConfiguradoAsync();
    Task<string> ConsultarCatalogoServiciosAsync();
    Task<ResultadoPagoServicioDto> EjecutarPagoServicioAsync(SolicitudPagoServicioDto solicitud, CancellationToken ct = default);
    Task<ResultadoConsultaAdeudoDto> ConsultarAdeudoServicioAsync(SolicitudConsultaAdeudoDto solicitud, CancellationToken ct = default);
}
