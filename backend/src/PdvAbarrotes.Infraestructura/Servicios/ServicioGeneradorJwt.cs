using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using PdvAbarrotes.Aplicacion.Interfaces;
using PdvAbarrotes.Dominio.Entidades;

namespace PdvAbarrotes.Infraestructura.Servicios;

/// <summary>
/// Implementación para la generación de tokens JWT seguros.
/// </summary>
public class ServicioGeneradorJwt : IServicioGeneradorJwt
{
    private readonly IConfiguration _configuracion;

    public ServicioGeneradorJwt(IConfiguration configuracion)
    {
        _configuracion = configuracion;
    }

    public (string Token, DateTime Expiracion) GenerarToken(Usuario usuario, string rol)
    {
        var claveSecreta = _configuracion["Jwt:ClaveSecreta"] 
            ?? "PdvAbarrotesArenas_SuperClaveSecretaSegura2026_JWT_Token_Key_987654321";
        var emisor = _configuracion["Jwt:Emisor"] ?? "PdvAbarrotesApi";
        var audiencia = _configuracion["Jwt:Audiencia"] ?? "PdvAbarrotesWeb";
        var expiracionMinutos = int.TryParse(_configuracion["Jwt:ExpiracionMinutos"], out var mins) ? mins : 480;

        var expiracion = DateTime.UtcNow.AddMinutes(expiracionMinutos);
        var claveSeguridad = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(claveSecreta));
        var credenciales = new SigningCredentials(claveSeguridad, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, usuario.IdUsuario.ToString()),
            new("IdUsuario", usuario.IdUsuario.ToString()),
            new(ClaimTypes.Name, usuario.NombreUsuario),
            new("NombreUsuario", usuario.NombreUsuario),
            new("NombreCompleto", usuario.NombreCompleto),
            new(ClaimTypes.Role, rol)
        };

        var descriptorToken = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = expiracion,
            Issuer = emisor,
            Audience = audiencia,
            SigningCredentials = credenciales
        };

        var manejadorToken = new JwtSecurityTokenHandler();
        var tokenCreado = manejadorToken.CreateToken(descriptorToken);

        return (manejadorToken.WriteToken(tokenCreado), expiracion);
    }
}
