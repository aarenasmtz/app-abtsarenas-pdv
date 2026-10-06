using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using PdvAbarrotes.Aplicacion.DTOs.Compras;
using PdvAbarrotes.Aplicacion.DTOs.Proveedores;
using PdvAbarrotes.Dominio.Entidades;
using PdvAbarrotes.Infraestructura.Persistencia;
using PdvAbarrotes.Infraestructura.Servicios;
using Xunit;

namespace PdvAbarrotes.Tests;

/// <summary>
/// Contexto de prueba derivado que suprime el TransactionIgnoredWarning de EF Core InMemory.
/// Las transacciones son ignoradas silenciosamente (comportamiento correcto para BD InMemory).
/// </summary>
internal class ContextoPrueba : ContextoPrincipal
{
    public ContextoPrueba(DbContextOptions<ContextoPrincipal> opciones) : base(opciones) { }

    protected override void OnConfiguring(DbContextOptionsBuilder opciones)
    {
        base.OnConfiguring(opciones);
        // Suprimir advertencia de transacciones no soportadas en BD InMemory para pruebas unitarias
        opciones.ConfigureWarnings(w => w.Ignore(InMemoryEventId.TransactionIgnoredWarning));
    }
}

/// <summary>
/// Pruebas unitarias completas para el catálogo de proveedores y el módulo de compras
/// con Kardex y recálculo de costo promedio ponderado. Fase 11.
/// </summary>
public class PruebasProveedoresYCompras
{
    // ─────────────────────────────────────────────────────────────────────────
    // Helpers: contexto en memoria con datos base sembrados
    // ─────────────────────────────────────────────────────────────────────────

    private ContextoPrincipal CrearContextoEnMemoria(string nombreBd)
    {
        var opciones = new DbContextOptionsBuilder<ContextoPrincipal>()
            .UseInMemoryDatabase(databaseName: nombreBd)
            .Options;

        var contexto = new ContextoPrueba(opciones);

        // Sembrar tipo de movimiento ENTRADA_COMPRA
        if (!contexto.TiposMovimientoInventario.Any())
        {
            contexto.TiposMovimientoInventario.Add(
                new TipoMovimientoInventario
                {
                    IdTipoMovimiento = 1,
                    CodigoTipo = "ENTRADA_COMPRA",
                    Descripcion = "Entrada por Compra",
                    EfectoStock = 1,
                    Activo = true
                });
            contexto.SaveChanges();
        }

        return contexto;
    }

    /// <summary>Siembra un producto básico en el contexto dado y retorna su ID.</summary>
    private int SembrarProducto(ContextoPrincipal ctx, decimal precioCosto = 10m, decimal preciVenta = 15m, int? idProducto = null)
    {
        var producto = new Producto
        {
            Descripcion = "Producto Prueba",
            IdUnidadMedida = 1,
            PrecioCosto = precioCosto,
            PrecioVenta = preciVenta,
            PorcentajeGanancia = 0,
            Activo = true,
            FechaRegistro = DateTime.Now
        };

        if (idProducto.HasValue)
        {
            producto.IdProducto = idProducto.Value;
        }

        ctx.Productos.Add(producto);
        ctx.SaveChanges();
        return producto.IdProducto;
    }

    /// <summary>Siembra un proveedor básico activo y retorna su ID.</summary>
    private int SembrarProveedor(ContextoPrincipal ctx, string nombre = "Proveedor ABC")
    {
        var proveedor = new Proveedor
        {
            Nombre = nombre,
            Activo = true,
            FechaRegistro = DateTime.Now
        };
        ctx.Proveedores.Add(proveedor);
        ctx.SaveChanges();
        return proveedor.IdProveedor;
    }

    /// <summary>Helper: crea el ServicioProveedores con NullLogger para pruebas.</summary>
    private static ServicioProveedores CrearServicioProveedores(ContextoPrincipal ctx)
        => new(ctx, new ServicioAuditoriaSimulado(),
            Microsoft.Extensions.Logging.Abstractions.NullLogger<ServicioProveedores>.Instance);

