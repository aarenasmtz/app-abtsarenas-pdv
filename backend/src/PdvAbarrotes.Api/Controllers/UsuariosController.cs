using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PdvAbarrotes.Aplicacion.Comun;
using PdvAbarrotes.Aplicacion.DTOs.Autenticacion;
using PdvAbarrotes.Aplicacion.Interfaces;

namespace PdvAbarrotes.Api.Controllers;

/// <summary>
/// Controlador para la administración de usuarios y cajeros (ABC con paginación server-side).
/// </summary>
[Authorize(Roles = "Administrador")]
public class UsuariosController : ControladorBase
{
    private readonly IServicioUsuarios _servicioUsuarios;

    public UsuariosController(IServicioUsuarios servicioUsuarios)
    {
        _servicioUsuarios = servicioUsuarios;
    }

    /// <summary>
    /// Consulta el listado de usuarios con paginación server-side (opciones 25/50/100).
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<RespuestaApi<ResultadoPaginado<UsuarioDto>>>> ObtenerTodos(
        [FromQuery] FiltroPaginacionDto filtro, 
        CancellationToken cancellationToken)
    {
        var resultado = await _servicioUsuarios.ObtenerUsuariosPaginadoAsync(filtro, cancellationToken);
        return RespuestaExito(resultado);
    }

    /// <summary>
    /// Consulta un usuario específico por su Id.
    /// </summary>
    [HttpGet("{id:int}")]
    public async Task<ActionResult<RespuestaApi<UsuarioDto>>> ObtenerPorId(
        int id, 
        CancellationToken cancellationToken)
    {
        var usuario = await _servicioUsuarios.ObtenerPorIdAsync(id, cancellationToken);
        return RespuestaExito(usuario);
    }

    /// <summary>
    /// Da de alta un nuevo usuario o cajero en el sistema.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<RespuestaApi<UsuarioDto>>> Crear(
        [FromBody] CrearUsuarioDto nuevoUsuario, 
        CancellationToken cancellationToken)
    {
        var creado = await _servicioUsuarios.CrearUsuarioAsync(nuevoUsuario, cancellationToken);
        return StatusCode(201, RespuestaApi<UsuarioDto>.Satisfactorio(creado, "Usuario creado exitosamente"));
    }

    /// <summary>
    /// Actualiza los datos de un usuario existente.
    /// </summary>
    [HttpPut("{id:int}")]
    public async Task<ActionResult<RespuestaApi<string>>> Actualizar(
        int id, 
        [FromBody] ActualizarUsuarioDto datosActualizados, 
        CancellationToken cancellationToken)
    {
        await _servicioUsuarios.ActualizarUsuarioAsync(id, datosActualizados, cancellationToken);
        return RespuestaExito("Usuario actualizado exitosamente");
    }

    /// <summary>
    /// Activa o desactiva a un usuario del sistema.
    /// </summary>
    [HttpPatch("{id:int}/estado")]
    public async Task<ActionResult<RespuestaApi<string>>> CambiarEstado(
        int id, 
        [FromBody] bool activo, 
        CancellationToken cancellationToken)
    {
        await _servicioUsuarios.CambiarEstadoActivoAsync(id, activo, cancellationToken);
        var estadoTexto = activo ? "activado" : "desactivado";
        return RespuestaExito($"Usuario {estadoTexto} exitosamente");
    }
}
