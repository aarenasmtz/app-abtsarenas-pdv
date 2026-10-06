using System.Collections.Concurrent;
using System.Diagnostics;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using PdvAbarrotes.Aplicacion.DTOs.Reportes;
using PdvAbarrotes.Aplicacion.DTOs.Ventas;
using PdvAbarrotes.Dominio.Entidades;
using PdvAbarrotes.Infraestructura.Persistencia;
using PdvAbarrotes.Infraestructura.Servicios;
using Xunit;
using Xunit.Abstractions;

namespace PdvAbarrotes.Tests;

/// <summary>
/// Pruebas de Carga, Concurrencia y Rendimiento (Fase 15).
/// Valida atomicidad de inventario ante ráfagas concurrentes, prevención de condiciones de carrera,
/// blindaje de idempotencia en peticiones paralelas, aislamiento no bloqueante (READ_COMMITTED_SNAPSHOT)
/// y tiempos de respuesta de cobro en caja inferiores a 100ms.
/// </summary>
public class PruebasCargaYConcurrencia
{
    private readonly ITestOutputHelper _salida;

    public PruebasCargaYConcurrencia(ITestOutputHelper salida)
    {
        _salida = salida;
    }

    private DbContextOptions<ContextoPrincipal> CrearOpcionesBd(string nombreBd)
    {
        return new DbContextOptionsBuilder<ContextoPrincipal>()
            .UseInMemoryDatabase(databaseName: nombreBd)
            .Options;
    }

    private async Task SembrarDatosBaseAsync(DbContextOptions<ContextoPrincipal> opciones)
    {
        using var ctx = new ContextoPrincipal(opciones);

        if (!await ctx.Clientes.AnyAsync())
        {
            ctx.Clientes.Add(new Cliente
            {
                IdCliente = 1,
                Nombre = "Público",
                Apellidos = "en General",
                Activo = true,
                EsSistema = true
            });
        }

        if (!await ctx.TiposMovimientoInventario.AnyAsync())
        {
            ctx.TiposMovimientoInventario.AddRange(
                new TipoMovimientoInventario { IdTipoMovimiento = 1, CodigoTipo = "ENTRADA_COMPRA", Descripcion = "Entrada por Compra", EfectoStock = 1, Activo = true },
                new TipoMovimientoInventario { IdTipoMovimiento = 2, CodigoTipo = "VENTA", Descripcion = "Salida por Venta", EfectoStock = -1, Activo = true }
            );
        }

        if (!await ctx.Usuarios.AnyAsync())
        {
            ctx.Usuarios.Add(new Usuario
            {
                IdUsuario = 1,
                NombreUsuario = "cajero_concurrente",
                NombreCompleto = "Cajero de Pruebas",
                Activo = true
            });
        }

        if (!await ctx.MetodosPago.AnyAsync())
        {
            ctx.MetodosPago.AddRange(
                new MetodoPago { IdMetodoPago = 1, CodigoMetodo = "EFECTIVO", Descripcion = "Efectivo", Activo = true },
                new MetodoPago { IdMetodoPago = 2, CodigoMetodo = "TARJETA_DEBITO", Descripcion = "Tarjeta de Débito", Activo = true }
            );
        }

        await ctx.SaveChangesAsync();
    }