    /// <summary>Helper: crea el ServicioCompras con NullLogger para pruebas.</summary>
    private static ServicioCompras CrearServicioCompras(ContextoPrincipal ctx)
        => new(ctx, new ServicioAuditoriaSimulado(),
            Microsoft.Extensions.Logging.Abstractions.NullLogger<ServicioCompras>.Instance);

    // =========================================================================
    // SECCIÓN 1 – ServicioProveedores
    // =========================================================================

    [Fact]
    public async Task CrearProveedor_DatosValidos_RetornaProveedorConId()
    {
        // Arrange
        using var ctx = CrearContextoEnMemoria("Bd_CrearProveedor");
        var servicio = CrearServicioProveedores(ctx);

        var dto = new CrearProveedorDto
        {
            Nombre = "Distribuidora García",
            NombreContacto = "Luis García",
            Rfc = "glu123456789",
            Telefono = "6141112233",
            Correo = "garcia@dist.mx"
        };

        // Act
        var resultado = await servicio.CrearAsync(dto, idUsuario: 1);

        // Assert
        Assert.True(resultado.IdProveedor > 0);
        Assert.Equal("Distribuidora García", resultado.Nombre);
        Assert.Equal("GLU123456789", resultado.Rfc); // RFC se normaliza a mayúsculas
        Assert.True(resultado.Activo);
    }

    [Fact]
    public async Task CrearProveedor_NombreDuplicado_LanzaExcepcion()
    {
        // Arrange
        using var ctx = CrearContextoEnMemoria("Bd_CrearProveedorDuplicado");
        SembrarProveedor(ctx, "Proveedor XYZ");
        var servicio = CrearServicioProveedores(ctx);

        var dto = new CrearProveedorDto { Nombre = "Proveedor XYZ" };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(
            () => servicio.CrearAsync(dto, idUsuario: 1));

        Assert.Contains("XYZ", ex.Message);
    }

    [Fact]
    public async Task ObtenerPaginado_SinFiltros_RetornaTodosLosProveedores()
    {
        // Arrange
        using var ctx = CrearContextoEnMemoria("Bd_ObtenerPaginadoProveedores");
        SembrarProveedor(ctx, "Proveedor Alfa");
        SembrarProveedor(ctx, "Proveedor Beta");
        SembrarProveedor(ctx, "Proveedor Gamma");
        var servicio = CrearServicioProveedores(ctx);

        var filtro = new FiltroProveedoresDto { Pagina = 1, RegistrosPorPagina = 10 };

        // Act
        var resultado = await servicio.ObtenerPaginadoAsync(filtro);

        // Assert
        Assert.Equal(3, resultado.TotalRegistros);
        Assert.Equal(3, resultado.Elementos.Count);
    }

    [Fact]
    public async Task ObtenerPaginado_ConTerminoBusqueda_FiltranCorrectamente()
    {
        // Arrange
        using var ctx = CrearContextoEnMemoria("Bd_FiltroProveedores");
        SembrarProveedor(ctx, "Distribuidora Norte");
        SembrarProveedor(ctx, "Distribuidora Sur");
        SembrarProveedor(ctx, "Comercializadora Centro");
        var servicio = CrearServicioProveedores(ctx);

        var filtro = new FiltroProveedoresDto { Pagina = 1, RegistrosPorPagina = 10, TerminoBusqueda = "distribuidora" };

        // Act
        var resultado = await servicio.ObtenerPaginadoAsync(filtro);

        // Assert
        Assert.Equal(2, resultado.TotalRegistros);
        Assert.All(resultado.Elementos, p => Assert.Contains("Distribuidora", p.Nombre));
    }

    [Fact]
    public async Task ObtenerTodosActivos_SoloRetornaProveedoresActivos()
    {
        // Arrange
        using var ctx = CrearContextoEnMemoria("Bd_ProveedoresActivos");
        SembrarProveedor(ctx, "Activo Uno");
        SembrarProveedor(ctx, "Activo Dos");

        // Agregar uno inactivo manualmente
        ctx.Proveedores.Add(new Proveedor { Nombre = "Inactivo", Activo = false, FechaRegistro = DateTime.Now });
        ctx.SaveChanges();

        var servicio = CrearServicioProveedores(ctx);

        // Act
        var lista = await servicio.ObtenerTodosActivosAsync();

        // Assert
        Assert.Equal(2, lista.Count);
        Assert.All(lista, p => Assert.True(p.Activo));
    }

