using Microsoft.EntityFrameworkCore;
using PdvAbarrotes.Aplicacion.DTOs.Reportes;
using PdvAbarrotes.Dominio.Entidades;
using PdvAbarrotes.Infraestructura.Persistencia;
using PdvAbarrotes.Infraestructura.Servicios;
using Xunit;

namespace PdvAbarrotes.Tests;

/// <summary>
/// Pruebas unitarias para el Dashboard ejecutivo y módulo de Reportes Gerenciales. Fase 12.
/// </summary>
public class PruebasDashboardYReportes
{
    private ContextoPrincipal CrearContextoEnMemoria(string nombreBd)
    {
        var opciones = new DbContextOptionsBuilder<ContextoPrincipal>()
            .UseInMemoryDatabase(databaseName: nombreBd)
            .Options;

        var contexto = new ContextoPrueba(opciones);

        // Sembrar métodos de pago
        if (!contexto.MetodosPago.Any())
        {
            contexto.MetodosPago.AddRange(
                new MetodoPago { IdMetodoPago = 1, CodigoMetodo = "EFECTIVO", Descripcion = "Efectivo", Activo = true },
                new MetodoPago { IdMetodoPago = 2, CodigoMetodo = "TARJETA", Descripcion = "Tarjeta", Activo = true },
                new MetodoPago { IdMetodoPago = 3, CodigoMetodo = "VALES", Descripcion = "Vales de Despensa", Activo = true });
            contexto.SaveChanges();
        }

        return contexto;
    }

    [Fact]
    public async Task ObtenerResumenDashboard_ConVentasHoy_CalculaMetricasCorrectamente()
    {
        // Arrange
        var ctx = CrearContextoEnMemoria(nameof(ObtenerResumenDashboard_ConVentasHoy_CalculaMetricasCorrectamente));
        var servicio = new ServicioReportes(ctx);

        var hoy = DateTime.Today.AddHours(10);

        // Venta 1: $100 total, $30 ganancia
        ctx.Ventas.Add(new Venta
        {
            FolioVenta = "V-001",
            FechaVenta = hoy,
            Total = 100m,
            Ganancia = 30m,
            NumeroArticulos = 2,
            EsCancelada = false
        });

        // Venta 2: $200 total, $50 ganancia
        ctx.Ventas.Add(new Venta
        {
            FolioVenta = "V-002",
            FechaVenta = hoy,
            Total = 200m,
            Ganancia = 50m,
            NumeroArticulos = 5,
            EsCancelada = false
        });

        await ctx.SaveChangesAsync();

        // Act
        var resultado = await servicio.ObtenerResumenDashboardAsync();

        // Assert
        Assert.Equal(300m, resultado.VentasHoy);
        Assert.Equal(2, resultado.TicketsHoy);
        Assert.Equal(80m, resultado.GananciaHoy);
        Assert.Equal(150m, resultado.TicketPromedioHoy); // 300 / 2
        Assert.Equal(26.67m, resultado.MargenPorcentajeHoy); // (80 / 300) * 100
    }

    [Fact]
    public async Task ObtenerResumenDashboard_VentasCanceladas_NoSeSumanEnIngresosNiGanancias()
    {
        // Arrange
        var ctx = CrearContextoEnMemoria(nameof(ObtenerResumenDashboard_VentasCanceladas_NoSeSumanEnIngresosNiGanancias));
        var servicio = new ServicioReportes(ctx);
        var hoy = DateTime.Today.AddHours(12);

        // Venta válida: $150
        ctx.Ventas.Add(new Venta
        {
            FolioVenta = "V-010",
            FechaVenta = hoy,
            Total = 150m,
            Ganancia = 45m,
            EsCancelada = false
        });

        // Venta cancelada: $500
        ctx.Ventas.Add(new Venta
        {
            FolioVenta = "V-011",
            FechaVenta = hoy,
            Total = 500m,
            Ganancia = 150m,
            EsCancelada = true
        });

        await ctx.SaveChangesAsync();

        // Act
        var resultado = await servicio.ObtenerResumenDashboardAsync();

        // Assert
        Assert.Equal(150m, resultado.VentasHoy);
        Assert.Equal(1, resultado.TicketsHoy);
        Assert.Equal(45m, resultado.GananciaHoy);
    }

