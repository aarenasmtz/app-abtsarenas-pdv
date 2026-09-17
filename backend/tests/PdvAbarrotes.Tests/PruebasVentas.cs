using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using PdvAbarrotes.Aplicacion.DTOs.Ventas;
using PdvAbarrotes.Dominio.Entidades;
using PdvAbarrotes.Infraestructura.Persistencia;
using PdvAbarrotes.Infraestructura.Servicios;
using Xunit;

namespace PdvAbarrotes.Tests;

/// <summary>
/// Pruebas unitarias para el servicio central de ventas, tickets térmicos e idempotencia del PDV.
/// </summary>
public class PruebasVentas
{
    private ContextoPrincipal CrearContextoEnMemoria(string nombreBd)
    {
        var opciones = new DbContextOptionsBuilder<ContextoPrincipal>()
            .UseInMemoryDatabase(databaseName: nombreBd)
            .Options;

        var contexto = new ContextoPrincipal(opciones);

        // Sembrar datos indispensables de prueba
        if (!contexto.Clientes.Any())
        {
            contexto.Clientes.Add(new Cliente
            {
                IdCliente = 1,
                Nombre = "Público",
                Apellidos = "en General",
                Activo = true,
                EsSistema = true
            });
        }

        if (!contexto.TiposMovimientoInventario.Any())
        {
            contexto.TiposMovimientoInventario.AddRange(
                new TipoMovimientoInventario { IdTipoMovimiento = 1, CodigoTipo = "ENTRADA_COMPRA", Descripcion = "Entrada por Compra", EfectoStock = 1, Activo = true },
                new TipoMovimientoInventario { IdTipoMovimiento = 2, CodigoTipo = "VENTA", Descripcion = "Salida por Venta", EfectoStock = -1, Activo = true }
            );
        }

        if (!contexto.Usuarios.Any())
        {
            contexto.Usuarios.Add(new Usuario
            {
                IdUsuario = 1,
                NombreUsuario = "admin_pruebas",
                NombreCompleto = "Administrador Pruebas",
                Activo = true
            });
        }

        if (!contexto.MetodosPago.Any())
        {
            contexto.MetodosPago.AddRange(
                new MetodoPago { IdMetodoPago = 1, Codigo = "EFECTIVO", Descripcion = "Efectivo", Activo = true },
                new MetodoPago { IdMetodoPago = 2, Codigo = "TARJETA_DEBITO", Descripcion = "Tarjeta de Débito", Activo = true }
            );
        }

        contexto.SaveChanges();
        return contexto;
    }

    [Fact]
    public async Task RegistrarVentaAsync_VentaExitosa_CalculaTotalesYDescuentaInventario()
    {
        // Arrange
        using var contexto = CrearContextoEnMemoria("BdTest_VentaExitosa");
        var auditoria = new ServicioAuditoriaSimulado();
        var usuarioActual = new ServicioUsuarioActualSimulado();
        var logger = NullLogger<ServicioVentas>.Instance;
        var servicio = new ServicioVentas(contexto, auditoria, usuarioActual, logger);

        var producto = new Producto
        {
            IdProducto = 201,
            CodigoProducto = "REF-COCA",
            Descripcion = "Coca Cola 600ml",
            PrecioCosto = 12.50m,
            PrecioVenta = 18.00m,
            ManejaInventario = true,
            Activo = true
        };
        contexto.Productos.Add(producto);

        var inventario = new Inventario
        {
            IdSucursal = 1,
            IdProducto = 201,
            ExistenciaActual = 50.0m,
            FechaUltimaModificacion = DateTime.Now
        };
        contexto.Inventarios.Add(inventario);
        await contexto.SaveChangesAsync();

        var peticion = new RegistrarVentaDto
        {
            TokenIdempotencia = Guid.NewGuid(),
            IdCliente = 1,
            IdCaja = 1,
            IdTurnoCaja = 1,
            ImporteRecibido = 50.00m, // Paga con un billete de $50
            Articulos = new List<ItemVentaDto>
            {
                new ItemVentaDto
                {
                    IdProducto = 201,
                    CodigoBarras = "7501055300075",
                    Descripcion = "Coca Cola 600ml",
                    Cantidad = 2,
                    PrecioUnitario = 18.00m,
                    Descuento = 0,
                    Subtotal = 36.00m
                }
            }
        };

        // Act
        var respuesta = await servicio.RegistrarVentaAsync(peticion);

        // Assert
        Assert.True(respuesta.Exito);
        Assert.NotNull(respuesta.Datos);
        Assert.Equal(36.00m, respuesta.Datos.Total);
        Assert.Equal(36.00m, respuesta.Datos.Subtotal);
        Assert.Equal(50.00m, respuesta.Datos.ImporteRecibido);
        Assert.Equal(14.00m, respuesta.Datos.Cambio); // 50 - 36 = 14
        Assert.Equal(2m, respuesta.Datos.NumeroArticulos);
        Assert.False(respuesta.Datos.EsReintentoIdempotente);

        // Validar descuento en inventario
        var inventarioActualizado = await contexto.Inventarios.FirstAsync(i => i.IdProducto == 201);
        Assert.Equal(48.0m, inventarioActualizado.ExistenciaActual); // 50 - 2 = 48

        // Validar inserción en Kardex
        var kardex = await contexto.MovimientosInventario.FirstOrDefaultAsync(m => m.IdProducto == 201);
        Assert.NotNull(kardex);
        Assert.Equal(-2m, kardex.CantidadMovimiento);
        Assert.Equal(48.0m, kardex.CantidadNueva);
    }