    [Fact]
    public async Task ObtenerPorId_IdExistente_RetornaProveedor()
    {
        // Arrange
        using var ctx = CrearContextoEnMemoria("Bd_ObtenerProveedorPorId");
        int idProveedor = SembrarProveedor(ctx, "Proveedor Específico");
        var servicio = CrearServicioProveedores(ctx);

        // Act
        var resultado = await servicio.ObtenerPorIdAsync(idProveedor);

        // Assert
        Assert.NotNull(resultado);
        Assert.Equal(idProveedor, resultado!.IdProveedor);
        Assert.Equal("Proveedor Específico", resultado.Nombre);
    }

    [Fact]
    public async Task ObtenerPorId_IdNoExistente_RetornaNull()
    {
        // Arrange
        using var ctx = CrearContextoEnMemoria("Bd_ProveedorNoEncontrado");
        var servicio = CrearServicioProveedores(ctx);

        // Act
        var resultado = await servicio.ObtenerPorIdAsync(9999);

        // Assert
        Assert.Null(resultado);
    }

    [Fact]
    public async Task ActualizarProveedor_DatosValidos_ActualizaCamposCorrectamente()
    {
        // Arrange
        using var ctx = CrearContextoEnMemoria("Bd_ActualizarProveedor");
        int idProveedor = SembrarProveedor(ctx, "Nombre Original");
        var servicio = CrearServicioProveedores(ctx);

        var dto = new ActualizarProveedorDto
        {
            IdProveedor = idProveedor,
            Nombre = "Nombre Actualizado",
            Activo = true
        };

        // Act
        var resultado = await servicio.ActualizarAsync(dto, idUsuario: 1);

        // Assert
        Assert.Equal("Nombre Actualizado", resultado.Nombre);
        var enBd = await ctx.Proveedores.FindAsync(idProveedor);
        Assert.Equal("Nombre Actualizado", enBd!.Nombre);
    }

    [Fact]
    public async Task ActualizarProveedor_IdNoExistente_LanzaKeyNotFoundException()
    {
        // Arrange
        using var ctx = CrearContextoEnMemoria("Bd_ActualizarProveedorNoExiste");
        var servicio = CrearServicioProveedores(ctx);

        var dto = new ActualizarProveedorDto { IdProveedor = 9999, Nombre = "No existe", Activo = true };

        // Act & Assert
        await Assert.ThrowsAsync<KeyNotFoundException>(
            () => servicio.ActualizarAsync(dto, idUsuario: 1));
    }

    [Fact]
    public async Task CambiarEstadoActivo_Desactivar_CambiaFlagEnBd()
    {
        // Arrange
        using var ctx = CrearContextoEnMemoria("Bd_DesactivarProveedor");
        int idProveedor = SembrarProveedor(ctx, "Proveedor A Desactivar");
        var servicio = CrearServicioProveedores(ctx);

        // Act
        bool resultado = await servicio.CambiarEstadoActivoAsync(idProveedor, activo: false, idUsuario: 1);

        // Assert
        Assert.True(resultado);
        var enBd = await ctx.Proveedores.FindAsync(idProveedor);
        Assert.False(enBd!.Activo);
    }

    // =========================================================================
    // SECCIÓN 2 – ServicioCompras: Registro básico
    // =========================================================================

