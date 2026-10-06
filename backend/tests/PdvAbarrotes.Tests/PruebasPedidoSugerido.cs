using Microsoft.EntityFrameworkCore;
using PdvAbarrotes.Aplicacion.DTOs.PedidosSugeridos;
using PdvAbarrotes.Dominio.Entidades;
using PdvAbarrotes.Infraestructura.Persistencia;
using PdvAbarrotes.Infraestructura.Servicios;
using Xunit;

namespace PdvAbarrotes.Tests;

/// <summary>
/// Pruebas unitarias para el módulo de Pedido Sugerido Dominical (Fase 13).
/// Valida cálculo de demanda histórica, stock de seguridad, redondeos, agrupación por proveedor y ciclo de vida de pedidos.
/// </summary>
public class PruebasPedidoSugerido
{
    private ContextoPrincipal CrearContextoEnMemoria(string nombreBd)
    {
        var opciones = new DbContextOptionsBuilder<ContextoPrincipal>()
            .UseInMemoryDatabase(databaseName: nombreBd)
            .Options;

        var contexto = new ContextoPrueba(opciones);

        // Sembrar datos maestros si no existen
        if (!contexto.Proveedores.Any())
        {
            var prov1 = new Proveedor
            {
                IdProveedor = 1,
                Nombre = "Distribuidora Bimbo del Centro",
                NombreContacto = "Carlos Méndez",
                Telefono = "4771234567",
                Correo = "pedidos@bimbo.com",
                Activo = true
            };
            var prov2 = new Proveedor
            {
                IdProveedor = 2,
                Nombre = "Embotelladora Coca-Cola Femsa",
                NombreContacto = "Laura Torres",
                Telefono = "4779876543",
                Correo = "ventas@femsa.com",
                Activo = true
            };

            contexto.Proveedores.AddRange(prov1, prov2);

            var catAbarrotes = new Categoria { IdCategoria = 1, Descripcion = "Abarrotes", Activo = true };
            var catBebidas = new Categoria { IdCategoria = 2, Descripcion = "Bebidas", Activo = true };
            contexto.Categorias.AddRange(catAbarrotes, catBebidas);

            var umPza = new UnidadMedida { IdUnidadMedida = 1, Nombre = "Pieza", Abreviatura = "PZA", Activo = true };
            contexto.UnidadesMedida.Add(umPza);

            // Producto 1: Pan Blanco Bimbo (no fraccionado, stock bajo)
            var prod1 = new Producto
            {
                IdProducto = 1,
                CodigoProducto = "PAN-BIMBO",
                Descripcion = "Pan Blanco Bimbo Grande 680g",
                IdCategoria = 1,
                IdUnidadMedida = 1,
                IdProveedorPredeterminado = 1,
                PrecioCosto = 38.50m,
                PrecioVenta = 45.00m,
                ExistenciaMinima = 5m,
                PermiteVentaFraccionada = false,
                ManejaInventario = true,
                Activo = true
            };
            prod1.CodigosBarras.Add(new CodigoBarras { IdCodigoBarras = 1, CodigoValor = "7501000111222", EsPrincipal = true, Activo = true });
            prod1.Inventarios.Add(new Inventario { IdInventario = 1, IdSucursal = 1, IdProducto = 1, ExistenciaActual = 2m });

            // Producto 2: Coca Cola 600ml (no fraccionado, stock crítico)
            var prod2 = new Producto
            {
                IdProducto = 2,
                CodigoProducto = "COCA-600",
                Descripcion = "Coca-Cola Original 600ml Pet",
                IdCategoria = 2,
                IdUnidadMedida = 1,
                IdProveedorPredeterminado = 2,
                PrecioCosto = 14.00m,
                PrecioVenta = 18.00m,
                ExistenciaMinima = 10m,
                PermiteVentaFraccionada = false,
                ManejaInventario = true,
                Activo = true
            };
            prod2.CodigosBarras.Add(new CodigoBarras { IdCodigoBarras = 2, CodigoValor = "7501055300075", EsPrincipal = true, Activo = true });
            prod2.Inventarios.Add(new Inventario { IdInventario = 2, IdSucursal = 1, IdProducto = 2, ExistenciaActual = 4m });

            // Producto 3: Producto con sobre-stock (no debería sugerir compra)
            var prod3 = new Producto
            {
                IdProducto = 3,
                CodigoProducto = "SOBRE-STOCK",
                Descripcion = "Arroz Verde Valle 1kg",
                IdCategoria = 1,
                IdUnidadMedida = 1,
                IdProveedorPredeterminado = 1,
                PrecioCosto = 22.00m,
                PrecioVenta = 28.00m,
                ExistenciaMinima = 5m,
                PermiteVentaFraccionada = false,
                ManejaInventario = true,
                Activo = true
            };
            prod3.CodigosBarras.Add(new CodigoBarras { IdCodigoBarras = 3, CodigoValor = "7501000999888", EsPrincipal = true, Activo = true });
            prod3.Inventarios.Add(new Inventario { IdInventario = 3, IdSucursal = 1, IdProducto = 3, ExistenciaActual = 50m });

            contexto.Productos.AddRange(prod1, prod2, prod3);
            contexto.SaveChanges();
        }

        return contexto;
    }

