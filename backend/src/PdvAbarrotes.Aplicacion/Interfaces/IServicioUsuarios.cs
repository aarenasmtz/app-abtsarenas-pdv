using PdvAbarrotes.Aplicacion.Comun;
using PdvAbarrotes.Aplicacion.DTOs.Autenticacion;

namespace PdvAbarrotes.Aplicacion.Interfaces;

/// <summary>
/// Contrato para la administración de usuarios y cajeros (ABC).
/// </summary>
public interface IServicioUsuarios
{
    Task<ResultadoPaginado<UsuarioDto>> ObtenerUsuariosPaginadoAsync(FiltroPaginacionDto filtro, CancellationToken cancellationToken = default);
    Task<UsuarioDto> ObtenerPorIdAsync(int idUsuario, CancellationToken cancellationToken = default);
    Task<UsuarioDto> CrearUsuarioAsync(CrearUsuarioDto nuevoUsuario, CancellationToken cancellationToken = default);
    Task ActualizarUsuarioAsync(int idUsuario, ActualizarUsuarioDto datosActualizados, CancellationToken cancellationToken = default);
    Task CambiarEstadoActivoAsync(int idUsuario, bool activo, CancellationToken cancellationToken = default);
}