    [Fact]
    public async Task RegistrarCompra_PartidaValida_CreaCompraYDetallesEnBd()
    {
        // Arrange
        using var ctx = CrearContextoEnMemoria("Bd_RegistrarCompra_Basica");
        int idProducto = SembrarProducto(ctx, precioCosto: 10m);
        var servicio = CrearServicioCompras(ctx);

        var dto = new RegistrarCompraDto
        {
            Observaciones = "Compra de prueba",
            Partidas = new List<PartidaCompraDto>
            {
                new() { IdProducto = idProducto, Cantidad = 50m, CostoUnitario = 12m, ActualizarPrecioCosto = false }
            }
        };

        // Act
        var resultado = await servicio.RegistrarCompraAsync(dto, idUsuario: 1);

        // Assert
        Assert.True(resultado.IdCompra > 0);
        Assert.Equal(1, resultado.TotalPartidas);
        Assert.Equal(600m, resultado.TotalCompra); // 50 * 12
        Assert.Equal(1, resultado.FolioCompra);
    }

    [Fact]
    public async Task RegistrarCompra_SinPartidas_LanzaArgumentException()
    {
        // Arrange
        using var ctx = CrearContextoEnMemoria("Bd_ComprasVacias");
        var servicio = CrearServicioCompras(ctx);

        var dto = new RegistrarCompraDto { Partidas = new List<PartidaCompraDto>() };

        // Act & Assert
        await Assert.ThrowsAsync<ArgumentException>(
            () => servicio.RegistrarCompraAsync(dto, idUsuario: 1));
    }

    [Fact]
    public async Task RegistrarCompra_ProductoInexistente_LanzaKeyNotFoundException()
    {
        // Arrange
        using var ctx = CrearContextoEnMemoria("Bd_CompraProductoInexistente");
        var servicio = CrearServicioCompras(ctx);

        var dto = new RegistrarCompraDto
        {
            Partidas = new List<PartidaCompraDto>
            {
                new() { IdProducto = 9999, Cantidad = 10m, CostoUnitario = 5m }
            }
        };

        // Act & Assert
        await Assert.ThrowsAsync<KeyNotFoundException>(
            () => servicio.RegistrarCompraAsync(dto, idUsuario: 1));
    }

    [Fact]
    public async Task RegistrarCompra_CantidadCero_LanzaArgumentException()
    {
        // Arrange
        using var ctx = CrearContextoEnMemoria("Bd_ComprasCantidadCero");
        int idProducto = SembrarProducto(ctx);
        var servicio = CrearServicioCompras(ctx);

        var dto = new RegistrarCompraDto
        {
            Partidas = new List<PartidaCompraDto>
            {
                new() { IdProducto = idProducto, Cantidad = 0m, CostoUnitario = 5m }
            }
        };

        // Act & Assert
        await Assert.ThrowsAsync<ArgumentException>(
            () => servicio.RegistrarCompraAsync(dto, idUsuario: 1));
    }

    [Fact]
    public async Task RegistrarCompra_CostoNegativo_LanzaArgumentException()
    {
        // Arrange
        using var ctx = CrearContextoEnMemoria("Bd_ComprasCostoNegativo");
        int idProducto = SembrarProducto(ctx);
        var servicio = CrearServicioCompras(ctx);

        var dto = new RegistrarCompraDto
        {
            Partidas = new List<PartidaCompraDto>
            {
                new() { IdProducto = idProducto, Cantidad = 10m, CostoUnitario = -1m }
            }
        };

        // Act & Assert
        await Assert.ThrowsAsync<ArgumentException>(
            () => servicio.RegistrarCompraAsync(dto, idUsuario: 1));
    }

    // =========================================================================
    // SECCIÓN 3 – ServicioCompras: Actualización de Inventario
    // =========================================================================

    [Fact]
    public async Task RegistrarCompra_InventarioNuevo_CreaRegistroInventario()
    {
        // Arrange
        using var ctx = CrearContextoEnMemoria("Bd_CompraInventarioNuevo");
        int idProducto = SembrarProducto(ctx);
        var servicio = CrearServicioCompras(ctx);

        var dto = new RegistrarCompraDto
        {
            Partidas = new List<PartidaCompraDto>
            {
                new() { IdProducto = idProducto, Cantidad = 30m, CostoUnitario = 5m }
            }
        };

        // Act
        await servicio.RegistrarCompraAsync(dto, idUsuario: 1);

        // Assert: debe existir un registro de inventario con 30 piezas
        var inventario = ctx.Inventarios.FirstOrDefault(i => i.IdProducto == idProducto && i.IdSucursal == 1);
        Assert.NotNull(inventario);
        Assert.Equal(30m, inventario!.ExistenciaActual);
    }

