using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using PdvAbarrotes.Aplicacion.Comun;
using PdvAbarrotes.Aplicacion.DTOs.Auditoria;
using PdvAbarrotes.Aplicacion.DTOs.Productos;
using PdvAbarrotes.Aplicacion.Interfaces;
using PdvAbarrotes.Dominio.Entidades;
using PdvAbarrotes.Dominio.Excepciones;
using PdvAbarrotes.Infraestructura.Persistencia;
using PdvAbarrotes.Infraestructura.Servicios;
using Xunit;

namespace PdvAbarrotes.Tests;

/// <summary>
/// Implementación simulada de auditoría para pruebas unitarias en memoria.
/// </summary>
public class ServicioAuditoriaSimulado : IServicioAuditoria
{
    public List<BitacoraAuditoria> Registros { get; } = new();

    public Task RegistrarAsync(string tabla, int idRegistro, string accion, string? valorAnterior, string? valorNuevo, CancellationToken cancellationToken = default)
    {
        Registros.Add(new BitacoraAuditoria
        {
            IdAuditoria = Registros.Count + 1,
            Tabla = tabla,
            IdRegistro = idRegistro,
            Accion = accion,
            ValorAnterior = valorAnterior,
            ValorNuevo = valorNuevo,
            Usuario = "admin_test",
            FechaHora = DateTime.Now
        });
        return Task.CompletedTask;
    }

    public Task<ResultadoPaginado<RegistroAuditoriaDto>> ConsultarAuditoriaPaginadoAsync(FiltroAuditoriaDto filtro, CancellationToken cancellationToken = default)
    {
        var dtos = Registros.Select(r => new RegistroAuditoriaDto
        {
            IdAuditoria = r.IdAuditoria,
            Tabla = r.Tabla,
            IdRegistro = r.IdRegistro,
            Accion = r.Accion,
            ValorAnterior = r.ValorAnterior,
            ValorNuevo = r.ValorNuevo,
            Usuario = r.Usuario,
            FechaHora = r.FechaHora
        }).ToList();

        return Task.FromResult(new ResultadoPaginado<RegistroAuditoriaDto>(dtos, dtos.Count, 1, 25));
    }
}

/// <summary>
/// Pruebas unitarias para el servicio de productos, catálogos y buscador rápido del PDV.
/// </summary>
public class PruebasProductos
{
    private ContextoPrincipal CrearContextoEnMemoria(string nombreBd)
    {
        var opciones = new DbContextOptionsBuilder<ContextoPrincipal>()
            .UseInMemoryDatabase(databaseName: nombreBd)
            .Options;

        return new ContextoPrincipal(opciones);
    }

    [Fact]
    public async Task CrearAsync_CalculaPorcentajeGananciaYRegistraInventario()
    {
        // Arrange
        using var contexto = CrearContextoEnMemoria("BdTest_CrearProducto");
        var auditoria = new ServicioAuditoriaSimulado();
        var configuracion = new ConfigurationBuilder().Build();
        var servicio = new ServicioProductos(contexto, auditoria, configuracion);

        var nuevo = new CrearProductoDto
        {
            CodigoProducto = "75010001",
            CodigoBarras = "75010001",
            Descripcion = "Refresco Cola 600ml",
            PrecioCosto = 10.00m,
            PrecioVenta = 15.00m,
            PrecioMayoreo = 13.50m,
            ExistenciaInicial = 50,
            ExistenciaMinima = 10,
            ExistenciaMaxima = 100
        };

        // Act
        var resultado = await servicio.CrearAsync(nuevo);

        // Assert
        Assert.NotNull(resultado);
        Assert.Equal("Refresco Cola 600ml", resultado.Descripcion);
        Assert.Equal(50.00m, resultado.PorcentajeGanancia); // (15 - 10) / 10 * 100 = 50%
        Assert.Equal(50, resultado.ExistenciaActual);

        // Verificar código de barras y auditoría
        Assert.Equal("75010001", resultado.CodigoBarrasPrincipal);
        Assert.Contains(auditoria.Registros, r => r.Tabla == "Productos" && r.Accion == "CREAR");
    }

    [Fact]
    public async Task ActualizarAsync_CambioPrecioRegistraAuditoriaEspecifica()
    {
        // Arrange
        using var contexto = CrearContextoEnMemoria("BdTest_CambioPrecio");
        var auditoria = new ServicioAuditoriaSimulado();
        var configuracion = new ConfigurationBuilder().Build();
        var servicio = new ServicioProductos(contexto, auditoria, configuracion);

        var productoInicial = await servicio.CrearAsync(new CrearProductoDto
        {
            CodigoProducto = "75020002",
            CodigoBarras = "75020002",
            Descripcion = "Galletas Chocolate 100g",
            PrecioCosto = 12.00m,
            PrecioVenta = 18.00m,
            ExistenciaInicial = 20
        });

        // Act - Modificar precio de venta de 18 a 21
        var datosActualizar = new ActualizarProductoDto
        {
            CodigoBarrasPrincipal = "75020002",
            Descripcion = "Galletas Chocolate 100g",
            PrecioCosto = 12.00m,
            PrecioVenta = 21.00m,
            PrecioMayoreo = 19.00m,
            ExistenciaMinima = 5,
            ExistenciaMaxima = 50,
            Activo = true
        };

        var resultado = await servicio.ActualizarAsync(productoInicial.IdProducto, datosActualizar);

        // Assert
        Assert.Equal(21.00m, resultado.PrecioVenta);
        Assert.Equal(75.00m, resultado.PorcentajeGanancia); // (21 - 12) / 12 * 100 = 75%
        Assert.Contains(auditoria.Registros, r => r.Accion == "CAMBIO_PRECIO");
    }

