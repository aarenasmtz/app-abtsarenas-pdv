using PdvAbarrotes.Dominio.Entidades;

namespace PdvAbarrotes.Aplicacion.Interfaces;

/// <summary>
/// Contrato para la generación de tokens JWT basados en las credenciales del usuario.
/// </summary>
public interface IServicioGeneradorJwt
{
    (string Token, DateTime Expiracion) GenerarToken(Usuario usuario, string rol);
}
