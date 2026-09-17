using Microsoft.EntityFrameworkCore;
using PdvAbarrotes.Aplicacion.DTOs.Inventario;
using PdvAbarrotes.Aplicacion.Interfaces;
using PdvAbarrotes.Dominio.Entidades;
using PdvAbarrotes.Dominio.Excepciones;
using PdvAbarrotes.Infraestructura.Persistencia;
using PdvAbarrotes.Infraestructura.Servicios;
using Xunit;

namespace PdvAbarrotes.Tests;

/// <summary>
/// Implementación simulada del servicio de usuario actual para pruebas unitarias.
/// </summary>
public class ServicioUsuarioActualSimulado : IServicioUsuarioActual
{
    public int? IdUsuario => 1;
    public string NombreUsuario => "admin_pruebas";
    public string Rol => "Administrador";
    public string? DireccionIp => "127.0.0.1";
    public bool EstaAutenticado => true;
}

/// <summary>
/// Pruebas unitarias para el servicio de control de inventario, Kardex y ajustes de existencias.
/// </summary>
public class PruebasInventario
{
    private ContextoPrincipal CrearContextoEnMemoria(string nombreBd)
    {
        var opciones = new DbContextOptionsBuilder<ContextoPrincipal>()
            .UseInMemoryDatabase(databaseName: nombreBd)
            .Options;

        var contexto = new ContextoPrincipal(opciones);

        // Sembrar tipos de movimiento básicos si no existen
        if (!contexto.TiposMovimientoInventario.Any())
        {
            contexto.TiposMovimientoInventario.AddRange(
                new TipoMovimientoInventario { IdTipoMovimiento = 1, CodigoTipo = "ENTRADA_COMPRA", Descripcion = "Entrada por Compra", EfectoStock = 1, Activo = true },
                new TipoMovimientoInventario { IdTipoMovimiento = 2, CodigoTipo = "VENTA", Descripcion = "Salida por Venta", EfectoStock = -1, Activo = true },
                new TipoMovimientoInventario { IdTipoMovimiento = 5, CodigoTipo = "AJUSTE_ENTRADA", Descripcion = "Entrada por Ajuste", EfectoStock = 1, Activo = true },
                new TipoMovimientoInventario { IdTipoMovimiento = 6, CodigoTipo = "AJUSTE_SALIDA", Descripcion = "Salida por Ajuste / Merma", EfectoStock = -1, Activo = true }
            );
            contexto.SaveChanges();
        }

        return contexto;
    }

    [Fact]
    public async Task RegistrarAjusteStockAsync_EntradaIncrementaStockYRegistraKardex()
    {
        // Arrange
        using var contexto = CrearContextoEnMemoria("BdTest_AjusteEntrada");
        var auditoria = new ServicioAuditoriaSimulado();
        var usuarioActual = new ServicioUsuarioActualSimulado();
        var servicio = new ServicioInventario(contexto, auditoria, usuarioActual);

        // Crear producto base
        var producto = new Producto
        {
            CodigoProducto = "PROD-101",
            Descripcion = "Azúcar Morena 1kg",
            PrecioCosto = 20.00m,
            PrecioVenta = 28.00m,
            ManejaInventario = true,
            Activo = true
        };
        contexto.Productos.Add(producto);
        await contexto.SaveChangesAsync();

        // Act - Registrar entrada manual de 30 unidades
        var dto = new RegistrarAjusteStockDto
        {
            IdProducto = producto.IdProducto,
            CantidadAjuste = 30,
            TipoAjuste = "ENTRADA",
            Motivo = "Recepción extraordinaria sin factura"
        };

        var resultado = await servicio.RegistrarAjusteStockAsync(dto);

        // Assert
        Assert.NotNull(resultado);
        Assert.Equal(0, resultado.CantidadAnterior);
        Assert.Equal(30, resultado.CantidadMovimiento);
        Assert.Equal(30, resultado.CantidadNueva);
        Assert.Equal(5, resultado.IdTipoMovimiento);

        // Verificar persistencia en Inventario
        var stock = await contexto.Inventarios.FirstAsync(i => i.IdProducto == producto.IdProducto);
        Assert.Equal(30, stock.ExistenciaActual);

        // Verificar Kardex
        var kardex = await contexto.MovimientosInventario.FirstAsync(m => m.IdProducto == producto.IdProducto);
        Assert.Equal(30, kardex.CantidadNueva);
        Assert.Equal("admin_pruebas", resultado.Usuario);
    }

