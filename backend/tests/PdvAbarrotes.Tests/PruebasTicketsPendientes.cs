using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using PdvAbarrotes.Aplicacion.DTOs.Ventas;
using PdvAbarrotes.Dominio.Entidades;
using PdvAbarrotes.Infraestructura.Persistencia;
using PdvAbarrotes.Infraestructura.Servicios;
using Xunit;

namespace PdvAbarrotes.Tests;

/// <summary>
/// Pruebas unitarias para la gestión de tickets en espera (TicketsPendientes).
/// </summary>
public class PruebasTicketsPendientes
{
    private ContextoPrincipal CrearContextoEnMemoria(string nombreBd)
    {
        var opciones = new DbContextOptionsBuilder<ContextoPrincipal>()
            .UseInMemoryDatabase(databaseName: nombreBd)
            .Options;

        var contexto = new ContextoPrincipal(opciones);

        if (!contexto.Usuarios.Any())
        {
            contexto.Usuarios.Add(new Usuario
            {
                IdUsuario = 1,
                NombreUsuario = "cajero1",
                NombreCompleto = "Cajero de Prueba",
                Activo = true
            });
        }

        if (!contexto.Productos.Any())
        {
            contexto.Productos.AddRange(
                new Producto { IdProducto = 10, CodigoProducto = "7501001", Descripcion = "Leche Entera 1L", PrecioCosto = 20m, PrecioVenta = 28m, Activo = true },
                new Producto { IdProducto = 20, CodigoProducto = "7501002", Descripcion = "Pan Blanco", PrecioCosto = 30m, PrecioVenta = 42m, Activo = true }
            );
        }

        contexto.SaveChanges();
        return contexto;
    }

    [Fact]
    public async Task GuardarTicketPendiente_ConArticulos_GuardaExitosamente()
    {
        // Organizar
        using var contexto = CrearContextoEnMemoria("Bd_GuardarTicketPendiente");
        var servicio = new ServicioTicketsPendientes(
            contexto,
            new ServicioAuditoriaSimulado(),
            new ServicioUsuarioActualSimulado(),
            NullLogger<ServicioTicketsPendientes>.Instance
        );

        var peticion = new CrearTicketPendienteDto
        {
            IdCaja = 1,
            IdentificadorCliente = "Cliente de camisa roja",
            Articulos = new List<ItemTicketPendienteDto>
            {
                new() { IdProducto = 10, CodigoBarras = "7501001", Descripcion = "Leche Entera 1L", Cantidad = 2, PrecioUnitario = 28m },
                new() { IdProducto = 20, CodigoBarras = "7501002", Descripcion = "Pan Blanco", Cantidad = 1, PrecioUnitario = 42m }
            }
        };

        // Actuar
        var respuesta = await servicio.GuardarTicketPendienteAsync(peticion);

        // Afirmar
        Assert.True(respuesta.Exito);
        Assert.NotNull(respuesta.Datos);
        Assert.Equal(98.00m, respuesta.Datos.Total); // (2*28) + (1*42) = 56 + 42 = 98
        Assert.Equal("Cliente de camisa roja", respuesta.Datos.IdentificadorCliente);
        Assert.True(respuesta.Datos.Activo);

        // Verificar en BD
        var ticketEnBd = await contexto.TicketsPendientes.Include(t => t.Detalles).FirstOrDefaultAsync(t => t.IdTicketPendiente == respuesta.Datos.IdTicketPendiente);
        Assert.NotNull(ticketEnBd);
        Assert.Equal(2, ticketEnBd.Detalles.Count);
        Assert.Equal(98.00m, ticketEnBd.Total);
    }

    [Fact]
    public async Task GuardarTicketPendiente_SinArticulos_RetornaError()
    {
        // Organizar
        using var contexto = CrearContextoEnMemoria("Bd_GuardarSinArticulos");
        var servicio = new ServicioTicketsPendientes(
            contexto,
            new ServicioAuditoriaSimulado(),
            new ServicioUsuarioActualSimulado(),
            NullLogger<ServicioTicketsPendientes>.Instance
        );

        var peticion = new CrearTicketPendienteDto
        {
            IdCaja = 1,
            IdentificadorCliente = "Venta vacía",
            Articulos = new List<ItemTicketPendienteDto>()
        };

        // Actuar
        var respuesta = await servicio.GuardarTicketPendienteAsync(peticion);

        // Afirmar
        Assert.False(respuesta.Exito);
        Assert.Contains("sin artículos", respuesta.Mensaje);
    }