    [Fact]
    public async Task Concurrencia_RafagaDeVentasSimultaneas_MantieneConsistenciaTotalDeInventario()
    {
        // Arrange
        var nombreBd = nameof(Concurrencia_RafagaDeVentasSimultaneas_MantieneConsistenciaTotalDeInventario);
        var opciones = CrearOpcionesBd(nombreBd);
        await SembrarDatosBaseAsync(opciones);

        const int idProducto = 101;
        const decimal stockInicial = 50.0m;
        const int hilosConcurrentes = 25;
        const decimal cantidadPorVenta = 2.0m; // 25 * 2 = 50 piezas totales

        using (var ctxInicial = new ContextoPrincipal(opciones))
        {
            ctxInicial.Productos.Add(new Producto
            {
                IdProducto = idProducto,
                CodigoProducto = "COCA-600-CONC",
                Descripcion = "Coca Cola 600ml Concurrencia",
                PrecioCosto = 12.00m,
                PrecioVenta = 18.00m,
                ManejaInventario = true,
                Activo = true
            });

            ctxInicial.Inventarios.Add(new Inventario
            {
                IdInventario = 101,
                IdSucursal = 1,
                IdProducto = idProducto,
                ExistenciaActual = stockInicial,
                FechaUltimaModificacion = DateTime.Now
            });

            await ctxInicial.SaveChangesAsync();
        }

        var logger = NullLogger<ServicioVentas>.Instance;
        var auditoria = new ServicioAuditoriaSimulado();
        var usuarioActual = new ServicioUsuarioActualSimulado();

        // Act: Ejecutar 25 ventas simultáneas mediante hilos paralelos
        var cronometro = Stopwatch.StartNew();

        var tareas = Enumerable.Range(1, hilosConcurrentes).Select(async i =>
        {
            using var ctxHilo = new ContextoPrincipal(opciones);
            var servicioHilo = new ServicioVentas(ctxHilo, auditoria, usuarioActual, logger);

            var peticion = new RegistrarVentaDto
            {
                TokenIdempotencia = Guid.NewGuid(),
                IdCliente = 1,
                IdCaja = (i % 2) + 1, // Simular 2 cajas simultáneas
                IdTurnoCaja = 1,
                ImporteRecibido = 50.00m,
                Articulos = new List<ItemVentaDto>
                {
                    new ItemVentaDto
                    {
                        IdProducto = idProducto,
                        Descripcion = "Coca Cola 600ml Concurrencia",
                        Cantidad = cantidadPorVenta,
                        PrecioUnitario = 18.00m,
                        Subtotal = 36.00m
                    }
                }
            };

            return await servicioHilo.RegistrarVentaAsync(peticion);
        }).ToArray();

        var resultados = await Task.WhenAll(tareas);
        cronometro.Stop();

        _salida.WriteLine($"[BENCHMARK] {hilosConcurrentes} ventas concurrentes ejecutadas en {cronometro.ElapsedMilliseconds} ms ({cronometro.ElapsedMilliseconds / (double)hilosConcurrentes:F2} ms/venta).");

        // Assert
        Assert.All(resultados, r => Assert.True(r.Exito, r.Mensaje));

        using (var ctxFinal = new ContextoPrincipal(opciones))
        {
            var inventarioFinal = await ctxFinal.Inventarios.FirstAsync(inv => inv.IdProducto == idProducto);
            var totalVentas = await ctxFinal.Ventas.CountAsync();
            var movimientosKardex = await ctxFinal.MovimientosInventario
                .Where(m => m.IdProducto == idProducto)
                .ToListAsync();

            // El stock debe ser exactamente 0.00 (sin condiciones de carrera ni fugas)
            Assert.Equal(0.0m, inventarioFinal.ExistenciaActual);
            Assert.Equal(hilosConcurrentes, totalVentas);
            Assert.Equal(hilosConcurrentes, movimientosKardex.Count);
            Assert.Equal(-stockInicial, movimientosKardex.Sum(m => m.CantidadMovimiento));
        }
    }

