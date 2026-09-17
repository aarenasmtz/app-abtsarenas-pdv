using Microsoft.EntityFrameworkCore;
using PdvAbarrotes.Aplicacion.Interfaces;
using PdvAbarrotes.Dominio.Entidades;
using PdvAbarrotes.Infraestructura.Persistencia;

namespace PdvAbarrotes.Infraestructura.Servicios;

/// <summary>
/// Servicio para registrar eventos de auditoría detallados en dbo.BitacoraAuditoria.
/// </summary>
public class ServicioAuditoria : IServicioAuditoria
{
    private readonly ContextoPrincipal _contexto;
    private readonly IServicioUsuarioActual _usuarioActual;

    public ServicioAuditoria(ContextoPrincipal contexto, IServicioUsuarioActual usuarioActual)
    {
        _contexto = contexto;
        _usuarioActual = usuarioActual;
    }

    public async Task RegistrarAsync(
        string tabla, 
        int idRegistro, 
        string accion, 
        string? valorAnterior, 
        string? valorNuevo, 
        CancellationToken cancellationToken = default)
    {
        var auditoria = new BitacoraAuditoria
        {
            Tabla = tabla,
            IdRegistro = idRegistro,
            Accion = accion,
            ValorAnterior = valorAnterior,
            ValorNuevo = valorNuevo,
            Usuario = _usuarioActual.NombreUsuario,
            FechaHora = DateTime.Now,
            DireccionIp = _usuarioActual.DireccionIp
        };

        _contexto.BitacoraAuditoria.Add(auditoria);
        await _contexto.SaveChangesAsync(cancellationToken);
    }
}