    [Fact]
    public async Task ObtenerTicketsPendientesActivos_RetornaSoloTicketsActivos()
    {
        // Organizar
        using var contexto = CrearContextoEnMemoria("Bd_ObtenerTicketsActivos");
        contexto.TicketsPendientes.AddRange(
            new TicketPendiente { IdTicketPendiente = 1, IdCaja = 1, IdUsuario = 1, IdentificadorCliente = "Espera 1", Total = 50m, Activo = true, FechaRegistro = DateTime.Now.AddMinutes(-10) },
            new TicketPendiente { IdTicketPendiente = 2, IdCaja = 1, IdUsuario = 1, IdentificadorCliente = "Espera 2", Total = 80m, Activo = false, FechaRegistro = DateTime.Now.AddMinutes(-5) },
            new TicketPendiente { IdTicketPendiente = 3, IdCaja = 1, IdUsuario = 1, IdentificadorCliente = "Espera 3", Total = 120m, Activo = true, FechaRegistro = DateTime.Now }
        );
        await contexto.SaveChangesAsync();

        var servicio = new ServicioTicketsPendientes(
            contexto,
            new ServicioAuditoriaSimulado(),
            new ServicioUsuarioActualSimulado(),
            NullLogger<ServicioTicketsPendientes>.Instance
        );

        // Actuar
        var respuesta = await servicio.ObtenerTicketsPendientesActivosAsync(1);

        // Afirmar
        Assert.True(respuesta.Exito);
        Assert.NotNull(respuesta.Datos);
        Assert.Equal(2, respuesta.Datos.Count); // Solo id 3 e id 1
        Assert.Contains(respuesta.Datos, t => t.IdTicketPendiente == 1);
        Assert.Contains(respuesta.Datos, t => t.IdTicketPendiente == 3);
        Assert.DoesNotContain(respuesta.Datos, t => t.IdTicketPendiente == 2);
    }

    [Fact]
    public async Task RecuperarTicketPendiente_DesactivaDeColaYRetornaPartidas()
    {
        // Organizar
        using var contexto = CrearContextoEnMemoria("Bd_RecuperarTicket");
        var ticket = new TicketPendiente
        {
            IdTicketPendiente = 100,
            IdCaja = 1,
            IdUsuario = 1,
            IdentificadorCliente = "Cliente que regresó",
            Total = 70.00m,
            Activo = true,
            FechaRegistro = DateTime.Now
        };
        contexto.TicketsPendientes.Add(ticket);
        contexto.DetalleTicketsPendientes.Add(new DetalleTicketPendiente
        {
            IdTicketPendiente = 100,
            IdProducto = 10,
            Cantidad = 2.5m,
            PrecioUnitario = 28m,
            Subtotal = 70.00m
        });
        await contexto.SaveChangesAsync();

        var servicio = new ServicioTicketsPendientes(
            contexto,
            new ServicioAuditoriaSimulado(),
            new ServicioUsuarioActualSimulado(),
            NullLogger<ServicioTicketsPendientes>.Instance
        );

        // Actuar
        var respuesta = await servicio.RecuperarTicketPendienteAsync(100);

        // Afirmar
        Assert.True(respuesta.Exito);
        Assert.NotNull(respuesta.Datos);
        Assert.Equal(100, respuesta.Datos.IdTicketPendiente);
        Assert.Single(respuesta.Datos.Articulos);
        Assert.Equal(2.5m, respuesta.Datos.Articulos[0].Cantidad);

        // En BD debe quedar inactivo
        var ticketEnBd = await contexto.TicketsPendientes.FindAsync(100);
        Assert.NotNull(ticketEnBd);
        Assert.False(ticketEnBd.Activo);
    }

    [Fact]
    public async Task DescartarTicketPendiente_DesactivaCorrectamente()
    {
        // Organizar
        using var contexto = CrearContextoEnMemoria("Bd_DescartarTicket");
        var ticket = new TicketPendiente
        {
            IdTicketPendiente = 200,
            IdCaja = 1,
            IdUsuario = 1,
            IdentificadorCliente = "No regresó",
            Total = 40.00m,
            Activo = true,
            FechaRegistro = DateTime.Now
        };
        contexto.TicketsPendientes.Add(ticket);
        await contexto.SaveChangesAsync();

        var servicio = new ServicioTicketsPendientes(
            contexto,
            new ServicioAuditoriaSimulado(),
            new ServicioUsuarioActualSimulado(),
            NullLogger<ServicioTicketsPendientes>.Instance
        );

        // Actuar
        var respuesta = await servicio.DescartarTicketPendienteAsync(200);

        // Afirmar
        Assert.True(respuesta.Exito);

        var ticketEnBd = await contexto.TicketsPendientes.FindAsync(200);
        Assert.NotNull(ticketEnBd);
        Assert.False(ticketEnBd.Activo);
    }
}