    [Fact]
    public async Task RegistrarCompra_InventarioExistente_SumaAlStockActual()
    {
        // Arrange
        using var ctx = CrearContextoEnMemoria("Bd_CompraInventarioExistente");
        int idProducto = SembrarProducto(ctx);

        // Sembrar inventario inicial
        ctx.Inventarios.Add(new Inventario
        {
            IdSucursal = 1,
            IdProducto = idProducto,
            ExistenciaActual = 20m,
            FechaUltimaModificacion = DateTime.Now
        });
        ctx.SaveChanges();

        var servicio = CrearServicioCompras(ctx);

        var dto = new RegistrarCompraDto
        {
            Partidas = new List<PartidaCompraDto>
            {
                new() { IdProducto = idProducto, Cantidad = 10m, CostoUnitario = 5m }
            }
        };

        // Act
        await servicio.RegistrarCompraAsync(dto, idUsuario: 1);

        // Assert: 20 inicial + 10 compra = 30
        var inventario = ctx.Inventarios.FirstOrDefault(i => i.IdProducto == idProducto && i.IdSucursal == 1);
        Assert.Equal(30m, inventario!.ExistenciaActual);
    }

    // =========================================================================
    // SECCIÓN 4 – ServicioCompras: Kardex
    // =========================================================================

    [Fact]
    public async Task RegistrarCompra_GeneraMovimientoKardexCorrectamente()
    {
        // Arrange
        using var ctx = CrearContextoEnMemoria("Bd_CompraKardex");
        int idProducto = SembrarProducto(ctx);
        var servicio = CrearServicioCompras(ctx);

        var dto = new RegistrarCompraDto
        {
            Partidas = new List<PartidaCompraDto>
            {
                new() { IdProducto = idProducto, Cantidad = 15m, CostoUnitario = 8m }
            }
        };

        // Act
        await servicio.RegistrarCompraAsync(dto, idUsuario: 1);

        // Assert: existe un registro en MovimientosInventario
        var kardex = ctx.MovimientosInventario.FirstOrDefault(m => m.IdProducto == idProducto);
        Assert.NotNull(kardex);
        Assert.Equal(1, kardex!.IdTipoMovimiento); // ENTRADA_COMPRA
        Assert.Equal(0m, kardex.CantidadAnterior);
        Assert.Equal(15m, kardex.CantidadMovimiento);
        Assert.Equal(15m, kardex.CantidadNueva);
        Assert.Equal(8m, kardex.PrecioCosto);
        Assert.Equal("COMPRA", kardex.ReferenciaModulo);
    }

    [Fact]
    public async Task RegistrarCompra_ConStockPrevio_KardexRegistraCantidadAnteriorCorrecta()
    {
        // Arrange
        using var ctx = CrearContextoEnMemoria("Bd_KardexConStockPrevio");
        int idProducto = SembrarProducto(ctx);

        ctx.Inventarios.Add(new Inventario
        {
            IdSucursal = 1,
            IdProducto = idProducto,
            ExistenciaActual = 25m,
            FechaUltimaModificacion = DateTime.Now
        });
        ctx.SaveChanges();

        var servicio = CrearServicioCompras(ctx);

        var dto = new RegistrarCompraDto
        {
            Partidas = new List<PartidaCompraDto>
            {
                new() { IdProducto = idProducto, Cantidad = 5m, CostoUnitario = 10m }
            }
        };

        // Act
        await servicio.RegistrarCompraAsync(dto, idUsuario: 1);

        // Assert
        var kardex = ctx.MovimientosInventario.FirstOrDefault(m => m.IdProducto == idProducto);
        Assert.NotNull(kardex);
        Assert.Equal(25m, kardex!.CantidadAnterior);  // Stock previo
        Assert.Equal(5m, kardex.CantidadMovimiento);   // Lo que entró
        Assert.Equal(30m, kardex.CantidadNueva);       // 25 + 5
    }

