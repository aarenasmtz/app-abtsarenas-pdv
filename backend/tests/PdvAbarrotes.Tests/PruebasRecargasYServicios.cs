using PdvAbarrotes.Aplicacion.DTOs.Servicios;
using PdvAbarrotes.Aplicacion.Interfaces;
using PdvAbarrotes.Infraestructura.Servicios;
using Xunit;

namespace PdvAbarrotes.Tests;

/// <summary>
/// Pruebas unitarias para el módulo de Recargas Electrónicas y Pago de Servicios Públicos (Fase 14).
/// Valida contratos, validaciones de seguridad de números telefónicos, referencias de recibos y estado de integración desacoplado.
/// </summary>
public class PruebasRecargasYServicios
{
    [Fact]
    public async Task ObtenerEstadoIntegracion_CuandoProveedorNoEstaConfigurado_RetornaEstadoEnEspera()
    {
        // Arrange
        IProveedorRecargas provRecargas = new ProveedorRecargasPendiente();
        IProveedorServicios provServicios = new ProveedorServiciosPendiente();
        var servicio = new ServicioRecargasYServicios(provRecargas, provServicios);

        // Act
        var estado = await servicio.ObtenerEstadoIntegracionAsync();

        // Assert
        Assert.NotNull(estado);
        Assert.False(estado.EstaConfigurado);
        Assert.Equal("Pendiente de Contratación Comercial", estado.NombreProveedor);
        Assert.Contains("Modo Preparado", estado.MensajeEstatus);
        Assert.Equal(0m, estado.SaldoBolsaDisponible);
    }

    [Fact]
    public async Task ObtenerCompaniasRecargas_RetornaOperadorasMexicanasConMontosAutorizados()
    {
        // Arrange
        var servicio = new ServicioRecargasYServicios(new ProveedorRecargasPendiente(), new ProveedorServiciosPendiente());

        // Act
        var companias = await servicio.ObtenerCompaniasRecargasAsync();

        // Assert
        Assert.NotNull(companias);
        Assert.NotEmpty(companias);
        Assert.Contains(companias, c => c.Codigo == "TELCEL");
        Assert.Contains(companias, c => c.Codigo == "MOVISTAR");
        Assert.Contains(companias, c => c.Codigo == "ATT");
        Assert.Contains(companias, c => c.Codigo == "BAIT");

        var telcel = companias.First(c => c.Codigo == "TELCEL");
        Assert.Contains(50m, telcel.MontosDisponibles);
        Assert.Contains(100m, telcel.MontosDisponibles);
    }

    [Fact]
    public async Task ObtenerCatalogoServicios_RetornaServiciosPublicosEstandar()
    {
        // Arrange
        var servicio = new ServicioRecargasYServicios(new ProveedorRecargasPendiente(), new ProveedorServiciosPendiente());

        // Act
        var servicios = await servicio.ObtenerCatalogoServiciosAsync();

        // Assert
        Assert.NotNull(servicios);
        Assert.NotEmpty(servicios);
        Assert.Contains(servicios, s => s.Codigo == "CFE");
        Assert.Contains(servicios, s => s.Codigo == "TELMEX");
        Assert.Contains(servicios, s => s.Codigo == "AGUA_MUNICIPAL");

        var cfe = servicios.First(s => s.Codigo == "CFE");
        Assert.Equal("Electricidad", cfe.Categoria);
        Assert.Equal(12.00m, cfe.ComisionRecomendada);
    }

    [Fact]
    public async Task ProcesarRecarga_ConTelefonoInvalido_LanzaExcepcion()
    {
        // Arrange
        var servicio = new ServicioRecargasYServicios(new ProveedorRecargasPendiente(), new ProveedorServiciosPendiente());

        var solicitudCorta = new SolicitudRecargaDto
        {
            CodigoCompania = "TELCEL",
            NumeroTelefono = "477123", // Menor a 10 dígitos
            Monto = 50m
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ArgumentException>(() =>
            servicio.ProcesarRecargaAsync(solicitudCorta));

        Assert.Contains("10 dígitos", ex.Message);
    }

    [Fact]
    public async Task ProcesarRecarga_ConDiscrepanciaDeConfirmacion_LanzaExcepcion()
    {
        // Arrange
        var servicio = new ServicioRecargasYServicios(new ProveedorRecargasPendiente(), new ProveedorServiciosPendiente());

        var solicitudDiscrepante = new SolicitudRecargaDto
        {
            CodigoCompania = "TELCEL",
            NumeroTelefono = "4771234567",
            ConfirmarNumeroTelefono = "4779876543", // Discrepante
            Monto = 100m
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ArgumentException>(() =>
            servicio.ProcesarRecargaAsync(solicitudDiscrepante));

        Assert.Contains("confirmación", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task ProcesarRecarga_CuandoProveedorEstaPendiente_RetornaExitoFalsoConMensajeClaro()
    {
        // Arrange
        var servicio = new ServicioRecargasYServicios(new ProveedorRecargasPendiente(), new ProveedorServiciosPendiente());

        var solicitudValida = new SolicitudRecargaDto
        {
            CodigoCompania = "TELCEL",
            NumeroTelefono = "4771234567",
            ConfirmarNumeroTelefono = "4771234567",
            Monto = 50m
        };

        // Act
        var resultado = await servicio.ProcesarRecargaAsync(solicitudValida);

        // Assert
        Assert.NotNull(resultado);
        Assert.False(resultado.Exito);
        Assert.Contains("proveedor externo de recargas", resultado.Mensaje, StringComparison.OrdinalIgnoreCase);
        Assert.Equal(50m, resultado.Monto);
        Assert.Equal("4771234567", resultado.NumeroTelefono);
    }

    [Fact]
    public async Task ProcesarPagoServicio_ConMontoInvalido_LanzaExcepcion()
    {
        // Arrange
        var servicio = new ServicioRecargasYServicios(new ProveedorRecargasPendiente(), new ProveedorServiciosPendiente());

        var solicitudMontoCero = new SolicitudPagoServicioDto
        {
            CodigoServicio = "CFE",
            ReferenciaRecibo = "01234567890123456789",
            MontoRecibo = 0m // Inválido
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ArgumentException>(() =>
            servicio.ProcesarPagoServicioAsync(solicitudMontoCero));

        Assert.Contains("mayor a $0.00", ex.Message);
    }

    [Fact]
    public async Task ProcesarPagoServicio_CuandoProveedorEstaPendiente_RetornaExitoFalsoConMensajeClaro()
    {
        // Arrange
        var servicio = new ServicioRecargasYServicios(new ProveedorRecargasPendiente(), new ProveedorServiciosPendiente());

        var solicitudValida = new SolicitudPagoServicioDto
        {
            CodigoServicio = "CFE",
            ReferenciaRecibo = "01234567890123456789",
            MontoRecibo = 450.50m,
            Comision = 12.00m
        };

        // Act
        var resultado = await servicio.ProcesarPagoServicioAsync(solicitudValida);

        // Assert
        Assert.NotNull(resultado);
        Assert.False(resultado.Exito);
        Assert.Contains("proveedor externo de pago de servicios", resultado.Mensaje, StringComparison.OrdinalIgnoreCase);
        Assert.Equal(450.50m, resultado.MontoPagado);
        Assert.Equal(12.00m, resultado.ComisionCobrada);
        Assert.Equal(462.50m, resultado.TotalCobrado);
    }
}