    [Fact]
    public async Task RegistrarAjusteStockAsync_SalidaDecrementaStockYRegistraKardex()
    {
        // Arrange
        using var contexto = CrearContextoEnMemoria("BdTest_AjusteSalida");
        var auditoria = new ServicioAuditoriaSimulado();
        var usuarioActual = new ServicioUsuarioActualSimulado();
        var servicio = new ServicioInventario(contexto, auditoria, usuarioActual);

        var producto = new Producto
        {
            CodigoProducto = "PROD-102",
            Descripcion = "Cereal Maíz 500g",
            PrecioCosto = 30.00m,
            ManejaInventario = true,
            Activo = true
        };
        contexto.Productos.Add(producto);
        await contexto.SaveChangesAsync();

        // Stock inicial de 40 unidades
        contexto.Inventarios.Add(new Inventario
        {
            IdProducto = producto.IdProducto,
            IdSucursal = 1,
            ExistenciaActual = 40,
            FechaUltimaModificacion = DateTime.Now
        });
        await contexto.SaveChangesAsync();

        // Act - Registrar salida por merma de 5 unidades
        var dto = new RegistrarAjusteStockDto
        {
            IdProducto = producto.IdProducto,
            CantidadAjuste = 5,
            TipoAjuste = "SALIDA",
            Motivo = "Empaque roto / Merma"
        };

        var resultado = await servicio.RegistrarAjusteStockAsync(dto);

        // Assert
        Assert.Equal(40, resultado.CantidadAnterior);
        Assert.Equal(5, resultado.CantidadMovimiento);
        Assert.Equal(35, resultado.CantidadNueva);
        Assert.Equal(6, resultado.IdTipoMovimiento); // AJUSTE_SALIDA

        var stock = await contexto.Inventarios.FirstAsync(i => i.IdProducto == producto.IdProducto);
        Assert.Equal(35, stock.ExistenciaActual);
    }

    [Fact]
    public async Task RegistrarAjusteStockAsync_SalidaMayorAExistenciaLanzaExcepcion()
    {
        // Arrange
        using var contexto = CrearContextoEnMemoria("BdTest_SalidaExcesiva");
        var auditoria = new ServicioAuditoriaSimulado();
        var usuarioActual = new ServicioUsuarioActualSimulado();
        var servicio = new ServicioInventario(contexto, auditoria, usuarioActual);

        var producto = new Producto
        {
            CodigoProducto = "PROD-103",
            Descripcion = "Aceite Canola 1L",
            Activo = true
        };
        contexto.Productos.Add(producto);
        contexto.Inventarios.Add(new Inventario { IdProducto = 1, IdSucursal = 1, ExistenciaActual = 10 });
        await contexto.SaveChangesAsync();

        var dto = new RegistrarAjusteStockDto
        {
            IdProducto = producto.IdProducto,
            CantidadAjuste = 25, // Mayor a 10
            TipoAjuste = "SALIDA",
            Motivo = "Prueba de sobregiro"
        };

        // Act & Assert
        await Assert.ThrowsAsync<ExcepcionReglaNegocio>(() => servicio.RegistrarAjusteStockAsync(dto));
    }