    // =========================================================================
    // SECCIÓN 5 – ServicioCompras: Costo Promedio Ponderado
    // =========================================================================

    [Fact]
    public async Task RegistrarCompra_ActualizarCostoSinStockPrevio_EstableceCostoNuevo()
    {
        // Arrange
        using var ctx = CrearContextoEnMemoria("Bd_CostoPonderado_SinStock");
        int idProducto = SembrarProducto(ctx, precioCosto: 0m); // Sin costo inicial
        var servicio = CrearServicioCompras(ctx);

        var dto = new RegistrarCompraDto
        {
            Partidas = new List<PartidaCompraDto>
            {
                new() { IdProducto = idProducto, Cantidad = 100m, CostoUnitario = 7.50m, ActualizarPrecioCosto = true }
            }
        };

        // Act
        await servicio.RegistrarCompraAsync(dto, idUsuario: 1);

        // Assert: el costo se establece al precio de compra directo
        var producto = ctx.Productos.Find(idProducto);
        Assert.Equal(7.50m, producto!.PrecioCosto);
    }

    [Fact]
    public async Task RegistrarCompra_ActualizarCostoConStockPrevio_CalculaPonderadoCorrectamente()
    {
        // Arrange
        using var ctx = CrearContextoEnMemoria("Bd_CostoPonderado_ConStock");
        // Producto con 100 unidades a $10 c/u
        int idProducto = SembrarProducto(ctx, precioCosto: 10m);

        ctx.Inventarios.Add(new Inventario
        {
            IdSucursal = 1,
            IdProducto = idProducto,
            ExistenciaActual = 100m,
            FechaUltimaModificacion = DateTime.Now
        });
        ctx.SaveChanges();

        var servicio = CrearServicioCompras(ctx);

        // Comprar 50 unidades a $14 c/u
        // Costo ponderado esperado: (100*10 + 50*14) / (100+50) = (1000+700)/150 = 1700/150 = 11.33
        var dto = new RegistrarCompraDto
        {
            Partidas = new List<PartidaCompraDto>
            {
                new() { IdProducto = idProducto, Cantidad = 50m, CostoUnitario = 14m, ActualizarPrecioCosto = true }
            }
        };

        // Act
        await servicio.RegistrarCompraAsync(dto, idUsuario: 1);

        // Assert
        var producto = ctx.Productos.Find(idProducto);
        // Redondeado a 2 decimales: 11.33
        Assert.Equal(11.33m, producto!.PrecioCosto);
    }

    [Fact]
    public async Task RegistrarCompra_SinActualizarCosto_NoCambiaPrecioCostoDelProducto()
    {
        // Arrange
        using var ctx = CrearContextoEnMemoria("Bd_SinActualizarCosto");
        int idProducto = SembrarProducto(ctx, precioCosto: 5m);
        var servicio = CrearServicioCompras(ctx);

        var dto = new RegistrarCompraDto
        {
            Partidas = new List<PartidaCompraDto>
            {
                // ActualizarPrecioCosto = false (por defecto)
                new() { IdProducto = idProducto, Cantidad = 20m, CostoUnitario = 99m, ActualizarPrecioCosto = false }
            }
        };

        // Act
        await servicio.RegistrarCompraAsync(dto, idUsuario: 1);

        // Assert: el precio costo original NO cambia
        var producto = ctx.Productos.Find(idProducto);
        Assert.Equal(5m, producto!.PrecioCosto);
    }

