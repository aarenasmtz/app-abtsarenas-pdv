using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PdvAbarrotes.Aplicacion.Comun;
using PdvAbarrotes.Aplicacion.DTOs.Autenticacion;
using PdvAbarrotes.Aplicacion.Interfaces;

namespace PdvAbarrotes.Api.Controllers;

/// <summary>
/// Controlador para la autenticación de usuarios, inicio de sesión y gestión de claves.
/// </summary>
public class AutenticacionController : ControladorBase
{
    private readonly IServicioAutenticacion _servicioAutenticacion;

    public AutenticacionController(IServicioAutenticacion servicioAutenticacion)
    {
        _servicioAutenticacion = servicioAutenticacion;
    }

    /// <summary>
    /// Inicia sesión con nombre de usuario y contraseña, retornando un token JWT.
    /// </summary>
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<RespuestaApi<RespuestaLoginDto>>> IniciarSesion(
        [FromBody] SolicitudLoginDto solicitud, 
        CancellationToken cancellationToken)
    {
        var resultado = await _servicioAutenticacion.IniciarSesionAsync(solicitud, cancellationToken);
        return RespuestaExito(resultado, "Inicio de sesión exitoso");
    }

    /// <summary>
    /// Modifica la contraseña del usuario actual autenticado.
    /// </summary>
    [HttpPost("cambiar-clave")]
    [Authorize]
    public async Task<ActionResult<RespuestaApi<string>>> CambiarClave(
        [FromBody] CambiarClaveDto solicitud, 
        CancellationToken cancellationToken)
    {
        await _servicioAutenticacion.CambiarClaveAsync(solicitud, cancellationToken);
        return RespuestaExito("Contraseña actualizada satisfactoriamente");
    }

    /// <summary>
    /// Retorna los datos del perfil del usuario actualmente autenticado según su token JWT.
    /// </summary>
    [HttpGet("perfil")]
    [Authorize]
    public async Task<ActionResult<RespuestaApi<UsuarioDto>>> ObtenerPerfil(CancellationToken cancellationToken)
    {
        var perfil = await _servicioAutenticacion.ObtenerPerfilActualAsync(cancellationToken);
        return RespuestaExito(perfil, "Perfil obtenido correctamente");
    }
}