    [Fact]
    public async Task RegistrarAjusteStockAsync_ReconteoFisicoCalculaDiferenciaCorrectamente()
    {
        // Arrange
        using var contexto = CrearContextoEnMemoria("BdTest_ReconteoFisico");
        var auditoria = new ServicioAuditoriaSimulado();
        var usuarioActual = new ServicioUsuarioActualSimulado();
        var servicio = new ServicioInventario(contexto, auditoria, usuarioActual);

        var producto = new Producto
        {
            CodigoProducto = "PROD-104",
            Descripcion = "Atún en Agua 140g",
            PrecioCosto = 15.00m,
            Activo = true
        };
        contexto.Productos.Add(producto);
        contexto.Inventarios.Add(new Inventario { IdProducto = producto.IdProducto, IdSucursal = 1, ExistenciaActual = 12 });
        await contexto.SaveChangesAsync();

        // Act - Reconteo físico encuentra 20 latas (diferencia de +8)
        var dto = new RegistrarAjusteStockDto
        {
            IdProducto = producto.IdProducto,
            CantidadAjuste = 20,
            TipoAjuste = "RECONTEO_FISICO",
            Motivo = "Inventario físico mensual"
        };

        var resultado = await servicio.RegistrarAjusteStockAsync(dto);

        // Assert
        Assert.Equal(12, resultado.CantidadAnterior);
        Assert.Equal(8, resultado.CantidadMovimiento); // Diferencia absoluta
        Assert.Equal(20, resultado.CantidadNueva);
        Assert.Equal(5, resultado.IdTipoMovimiento); // Entrada (diferencia positiva)

        var stock = await contexto.Inventarios.FirstAsync(i => i.IdProducto == producto.IdProducto);
        Assert.Equal(20, stock.ExistenciaActual);
    }

    [Fact]
    public async Task ObtenerAlertasBajoStockAsync_DetectaArticulosCriticosYBajos()
    {
        // Arrange
        using var contexto = CrearContextoEnMemoria("BdTest_AlertasStock");
        var auditoria = new ServicioAuditoriaSimulado();
        var usuarioActual = new ServicioUsuarioActualSimulado();
        var servicio = new ServicioInventario(contexto, auditoria, usuarioActual);

        // Producto 1: Crítico (stock = 0, minimo = 10)
        var p1 = new Producto { CodigoProducto = "C1", Descripcion = "Arroz 1kg", ExistenciaMinima = 10, ExistenciaMaxima = 50, ManejaInventario = true, Activo = true };
        // Producto 2: Bajo (stock = 5, minimo = 15)
        var p2 = new Producto { CodigoProducto = "C2", Descripcion = "Frijol 1kg", ExistenciaMinima = 15, ExistenciaMaxima = 60, ManejaInventario = true, Activo = true };
        // Producto 3: Óptimo (stock = 40, minimo = 10)
        var p3 = new Producto { CodigoProducto = "C3", Descripcion = "Sal 1kg", ExistenciaMinima = 10, ExistenciaMaxima = 50, ManejaInventario = true, Activo = true };

        contexto.Productos.AddRange(p1, p2, p3);
        await contexto.SaveChangesAsync();

        contexto.Inventarios.AddRange(
            new Inventario { IdProducto = p1.IdProducto, IdSucursal = 1, ExistenciaActual = 0 },
            new Inventario { IdProducto = p2.IdProducto, IdSucursal = 1, ExistenciaActual = 5 },
            new Inventario { IdProducto = p3.IdProducto, IdSucursal = 1, ExistenciaActual = 40 }
        );
        await contexto.SaveChangesAsync();

        // Act
        var alertas = await servicio.ObtenerAlertasBajoStockAsync();

        // Assert
        Assert.Equal(2, alertas.Count);

        var alertaCritica = alertas.First(a => a.IdProducto == p1.IdProducto);
        Assert.Equal("CRITICO", alertaCritica.NivelAlerta);
        Assert.Equal(10, alertaCritica.FaltanteParaMinimo);
        Assert.Equal(50, alertaCritica.SugeridoParaMaximo);

        var alertaBaja = alertas.First(a => a.IdProducto == p2.IdProducto);
        Assert.Equal("BAJO", alertaBaja.NivelAlerta);
        Assert.Equal(10, alertaBaja.FaltanteParaMinimo);
    }
}
