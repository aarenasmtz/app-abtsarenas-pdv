using Microsoft.EntityFrameworkCore;
using PdvAbarrotes.Aplicacion.Comun;
using PdvAbarrotes.Aplicacion.DTOs.Autenticacion;
using PdvAbarrotes.Aplicacion.Interfaces;
using PdvAbarrotes.Dominio.Entidades;
using PdvAbarrotes.Dominio.Excepciones;
using PdvAbarrotes.Infraestructura.Persistencia;

namespace PdvAbarrotes.Infraestructura.Servicios;

/// <summary>
/// Implementación del servicio de administración de usuarios y cajeros con auditoría granular.
/// </summary>
public class ServicioUsuarios : IServicioUsuarios
{
    private readonly ContextoPrincipal _contexto;
    private readonly IServicioAuditoria _servicioAuditoria;

    public ServicioUsuarios(ContextoPrincipal contexto, IServicioAuditoria servicioAuditoria)
    {
        _contexto = contexto;
        _servicioAuditoria = servicioAuditoria;
    }

    public async Task<ResultadoPaginado<UsuarioDto>> ObtenerUsuariosPaginadoAsync(FiltroPaginacionDto filtro, CancellationToken cancellationToken = default)
    {
        var consulta = _contexto.Usuarios.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(filtro.Busqueda))
        {
            var termino = filtro.Busqueda.Trim().ToLower();
            consulta = consulta.Where(u => u.NombreUsuario.ToLower().Contains(termino) ||
                                           u.NombreCompleto.ToLower().Contains(termino) ||
                                           u.Correo.ToLower().Contains(termino));
        }

        var totalRegistros = await consulta.CountAsync(cancellationToken);

        var elementos = await (from u in consulta
                               join ur in _contexto.UsuarioRoles on u.IdUsuario equals ur.IdUsuario into urGroup
                               from ur in urGroup.DefaultIfEmpty()
                               join r in _contexto.Roles on ur.IdRol equals r.IdRol into rGroup
                               from r in rGroup.DefaultIfEmpty()
                               orderby u.IdUsuario ascending
                               select new UsuarioDto
                               {
                                   IdUsuario = u.IdUsuario,
                                   NombreCompleto = u.NombreCompleto,
                                   NombreUsuario = u.NombreUsuario,
                                   Correo = u.Correo,
                                   Telefono = u.Telefono,
                                   EsAdministrador = u.EsAdministrador,
                                   Activo = u.Activo,
                                   Rol = u.EsAdministrador ? "Administrador" : (r != null ? r.Nombre : "Cajero"),
                                   FechaRegistro = u.FechaRegistro
                               })
                               .Skip((filtro.Pagina - 1) * filtro.RegistrosPorPagina)
                               .Take(filtro.RegistrosPorPagina)
                               .ToListAsync(cancellationToken);

