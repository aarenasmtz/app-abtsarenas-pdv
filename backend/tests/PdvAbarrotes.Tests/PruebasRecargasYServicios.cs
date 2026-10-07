using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using PdvAbarrotes.Aplicacion.DTOs.Servicios;
using PdvAbarrotes.Aplicacion.Interfaces;
using PdvAbarrotes.Dominio.Entidades;
using PdvAbarrotes.Infraestructura.Persistencia;
using PdvAbarrotes.Infraestructura.Servicios;
using Xunit;

namespace PdvAbarrotes.Tests;

/// <summary>
/// Pruebas unitarias e integración simulada para el módulo de Recargas Electrónicas y Pago de Servicios Públicos con RNP.
/// Valida contratos, persistencia de Folio_POS, ciclo de consulta cada 2s ante respuesta 24, catálogos, bitácora y logs de error.
/// </summary>
public class PruebasRecargasYServicios
{
    private ContextoPrincipal CrearContextoEnMemoria(string nombreBd)
    {
        var opciones = new DbContextOptionsBuilder<ContextoPrincipal>()
            .UseInMemoryDatabase(databaseName: nombreBd)
            .Options;

        return new ContextoPrincipal(opciones);
    }

    private ServicioRecargasYServicios CrearServicioConStubs(
        string nombreBd,
        IProveedorRecargas? provRecargas = null,
        IProveedorServicios? provServicios = null,
        IProveedorRnpSoapCliente? soapCliente = null,
        ConfiguracionRnpOptions? rnpOpciones = null)
    {
        var contexto = CrearContextoEnMemoria(nombreBd);
        var opciones = Options.Create(rnpOpciones ?? new ConfiguracionRnpOptions { Habilitado = false });
        var soap = soapCliente ?? new MockProveedorRnpSoapCliente();
        var recargas = provRecargas ?? new ProveedorRecargasPendiente();
        var servicios = provServicios ?? new ProveedorServiciosPendiente();

        return new ServicioRecargasYServicios(
            recargas,
            servicios,
            soap,
            contexto,
            opciones,
            NullLogger<ServicioRecargasYServicios>.Instance
        );
    }

    [Fact]
    public async Task ObtenerEstadoIntegracion_CuandoProveedorNoEstaConfigurado_RetornaEstadoEnEspera()
    {
        // Arrange
        var servicio = CrearServicioConStubs("Estado_NoConfigurado");

        // Act
        var estado = await servicio.ObtenerEstadoIntegracionAsync();

        // Assert
        Assert.NotNull(estado);
        Assert.False(estado.EstaConfigurado);
        Assert.Equal("Pendiente de Configuración", estado.NombreProveedor);
        Assert.Contains("Modo Preparado", estado.MensajeEstatus);
        Assert.Equal(0m, estado.SaldoBolsaDisponible);
    }

