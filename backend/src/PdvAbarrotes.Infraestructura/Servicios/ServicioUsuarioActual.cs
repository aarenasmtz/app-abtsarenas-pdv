using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using PdvAbarrotes.Aplicacion.Interfaces;

namespace PdvAbarrotes.Infraestructura.Servicios;

/// <summary>
/// Extrae la identidad del usuario actual autenticado desde los Claims del JWT y la petición HTTP.
/// </summary>
public class ServicioUsuarioActual : IServicioUsuarioActual
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public ServicioUsuarioActual(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public int? IdUsuario
    {
        get
        {
            var claim = _httpContextAccessor.HttpContext?.User?.FindFirst("IdUsuario") 
                     ?? _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier);
            return int.TryParse(claim?.Value, out var id) ? id : null;
        }
    }

    public string NombreUsuario
    {
        get
        {
            var claim = _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.Name)
                     ?? _httpContextAccessor.HttpContext?.User?.FindFirst("NombreUsuario");
            return claim?.Value ?? "Sistema";
        }
    }

    public string Rol
    {
        get
        {
            var claim = _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.Role);
            return claim?.Value ?? "SinRol";
        }
    }

    public string? DireccionIp
    {
        get
        {
            var contexto = _httpContextAccessor.HttpContext;
            if (contexto == null) return null;

            if (contexto.Request.Headers.TryGetValue("X-Forwarded-For", out var ipReenviada))
            {
                return ipReenviada.FirstOrDefault();
            }

            return contexto.Connection.RemoteIpAddress?.ToString();
        }
    }

    public bool EstaAutenticado => _httpContextAccessor.HttpContext?.User?.Identity?.IsAuthenticated ?? false;
}
