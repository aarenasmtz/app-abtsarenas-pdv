using PdvAbarrotes.Aplicacion.DTOs.Autenticacion;

namespace PdvAbarrotes.Aplicacion.Interfaces;

/// <summary>
/// Contrato de servicio para el flujo de autenticación, generación de JWT y cambio de clave.
/// </summary>
public interface IServicioAutenticacion
{
    Task<RespuestaLoginDto> IniciarSesionAsync(SolicitudLoginDto solicitud, CancellationToken cancellationToken = default);
    Task CambiarClaveAsync(CambiarClaveDto solicitud, CancellationToken cancellationToken = default);
    Task<UsuarioDto> ObtenerPerfilActualAsync(CancellationToken cancellationToken = default);
}
