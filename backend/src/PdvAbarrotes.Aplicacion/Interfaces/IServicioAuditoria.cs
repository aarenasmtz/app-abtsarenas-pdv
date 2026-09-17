using PdvAbarrotes.Aplicacion.Comun;
using PdvAbarrotes.Aplicacion.DTOs.Auditoria;

namespace PdvAbarrotes.Aplicacion.Interfaces;

/// <summary>
/// Contrato para el registro y consulta de auditoría de cambios y eventos del sistema.
/// </summary>
public interface IServicioAuditoria
{
    Task RegistrarAsync(string tabla, int idRegistro, string accion, string? valorAnterior, string? valorNuevo, CancellationToken cancellationToken = default);
    Task<ResultadoPaginado<RegistroAuditoriaDto>> ConsultarAuditoriaPaginadoAsync(FiltroAuditoriaDto filtro, CancellationToken cancellationToken = default);
}
