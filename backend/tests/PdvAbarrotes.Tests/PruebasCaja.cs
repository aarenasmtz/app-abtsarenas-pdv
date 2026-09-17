using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using PdvAbarrotes.Aplicacion.DTOs.Caja;
using PdvAbarrotes.Dominio.Entidades;
using PdvAbarrotes.Infraestructura.Persistencia;
using PdvAbarrotes.Infraestructura.Servicios;
using Xunit;

namespace PdvAbarrotes.Tests;

/// <summary>
/// Pruebas unitarias para el control de caja, turnos, movimientos de efectivo y cortes contables X/Z.
/// </summary>
public class PruebasCaja
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

        if (!contexto.Cajas.Any())
        {
            contexto.Cajas.AddRange(
                new Caja { IdCaja = 1, IdSucursal = 1, Nombre = "Caja Principal", EsPrincipal = true, Activo = true },
                new Caja { IdCaja = 2, IdSucursal = 1, Nombre = "Caja Secundaria", EsPrincipal = false, Activo = true }
            );
        }

        contexto.SaveChanges();
        return contexto;
    }

    [Fact]
    public async Task AbrirTurno_ConDatosValidos_AbreTurnoYRegistraFondoInicial()
    {
        // Organizar
        using var contexto = CrearContextoEnMemoria("Bd_AbrirTurno_Valido");
        var servicio = new ServicioCaja(
            contexto,
            new ServicioAuditoriaSimulado(),
            NullLogger<ServicioCaja>.Instance
        );

        var dto = new AbrirTurnoDto
        {
            IdCaja = 1,
            MontoInicial = 500m
        };

        // Actuar
        var resultado = await servicio.AbrirTurnoAsync(dto, idUsuario: 1);

        // Afirmar
        Assert.NotNull(resultado);
        Assert.Equal(1, resultado.IdCaja);
        Assert.Equal("ABIERTO", resultado.Estatus);
        Assert.Equal(500m, resultado.MontoInicial);

        var turnoEnBd = await contexto.TurnosCaja.FirstOrDefaultAsync(t => t.IdTurnoCaja == resultado.IdTurnoCaja);
        Assert.NotNull(turnoEnBd);
        Assert.Equal("ABIERTO", turnoEnBd.Estatus);

        var movimientoFondo = await contexto.MovimientosCaja.FirstOrDefaultAsync(m => m.IdTurnoCaja == resultado.IdTurnoCaja);
        Assert.NotNull(movimientoFondo);
        Assert.Equal("ENTRADA", movimientoFondo.TipoMovimiento);
        Assert.Equal(500m, movimientoFondo.Monto);
    }

    [Fact]
    public async Task AbrirTurno_CajaYaAbierta_LanzaExcepcion()
    {
        // Organizar
        using var contexto = CrearContextoEnMemoria("Bd_AbrirTurno_Duplicado");
        var servicio = new ServicioCaja(
            contexto,
            new ServicioAuditoriaSimulado(),
            NullLogger<ServicioCaja>.Instance
        );

        await servicio.AbrirTurnoAsync(new AbrirTurnoDto { IdCaja = 1, MontoInicial = 300m }, idUsuario: 1);

        // Actuar & Afirmar
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            servicio.AbrirTurnoAsync(new AbrirTurnoDto { IdCaja = 1, MontoInicial = 200m }, idUsuario: 2)
        );
    }

    [Fact]
    public async Task RegistrarMovimiento_EntradaValida_RegistraMovimiento()
    {
        // Organizar
        using var contexto = CrearContextoEnMemoria("Bd_Movimiento_Entrada");
        var servicio = new ServicioCaja(
            contexto,
            new ServicioAuditoriaSimulado(),
            NullLogger<ServicioCaja>.Instance
        );

        var turno = await servicio.AbrirTurnoAsync(new AbrirTurnoDto { IdCaja = 1, MontoInicial = 200m }, idUsuario: 1);

        var peticion = new RegistrarMovimientoCajaDto
        {
            IdTurnoCaja = turno.IdTurnoCaja,
            TipoMovimiento = "ENTRADA",
            Monto = 150m,
            Descripcion = "Cambio de morralla aportado por administrador"
        };

        // Actuar
        var movimiento = await servicio.RegistrarMovimientoAsync(peticion, idUsuario: 1);

        // Afirmar
        Assert.NotNull(movimiento);
        Assert.Equal("ENTRADA", movimiento.TipoMovimiento);
        Assert.Equal(150m, movimiento.Monto);

        var lista = await servicio.ObtenerMovimientosTurnoAsync(turno.IdTurnoCaja);
        Assert.Equal(2, lista.Count); // Fondo inicial + entrada
    }

    [Fact]
    public async Task RegistrarMovimiento_SalidaSuperaEfectivoDisponible_LanzaExcepcion()
    {
        // Organizar
        using var contexto = CrearContextoEnMemoria("Bd_Movimiento_SalidaExcesiva");
        var servicio = new ServicioCaja(
            contexto,
            new ServicioAuditoriaSimulado(),
            NullLogger<ServicioCaja>.Instance
        );

        var turno = await servicio.AbrirTurnoAsync(new AbrirTurnoDto { IdCaja = 1, MontoInicial = 200m }, idUsuario: 1);

        var peticion = new RegistrarMovimientoCajaDto
        {
            IdTurnoCaja = turno.IdTurnoCaja,
            TipoMovimiento = "SALIDA",
            Monto = 300m, // Hay solo 200m en caja
            Descripcion = "Pago a proveedor de botanas"
        };

        // Actuar & Afirmar
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            servicio.RegistrarMovimientoAsync(peticion, idUsuario: 1)
        );
    }

    [Fact]
    public async Task CalcularCorteX_TurnoConVentasYMovimientos_TotalizaCorrectamente()
    {
        // Organizar
        using var contexto = CrearContextoEnMemoria("Bd_CorteX_Calculo");
        var servicio = new ServicioCaja(
            contexto,
            new ServicioAuditoriaSimulado(),
            NullLogger<ServicioCaja>.Instance
        );

        var turno = await servicio.AbrirTurnoAsync(new AbrirTurnoDto { IdCaja = 1, MontoInicial = 500m }, idUsuario: 1);

        // Agregar venta en efectivo de $250
        var venta1 = new Venta
        {
            IdVenta = 1,
            FolioVenta = "V-001",
            IdCaja = 1,
            IdTurnoCaja = turno.IdTurnoCaja,
            IdUsuario = 1,
            IdCliente = 1,
            FechaVenta = DateTime.Now,
            Total = 250m,
            EsCancelada = false
        };
        venta1.Pagos.Add(new VentaPago { IdVenta = 1, IdMetodoPago = 1, Importe = 250m }); // Efectivo
        contexto.Ventas.Add(venta1);

        // Agregar venta con tarjeta de $400
        var venta2 = new Venta
        {
            IdVenta = 2,
            FolioVenta = "V-002",
            IdCaja = 1,
            IdTurnoCaja = turno.IdTurnoCaja,
            IdUsuario = 1,
            IdCliente = 1,
            FechaVenta = DateTime.Now,
            Total = 400m,
            EsCancelada = false
        };
        venta2.Pagos.Add(new VentaPago { IdVenta = 2, IdMetodoPago = 2, Importe = 400m }); // Tarjeta
        contexto.Ventas.Add(venta2);

        await contexto.SaveChangesAsync();

        // Movimiento de salida de $100
        await servicio.RegistrarMovimientoAsync(new RegistrarMovimientoCajaDto
        {
            IdTurnoCaja = turno.IdTurnoCaja,
            TipoMovimiento = "SALIDA",
            Monto = 100m,
            Descripcion = "Pago de garrafones de agua"
        }, idUsuario: 1);

        // Actuar: Corte X
        var corteX = await servicio.CalcularCorteXAsync(turno.IdTurnoCaja);

        // Afirmar
        // Esperado en efectivo: Fondo(500) + VentaEfectivo(250) + Entradas(0) - Salidas(100) = 650
        Assert.Equal("X", corteX.TipoCorte);
        Assert.Equal(500m, corteX.MontoInicial);
        Assert.Equal(250m, corteX.VentasEfectivo);
        Assert.Equal(400m, corteX.VentasTarjeta);
        Assert.Equal(650m, corteX.TotalVentas);
        Assert.Equal(100m, corteX.SalidasEfectivo);
        Assert.Equal(650m, corteX.TotalEsperadoEnCaja);
    }

    [Fact]
    public async Task CerrarTurnoCorteZ_ConArqueoCiego_CierraTurnoYCalculaDiferencia()
    {
        // Organizar
        using var contexto = CrearContextoEnMemoria("Bd_CorteZ_Cierre");
        var servicio = new ServicioCaja(
            contexto,
            new ServicioAuditoriaSimulado(),
            NullLogger<ServicioCaja>.Instance
        );

        var turno = await servicio.AbrirTurnoAsync(new AbrirTurnoDto { IdCaja = 1, MontoInicial = 400m }, idUsuario: 1);

        // Venta en efectivo $600
        var venta = new Venta
        {
            IdVenta = 10,
            FolioVenta = "V-010",
            IdCaja = 1,
            IdTurnoCaja = turno.IdTurnoCaja,
            IdUsuario = 1,
            IdCliente = 1,
            FechaVenta = DateTime.Now,
            Total = 600m,
            EsCancelada = false
        };
        venta.Pagos.Add(new VentaPago { IdVenta = 10, IdMetodoPago = 1, Importe = 600m });
        contexto.Ventas.Add(venta);
        await contexto.SaveChangesAsync();

        // Total esperado en caja: 400 (fondo) + 600 (venta efectivo) = 1000.
        // Cajero cuenta físicamente $980 (faltante de $20)
        var dtoCierre = new CerrarTurnoDto
        {
            IdTurnoCaja = turno.IdTurnoCaja,
            TotalContado = 980m,
            Observaciones = "Faltante de 20 pesos por error de cambio"
        };

        // Actuar
        var corteZ = await servicio.CerrarTurnoCorteZAsync(dtoCierre, idUsuario: 1);

        // Afirmar
        Assert.Equal("Z", corteZ.TipoCorte);
        Assert.Equal("CERRADO", corteZ.EstatusTurno);
        Assert.Equal(1000m, corteZ.TotalEsperadoEnCaja);
        Assert.Equal(980m, corteZ.TotalContado);
        Assert.Equal(-20m, corteZ.Diferencia); // Faltante

        var turnoEnBd = await contexto.TurnosCaja.FindAsync(turno.IdTurnoCaja);
        Assert.NotNull(turnoEnBd);
        Assert.Equal("CERRADO", turnoEnBd.Estatus);
        Assert.NotNull(turnoEnBd.FechaCierre);

        var corteEnBd = await contexto.CortesCaja.FirstOrDefaultAsync(c => c.IdTurnoCaja == turno.IdTurnoCaja);
        Assert.NotNull(corteEnBd);
        Assert.Equal("Z", corteEnBd.TipoCorte);
        Assert.Equal(980m, corteEnBd.TotalContado);
        Assert.Equal(-20m, corteEnBd.Diferencia);
    }
}