    [Fact]
    public async Task GenerarPedidoSugerido_CalculaDemandaYColchonDeSeguridad_Correctamente()
    {
        // Arrange
        var ctx = CrearContextoEnMemoria(nameof(GenerarPedidoSugerido_CalculaDemandaYColchonDeSeguridad_Correctamente));
        var servicio = new ServicioPedidosSugeridos(ctx);

        // Venta histórica de Producto 1: 14 piezas en 14 días (promedio 1 pza/día)
        var venta = new Venta
        {
            FolioVenta = "V-TEST-01",
            FechaVenta = DateTime.Now.AddDays(-2),
            Total = 630m,
            EsCancelada = false
        };
        venta.Detalles.Add(new DetalleVenta
        {
            IdProducto = 1,
            Descripcion = "Pan Blanco Bimbo Grande 680g",
            Cantidad = 14m,
            PrecioUnitario = 45.00m,
            Total = 630m
        });
        ctx.Ventas.Add(venta);
        await ctx.SaveChangesAsync();

        var dto = new GenerarPedidoSugeridoDto
        {
            IdSucursal = 1,
            DiasAnalisisHistorial = 14,
            DiasCobertura = 7,
            SoloConSugerenciaPositiva = true
        };

        // Act
        var pedido = await servicio.GenerarPedidoSugeridoAsync(dto);

        // Assert
        Assert.NotNull(pedido);
        Assert.True(pedido.IdPedidoSugerido > 0);
        Assert.Equal("GENERADO", pedido.Estado);

        var partidaBimbo = pedido.Detalles.FirstOrDefault(d => d.IdProducto == 1);
        Assert.NotNull(partidaBimbo);

        // Venta 14 en 14 días => VentaPromedioDiaria = 1.0
        Assert.Equal(1.0m, partidaBimbo.VentaPromedioDiaria);
        // DemandaEstimada = 1.0 * 7 = 7.0
        Assert.Equal(7.0m, partidaBimbo.DemandaEstimada);
        // StockObjetivo = 7 (demanda) + 5 (minimo) = 12
        // ExistenciaActual = 2
        // CantidadSugerida = 12 - 2 = 10 piezas
        Assert.Equal(10.0m, partidaBimbo.CantidadSugerida);
        Assert.Equal(38.50m, partidaBimbo.PrecioCostoUnitario);
        Assert.Equal(385.00m, partidaBimbo.SubtotalSugerido);
    }

    [Fact]
    public async Task GenerarPedidoSugerido_ProductoConSobrestock_SeExcluyeConFiltroPositivo()
    {
        // Arrange
        var ctx = CrearContextoEnMemoria(nameof(GenerarPedidoSugerido_ProductoConSobrestock_SeExcluyeConFiltroPositivo));
        var servicio = new ServicioPedidosSugeridos(ctx);

        var dto = new GenerarPedidoSugeridoDto
        {
            IdSucursal = 1,
            DiasAnalisisHistorial = 14,
            DiasCobertura = 7,
            SoloConSugerenciaPositiva = true
        };

        // Act
        var pedido = await servicio.GenerarPedidoSugeridoAsync(dto);

        // Assert: El producto 3 tiene 50 en stock y 0 ventas => sugerido 0 => debe excluirse
        var partidaSobreStock = pedido.Detalles.FirstOrDefault(d => d.IdProducto == 3);
        Assert.Null(partidaSobreStock);
    }

