using System.Net;
using System.Text.Json;
using PdvAbarrotes.Aplicacion.Comun;
using PdvAbarrotes.Dominio.Excepciones;

namespace PdvAbarrotes.Api.Middlewares;

/// <summary>
/// Middleware global para capturar y estandarizar las excepciones de la aplicación en español.
/// </summary>
public class ManejadorExcepcionesMiddleware
{
    private readonly RequestDelegate _siguiente;
    private readonly ILogger<ManejadorExcepcionesMiddleware> _logger;

    public ManejadorExcepcionesMiddleware(RequestDelegate siguiente, ILogger<ManejadorExcepcionesMiddleware> logger)
    {
        _siguiente = siguiente;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext contexto)
    {
        try
        {
            await _siguiente(contexto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error no controlado capturado por el middleware global: {Mensaje}", ex.Message);
            await ManejarExcepcionAsync(contexto, ex);
        }
    }

    private static async Task ManejarExcepcionAsync(HttpContext contexto, Exception excepcion)
    {
        contexto.Response.ContentType = "application/json";

        var codigoEstado = HttpStatusCode.InternalServerError;
        var mensaje = "Ocurrió un error interno en el servidor.";
        List<string>? detalles = null;

        switch (excepcion)
        {
            case ExcepcionReglaNegocio reglaNegocio:
                codigoEstado = HttpStatusCode.BadRequest;
                mensaje = reglaNegocio.Message;
                break;

            case ExcepcionNoEncontrado noEncontrado:
                codigoEstado = HttpStatusCode.NotFound;
                mensaje = noEncontrado.Message;
                break;

            default:
                detalles = new List<string> { excepcion.Message };
                break;
        }

        contexto.Response.StatusCode = (int)codigoEstado;

        var respuesta = RespuestaApi<object>.Fallido(mensaje, detalles);
        var jsonOpciones = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
        var json = JsonSerializer.Serialize(respuesta, jsonOpciones);

        await contexto.Response.WriteAsync(json);
    }
}
