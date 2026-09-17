using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PdvAbarrotes.Aplicacion.Comun;
using PdvAbarrotes.Aplicacion.DTOs.Auditoria;
using PdvAbarrotes.Aplicacion.Interfaces;

namespace PdvAbarrotes.Api.Controllers;

/// <summary>
/// Controlador para consultar la bitácora de auditoría detallada de cambios del sistema.
/// </summary>
[Authorize(Roles = "Administrador,Supervisor")]
public class AuditoriaController : ControladorBase
{
    private readonly IServicioAuditoria _servicioAuditoria;

    public AuditoriaController(IServicioAuditoria servicioAuditoria)
    {
        _servicioAuditoria = servicioAuditoria;
    }

    /// <summary>
    /// Consulta el historial de auditoría paginado con filtros por tabla, usuario, acción y fechas.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<RespuestaApi<ResultadoPaginado<RegistroAuditoriaDto>>>> ConsultarBitacora(
        [FromQuery] FiltroAuditoriaDto filtro, 
        CancellationToken cancellationToken)
    {
        var resultado = await _servicioAuditoria.ConsultarAuditoriaPaginadoAsync(filtro, cancellationToken);
        return RespuestaExito(resultado, "Registros de auditoría recuperados exitosamente");
    }
}