    [Fact]
    public async Task RegistrarVentaAsync_Idempotencia_MismoTokenRetornaVentaSinDuplicarInventario()
    {
        // Arrange
        using var contexto = CrearContextoEnMemoria("BdTest_VentaIdempotente");
        var auditoria = new ServicioAuditoriaSimulado();
        var usuarioActual = new ServicioUsuarioActualSimulado();
        var logger = NullLogger<ServicioVentas>.Instance;
        var servicio = new ServicioVentas(contexto, auditoria, usuarioActual, logger);

        var producto = new Producto
        {
            IdProducto = 301,
            CodigoProducto = "LECHE-LALA",
            Descripcion = "Leche Entera Lala 1L",
            PrecioCosto = 21.00m,
            PrecioVenta = 28.00m,
            ManejaInventario = true,
            Activo = true
        };
        contexto.Productos.Add(producto);

        var inventario = new Inventario
        {
            IdSucursal = 1,
            IdProducto = 301,
            ExistenciaActual = 20.0m,
            FechaUltimaModificacion = DateTime.Now
        };
        contexto.Inventarios.Add(inventario);
        await contexto.SaveChangesAsync();

        var tokenFijo = Guid.NewGuid();
        var peticion = new RegistrarVentaDto
        {
            TokenIdempotencia = tokenFijo,
            IdCliente = 1,
            ImporteRecibido = 28.00m,
            Articulos = new List<ItemVentaDto>
            {
                new ItemVentaDto { IdProducto = 301, Cantidad = 1, PrecioUnitario = 28.00m, Subtotal = 28.00m }
            }
        };

        // Act 1: Primer intento (Venta normal)
        var resp1 = await servicio.RegistrarVentaAsync(peticion);

        // Act 2: Segundo intento con el mismo token (ej. doble clic del cajero)
        var resp2 = await servicio.RegistrarVentaAsync(peticion);

        // Assert
        Assert.True(resp1.Exito, $"resp1 fallo: {resp1.Mensaje}");
        Assert.NotNull(resp1.Datos);
        Assert.False(resp1.Datos.EsReintentoIdempotente);

        Assert.True(resp2.Exito, $"resp2 fallo: {resp2.Mensaje}");
        Assert.NotNull(resp2.Datos);
        Assert.True(resp2.Datos.EsReintentoIdempotente, $"resp2.EsReintento={resp2.Datos?.EsReintentoIdempotente}, mensaje={resp2.Mensaje}");
        Assert.Equal(resp1.Datos.IdVenta, resp2.Datos.IdVenta);
        Assert.Equal(resp1.Datos.FolioVenta, resp2.Datos.FolioVenta);

        // Asegurar que solo hay 1 registro de venta en la base de datos
        var totalVentas = await contexto.Ventas.CountAsync();
        Assert.Equal(1, totalVentas);

        // Asegurar que el stock se descontó solo una vez (20 - 1 = 19, NO 18)
        var invFinal = await contexto.Inventarios.FirstAsync(i => i.IdProducto == 301);
        Assert.Equal(19.0m, invFinal.ExistenciaActual);
    }

