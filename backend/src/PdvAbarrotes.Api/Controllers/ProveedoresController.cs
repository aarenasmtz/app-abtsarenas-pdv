using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PdvAbarrotes.Aplicacion.Comun;
using PdvAbarrotes.Aplicacion.DTOs.Proveedores;
using PdvAbarrotes.Aplicacion.Interfaces;

namespace PdvAbarrotes.Api.Controllers;

/// <summary>
/// Controlador para el catálogo de proveedores comerciales: alta, edición, búsqueda y activación/desactivación.
/// Ruta base: /api/v1/proveedores
/// </summary>
[Authorize]
public class ProveedoresController : ControladorBase
{
    private readonly IServicioProveedores _servicioProveedores;
    private readonly IServicioUsuarioActual _servicioUsuarioActual;

    public ProveedoresController(
        IServicioProveedores servicioProveedores,
        IServicioUsuarioActual servicioUsuarioActual)
    {
        _servicioProveedores = servicioProveedores;
        _servicioUsuarioActual = servicioUsuarioActual;
    }

    /// <summary>
    /// Consulta el catálogo de proveedores con filtros opcionales y paginación.
    /// </summary>
    /// <param name="filtro">Filtros: término de búsqueda, soloActivos, página y tamaño de página.</param>
    /// <param name="ct">Token de cancelación.</param>
    [HttpGet]
    [Authorize(Roles = "Supervisor,Administrador")]
    [ProducesResponseType(typeof(RespuestaApi<ResultadoPaginado<ProveedorDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ObtenerPaginado([FromQuery] FiltroProveedoresDto filtro, CancellationToken ct)
    {
        try
        {
            var resultado = await _servicioProveedores.ObtenerPaginadoAsync(filtro, ct);
            return Ok(RespuestaApi<ResultadoPaginado<ProveedorDto>>.Satisfactorio(resultado, "Proveedores obtenidos correctamente."));
        }
        catch (Exception ex)
        {
            return StatusCode(500, RespuestaApi<object>.Fallido($"Error interno al consultar proveedores: {ex.Message}"));
        }
    }

    /// <summary>
    /// Retorna la lista compacta de todos los proveedores activos para poblar combos y selectores.
    /// </summary>
    /// <param name="ct">Token de cancelación.</param>
    [HttpGet("activos")]
    [Authorize(Roles = "Cajero,Supervisor,Administrador")]
    [ProducesResponseType(typeof(RespuestaApi<IReadOnlyList<ProveedorDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ObtenerActivos(CancellationToken ct)
    {
        try
        {
            var lista = await _servicioProveedores.ObtenerTodosActivosAsync(ct);
            return Ok(RespuestaApi<IReadOnlyList<ProveedorDto>>.Satisfactorio(lista, $"{lista.Count} proveedores activos."));
        }
        catch (Exception ex)
        {
            return StatusCode(500, RespuestaApi<object>.Fallido($"Error interno: {ex.Message}"));
        }
    }

    /// <summary>
    /// Obtiene el detalle completo de un proveedor por su identificador.
    /// </summary>
    /// <param name="id">Identificador único del proveedor.</param>
    /// <param name="ct">Token de cancelación.</param>
    [HttpGet("{id:int}")]
    [Authorize(Roles = "Supervisor,Administrador")]
    [ProducesResponseType(typeof(RespuestaApi<ProveedorDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(RespuestaApi<ProveedorDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ObtenerPorId([FromRoute] int id, CancellationToken ct)
    {
        try
        {
            var proveedor = await _servicioProveedores.ObtenerPorIdAsync(id, ct);
            if (proveedor == null)
            {
                return NotFound(RespuestaApi<ProveedorDto>.Fallido($"El proveedor #{id} no fue encontrado."));
            }

            return Ok(RespuestaApi<ProveedorDto>.Satisfactorio(proveedor, "Proveedor encontrado."));
        }
        catch (Exception ex)
        {
            return StatusCode(500, RespuestaApi<object>.Fallido($"Error interno: {ex.Message}"));
        }
    }

    /// <summary>
    /// Registra un nuevo proveedor en el catálogo.
    /// </summary>
    /// <param name="dto">Datos del nuevo proveedor (nombre, RFC, teléfono, correo, etc.).</param>
    /// <param name="ct">Token de cancelación.</param>
    [HttpPost]
    [Authorize(Roles = "Supervisor,Administrador")]
    [ProducesResponseType(typeof(RespuestaApi<ProveedorDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(RespuestaApi<ProveedorDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Crear([FromBody] CrearProveedorDto dto, CancellationToken ct)
    {
        if (!ModelState.IsValid)
        {
            var errores = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage)
                .ToList();
            return BadRequest(RespuestaApi<ProveedorDto>.Fallido("Datos de proveedor inválidos.", errores));
        }

        try
        {
            int idUsuario = _servicioUsuarioActual.IdUsuario ?? 0;
            var creado = await _servicioProveedores.CrearAsync(dto, idUsuario, ct);
            return CreatedAtAction(
                nameof(ObtenerPorId),
                new { id = creado.IdProveedor },
                RespuestaApi<ProveedorDto>.Satisfactorio(creado, $"Proveedor '{creado.Nombre}' creado correctamente."));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(RespuestaApi<ProveedorDto>.Fallido(ex.Message));
        }
        catch (Exception ex)
        {
            return StatusCode(500, RespuestaApi<object>.Fallido($"Error interno al crear el proveedor: {ex.Message}"));
        }
    }

    /// <summary>
    /// Actualiza los datos de un proveedor existente.
    /// </summary>
    /// <param name="id">Identificador del proveedor a actualizar.</param>
    /// <param name="dto">Datos actualizados del proveedor.</param>
    /// <param name="ct">Token de cancelación.</param>
    [HttpPut("{id:int}")]
    [Authorize(Roles = "Supervisor,Administrador")]
    [ProducesResponseType(typeof(RespuestaApi<ProveedorDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(RespuestaApi<ProveedorDto>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(RespuestaApi<ProveedorDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Actualizar([FromRoute] int id, [FromBody] ActualizarProveedorDto dto, CancellationToken ct)
    {
        if (id != dto.IdProveedor)
        {
            return BadRequest(RespuestaApi<ProveedorDto>.Fallido("El ID de la ruta no coincide con el ID del cuerpo de la solicitud."));
        }

        if (!ModelState.IsValid)
        {
            var errores = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage)
                .ToList();
            return BadRequest(RespuestaApi<ProveedorDto>.Fallido("Datos de proveedor inválidos.", errores));
        }

        try
        {
            int idUsuario = _servicioUsuarioActual.IdUsuario ?? 0;
            var actualizado = await _servicioProveedores.ActualizarAsync(dto, idUsuario, ct);
            return Ok(RespuestaApi<ProveedorDto>.Satisfactorio(actualizado, $"Proveedor '{actualizado.Nombre}' actualizado correctamente."));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(RespuestaApi<ProveedorDto>.Fallido(ex.Message));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(RespuestaApi<ProveedorDto>.Fallido(ex.Message));
        }
        catch (Exception ex)
        {
            return StatusCode(500, RespuestaApi<object>.Fallido($"Error interno al actualizar el proveedor: {ex.Message}"));
        }
    }

    /// <summary>
    /// Activa o desactiva un proveedor del catálogo sin eliminarlo físicamente.
    /// </summary>
    /// <param name="id">Identificador del proveedor.</param>
    /// <param name="activo">true = activar, false = desactivar.</param>
    /// <param name="ct">Token de cancelación.</param>
    [HttpPatch("{id:int}/estado")]
    [Authorize(Roles = "Administrador")]
    [ProducesResponseType(typeof(RespuestaApi<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(RespuestaApi<bool>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CambiarEstado([FromRoute] int id, [FromQuery] bool activo, CancellationToken ct)
    {
        try
        {
            int idUsuario = _servicioUsuarioActual.IdUsuario ?? 0;
            await _servicioProveedores.CambiarEstadoActivoAsync(id, activo, idUsuario, ct);
            string accion = activo ? "activado" : "desactivado";
            return Ok(RespuestaApi<bool>.Satisfactorio(true, $"Proveedor #{id} {accion} correctamente."));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(RespuestaApi<bool>.Fallido(ex.Message));
        }
        catch (Exception ex)
        {
            return StatusCode(500, RespuestaApi<object>.Fallido($"Error interno al cambiar estado del proveedor: {ex.Message}"));
        }
    }
}