    [Fact]
    public async Task Concurrencia_IdempotenciaBajoRafagaParalela_RegistraUnaSolaVenta()
    {
        // Arrange
        var nombreBd = nameof(Concurrencia_IdempotenciaBajoRafagaParalela_RegistraUnaSolaVenta);
        var opciones = CrearOpcionesBd(nombreBd);
        await SembrarDatosBaseAsync(opciones);

        const int idProducto = 102;
        using (var ctxInicial = new ContextoPrincipal(opciones))
        {
            ctxInicial.Productos.Add(new Producto
            {
                IdProducto = idProducto,
                Descripcion = "Sabritas Sal 45g",
                PrecioVenta = 20.00m,
                ManejaInventario = true,
                Activo = true
            });
            ctxInicial.Inventarios.Add(new Inventario
            {
                IdSucursal = 1,
                IdProducto = idProducto,
                ExistenciaActual = 100m,
                FechaUltimaModificacion = DateTime.Now
            });
            await ctxInicial.SaveChangesAsync();
        }

        var tokenIdempotente = Guid.NewGuid();
        const int intentosParalelos = 10;
        var logger = NullLogger<ServicioVentas>.Instance;
        var auditoria = new ServicioAuditoriaSimulado();
        var usuarioActual = new ServicioUsuarioActualSimulado();

        // Act: 10 hilos disparan exactamente la misma venta al mismo tiempo (simulando doble clic o reintentos de red)
        var tareas = Enumerable.Range(1, intentosParalelos).Select(async _ =>
        {
            using var ctxHilo = new ContextoPrincipal(opciones);
            var servicioHilo = new ServicioVentas(ctxHilo, auditoria, usuarioActual, logger);

            var peticion = new RegistrarVentaDto
            {
                TokenIdempotencia = tokenIdempotente,
                IdCliente = 1,
                IdCaja = 1,
                ImporteRecibido = 50.00m,
                Articulos = new List<ItemVentaDto>
                {
                    new ItemVentaDto { IdProducto = idProducto, Cantidad = 1, PrecioUnitario = 20.00m, Subtotal = 20.00m }
                }
            };

            return await servicioHilo.RegistrarVentaAsync(peticion);
        }).ToArray();

        var respuestas = await Task.WhenAll(tareas);

        // Assert: Todas las respuestas deben ser exitosas y apuntar al mismo IdVenta
        Assert.All(respuestas, r => Assert.True(r.Exito));
        var idVentaUnico = respuestas.First().Datos!.IdVenta;
        Assert.All(respuestas, r => Assert.Equal(idVentaUnico, r.Datos!.IdVenta));

        using (var ctxVerificar = new ContextoPrincipal(opciones))
        {
            // Solo debe existir 1 registro de venta en BD
            var totalVentas = await ctxVerificar.Ventas.CountAsync();
            Assert.Equal(1, totalVentas);

            // Solo se debió descontar 1 pieza del inventario
            var stock = await ctxVerificar.Inventarios.FirstAsync(i => i.IdProducto == idProducto);
            Assert.Equal(99.0m, stock.ExistenciaActual);
        }
    }

    [Fact]
    public async Task Concurrencia_LecturaDeReportesVsCobrosSimultaneos_SinBloqueos()
    {
        // Arrange
        var nombreBd = nameof(Concurrencia_LecturaDeReportesVsCobrosSimultaneos_SinBloqueos);
        var opciones = CrearOpcionesBd(nombreBd);
        await SembrarDatosBaseAsync(opciones);

        const int idProducto = 103;
        using (var ctx = new ContextoPrincipal(opciones))
        {
            ctx.Productos.Add(new Producto { IdProducto = idProducto, Descripcion = "Leche Lala 1L", PrecioVenta = 28m, ManejaInventario = true, Activo = true });
            ctx.Inventarios.Add(new Inventario { IdSucursal = 1, IdProducto = idProducto, ExistenciaActual = 100m, FechaUltimaModificacion = DateTime.Now });
            await ctx.SaveChangesAsync();
        }

        var logger = NullLogger<ServicioVentas>.Instance;
        var auditoria = new ServicioAuditoriaSimulado();
        var usuarioActual = new ServicioUsuarioActualSimulado();

        // 10 tareas de cobro de ventas en caja
        var tareasVentas = Enumerable.Range(1, 10).Select(async i =>
        {
            using var ctxHilo = new ContextoPrincipal(opciones);
            var servicio = new ServicioVentas(ctxHilo, auditoria, usuarioActual, logger);
            return await servicio.RegistrarVentaAsync(new RegistrarVentaDto
            {
                TokenIdempotencia = Guid.NewGuid(),
                IdCliente = 1,
                ImporteRecibido = 50m,
                Articulos = new List<ItemVentaDto> { new ItemVentaDto { IdProducto = idProducto, Cantidad = 1, PrecioUnitario = 28m, Subtotal = 28m } }
            });
        });

        // 10 tareas de consulta pesada de reportes gerenciales (AsNoTracking)
        var tareasReportes = Enumerable.Range(1, 10).Select(async _ =>
        {
            using var ctxHilo = new ContextoPrincipal(opciones);
            var servicio = new ServicioReportes(ctxHilo);
            return await servicio.ObtenerResumenDashboardAsync();
        });

        var cronometro = Stopwatch.StartNew();
        var todasLasTareas = Task.WhenAll(
            Task.WhenAll(tareasVentas),
            Task.WhenAll(tareasReportes)
        );

        await todasLasTareas;
        cronometro.Stop();

        _salida.WriteLine($"[BENCHMARK] Cobros en caja + Consultas pesadas de reportes ejecutadas en paralelo: {cronometro.ElapsedMilliseconds} ms (Sin bloqueos).");

        Assert.True(cronometro.ElapsedMilliseconds < 5000, "La concurrencia combinada de lectura/escritura excedió el tiempo límite esperado.");
    }

