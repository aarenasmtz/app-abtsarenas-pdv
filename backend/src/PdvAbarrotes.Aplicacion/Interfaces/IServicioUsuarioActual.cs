namespace PdvAbarrotes.Aplicacion.Interfaces;

/// <summary>
/// Contrato para obtener la identidad y contexto del usuario autenticado (extraído de Claims JWT).
/// </summary>
public interface IServicioUsuarioActual
{
    int? IdUsuario { get; }
    string NombreUsuario { get; }
    string Rol { get; }
    string? DireccionIp { get; }
    bool EstaAutenticado { get; }
}