        return new ResultadoPaginado<UsuarioDto>(elementos, totalRegistros, filtro.Pagina, filtro.RegistrosPorPagina);
    }

    public async Task<UsuarioDto> ObtenerPorIdAsync(int idUsuario, CancellationToken cancellationToken = default)
    {
        var usuario = await _contexto.Usuarios.AsNoTracking().FirstOrDefaultAsync(u => u.IdUsuario == idUsuario, cancellationToken);
        if (usuario == null)
        {
            throw new ExcepcionNoEncontrado("Usuario", idUsuario);
        }

        var rolNombre = "Cajero";
        var rolAsignado = await (from ur in _contexto.UsuarioRoles
                                 join r in _contexto.Roles on ur.IdRol equals r.IdRol
                                 where ur.IdUsuario == idUsuario
                                 select r.Nombre).FirstOrDefaultAsync(cancellationToken);
        if (!string.IsNullOrEmpty(rolAsignado))
        {
            rolNombre = rolAsignado;
        }
        else if (usuario.EsAdministrador)
        {
            rolNombre = "Administrador";
        }

        return new UsuarioDto
        {
            IdUsuario = usuario.IdUsuario,
            NombreCompleto = usuario.NombreCompleto,
            NombreUsuario = usuario.NombreUsuario,
            Correo = usuario.Correo,
            Telefono = usuario.Telefono,
            EsAdministrador = usuario.EsAdministrador,
            Activo = usuario.Activo,
            Rol = rolNombre,
            FechaRegistro = usuario.FechaRegistro
        };
    }

    public async Task<UsuarioDto> CrearUsuarioAsync(CrearUsuarioDto nuevoUsuario, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(nuevoUsuario.NombreUsuario))
        {
            throw new ExcepcionReglaNegocio("El nombre de usuario es obligatorio.");
        }

        if (string.IsNullOrWhiteSpace(nuevoUsuario.Clave) || nuevoUsuario.Clave.Length < 6)
        {
            throw new ExcepcionReglaNegocio("La contraseña inicial debe tener al menos 6 caracteres.");
        }

        var existeNombre = await _contexto.Usuarios.AnyAsync(u => u.NombreUsuario == nuevoUsuario.NombreUsuario, cancellationToken);
        if (existeNombre)
        {
            throw new ExcepcionReglaNegocio($"El nombre de usuario '{nuevoUsuario.NombreUsuario}' ya se encuentra registrado.");
        }

        var rol = await _contexto.Roles.FindAsync(new object[] { nuevoUsuario.IdRol }, cancellationToken);
        var esAdmin = rol?.Nombre == "Administrador";

        var usuario = new Usuario
        {
            NombreCompleto = nuevoUsuario.NombreCompleto.Trim(),
            NombreUsuario = nuevoUsuario.NombreUsuario.Trim().ToLower(),
            ClaveHash = BCrypt.Net.BCrypt.HashPassword(nuevoUsuario.Clave),
            Correo = nuevoUsuario.Correo?.Trim() ?? string.Empty,
            Telefono = nuevoUsuario.Telefono?.Trim() ?? string.Empty,
            EsAdministrador = esAdmin,
            Activo = true,
            FechaRegistro = DateTime.Now
        };

        _contexto.Usuarios.Add(usuario);
        await _contexto.SaveChangesAsync(cancellationToken);

        // Asociar rol
        _contexto.UsuarioRoles.Add(new UsuarioRol
        {
            IdUsuario = usuario.IdUsuario,
            IdRol = nuevoUsuario.IdRol
        });
        await _contexto.SaveChangesAsync(cancellationToken);

        // Auditar creación
        await _servicioAuditoria.RegistrarAsync(
            tabla: "Usuarios",
            idRegistro: usuario.IdUsuario,
            accion: "CREAR_USUARIO",
            valorAnterior: null,
            valorNuevo: $"Usuario '{usuario.NombreUsuario}' creado con rol '{rol?.Nombre ?? "Cajero"}'",
            cancellationToken: cancellationToken);

        return new UsuarioDto
        {
            IdUsuario = usuario.IdUsuario,
            NombreCompleto = usuario.NombreCompleto,
            NombreUsuario = usuario.NombreUsuario,
            Correo = usuario.Correo,
            Telefono = usuario.Telefono,
            EsAdministrador = usuario.EsAdministrador,
            Activo = usuario.Activo,
            Rol = rol?.Nombre ?? "Cajero",
            FechaRegistro = usuario.FechaRegistro
        };
    }

    public async Task ActualizarUsuarioAsync(int idUsuario, ActualizarUsuarioDto datosActualizados, CancellationToken cancellationToken = default)
    {
        var usuario = await _contexto.Usuarios.FindAsync(new object[] { idUsuario }, cancellationToken);
        if (usuario == null)
        {
            throw new ExcepcionNoEncontrado("Usuario", idUsuario);
        }

        var rol = await _contexto.Roles.FindAsync(new object[] { datosActualizados.IdRol }, cancellationToken);
        var esAdmin = rol?.Nombre == "Administrador";

        var valorAnterior = $"Nombre: {usuario.NombreCompleto}, Activo: {usuario.Activo}, Admin: {usuario.EsAdministrador}";

        usuario.NombreCompleto = datosActualizados.NombreCompleto.Trim();
        usuario.Correo = datosActualizados.Correo?.Trim() ?? string.Empty;
        usuario.Telefono = datosActualizados.Telefono?.Trim() ?? string.Empty;
        usuario.Activo = datosActualizados.Activo;
        usuario.EsAdministrador = esAdmin;

        if (!string.IsNullOrWhiteSpace(datosActualizados.NuevaClave))
        {
            if (datosActualizados.NuevaClave.Length < 6)
            {
                throw new ExcepcionReglaNegocio("La nueva contraseña debe tener al menos 6 caracteres.");
            }
            usuario.ClaveHash = BCrypt.Net.BCrypt.HashPassword(datosActualizados.NuevaClave);
        }

        // Actualizar rol
        var relacionRol = await _contexto.UsuarioRoles.FirstOrDefaultAsync(ur => ur.IdUsuario == idUsuario, cancellationToken);
        if (relacionRol != null)
        {
            relacionRol.IdRol = datosActualizados.IdRol;
        }
        else
        {
            _contexto.UsuarioRoles.Add(new UsuarioRol { IdUsuario = idUsuario, IdRol = datosActualizados.IdRol });
        }

        await _contexto.SaveChangesAsync(cancellationToken);

        var valorNuevo = $"Nombre: {usuario.NombreCompleto}, Activo: {usuario.Activo}, Admin: {usuario.EsAdministrador}, Rol: {rol?.Nombre}";

        await _servicioAuditoria.RegistrarAsync(
            tabla: "Usuarios",
            idRegistro: usuario.IdUsuario,
            accion: "MODIFICAR_USUARIO",
            valorAnterior: valorAnterior,
            valorNuevo: valorNuevo,
            cancellationToken: cancellationToken);
    }

    public async Task CambiarEstadoActivoAsync(int idUsuario, bool activo, CancellationToken cancellationToken = default)
    {
        var usuario = await _contexto.Usuarios.FindAsync(new object[] { idUsuario }, cancellationToken);
        if (usuario == null)
        {
            throw new ExcepcionNoEncontrado("Usuario", idUsuario);
        }

        var estadoAnterior = usuario.Activo;
        usuario.Activo = activo;
        await _contexto.SaveChangesAsync(cancellationToken);

        await _servicioAuditoria.RegistrarAsync(
            tabla: "Usuarios",
            idRegistro: usuario.IdUsuario,
            accion: activo ? "ACTIVAR_USUARIO" : "DESACTIVAR_USUARIO",
            valorAnterior: $"Activo: {estadoAnterior}",
            valorNuevo: $"Activo: {activo}",
            cancellationToken: cancellationToken);
    }
}
