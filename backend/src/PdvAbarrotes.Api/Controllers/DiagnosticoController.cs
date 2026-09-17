using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PdvAbarrotes.Aplicacion.Comun;
using PdvAbarrotes.Aplicacion.Interfaces;

namespace PdvAbarrotes.Api.Controllers;

/// <summary>
/// Controlador para verificar la salud de la API y el estado de la conexión a SQL Server.
/// </summary>
public class DiagnosticoController : ControladorBase
{
    private readonly IContextoPrincipal _contexto;
    private readonly ILogger<DiagnosticoController> _logger;

    public DiagnosticoController(IContextoPrincipal contexto, ILogger<DiagnosticoController> logger)
    {
        _contexto = contexto;
        _logger = logger;
    }

    /// <summary>
    /// Consulta el estado del sistema, confirmando la conectividad a SQL Server y la cantidad de registros base.
    /// </summary>
    [HttpGet("estado")]
    public async Task<ActionResult<RespuestaApi<object>>> ObtenerEstadoSistema(CancellationToken cancellationToken)
    {
        try
        {
            var totalProductos = await _contexto.Productos.CountAsync(cancellationToken);
            var totalVentas = await _contexto.Ventas.CountAsync(cancellationToken);
            var totalClientes = await _contexto.Clientes.CountAsync(cancellationToken);
            var totalCajas = await _contexto.Cajas.CountAsync(cancellationToken);

            var resultado = new
            {
                Estado = "En Línea",
                MotorBaseDatos = "Microsoft SQL Server 2022",
                BaseDatos = "PdvAbarrotesArenas",
                FechaServidor = DateTime.Now,
                Estadisticas = new
                {
                    TotalProductos = totalProductos,
                    TotalVentas = totalVentas,
                    TotalClientes = totalClientes,
                    TotalCajas = totalCajas
                }
            };

            return RespuestaExito<object>(resultado, "Conexión a SQL Server verificada satisfactoriamente");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al conectar con SQL Server durante diagnóstico.");
            return RespuestaError<object>($"Fallo de conectividad con SQL Server: {ex.Message}", codigoEstado: 500);
        }
    }
}
