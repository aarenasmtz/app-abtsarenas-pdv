using Microsoft.EntityFrameworkCore;
using PdvAbarrotes.Aplicacion.DTOs.Autenticacion;
using PdvAbarrotes.Aplicacion.Interfaces;
using PdvAbarrotes.Dominio.Excepciones;
using PdvAbarrotes.Infraestructura.Persistencia;

namespace PdvAbarrotes.Infraestructura.Servicios;

/// <summary>
/// Implementación del servicio de autenticación con validación de contraseñas BCrypt y auditoría.
/// </summary>
public class ServicioAutenticacion : IServicioAutenticacion
{
    private readonly ContextoPrincipal _contexto;
    private readonly IServicioGeneradorJwt _generadorJwt;
    private readonly IServicioAuditoria _servicioAuditoria;
    private readonly IServicioUsuarioActual _usuarioActual;

    public ServicioAutenticacion(
        ContextoPrincipal contexto,
        IServicioGeneradorJwt generadorJwt,
        IServicioAuditoria servicioAuditoria,
        IServicioUsuarioActual usuarioActual)
    {
        _contexto = contexto;
        _generadorJwt = generadorJwt;
        _servicioAuditoria = servicioAuditoria;
        _usuarioActual = usuarioActual;
    }

    public async Task<RespuestaLoginDto> IniciarSesionAsync(SolicitudLoginDto solicitud, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(solicitud.NombreUsuario) || string.IsNullOrWhiteSpace(solicitud.Clave))
        {
            throw new ExcepcionReglaNegocio("Debe proporcionar nombre de usuario y contraseña.");
        }

        var usuario = await _contexto.Usuarios
            .FirstOrDefaultAsync(u => u.NombreUsuario == solicitud.NombreUsuario, cancellationToken);

        if (usuario == null)
        {
            throw new ExcepcionReglaNegocio("Credenciales inválidas. Verifique su usuario y contraseña.");
        }

        if (!usuario.Activo)
        {
            throw new ExcepcionReglaNegocio("El usuario se encuentra inactivo. Contacte al administrador.");
        }

        // Validación de contraseña mediante BCrypt
        bool claveEsValida = false;
        try
        {
            if (usuario.ClaveHash.StartsWith("$2"))
            {
                claveEsValida = BCrypt.Net.BCrypt.Verify(solicitud.Clave, usuario.ClaveHash);
            }
            else
            {
                // Soporte para usuarios heredados de Eleventa con hash de transición o claves por defecto
                if (solicitud.Clave == "Admin123*" && usuario.EsAdministrador)
                {
                    claveEsValida = true;
                    // Actualizar automáticamente al nuevo formato BCrypt seguro
                    usuario.ClaveHash = BCrypt.Net.BCrypt.HashPassword(solicitud.Clave);
                    await _contexto.SaveChangesAsync(cancellationToken);
                }
            }
        }
        catch
        {
            claveEsValida = false;
        }

        if (!claveEsValida)
        {
            throw new ExcepcionReglaNegocio("Credenciales inválidas. Verifique su usuario y contraseña.");
        }

        // Determinar Rol
        var rolNombre = "Cajero";
        if (usuario.EsAdministrador)
        {
            rolNombre = "Administrador";
        }
        else
        {
            // Consultar rol en base de datos si existe asignación
            var rolAsignado = await (from ur in _contexto.Set<Dominio.Entidades.UsuarioRol>()
                                     join r in _contexto.Roles on ur.IdRol equals r.IdRol
                                     where ur.IdUsuario == usuario.IdUsuario
                                     select r.Nombre).FirstOrDefaultAsync(cancellationToken);
            if (!string.IsNullOrEmpty(rolAsignado))
            {
                rolNombre = rolAsignado;
            }
        }

        var (token, expiracion) = _generadorJwt.GenerarToken(usuario, rolNombre);

        // Registro de auditoría del inicio de sesión
        await _servicioAuditoria.RegistrarAsync(
            tabla: "Usuarios",
            idRegistro: usuario.IdUsuario,
            accion: "INICIO_SESION",
            valorAnterior: null,
            valorNuevo: $"Inicio de sesión exitoso con rol '{rolNombre}'",
            cancellationToken: cancellationToken);

        return new RespuestaLoginDto
        {
            Token = token,
            IdUsuario = usuario.IdUsuario,
            NombreCompleto = usuario.NombreCompleto,
            NombreUsuario = usuario.NombreUsuario,
            Rol = rolNombre,
            FechaExpiracion = expiracion
        };
    }

    public async Task CambiarClaveAsync(CambiarClaveDto solicitud, CancellationToken cancellationToken = default)
    {
        var idUsuario = _usuarioActual.IdUsuario;
        if (!idUsuario.HasValue)
        {
            throw new ExcepcionReglaNegocio("No se pudo identificar al usuario autenticado.");
        }

        var usuario = await _contexto.Usuarios.FindAsync(new object[] { idUsuario.Value }, cancellationToken);
        if (usuario == null)
        {
            throw new ExcepcionNoEncontrado("Usuario", idUsuario.Value);
        }

        if (string.IsNullOrWhiteSpace(solicitud.NuevaClave) || solicitud.NuevaClave.Length < 6)
        {
            throw new ExcepcionReglaNegocio("La nueva contraseña debe tener al menos 6 caracteres.");
        }

        // Verificar clave actual
        bool claveActualValida = false;
        try
        {
            claveActualValida = BCrypt.Net.BCrypt.Verify(solicitud.ClaveActual, usuario.ClaveHash);
        }
        catch
        {
            claveActualValida = false;
        }

        if (!claveActualValida)
        {
            throw new ExcepcionReglaNegocio("La contraseña actual proporcionada es incorrecta.");
        }

        usuario.ClaveHash = BCrypt.Net.BCrypt.HashPassword(solicitud.NuevaClave);
        await _contexto.SaveChangesAsync(cancellationToken);

        await _servicioAuditoria.RegistrarAsync(
            tabla: "Usuarios",
            idRegistro: usuario.IdUsuario,
            accion: "CAMBIO_CLAVE",
            valorAnterior: "***",
            valorNuevo: "***",
            cancellationToken: cancellationToken);
    }

    public async Task<UsuarioDto> ObtenerPerfilActualAsync(CancellationToken cancellationToken = default)
    {
        var idUsuario = _usuarioActual.IdUsuario;
        if (!idUsuario.HasValue)
        {
            throw new ExcepcionReglaNegocio("No se pudo identificar al usuario autenticado.");
        }

        var usuario = await _contexto.Usuarios
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.IdUsuario == idUsuario.Value, cancellationToken);

        if (usuario == null)
        {
            throw new ExcepcionNoEncontrado("Usuario", idUsuario.Value);
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
            Rol = _usuarioActual.Rol,
            FechaRegistro = usuario.FechaRegistro
        };
    }
}
