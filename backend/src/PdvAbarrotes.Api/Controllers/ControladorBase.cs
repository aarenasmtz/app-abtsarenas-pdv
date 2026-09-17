using Microsoft.AspNetCore.Mvc;
using PdvAbarrotes.Aplicacion.Comun;

namespace PdvAbarrotes.Api.Controllers;

/// <summary>
/// Controlador base en español para todos los controladores de la API.
/// Estandariza la ruta /api/v1/[controller] y las respuestas estandarizadas.
/// </summary>
[ApiController]
[Route("api/v1/[controller]")]
public abstract class ControladorBase : ControllerBase
{
    protected ActionResult<RespuestaApi<T>> RespuestaExito<T>(T datos, string mensaje = "Operación realizada con éxito")
    {
        return Ok(RespuestaApi<T>.Satisfactorio(datos, mensaje));
    }

    protected ActionResult<RespuestaApi<T>> RespuestaError<T>(string mensaje, List<string>? errores = null, int codigoEstado = 400)
    {
        return StatusCode(codigoEstado, RespuestaApi<T>.Fallido(mensaje, errores));
    }
}