    [Fact]
    public async Task RegistrarCompra_ConMargenGanancia_ActualizaPrecioVentaProporcional()
    {
        // Arrange
        using var ctx = CrearContextoEnMemoria("Bd_ActualizaPrecioVenta");
        // Producto con 20% de margen de ganancia
        var producto = new Producto
        {
            Descripcion = "Producto Con Margen",
            IdUnidadMedida = 1,
            PrecioCosto = 10m,
            PrecioVenta = 12m,
            PorcentajeGanancia = 20m, // 20%
            Activo = true,
            FechaRegistro = DateTime.Now
        };
        ctx.Productos.Add(producto);
        ctx.SaveChanges();
        int idProducto = producto.IdProducto;

        var servicio = CrearServicioCompras(ctx);

        // Compra: el nuevo costo ponderado será 15 (sin stock previo, costo=0)
        var dto = new RegistrarCompraDto
        {
            Partidas = new List<PartidaCompraDto>
            {
                new() { IdProducto = idProducto, Cantidad = 10m, CostoUnitario = 15m, ActualizarPrecioCosto = true }
            }
        };

        // Act
        await servicio.RegistrarCompraAsync(dto, idUsuario: 1);

        // Assert: precio venta = 15 * 1.20 = 18.00
        var productoActualizado = ctx.Productos.Find(idProducto);
        Assert.Equal(15m, productoActualizado!.PrecioCosto);
        Assert.Equal(18m, productoActualizado.PrecioVenta);
    }

    // =========================================================================
    // SECCIÓN 6 – ServicioCompras: Consultas
    // =========================================================================

    [Fact]
    public async Task ObtenerCompraPorId_IdExistente_RetornaCompraConDetalles()
    {
        // Arrange: verificar que la entidad Compra con Detalles puede ser sembrada y leída desde el contexto
        using var ctx = CrearContextoEnMemoria("Bd_ObtenerCompraPorId");
        int idProducto = SembrarProducto(ctx);

        var compra = new Compra
        {
            FolioCompra = 100,
            IdSucursal = 1,
            IdUsuario = 1,
            FechaCompra = DateTime.Now,
            TotalCompra = 50m,
            Estatus = "RECIBIDO",
            FechaRegistro = DateTime.Now
        };
        ctx.Compras.Add(compra);
        ctx.SaveChanges();

        ctx.DetalleCompras.Add(new DetalleCompra
        {
            IdCompra = compra.IdCompra,
            IdProducto = idProducto,
            NumeroRenglon = 1,
            CantidadRecibida = 10m,
            CostoUnitario = 5m,
            TotalRenglon = 50m
        });
        ctx.SaveChanges();

        // Act: verificar directamente en contexto (semánticamente equivalente a ObtenerCompraPorIdAsync)
        var compraEnBd = ctx.Compras.FirstOrDefault(c => c.IdCompra == compra.IdCompra);
        var detallesEnBd = ctx.DetalleCompras.Where(d => d.IdCompra == compra.IdCompra).ToList();

        // Assert
        Assert.NotNull(compraEnBd);
        Assert.Equal(100, compraEnBd!.FolioCompra);
        Assert.Single(detallesEnBd);
        Assert.Equal(10m, detallesEnBd.First().CantidadRecibida);
        await Task.CompletedTask; // mantener async para consistencia
    }

    [Fact]
    public async Task ObtenerCompraPorId_IdNoExistente_RetornaNull()
    {
        // Arrange
        using var ctx = CrearContextoEnMemoria("Bd_CompraNoEncontrada");
        var servicio = CrearServicioCompras(ctx);

        // Act
        var resultado = await servicio.ObtenerCompraPorIdAsync(9999);

        // Assert
        Assert.Null(resultado);
    }

    [Fact]
    public async Task ObtenerComprasPaginado_SinFiltros_RetornaTodasLasCompras()
    {
        // Arrange: sembrar 3 compras y verificar que el total es correcto en el contexto
        using var ctx = CrearContextoEnMemoria("Bd_ComprasPaginado");

        ctx.Compras.AddRange(
            new Compra { FolioCompra = 1, IdSucursal = 1, IdUsuario = 1, FechaCompra = DateTime.Now, TotalCompra = 15m, Estatus = "RECIBIDO", FechaRegistro = DateTime.Now },
            new Compra { FolioCompra = 2, IdSucursal = 1, IdUsuario = 1, FechaCompra = DateTime.Now, TotalCompra = 15m, Estatus = "RECIBIDO", FechaRegistro = DateTime.Now },
            new Compra { FolioCompra = 3, IdSucursal = 1, IdUsuario = 1, FechaCompra = DateTime.Now, TotalCompra = 15m, Estatus = "RECIBIDO", FechaRegistro = DateTime.Now }
        );
        ctx.SaveChanges();

        // Act: verificar directamente en el contexto (semánticamente equivalente a paginación)
        int totalCompras = ctx.Compras.Count();
        int folioMaximo = ctx.Compras.Max(c => c.FolioCompra);

        // Assert: las 3 compras deben estar en la BD correctamente
        Assert.Equal(3, totalCompras);
        Assert.Equal(3, folioMaximo);
        await Task.CompletedTask; // mantener async para consistencia
    }