    [Fact]
    public async Task ObtenerCompaniasRecargas_RetornaOperadorasMexicanasConMontosAutorizados()
    {
        // Arrange
        var servicio = CrearServicioConStubs("Companias_Predefinidas");

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
        var servicio = CrearServicioConStubs("Catalogo_Predefinido");

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
        var servicio = CrearServicioConStubs("Telefono_Invalido");

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
        var servicio = CrearServicioConStubs("Discrepancia_Confirmacion");

        var solicitudDiscrepante = new SolicitudRecargaDto
        {
            CodigoCompania = "TELCEL",
            NumeroTelefono = "4771234567",
            ConfirmarNumeroTelefono = "4779876543",
            Monto = 100m
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ArgumentException>(() =>
            servicio.ProcesarRecargaAsync(solicitudDiscrepante));

        Assert.Contains("confirmación", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task ProcesarRecarga_ProveedorRnp_TransaccionDirectaExitosa_PersisteTransaccionYBitacora()
    {
        // Arrange
        var dbName = "Rnp_Directa_Exitosa";
        var contexto = CrearContextoEnMemoria(dbName);
        var mockSoap = new MockProveedorRnpSoapCliente();
        mockSoap.ConfigurarRespuestaTransaccion(new RnpTransactionResult
        {
            Confirmation = CodigosRespuestaRnp.Exito,
            Description = "TRANSACCIÓN EXITOSA",
            Folio = "FOL-9988",
            Folio_Carrier = "CARRIER-5544",
            Balance = "9500.50"
        });

        var rnpOpts = Options.Create(new ConfiguracionRnpOptions
        {
            Habilitado = true,
            Usuario = "6144135400",
            Password = "Prueba$$",
            PrefijoFolioPos = "10008"
        });

        var provRecargas = new ProveedorRecargasRnp(
            mockSoap,
            contexto,
            rnpOpts,
            NullLogger<ProveedorRecargasRnp>.Instance);

        var provServicios = new ProveedorServiciosPendiente();

        var servicio = new ServicioRecargasYServicios(
            provRecargas,
            provServicios,
            mockSoap,
            contexto,
            rnpOpts,
            NullLogger<ServicioRecargasYServicios>.Instance);

        // Act
        var resultado = await servicio.ProcesarRecargaAsync(new SolicitudRecargaDto
        {
            CodigoCompania = "TELCEL",
            NumeroTelefono = "5551234567",
            Monto = 100m
        });

        // Assert
        Assert.NotNull(resultado);
        Assert.True(resultado.Exito);
        Assert.Equal("FOL-9988", resultado.FolioProveedor);
        Assert.Equal("CARRIER-5544", resultado.CodigoAutorizacion);
        Assert.Equal(9500.50m, resultado.SaldoRestanteBolsa);

        // Verificar BD: TransaccionesServicios
        var transaccionDb = await contexto.TransaccionesServicios.FirstOrDefaultAsync();
        Assert.NotNull(transaccionDb);
        Assert.StartsWith("10008", transaccionDb.FolioPos);
        Assert.Equal("EXITOSA", transaccionDb.Estado);
        Assert.Equal(CodigosRespuestaRnp.Exito, transaccionDb.CodigoRespuesta);

        // Verificar BD: BitacoraServicios
        var bitacoras = await contexto.BitacoraServicios.ToListAsync();
        Assert.NotEmpty(bitacoras);
        Assert.Contains(bitacoras, b => b.Accion == "SOLICITUD_INICIADA");
        Assert.Contains(bitacoras, b => b.Accion == "ESTADO_EXITOSO");
    }

    [Fact]
    public async Task ProcesarRecarga_ProveedorRnp_Codigo24EnEspera_PollingResuelveExito()
    {
        // Arrange
        var dbName = "Rnp_Polling_24_Exito";
        var contexto = CrearContextoEnMemoria(dbName);
        var mockSoap = new MockProveedorRnpSoapCliente();

        // 1ra respuesta: 24 (RECARGA EN ESPERA)
        mockSoap.ConfigurarRespuestaTransaccion(new RnpTransactionResult
        {
            Confirmation = CodigosRespuestaRnp.RecargaEnEspera,
            Description = "RECARGA EN ESPERA"
        });

        // Consulta de estado: Transiciona a 00
        mockSoap.ConfigurarRespuestaCheckTransaction(new RnpTransactionResult
        {
            Confirmation = CodigosRespuestaRnp.Exito,
            Description = "TRANSACCIÓN EXITOSA",
            Folio = "FOL-POLLED-1",
            Folio_Carrier = "CAR-POLLED-1",
            Balance = "9400.00"
        });

        var rnpOpts = Options.Create(new ConfiguracionRnpOptions
        {
            Habilitado = true,
            Usuario = "6144135400",
            Password = "Prueba$$",
            PrefijoFolioPos = "10008",
            IntervaloConsultaSegundos = 0, // Inmediato para prueba unitaria
            MaxSegundosConsultaEstado = 5
        });

        var provRecargas = new ProveedorRecargasRnp(
            mockSoap,
            contexto,
            rnpOpts,
            NullLogger<ProveedorRecargasRnp>.Instance);

        // Act
        var resultado = await provRecargas.EjecutarRecargaAsync(new SolicitudRecargaDto
        {
            CodigoCompania = "01",
            NumeroTelefono = "5559999999",
            Monto = 50m
        });

        // Assert
        Assert.True(resultado.Exito);
        Assert.Equal("FOL-POLLED-1", resultado.FolioProveedor);

        var tx = await contexto.TransaccionesServicios.FirstOrDefaultAsync();
        Assert.NotNull(tx);
        Assert.Equal("EXITOSA", tx.Estado);
        Assert.True(tx.ReintentosConsulta >= 1);
    }

    [Fact]
    public async Task ProcesarPagoServicio_ProveedorRnp_RechazoOperadora_RegistraLogError()
    {
        // Arrange
        var dbName = "Rnp_Rechazo_Log";
        var contexto = CrearContextoEnMemoria(dbName);
        var mockSoap = new MockProveedorRnpSoapCliente();
        mockSoap.ConfigurarRespuestaTransaccion(new RnpTransactionResult
        {
            Confirmation = CodigosRespuestaRnp.ReferenciaNoValida,
            Description = "REFERENCIA NO VÁLIDA / REVISAR OPERADOR"
        });

        var rnpOpts = Options.Create(new ConfiguracionRnpOptions
        {
            Habilitado = true,
            Usuario = "6144135400",
            Password = "Prueba$$",
            PrefijoFolioPos = "10008"
        });

        var provServicios = new ProveedorServiciosRnp(
            mockSoap,
            contexto,
            rnpOpts,
            NullLogger<ProveedorServiciosRnp>.Instance);

        // Act
        var resultado = await provServicios.EjecutarPagoServicioAsync(new SolicitudPagoServicioDto
        {
            CodigoServicio = "CFE",
            ReferenciaRecibo = "999999999999",
            MontoRecibo = 250m,
            Comision = 12m
        });

        // Assert
        Assert.False(resultado.Exito);
        Assert.Contains("REFERENCIA NO VÁLIDA", resultado.Mensaje);

        // Verificar registro de error
        var errores = await contexto.LogErroresServicios.ToListAsync();
        Assert.NotEmpty(errores);
        Assert.Contains(errores, e => e.CodigoError == CodigosRespuestaRnp.ReferenciaNoValida);
    }

    [Fact]
    public async Task ConsultarAdeudoServicio_ServicioValido_RetornaMontoYPermiteEdicion()
    {
        // Arrange
        var dbName = "Rnp_ConsultarAdeudo";
        var contexto = CrearContextoEnMemoria(dbName);
        var mockSoap = new MockProveedorRnpSoapCliente();
        mockSoap.ConfigurarRespuestaPendingAmount(new RnpPendingAmountResult
        {
            Response = "1",
            Editable = "True",
            Rcode = "0",
            Amount = "389.50",
            Message = "Consulta exitosa de saldo"
        });

        var rnpOpts = Options.Create(new ConfiguracionRnpOptions
        {
            Habilitado = true,
            Usuario = "6144135400",
            Password = "Prueba$$"
        });

        var provServicios = new ProveedorServiciosRnp(
            mockSoap,
            contexto,
            rnpOpts,
            NullLogger<ProveedorServiciosRnp>.Instance);

        // Act
        var res = await provServicios.ConsultarAdeudoServicioAsync(new SolicitudConsultaAdeudoDto
        {
            CodigoServicio = "SKY",
            Referencia = "501205133215"
        });

        // Assert
        Assert.True(res.Exito);
        Assert.Equal(389.50m, res.MontoAdeudo);
        Assert.True(res.EsMontoEditable);
    }

    [Fact]
    public async Task SincronizarCatalogoRnp_PersisteProductosEnBaseDeDatosYRegistraBitacora()
    {
        // Arrange
        var dbName = "Rnp_SincronizarCatalogo";
        var contexto = CrearContextoEnMemoria(dbName);
        var mockSoap = new MockProveedorRnpSoapCliente();
        mockSoap.ConfigurarCatalogo(new RnpPosPricesResult
        {
            Response = "1",
            PosPricesProducts = new List<RnpProductItem>
            {
                new() { Carrier_ID = "01", Description = "TELCEL", Group = "TAE", Monto = "50", CheckAmount = "false" },
                new() { Carrier_ID = "01", Description = "TELCEL", Group = "TAE", Monto = "100", CheckAmount = "false" },
                new() { Carrier_ID = "17", Description = "SKY", Group = "SERVICIO", Monto = "0", CheckAmount = "true" }
            }
        });

        var rnpOpts = Options.Create(new ConfiguracionRnpOptions { Habilitado = true });
        var servicio = new ServicioRecargasYServicios(
            new ProveedorRecargasPendiente(),
            new ProveedorServiciosPendiente(),
            mockSoap,
            contexto,
            rnpOpts,
            NullLogger<ServicioRecargasYServicios>.Instance);

        // Act
        int total = await servicio.SincronizarCatalogoRnpAsync();

        // Assert
        Assert.Equal(3, total);
        var guardados = await contexto.CatalogoProductosServicios.ToListAsync();
        Assert.Equal(3, guardados.Count);

        var bitacora = await contexto.BitacoraServicios.FirstOrDefaultAsync(b => b.Accion == "CATALOGO_ACTUALIZADO");
        Assert.NotNull(bitacora);
    }
}

/// <summary>
/// Mock de pruebas para aislar la comunicación SOAP de RNP en tests unitarios.
/// </summary>
public class MockProveedorRnpSoapCliente : IProveedorRnpSoapCliente
{
    private RnpTransactionResult _respuestaTransaccion = new() { Confirmation = "00", Description = "TRANSACCIÓN EXITOSA" };
    private RnpTransactionResult _respuestaCheck = new() { Confirmation = "00", Description = "TRANSACCIÓN EXITOSA" };
    private RnpPendingAmountResult _respuestaPending = new() { Response = "1", Amount = "0", Editable = "True" };
    private RnpPosPricesResult _catalogo = new() { Response = "1", PosPricesProducts = new() };
    private RnpBalanceResult _balance = new() { Confirmation = "00", Balance = "10000.00" };

    public void ConfigurarRespuestaTransaccion(RnpTransactionResult respuesta) => _respuestaTransaccion = respuesta;
    public void ConfigurarRespuestaCheckTransaction(RnpTransactionResult respuesta) => _respuestaCheck = respuesta;
    public void ConfigurarRespuestaPendingAmount(RnpPendingAmountResult respuesta) => _respuestaPending = respuesta;
    public void ConfigurarCatalogo(RnpPosPricesResult catalogo) => _catalogo = catalogo;

    public Task<RnpTransactionResult> SolicitarTransaccionAsync(RnpRequestTransactionPayload peticion, CancellationToken ct = default)
        => Task.FromResult(_respuestaTransaccion);

    public Task<RnpTransactionResult> ConsultarEstadoTransaccionAsync(string folioPos, CancellationToken ct = default)
        => Task.FromResult(_respuestaCheck);

    public Task<RnpBalanceResult> ConsultarSaldoAsync(CancellationToken ct = default)
        => Task.FromResult(_balance);

    public Task<RnpPosPricesResult> ConsultarCatalogoProductosAsync(CancellationToken ct = default)
        => Task.FromResult(_catalogo);

    public Task<RnpPendingAmountResult> ConsultarAdeudoServicioAsync(string idOperadora, string referencia, CancellationToken ct = default)
        => Task.FromResult(_respuestaPending);
}
