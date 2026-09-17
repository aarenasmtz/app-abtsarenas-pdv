using Microsoft.EntityFrameworkCore;
using PdvAbarrotes.Dominio.Entidades;
using PdvAbarrotes.Infraestructura.Persistencia;

namespace PdvAbarrotes.Infraestructura;

/// <summary>
/// Inicializador automático de datos base (Roles, Usuarios con BCrypt) para el arranque del sistema.
/// </summary>
public static class InicializadorDatos
{
    public static async Task InicializarAsync(ContextoPrincipal contexto)
    {
        // 1. Roles del Sistema
        if (!await contexto.Roles.AnyAsync())
        {
            await contexto.Database.ExecuteSqlRawAsync(@"
                SET IDENTITY_INSERT Roles ON;
                INSERT INTO Roles (IdRol, Nombre, Descripcion, Activo) VALUES 
                (1, 'Administrador', 'Control total y configuracion del sistema', 1),
                (2, 'Cajero', 'Operacion de cobro en caja y consulta de productos', 1),
                (3, 'Supervisor', 'Cortes de caja, autorizaciones y mermas', 1);
                SET IDENTITY_INSERT Roles OFF;
            ");
        }

        // 2. Usuario Administrador por defecto
        var admin = await contexto.Usuarios.FirstOrDefaultAsync(u => u.NombreUsuario == "admin");
        if (admin == null)
        {
            admin = new Usuario
            {
                NombreCompleto = "Administrador General",
                NombreUsuario = "admin",
                ClaveHash = BCrypt.Net.BCrypt.HashPassword("Admin123*"),
                Correo = "admin@abarrotesarenas.com",
                Telefono = "0000000000",
                EsAdministrador = true,
                Activo = true,
                FechaRegistro = DateTime.Now
            };
            contexto.Usuarios.Add(admin);
            await contexto.SaveChangesAsync();
        }
        else if (!admin.ClaveHash.StartsWith("$2"))
        {
            // Migrar clave a BCrypt seguro
            admin.ClaveHash = BCrypt.Net.BCrypt.HashPassword("Admin123*");
            admin.EsAdministrador = true;
            admin.Activo = true;
            await contexto.SaveChangesAsync();
        }

        // 3. Usuario Cajero por defecto
        var cajero = await contexto.Usuarios.FirstOrDefaultAsync(u => u.NombreUsuario == "cajero");
        if (cajero == null)
        {
            cajero = new Usuario
            {
                NombreCompleto = "Cajero de Mostrador",
                NombreUsuario = "cajero",
                ClaveHash = BCrypt.Net.BCrypt.HashPassword("Cajero123*"),
                Correo = "cajero@abarrotesarenas.com",
                Telefono = "0000000000",
                EsAdministrador = false,
                Activo = true,
                FechaRegistro = DateTime.Now
            };
            contexto.Usuarios.Add(cajero);
            await contexto.SaveChangesAsync();
        }
        else if (!cajero.ClaveHash.StartsWith("$2"))
        {
            cajero.ClaveHash = BCrypt.Net.BCrypt.HashPassword("Cajero123*");
            cajero.Activo = true;
            await contexto.SaveChangesAsync();
        }

        // 4. Asegurar asignación en UsuarioRoles
        if (!await contexto.UsuarioRoles.AnyAsync(ur => ur.IdUsuario == admin.IdUsuario))
        {
            contexto.UsuarioRoles.Add(new UsuarioRol { IdUsuario = admin.IdUsuario, IdRol = 1 });
        }

        if (!await contexto.UsuarioRoles.AnyAsync(ur => ur.IdUsuario == cajero.IdUsuario))
        {
            contexto.UsuarioRoles.Add(new UsuarioRol { IdUsuario = cajero.IdUsuario, IdRol = 2 });
        }

        await contexto.SaveChangesAsync();
    }
}
