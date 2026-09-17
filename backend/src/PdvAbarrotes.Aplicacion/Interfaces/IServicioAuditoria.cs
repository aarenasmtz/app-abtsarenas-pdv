namespace PdvAbarrotes.Aplicacion.Interfaces;

/// <summary>
/// Contrato para el registro de auditoría de cambios y eventos del sistema.
/// </summary>
public interface IServicioAuditoria
{
    Task RegistrarAsync(string tabla, int idRegistro, string accion, string? valorAnterior, string? valorNuevo, CancellationToken cancellationToken = default);
}