    [Fact]
    public async Task GenerarPedidoSugerido_AgrupaCorrectamentePorProveedor()
    {
        // Arrange
        var ctx = CrearContextoEnMemoria(nameof(GenerarPedidoSugerido_AgrupaCorrectamentePorProveedor));
        var servicio = new ServicioPedidosSugeridos(ctx);

        // Generar ventas para prod 1 y prod 2
        var venta = new Venta
        {
            FolioVenta = "V-TEST-02",
            FechaVenta = DateTime.Now.AddDays(-1),
            Total = 100m,
            EsCancelada = false
        };
        venta.Detalles.Add(new DetalleVenta { IdProducto = 1, Descripcion = "Pan", Cantidad = 14m });
        venta.Detalles.Add(new DetalleVenta { IdProducto = 2, Descripcion = "Coca", Cantidad = 28m });
        ctx.Ventas.Add(venta);
        await ctx.SaveChangesAsync();

        var dto = new GenerarPedidoSugeridoDto
        {
            IdSucursal = 1,
            DiasAnalisisHistorial = 14,
            DiasCobertura = 7,
            SoloConSugerenciaPositiva = true
        };

        // Act
        var pedido = await servicio.GenerarPedidoSugeridoAsync(dto);

        // Assert: Debe tener 2 grupos de proveedor (Bimbo y Coca-Cola)
        Assert.NotNull(pedido.GruposPorProveedor);
        Assert.Equal(2, pedido.GruposPorProveedor.Count);

        var grupoBimbo = pedido.GruposPorProveedor.FirstOrDefault(g => g.IdProveedor == 1);
        Assert.NotNull(grupoBimbo);
        Assert.Equal("Distribuidora Bimbo del Centro", grupoBimbo.NombreProveedor);
        Assert.Single(grupoBimbo.Partidas);

        var grupoCoca = pedido.GruposPorProveedor.FirstOrDefault(g => g.IdProveedor == 2);
        Assert.NotNull(grupoCoca);
        Assert.Equal("Embotelladora Coca-Cola Femsa", grupoCoca.NombreProveedor);
        Assert.Single(grupoCoca.Partidas);
    }

    [Fact]
    public async Task ActualizarCantidadDetalle_AjustaCantidadYPromueveEstadoARevisado()
    {
        // Arrange
        var ctx = CrearContextoEnMemoria(nameof(ActualizarCantidadDetalle_AjustaCantidadYPromueveEstadoARevisado));
        var servicio = new ServicioPedidosSugeridos(ctx);

        var dtoGen = new GenerarPedidoSugeridoDto { IdSucursal = 1, SoloConSugerenciaPositiva = false };
        var pedido = await servicio.GenerarPedidoSugeridoAsync(dtoGen);
        var detalle = pedido.Detalles.First();

        Assert.Equal("GENERADO", pedido.Estado);

        // Act: El usuario Don Juan ajusta manualmente a 15 piezas
        var detalleActualizado = await servicio.ActualizarCantidadDetalleAsync(
            detalle.IdDetallePedidoSugerido,
            new ActualizarDetallePedidoSugeridoDto { CantidadAjustada = 15m });

        // Assert
        Assert.Equal(15m, detalleActualizado.CantidadAjustada);
        Assert.Equal(15m, detalleActualizado.CantidadEfectiva);

        // El pedido padre ahora debe estar en REVISADO
        var pedidoConsultado = await servicio.ObtenerPedidoPorIdAsync(pedido.IdPedidoSugerido);
        Assert.NotNull(pedidoConsultado);
        Assert.Equal("REVISADO", pedidoConsultado.Estado);
    }

    [Fact]
    public async Task ActualizarEstado_TransicionYValidacionDeEstados()
    {
        // Arrange
        var ctx = CrearContextoEnMemoria(nameof(ActualizarEstado_TransicionYValidacionDeEstados));
        var servicio = new ServicioPedidosSugeridos(ctx);

        var pedido = await servicio.GenerarPedidoSugeridoAsync(new GenerarPedidoSugeridoDto { IdSucursal = 1, SoloConSugerenciaPositiva = false });

        // Act: Pasar a PROCESADO
        var actualizado = await servicio.ActualizarEstadoAsync(
            pedido.IdPedidoSugerido,
            new ActualizarEstadoPedidoSugeridoDto { Estado = "PROCESADO", Observaciones = "Órdenes enviadas a proveedores por WhatsApp" });

        // Assert
        Assert.Equal("PROCESADO", actualizado.Estado);
        Assert.Equal("Órdenes enviadas a proveedores por WhatsApp", actualizado.Observaciones);

        // Act & Assert: Intentar estado inválido
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            servicio.ActualizarEstadoAsync(
                pedido.IdPedidoSugerido,
                new ActualizarEstadoPedidoSugeridoDto { Estado = "ESTADO_INEXISTENTE" }));
    }

    [Fact]
    public async Task EliminarPedido_NoPermiteEliminarSiEstaProcesado()
    {
        // Arrange
        var ctx = CrearContextoEnMemoria(nameof(EliminarPedido_NoPermiteEliminarSiEstaProcesado));
        var servicio = new ServicioPedidosSugeridos(ctx);

        var pedido = await servicio.GenerarPedidoSugeridoAsync(new GenerarPedidoSugeridoDto { IdSucursal = 1, SoloConSugerenciaPositiva = false });
        await servicio.ActualizarEstadoAsync(pedido.IdPedidoSugerido, new ActualizarEstadoPedidoSugeridoDto { Estado = "PROCESADO" });

        // Act & Assert: Debe rechazar eliminar pedido procesado
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            servicio.EliminarPedidoAsync(pedido.IdPedidoSugerido));
    }
}