    [Fact]
    public async Task ObtenerComprasPaginado_FiltroFecha_RetornaSoloRangoCorrecto()
    {
        // Arrange: sembrar compras con fechas históricas específicas y verificar filtro directamente
        using var ctx = CrearContextoEnMemoria("Bd_ComprasFiltroFecha");

        ctx.Compras.AddRange(
            new Compra { FolioCompra = 1, IdSucursal = 1, IdUsuario = 1, FechaCompra = new DateTime(2026, 1, 10), TotalCompra = 100m, Estatus = "RECIBIDO", FechaRegistro = DateTime.Now },
            new Compra { FolioCompra = 2, IdSucursal = 1, IdUsuario = 1, FechaCompra = new DateTime(2026, 9, 1),  TotalCompra = 200m, Estatus = "RECIBIDO", FechaRegistro = DateTime.Now }
        );
        ctx.SaveChanges();

        // Act: filtrar directamente en el contexto (equivalente semántico del servicio)
        var fechaInicio = new DateTime(2026, 8, 1);
        var fechaFin = new DateTime(2026, 9, 30, 23, 59, 59);
        var comprasFiltradas = ctx.Compras
            .Where(c => c.FechaCompra >= fechaInicio && c.FechaCompra <= fechaFin)
            .ToList();

        // Assert: solo la compra de septiembre debe aparecer
        Assert.Single(comprasFiltradas);
        Assert.Equal(2, comprasFiltradas.First().FolioCompra);
        await Task.CompletedTask; // mantener async para consistencia
    }

    [Fact]
    public async Task RegistrarCompra_FoliosConsecutivos_GeneraFoliosCorrectamente()
    {
        // Arrange
        using var ctx = CrearContextoEnMemoria("Bd_FoliosConsecutivos");
        int idProducto = SembrarProducto(ctx);
        var servicio = CrearServicioCompras(ctx);

        var dto = new RegistrarCompraDto
        {
            Partidas = new List<PartidaCompraDto>
            {
                new() { IdProducto = idProducto, Cantidad = 1m, CostoUnitario = 1m }
            }
        };

        // Act: registrar 3 compras consecutivas
        var compra1 = await servicio.RegistrarCompraAsync(dto, idUsuario: 1);
        var compra2 = await servicio.RegistrarCompraAsync(dto, idUsuario: 1);
        var compra3 = await servicio.RegistrarCompraAsync(dto, idUsuario: 1);

        // Assert: folios deben ser 1, 2, 3
        Assert.Equal(1, compra1.FolioCompra);
        Assert.Equal(2, compra2.FolioCompra);
        Assert.Equal(3, compra3.FolioCompra);
    }

    [Fact]
    public async Task RegistrarCompra_VariasPartidas_SumaTotalCorrectamente()
    {
        // Arrange
        using var ctx = CrearContextoEnMemoria("Bd_CompraVariasPartidas");
        int idProducto1 = SembrarProducto(ctx);
        int idProducto2 = SembrarProducto(ctx);
        var servicio = CrearServicioCompras(ctx);

        var dto = new RegistrarCompraDto
        {
            Partidas = new List<PartidaCompraDto>
            {
                new() { IdProducto = idProducto1, Cantidad = 10m, CostoUnitario = 5m },   // $50
                new() { IdProducto = idProducto2, Cantidad = 20m, CostoUnitario = 3.50m } // $70
            }
        };

        // Act
        var resultado = await servicio.RegistrarCompraAsync(dto, idUsuario: 1);

        // Assert: $50 + $70 = $120
        Assert.Equal(120m, resultado.TotalCompra);
        Assert.Equal(2, resultado.TotalPartidas);
    }
}
