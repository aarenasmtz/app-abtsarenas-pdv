using PdvAbarrotes.Aplicacion.DTOs.Servicios;

namespace PdvAbarrotes.Aplicacion.Interfaces;

/// <summary>
/// Contrato para integración con proveedor de recargas de tiempo aire.
/// NOTA DE ARQUITECTURA: Queda pendiente la definición del proveedor externo comercial.
/// Esta interfaz define la abstracción requerida para enchufar el SDK/API REST del proveedor contratado.
/// </summary>
public interface IProveedorRecargas
{
    Task<bool> ProveedorEstaConfiguradoAsync();
    Task<string> ConsultarSaldoProveedorAsync();
    Task<ResultadoRecargaDto> EjecutarRecargaAsync(SolicitudRecargaDto solicitud, CancellationToken ct = default);
}
