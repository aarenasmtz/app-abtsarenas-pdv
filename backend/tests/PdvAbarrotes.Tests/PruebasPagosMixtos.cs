using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using PdvAbarrotes.Aplicacion.DTOs.Ventas;
using PdvAbarrotes.Dominio.Entidades;
using PdvAbarrotes.Infraestructura.Persistencia;
using PdvAbarrotes.Infraestructura.Servicios;
using Xunit;

namespace PdvAbarrotes.Tests;

/// <summary>
/// Pruebas unitarias especializadas para cobro con pagos mixtos (Efectivo + Tarjeta + Vales).
/// </summary>
public class PruebasPagosMixtos
{
    private ContextoPrincipal CrearContextoEnMemoria(string nombreBd)
    {
        var opciones = new DbContextOptionsBuilder<ContextoPrincipal>()
            .UseInMemoryDatabase(databaseName: nombreBd)
            .Options;

        var contexto = new ContextoPrincipal(opciones);

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
                NombreUsuario = "cajero1",
                NombreCompleto = "Cajero Pruebas",
                Activo = true
            });
        }

        if (!contexto.MetodosPago.Any())
        {
            contexto.MetodosPago.AddRange(
                new MetodoPago { IdMetodoPago = 1, CodigoMetodo = "EFECTIVO", Descripcion = "Efectivo", RequiereReferencia = false, Activo = true },
                new MetodoPago { IdMetodoPago = 2, CodigoMetodo = "TARJETA", Descripcion = "Tarjeta Débito/Crédito", RequiereReferencia = true, Activo = true },
                new MetodoPago { IdMetodoPago = 3, CodigoMetodo = "VALES", Descripcion = "Vales de Despensa", RequiereReferencia = true, Activo = true },
                new MetodoPago { IdMetodoPago = 5, CodigoMetodo = "TRANSFERENCIA", Descripcion = "Transferencia Electrónica", RequiereReferencia = true, Activo = true }
            );
        }

        contexto.SaveChanges();
        return contexto;
    }

    [Fact]
    public async Task RegistrarVenta_ConPagoMixtoExacto_RegistraEnVentaPagosYTotalConsistente()
    {
        // Organizar
        using var contexto = CrearContextoEnMemoria("Bd_PagoMixtoExacto");
        var producto = new Producto
        {
            IdProducto = 1,
            CodigoProducto = "P001",
            Descripcion = "Aceite Vegetal 1L",
            PrecioCosto = 30.00m,
            PrecioVenta = 50.00m,
            ManejaInventario = true,
            Activo = true
        };
        contexto.Productos.Add(producto);
        contexto.Inventarios.Add(new Inventario
        {
            IdSucursal = 1,
            IdProducto = 1,
            ExistenciaActual = 10,
            FechaUltimaModificacion = DateTime.Now
        });
        await contexto.SaveChangesAsync();

        var servicio = new ServicioVentas(
            contexto,
            new ServicioAuditoriaSimulado(),
            new ServicioUsuarioActualSimulado(),
            NullLogger<ServicioVentas>.Instance
        );

        // Venta de 2 aceites = $100.00 total
        // Pago mixto: $40.00 en efectivo + $60.00 en tarjeta
        var peticion = new RegistrarVentaDto
        {
            TokenIdempotencia = Guid.NewGuid(),
            Articulos = new List<ItemVentaDto>
            {
                new() { IdProducto = 1, CodigoBarras = "75010001", Cantidad = 2, PrecioUnitario = 50.00m, Subtotal = 100.00m }
            },
            Pagos = new List<VentaPagoDto>
            {
                new() { IdMetodoPago = 1, Importe = 40.00m, Referencia = "Efectivo" },
                new() { IdMetodoPago = 2, Importe = 60.00m, Referencia = "Term-4891" }
            }
        };

        // Actuar
        var respuesta = await servicio.RegistrarVentaAsync(peticion);

        // Afirmar
        Assert.True(respuesta.Exito);
        Assert.NotNull(respuesta.Datos);
        Assert.Equal(100.00m, respuesta.Datos.Total);
        Assert.Equal(100.00m, respuesta.Datos.ImporteRecibido);
        Assert.Equal(0.00m, respuesta.Datos.Cambio);

        // Verificar renglones en dbo.VentaPagos
        var pagosBd = await contexto.VentaPagos.Where(p => p.IdVenta == respuesta.Datos.IdVenta).ToListAsync();
        Assert.Equal(2, pagosBd.Count);
        Assert.Equal(100.00m, pagosBd.Sum(p => p.Importe));
    }

    [Fact]
    public async Task RegistrarVenta_ConPagoMixtoYCambioDeEfectivo_CalculaCambioYDesgloseCorrecto()
    {
        // Organizar
        using var contexto = CrearContextoEnMemoria("Bd_PagoMixtoConCambio");
        var producto = new Producto
        {
            IdProducto = 2,
            CodigoProducto = "P002",
            Descripcion = "Arroz 1kg",
            PrecioCosto = 15.00m,
            PrecioVenta = 25.00m,
            ManejaInventario = true,
            Activo = true
        };
        contexto.Productos.Add(producto);
        contexto.Inventarios.Add(new Inventario
        {
            IdSucursal = 1,
            IdProducto = 2,
            ExistenciaActual = 20,
            FechaUltimaModificacion = DateTime.Now
        });
        await contexto.SaveChangesAsync();

        var servicio = new ServicioVentas(
            contexto,
            new ServicioAuditoriaSimulado(),
            new ServicioUsuarioActualSimulado(),
            NullLogger<ServicioVentas>.Instance
        );

        // Venta de 4 arroces = $100.00 total
        // Cliente paga: $70.00 en tarjeta y da un billete de $50.00 en efectivo (Total entregado: $120.00)
        // El remanente a cubrir en efectivo es $30.00, por lo que el cambio debe ser $20.00
        var peticion = new RegistrarVentaDto
        {
            TokenIdempotencia = Guid.NewGuid(),
            Articulos = new List<ItemVentaDto>
            {
                new() { IdProducto = 2, CodigoBarras = "75020002", Cantidad = 4, PrecioUnitario = 25.00m, Subtotal = 100.00m }
            },
            Pagos = new List<VentaPagoDto>
            {
                new() { IdMetodoPago = 2, Importe = 70.00m, Referencia = "Autorización: 8812" },
                new() { IdMetodoPago = 1, Importe = 50.00m, Referencia = "Billete 50" }
            }
        };

        // Actuar
        var respuesta = await servicio.RegistrarVentaAsync(peticion);

        // Afirmar
        Assert.True(respuesta.Exito);
        Assert.NotNull(respuesta.Datos);
        Assert.Equal(100.00m, respuesta.Datos.Total);
        Assert.Equal(120.00m, respuesta.Datos.ImporteRecibido);
        Assert.Equal(20.00m, respuesta.Datos.Cambio);

        // En VentaPagos debe registrarse la tarjeta por $70.00 y el efectivo por el neto cubierto ($30.00), sumando $100.00 exactos
        var pagosBd = await contexto.VentaPagos.Where(p => p.IdVenta == respuesta.Datos.IdVenta).ToListAsync();
        Assert.Equal(2, pagosBd.Count);
        Assert.Equal(100.00m, pagosBd.Sum(p => p.Importe));

        var pagoEfectivo = pagosBd.First(p => p.IdMetodoPago == 1);
        Assert.Equal(30.00m, pagoEfectivo.Importe);

        var pagoTarjeta = pagosBd.First(p => p.IdMetodoPago == 2);
        Assert.Equal(70.00m, pagoTarjeta.Importe);
    }

    [Fact]
    public async Task RegistrarVenta_ConPagoTarjetaMayorAlTotal_RetornaErrorContable()
    {
        // Organizar
        using var contexto = CrearContextoEnMemoria("Bd_PagoTarjetaExcesivo");
        var producto = new Producto
        {
            IdProducto = 3,
            CodigoProducto = "P003",
            Descripcion = "Galletas 500g",
            PrecioCosto = 20.00m,
            PrecioVenta = 40.00m,
            ManejaInventario = true,
            Activo = true
        };
        contexto.Productos.Add(producto);
        contexto.Inventarios.Add(new Inventario
        {
            IdSucursal = 1,
            IdProducto = 3,
            ExistenciaActual = 10,
            FechaUltimaModificacion = DateTime.Now
        });
        await contexto.SaveChangesAsync();

        var servicio = new ServicioVentas(
            contexto,
            new ServicioAuditoriaSimulado(),
            new ServicioUsuarioActualSimulado(),
            NullLogger<ServicioVentas>.Instance
        );

        // Venta de $40.00 pero intentan cobrar $60.00 en tarjeta
        var peticion = new RegistrarVentaDto
        {
            TokenIdempotencia = Guid.NewGuid(),
            Articulos = new List<ItemVentaDto>
            {
                new() { IdProducto = 3, CodigoBarras = "75030003", Cantidad = 1, PrecioUnitario = 40.00m, Subtotal = 40.00m }
            },
            Pagos = new List<VentaPagoDto>
            {
                new() { IdMetodoPago = 2, Importe = 60.00m, Referencia = "Tarjeta" }
            }
        };

        // Actuar
        var respuesta = await servicio.RegistrarVentaAsync(peticion);

        // Afirmar
        Assert.False(respuesta.Exito);
        Assert.Contains("no pueden exceder el total", respuesta.Mensaje);
    }

    [Fact]
    public async Task RegistrarVenta_ConSumaPagosInsuficiente_RetornaError()
    {
        // Organizar
        using var contexto = CrearContextoEnMemoria("Bd_PagoInsuficiente");
        var producto = new Producto
        {
            IdProducto = 4,
            CodigoProducto = "P004",
            Descripcion = "Refresco 600ml",
            PrecioCosto = 10.00m,
            PrecioVenta = 18.00m,
            ManejaInventario = true,
            Activo = true
        };
        contexto.Productos.Add(producto);
        contexto.Inventarios.Add(new Inventario
        {
            IdSucursal = 1,
            IdProducto = 4,
            ExistenciaActual = 10,
            FechaUltimaModificacion = DateTime.Now
        });
        await contexto.SaveChangesAsync();

        var servicio = new ServicioVentas(
            contexto,
            new ServicioAuditoriaSimulado(),
            new ServicioUsuarioActualSimulado(),
            NullLogger<ServicioVentas>.Instance
        );

        // Venta de $18.00 pero solo pagan $10 en efectivo
        var peticion = new RegistrarVentaDto
        {
            TokenIdempotencia = Guid.NewGuid(),
            Articulos = new List<ItemVentaDto>
            {
                new() { IdProducto = 4, CodigoBarras = "75040004", Cantidad = 1, PrecioUnitario = 18.00m, Subtotal = 18.00m }
            },
            Pagos = new List<VentaPagoDto>
            {
                new() { IdMetodoPago = 1, Importe = 10.00m, Referencia = "Efectivo" }
            }
        };

        // Actuar
        var respuesta = await servicio.RegistrarVentaAsync(peticion);

        // Afirmar
        Assert.False(respuesta.Exito);
        Assert.Contains("insuficiente para cubrir la venta", respuesta.Mensaje);
    }
}