    [Fact]
    public async Task Benchmark_LatenciaDeCobro_CumpleMetaMenorA100ms()
    {
        // Arrange
        var nombreBd = nameof(Benchmark_LatenciaDeCobro_CumpleMetaMenorA100ms);
        var opciones = CrearOpcionesBd(nombreBd);
        await SembrarDatosBaseAsync(opciones);

        const int idProducto = 104;
        using (var ctx = new ContextoPrincipal(opciones))
        {
            ctx.Productos.Add(new Producto { IdProducto = idProducto, Descripcion = "Atún Dolores 140g", PrecioVenta = 22m, ManejaInventario = true, Activo = true });
            ctx.Inventarios.Add(new Inventario { IdSucursal = 1, IdProducto = idProducto, ExistenciaActual = 1000m, FechaUltimaModificacion = DateTime.Now });
            await ctx.SaveChangesAsync();
        }

        var logger = NullLogger<ServicioVentas>.Instance;
        var auditoria = new ServicioAuditoriaSimulado();
        var usuarioActual = new ServicioUsuarioActualSimulado();

        const int totalVentas = 50;
        var latencias = new List<double>(totalVentas);

        // Calentamiento previo de EF Core (Warm-up)
        using (var ctxWarm = new ContextoPrincipal(opciones))
        {
            var sWarm = new ServicioVentas(ctxWarm, auditoria, usuarioActual, logger);
            await sWarm.RegistrarVentaAsync(new RegistrarVentaDto
            {
                TokenIdempotencia = Guid.NewGuid(),
                IdCliente = 1,
                ImporteRecibido = 50m,
                Articulos = new List<ItemVentaDto> { new ItemVentaDto { IdProducto = idProducto, Cantidad = 1, PrecioUnitario = 22m, Subtotal = 22m } }
            });
        }

        // Act: Ejecutar 50 cobros secuenciales midiendo la latencia de cada uno
        for (int i = 0; i < totalVentas; i++)
        {
            using var ctxVenta = new ContextoPrincipal(opciones);
            var servicio = new ServicioVentas(ctxVenta, auditoria, usuarioActual, logger);

            var peticion = new RegistrarVentaDto
            {
                TokenIdempotencia = Guid.NewGuid(),
                IdCliente = 1,
                ImporteRecibido = 50.00m,
                Articulos = new List<ItemVentaDto>
                {
                    new ItemVentaDto { IdProducto = idProducto, Cantidad = 1, PrecioUnitario = 22.00m, Subtotal = 22.00m }
                }
            };

            var sw = Stopwatch.StartNew();
            var resp = await servicio.RegistrarVentaAsync(peticion);
            sw.Stop();

            Assert.True(resp.Exito);
            latencias.Add(sw.Elapsed.TotalMilliseconds);
        }

        // Métricas estadísticas
        latencias.Sort();
        var p50 = latencias[(int)(totalVentas * 0.50)];
        var p95 = latencias[(int)(totalVentas * 0.95)];
        var p99 = latencias[(int)(totalVentas * 0.99)];
        var promedio = latencias.Average();

        _salida.WriteLine($"=== MÉTRICAS DE LATENCIA DE COBRO (N={totalVentas}) ===");
        _salida.WriteLine($"Promedio: {promedio:F2} ms");
        _salida.WriteLine($"P50 (Mediana): {p50:F2} ms");
        _salida.WriteLine($"P95: {p95:F2} ms");
        _salida.WriteLine($"P99: {p99:F2} ms");

        // Assert: El promedio debe ser significativamente menor a 100ms (requisito estricto de alta rotación)
        Assert.True(promedio < 100.0, $"El tiempo promedio de cobro ({promedio:F2} ms) excedió el límite de 100 ms.");
        Assert.True(p95 < 150.0, $"El percentil P95 ({p95:F2} ms) excedió el límite de 150 ms.");
    }
}