    [Fact]
    public async Task ObtenerResumenDashboard_DesgloseMetodosPago_CalculaPorcentajesYTotales()
    {
        // Arrange
        var ctx = CrearContextoEnMemoria(nameof(ObtenerResumenDashboard_DesgloseMetodosPago_CalculaPorcentajesYTotales));
        var servicio = new ServicioReportes(ctx);

        var venta = new Venta
        {
            IdVenta = 50,
            FolioVenta = "V-050",
            FechaVenta = DateTime.Today,
            Total = 400m,
            EsCancelada = false
        };
        ctx.Ventas.Add(venta);

        ctx.VentaPagos.AddRange(
            new VentaPago { IdVenta = 50, IdMetodoPago = 1, Importe = 300m, Venta = venta }, // Efectivo 75%
            new VentaPago { IdVenta = 50, IdMetodoPago = 2, Importe = 100m, Venta = venta }  // Tarjeta 25%
        );

        await ctx.SaveChangesAsync();

        // Act
        var resultado = await servicio.ObtenerResumenDashboardAsync();

        // Assert
        Assert.NotEmpty(resultado.MetodosPago);
        var efectivo = resultado.MetodosPago.FirstOrDefault(m => m.MetodoPago == "Efectivo");
        var tarjeta = resultado.MetodosPago.FirstOrDefault(m => m.MetodoPago == "Tarjeta");

        Assert.NotNull(efectivo);
        Assert.NotNull(tarjeta);
        Assert.Equal(300m, efectivo.Total);
        Assert.Equal(100m, tarjeta.Total);
        Assert.Equal(75.0m, efectivo.Porcentaje);
        Assert.Equal(25.0m, tarjeta.Porcentaje);
    }

    [Fact]
    public async Task ObtenerResumenDashboard_TopProductos_OrdenaPorMayorVenta()
    {
        // Arrange
        var ctx = CrearContextoEnMemoria(nameof(ObtenerResumenDashboard_TopProductos_OrdenaPorMayorVenta));
        var servicio = new ServicioReportes(ctx);

        var prod1 = new Producto { IdProducto = 1, Descripcion = "Arroz 1kg", Activo = true };
        var prod2 = new Producto { IdProducto = 2, Descripcion = "Aceite 1L", Activo = true };
        ctx.Productos.AddRange(prod1, prod2);

        var venta = new Venta { IdVenta = 100, FolioVenta = "V-100", FechaVenta = DateTime.Today, Total = 500m, EsCancelada = false };
        ctx.Ventas.Add(venta);

        ctx.DetalleVentas.AddRange(
            new DetalleVenta { IdVenta = 100, IdProducto = 1, Descripcion = "Arroz 1kg", Cantidad = 2, Total = 60m, Ganancia = 12m, Venta = venta, Producto = prod1 },
            new DetalleVenta { IdVenta = 100, IdProducto = 2, Descripcion = "Aceite 1L", Cantidad = 5, Total = 250m, Ganancia = 50m, Venta = venta, Producto = prod2 }
        );

        await ctx.SaveChangesAsync();

        // Act
        var resultado = await servicio.ObtenerResumenDashboardAsync();

        // Assert
        Assert.NotEmpty(resultado.TopProductos);
        Assert.Equal("Aceite 1L", resultado.TopProductos[0].Descripcion);
        Assert.Equal(250m, resultado.TopProductos[0].TotalVendido);
        Assert.Equal("Arroz 1kg", resultado.TopProductos[1].Descripcion);
        Assert.Equal(60m, resultado.TopProductos[1].TotalVendido);
    }

    [Fact]
    public async Task ObtenerReporteVentasPaginado_FiltroPorFecha_RetornaSoloRangoEspecificado()
    {
        // Arrange
        var ctx = CrearContextoEnMemoria(nameof(ObtenerReporteVentasPaginado_FiltroPorFecha_RetornaSoloRangoEspecificado));
        var servicio = new ServicioReportes(ctx);

        var fechaAyer = DateTime.Today.AddDays(-1);
        var fechaHoy = DateTime.Today;

        ctx.Ventas.AddRange(
            new Venta { FolioVenta = "V-AYER", FechaVenta = fechaAyer, Total = 100m, EsCancelada = false },
            new Venta { FolioVenta = "V-HOY", FechaVenta = fechaHoy, Total = 200m, EsCancelada = false }
        );
        await ctx.SaveChangesAsync();

        var filtro = new ReporteVentasFiltroDto
        {
            FechaInicio = fechaHoy,
            FechaFin = fechaHoy.AddDays(1).AddSeconds(-1),
            Pagina = 1,
            RegistrosPorPagina = 25
        };

        // Act
        var resultado = await servicio.ObtenerReporteVentasPaginadoAsync(filtro);

        // Assert
        Assert.Single(resultado.Elementos);
        Assert.Equal("V-HOY", resultado.Elementos[0].FolioVenta);
    }

