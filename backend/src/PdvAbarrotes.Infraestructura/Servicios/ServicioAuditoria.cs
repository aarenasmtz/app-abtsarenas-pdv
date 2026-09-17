using Microsoft.EntityFrameworkCore;
using PdvAbarrotes.Aplicacion.Comun;
using PdvAbarrotes.Aplicacion.DTOs.Auditoria;
using PdvAbarrotes.Aplicacion.Interfaces;
using PdvAbarrotes.Dominio.Entidades;
using PdvAbarrotes.Infraestructura.Persistencia;

namespace PdvAbarrotes.Infraestructura.Servicios;

/// <summary>
/// Servicio para registrar y consultar eventos de auditoría detallados en dbo.BitacoraAuditoria.
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

    public async Task<ResultadoPaginado<RegistroAuditoriaDto>> ConsultarAuditoriaPaginadoAsync(
        FiltroAuditoriaDto filtro, 
        CancellationToken cancellationToken = default)
    {
        var consulta = _contexto.BitacoraAuditoria.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(filtro.Tabla))
        {
            consulta = consulta.Where(a => a.Tabla == filtro.Tabla);
        }

        if (!string.IsNullOrWhiteSpace(filtro.Accion))
        {
            consulta = consulta.Where(a => a.Accion == filtro.Accion);
        }

        if (!string.IsNullOrWhiteSpace(filtro.Usuario))
        {
            consulta = consulta.Where(a => a.Usuario.Contains(filtro.Usuario));
        }

        if (filtro.FechaDesde.HasValue)
        {
            consulta = consulta.Where(a => a.FechaHora >= filtro.FechaDesde.Value);
        }

        if (filtro.FechaHasta.HasValue)
        {
            consulta = consulta.Where(a => a.FechaHora <= filtro.FechaHasta.Value);
        }

        if (!string.IsNullOrWhiteSpace(filtro.Busqueda))
        {
            var termino = filtro.Busqueda.Trim().ToLower();
            consulta = consulta.Where(a => a.Tabla.ToLower().Contains(termino) ||
                                           a.Accion.ToLower().Contains(termino) ||
                                           a.Usuario.ToLower().Contains(termino) ||
                                           (a.ValorNuevo != null && a.ValorNuevo.ToLower().Contains(termino)));
        }

        var totalRegistros = await consulta.CountAsync(cancellationToken);

        var elementos = await consulta
            .OrderByDescending(a => a.FechaHora)
            .Skip((filtro.Pagina - 1) * filtro.RegistrosPorPagina)
            .Take(filtro.RegistrosPorPagina)
            .Select(a => new RegistroAuditoriaDto
            {
                IdAuditoria = a.IdAuditoria,
                Tabla = a.Tabla,
                IdRegistro = a.IdRegistro,
                Accion = a.Accion,
                ValorAnterior = a.ValorAnterior,
                ValorNuevo = a.ValorNuevo,
                Usuario = a.Usuario,
                FechaHora = a.FechaHora,
                DireccionIp = a.DireccionIp
            })
            .ToListAsync(cancellationToken);

        return new ResultadoPaginado<RegistroAuditoriaDto>(elementos, totalRegistros, filtro.Pagina, filtro.RegistrosPorPagina);
    }
}