    [Fact]
    public async Task RegistrarVentaAsync_PagoInsuficiente_RetornaError()
    {
        // Arrange
        using var contexto = CrearContextoEnMemoria("BdTest_PagoInsuficiente");
        var auditoria = new ServicioAuditoriaSimulado();
        var usuarioActual = new ServicioUsuarioActualSimulado();
        var logger = NullLogger<ServicioVentas>.Instance;
        var servicio = new ServicioVentas(contexto, auditoria, usuarioActual, logger);

        var producto = new Producto
        {
            IdProducto = 401,
            Descripcion = "Aceite Nutrioli 850ml",
            PrecioVenta = 45.00m,
            Activo = true
        };
        contexto.Productos.Add(producto);
        await contexto.SaveChangesAsync();

        var peticion = new RegistrarVentaDto
        {
            TokenIdempotencia = Guid.NewGuid(),
            ImporteRecibido = 30.00m, // Insuficiente para cubrir $45
            Articulos = new List<ItemVentaDto>
            {
                new ItemVentaDto { IdProducto = 401, Cantidad = 1, PrecioUnitario = 45.00m, Subtotal = 45.00m }
            }
        };

        // Act
        var respuesta = await servicio.RegistrarVentaAsync(peticion);

        // Assert
        Assert.False(respuesta.Exito);
        Assert.Contains("insuficiente", respuesta.Mensaje.ToLower());
    }

    [Fact]
    public async Task RegistrarVentaAsync_CarritoVacio_RetornaError()
    {
        // Arrange
        using var contexto = CrearContextoEnMemoria("BdTest_CarritoVacio");
        var auditoria = new ServicioAuditoriaSimulado();
        var usuarioActual = new ServicioUsuarioActualSimulado();
        var logger = NullLogger<ServicioVentas>.Instance;
        var servicio = new ServicioVentas(contexto, auditoria, usuarioActual, logger);

        var peticion = new RegistrarVentaDto
        {
            TokenIdempotencia = Guid.NewGuid(),
            Articulos = new List<ItemVentaDto>()
        };

        // Act
        var respuesta = await servicio.RegistrarVentaAsync(peticion);

        // Assert
        Assert.False(respuesta.Exito);
        Assert.Contains("no hay artículos", respuesta.Mensaje.ToLower());
    }

    [Fact]
    public async Task ObtenerTicketVentaAsync_RetornaFormatoCorrecto()
    {
        // Arrange
        using var contexto = CrearContextoEnMemoria("BdTest_TicketVenta");
        var auditoria = new ServicioAuditoriaSimulado();
        var usuarioActual = new ServicioUsuarioActualSimulado();
        var logger = NullLogger<ServicioVentas>.Instance;
        var servicio = new ServicioVentas(contexto, auditoria, usuarioActual, logger);

        var producto = new Producto
        {
            IdProducto = 501,
            Descripcion = "Galletas Marías 170g",
            PrecioVenta = 16.00m,
            Activo = true
        };
        contexto.Productos.Add(producto);
        await contexto.SaveChangesAsync();

        var peticion = new RegistrarVentaDto
        {
            TokenIdempotencia = Guid.NewGuid(),
            ImporteRecibido = 20.00m,
            Articulos = new List<ItemVentaDto>
            {
                new ItemVentaDto { IdProducto = 501, Descripcion = "Galletas Marías 170g", Cantidad = 1, PrecioUnitario = 16.00m, Subtotal = 16.00m }
            }
        };

        var ventaResp = await servicio.RegistrarVentaAsync(peticion);
        Assert.True(ventaResp.Exito);

        // Act
        var ticketResp = await servicio.ObtenerTicketVentaAsync(ventaResp.Datos.IdVenta);

        // Assert
        Assert.True(ticketResp.Exito, $"ticketResp fallo: {ticketResp.Mensaje}");
        Assert.NotNull(ticketResp.Datos);
        Assert.Equal("ABARROTES ARENAS", ticketResp.Datos.NombreNegocio);
        Assert.Equal(16.00m, ticketResp.Datos.Total);
        Assert.Single(ticketResp.Datos.Articulos);
        Assert.Equal("Galletas Marías 170g", ticketResp.Datos.Articulos[0].Descripcion);
        Assert.Single(ticketResp.Datos.Pagos);
        Assert.Equal(4.00m, ticketResp.Datos.Cambio);
    }
}
