using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.Extensions.Configuration;
using PdvAbarrotes.Dominio.Entidades;
using PdvAbarrotes.Infraestructura.Servicios;
using Xunit;

namespace PdvAbarrotes.Tests;

/// <summary>
/// Pruebas unitarias para validar la emisión de tokens JWT y hashing seguro de contraseñas.
/// </summary>
public class PruebasAutenticacion
{
    [Fact]
    public void GeneradorJwt_GeneraTokenValidoConClaimsCorrectos()
    {
        // Arrange
        var configuracionEnMemoria = new Dictionary<string, string?>
        {
            {"Jwt:ClaveSecreta", "ClaveSecretaDePruebaParaGenerarTokensSeguros123456789"},
            {"Jwt:Emisor", "PdvPruebaApi"},
            {"Jwt:Audiencia", "PdvPruebaWeb"},
            {"Jwt:ExpiracionMinutos", "60"}
        };

        var configuracion = new ConfigurationBuilder()
            .AddInMemoryCollection(configuracionEnMemoria)
            .Build();

        var servicioJwt = new ServicioGeneradorJwt(configuracion);

        var usuarioPrueba = new Usuario
        {
            IdUsuario = 42,
            NombreUsuario = "cajero_prueba",
            NombreCompleto = "Cajero de Pruebas Unitarias",
            EsAdministrador = false
        };

        // Act
        var (token, expiracion) = servicioJwt.GenerarToken(usuarioPrueba, "Cajero");

        // Assert
        Assert.NotNull(token);
        Assert.NotEmpty(token);
        Assert.True(expiracion > DateTime.UtcNow);

        // Validar claims dentro del token generado
        var manejador = new JwtSecurityTokenHandler();
        var jwtToken = manejador.ReadJwtToken(token);

        Assert.Equal("PdvPruebaApi", jwtToken.Issuer);
        Assert.Contains(jwtToken.Audiences, a => a == "PdvPruebaWeb");

        var claimId = jwtToken.Claims.FirstOrDefault(c => c.Type == "IdUsuario" || c.Type == ClaimTypes.NameIdentifier);
        Assert.NotNull(claimId);
        Assert.Equal("42", claimId.Value);

        var claimRol = jwtToken.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Role || c.Type == "role");
        Assert.NotNull(claimRol);
        Assert.Equal("Cajero", claimRol.Value);
    }

    [Fact]
    public void HashingContrasena_BCryptGeneraYVerificaCorrectamente()
    {
        // Arrange
        var claveOriginal = "Admin123*";

        // Act
        var hash = BCrypt.Net.BCrypt.HashPassword(claveOriginal);
        var coincide = BCrypt.Net.BCrypt.Verify(claveOriginal, hash);
        var noCoincide = BCrypt.Net.BCrypt.Verify("ClaveIncorrecta", hash);

        // Assert
        Assert.True(coincide);
        Assert.False(noCoincide);
        Assert.StartsWith("$2", hash);
    }
}