    [Fact]
    public async Task BuscarPorCodigoBarrasAsync_RetornaModeloCobroSinImagenes()
    {
        // Arrange
        using var contexto = CrearContextoEnMemoria("BdTest_ScannerPdv");
        var auditoria = new ServicioAuditoriaSimulado();
        var configuracion = new ConfigurationBuilder().Build();
        var servicio = new ServicioProductos(contexto, auditoria, configuracion);

        await servicio.CrearAsync(new CrearProductoDto
        {
            CodigoProducto = "75030003",
            CodigoBarras = "75030003",
            Descripcion = "Leche Entera 1L",
            PrecioCosto = 22.00m,
            PrecioVenta = 28.00m,
            PrecioMayoreo = 26.00m,
            ExistenciaInicial = 15,
            ImagenUrl = "/imagenes/productos/leche.jpg" // Imagen presente en catálogo administrativo
        });

        // Act - Escanear código de barras en el PDV
        var productoCobro = await servicio.BuscarPorCodigoBarrasAsync("75030003");

        // Assert - REGLA ESTRICTA: El DTO de cobro no debe contener imágenes ni costos
        Assert.NotNull(productoCobro);
        Assert.Equal("75030003", productoCobro.CodigoBarras);
        Assert.Equal("Leche Entera 1L", productoCobro.Descripcion);
        Assert.Equal(28.00m, productoCobro.PrecioVenta);
        Assert.Equal(15, productoCobro.ExistenciaActual);

        // Validar que el DTO ProductoCobroDto no expone la propiedad ImagenUrl ni PrecioCosto
        var propiedades = typeof(ProductoCobroDto).GetProperties().Select(p => p.Name).ToList();
        Assert.DoesNotContain("ImagenUrl", propiedades);
        Assert.DoesNotContain("PrecioCosto", propiedades);
    }

    [Fact]
    public async Task BuscarPdvAsync_RetornaResultadosPredictivosSinImagenes()
    {
        // Arrange
        using var contexto = CrearContextoEnMemoria("BdTest_BuscadorPdv");
        var auditoria = new ServicioAuditoriaSimulado();
        var configuracion = new ConfigurationBuilder().Build();
        var servicio = new ServicioProductos(contexto, auditoria, configuracion);

        await servicio.CrearAsync(new CrearProductoDto { CodigoBarras = "1111", Descripcion = "Jugo de Naranja 500ml", PrecioVenta = 15 });
        await servicio.CrearAsync(new CrearProductoDto { CodigoBarras = "2222", Descripcion = "Jugo de Manzana 500ml", PrecioVenta = 16 });
        await servicio.CrearAsync(new CrearProductoDto { CodigoBarras = "3333", Descripcion = "Agua Natural 1L", PrecioVenta = 12 });

        // Act
        var resultados = await servicio.BuscarPdvAsync("Jugo", limite: 10);

        // Assert
        Assert.Equal(2, resultados.Count);
        Assert.All(resultados, r => Assert.Contains("Jugo", r.Descripcion));

        // Validar que el DTO de búsqueda no expone ImagenUrl ni PrecioCosto
        var propiedades = typeof(ResultadoBusquedaPdvDto).GetProperties().Select(p => p.Name).ToList();
        Assert.DoesNotContain("ImagenUrl", propiedades);
        Assert.DoesNotContain("PrecioCosto", propiedades);
    }

    [Fact]
    public async Task BuscarPorCodigoBarrasAsync_ProductoInactivoLanzaExcepcion()
    {
        // Arrange
        using var contexto = CrearContextoEnMemoria("BdTest_ProductoInactivo");
        var auditoria = new ServicioAuditoriaSimulado();
        var configuracion = new ConfigurationBuilder().Build();
        var servicio = new ServicioProductos(contexto, auditoria, configuracion);

        var producto = await servicio.CrearAsync(new CrearProductoDto
        {
            CodigoBarras = "9999",
            Descripcion = "Producto Descontinuado",
            PrecioVenta = 50
        });

        // Desactivar producto
        await servicio.CambiarEstadoActivoAsync(producto.IdProducto, false);

        // Act & Assert
        await Assert.ThrowsAsync<ExcepcionNoEncontrado>(() => servicio.BuscarPorCodigoBarrasAsync("9999"));
    }
}