    [Fact]
    public async Task ObtenerResumenReporteVentas_CalculaTotalesYMargenGlobal()
    {
        // Arrange
        var ctx = CrearContextoEnMemoria(nameof(ObtenerResumenReporteVentas_CalculaTotalesYMargenGlobal));
        var servicio = new ServicioReportes(ctx);

        ctx.Ventas.AddRange(
            new Venta { FolioVenta = "V-R1", FechaVenta = DateTime.Today, Total = 100m, Ganancia = 20m, NumeroArticulos = 2, EsCancelada = false },
            new Venta { FolioVenta = "V-R2", FechaVenta = DateTime.Today, Total = 300m, Ganancia = 60m, NumeroArticulos = 4, EsCancelada = false },
            new Venta { FolioVenta = "V-RCANC", FechaVenta = DateTime.Today, Total = 150m, Ganancia = 30m, NumeroArticulos = 1, EsCancelada = true }
        );
        await ctx.SaveChangesAsync();

        var filtro = new ReporteVentasFiltroDto { Pagina = 1, RegistrosPorPagina = 25 };

        // Act
        var resumen = await servicio.ObtenerResumenReporteVentasAsync(filtro);

        // Assert
        Assert.Equal(400m, resumen.TotalVentas);
        Assert.Equal(80m, resumen.TotalGanancia);
        Assert.Equal(20.0m, resumen.MargenPromedioPorcentaje); // (80 / 400) * 100
        Assert.Equal(2, resumen.TotalTickets);
        Assert.Equal(6m, resumen.TotalArticulosVendidos);
        Assert.Equal(200m, resumen.TicketPromedio); // 400 / 2
        Assert.Equal(1, resumen.TicketsCancelados);
        Assert.Equal(150m, resumen.MontoCancelado);
    }

    [Fact]
    public async Task ObtenerReporteUtilidades_CalculaRentabilidadPorProducto()
    {
        // Arrange
        var ctx = CrearContextoEnMemoria(nameof(ObtenerReporteUtilidades_CalculaRentabilidadPorProducto));
        var servicio = new ServicioReportes(ctx);

        var prod = new Producto { IdProducto = 9, Descripcion = "Frijol Negro 1kg", Activo = true };
        ctx.Productos.Add(prod);

        var venta = new Venta { IdVenta = 200, FolioVenta = "V-200", FechaVenta = DateTime.Today, Total = 120m, EsCancelada = false };
        ctx.Ventas.Add(venta);

        // 3 piezas a costo $25 c/u ($75 costo), vendidas a $40 c/u ($120 venta) -> Utilidad $45, Margen 37.5%
        ctx.DetalleVentas.Add(new DetalleVenta
        {
            IdVenta = 200,
            IdProducto = 9,
            Descripcion = "Frijol Negro 1kg",
            Cantidad = 3,
            PrecioCosto = 25m,
            PrecioUnitario = 40m,
            Total = 120m,
            Ganancia = 45m,
            Venta = venta,
            Producto = prod
        });

        await ctx.SaveChangesAsync();

        // Act
        var utilidades = await servicio.ObtenerReporteUtilidadesAsync(DateTime.Today.AddDays(-1), DateTime.Today.AddDays(1));

        // Assert
        Assert.Single(utilidades);
        var item = utilidades[0];
        Assert.Equal("Frijol Negro 1kg", item.Descripcion);
        Assert.Equal(3m, item.CantidadVendida);
        Assert.Equal(75m, item.CostoTotal);
        Assert.Equal(120m, item.VentaTotal);
        Assert.Equal(45m, item.UtilidadBruta);
        Assert.Equal(37.5m, item.MargenPorcentaje);
    }
}
