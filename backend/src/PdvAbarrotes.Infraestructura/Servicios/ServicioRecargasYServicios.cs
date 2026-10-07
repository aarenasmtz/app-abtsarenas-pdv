using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using PdvAbarrotes.Aplicacion.DTOs.Servicios;
using PdvAbarrotes.Aplicacion.Interfaces;
using PdvAbarrotes.Dominio.Entidades;

namespace PdvAbarrotes.Infraestructura.Servicios;

/// <summary>
/// Orquestador central para la gestión de recargas electrónicas de tiempo aire y pago de servicios públicos.
/// Conecta la lógica de negocio con Red Nacional de Pagos (RNP), gestionando auditoría, bitácora y sincronización.
/// </summary>
public class ServicioRecargasYServicios : IServicioRecargasYServicios
{
    private readonly IProveedorRecargas _proveedorRecargas;
    private readonly IProveedorServicios _proveedorServicios;
    private readonly IProveedorRnpSoapCliente _clienteSoap;
    private readonly IContextoPrincipal _contexto;
    private readonly ConfiguracionRnpOptions _opciones;
    private readonly ILogger<ServicioRecargasYServicios> _logger;

    private static readonly List<CompaniaTelefonicaDto> CompaniasPredefinidas = new()
    {
        new CompaniaTelefonicaDto
        {
            Codigo = "TELCEL",
            Nombre = "Telcel (Amigo de Telcel)",
            LogotipoUrl = "/iconos/companias/telcel.png",
            MontosDisponibles = new List<decimal> { 10, 20, 30, 50, 80, 100, 150, 200, 300, 500 }
        },
        new CompaniaTelefonicaDto
        {
            Codigo = "MOVISTAR",
            Nombre = "Movistar México",
            LogotipoUrl = "/iconos/companias/movistar.png",
            MontosDisponibles = new List<decimal> { 10, 20, 30, 50, 60, 100, 120, 150, 200, 300 }
        },
        new CompaniaTelefonicaDto
        {
            Codigo = "ATT",
            Nombre = "AT&T México",
            LogotipoUrl = "/iconos/companias/att.png",
            MontosDisponibles = new List<decimal> { 30, 50, 100, 150, 200, 300, 500 }
        },
        new CompaniaTelefonicaDto
        {
            Codigo = "BAIT",
            Nombre = "Bait (Bodega Aurrera / Walmart)",
            LogotipoUrl = "/iconos/companias/bait.png",
            MontosDisponibles = new List<decimal> { 20, 50, 100, 125, 200, 300 }
        },
        new CompaniaTelefonicaDto
        {
            Codigo = "UNEFON",
            Nombre = "Unefon Prepago",
            LogotipoUrl = "/iconos/companias/unefon.png",
            MontosDisponibles = new List<decimal> { 20, 30, 50, 70, 100, 150, 200, 300 }
        },
        new CompaniaTelefonicaDto
        {
            Codigo = "VIRGIN",
            Nombre = "Virgin Mobile",
            LogotipoUrl = "/iconos/companias/virgin.png",
            MontosDisponibles = new List<decimal> { 20, 30, 50, 100, 150, 200, 300 }
        }
    };

    private static readonly List<CatalogoServicioDto> ServiciosPredefinidos = new()
    {
        new CatalogoServicioDto
        {
            Codigo = "CFE",
            Nombre = "CFE - Suministrador de Servicios Básicos",
            Categoria = "Electricidad",
            ComisionRecomendada = 12.00m,
            PermiteVencidos = false,
            FormatoReferencia = "Código de barras o 30 dígitos de recibo"
        },
        new CatalogoServicioDto
        {
            Codigo = "TELMEX",
            Nombre = "Telmex (Telefonía e Internet Infinitum)",
            Categoria = "Telecomunicaciones",
            ComisionRecomendada = 12.00m,
            PermiteVencidos = true,
            FormatoReferencia = "Número de teléfono a 10 dígitos o código de barras"
        },
        new CatalogoServicioDto
        {
            Codigo = "SKY",
            Nombre = "Sky México / VeTV",
            Categoria = "Televisión Satelital",
            ComisionRecomendada = 12.00m,
            PermiteVencidos = true,
            FormatoReferencia = "Número de cuenta de 12 dígitos"
        },
        new CatalogoServicioDto
        {
            Codigo = "IZZI",
            Nombre = "Izzi Telecom (Televisión / Internet)",
            Categoria = "Televisión e Internet",
            ComisionRecomendada = 12.00m,
            PermiteVencidos = true,
            FormatoReferencia = "Referencia de suscriptor"
        },
        new CatalogoServicioDto
        {
            Codigo = "TOTALPLAY",
            Nombre = "Totalplay Telecomunicaciones",
            Categoria = "Televisión e Internet",
            ComisionRecomendada = 12.00m,
            PermiteVencidos = false,
            FormatoReferencia = "Número de cuenta de 10 dígitos"
        },
        new CatalogoServicioDto
        {
            Codigo = "MEGACABLE",
            Nombre = "Megacable Comunicaciones",
            Categoria = "Televisión e Internet",
            ComisionRecomendada = 12.00m,
            PermiteVencidos = true,
            FormatoReferencia = "Número de suscriptor de 10 dígitos"
        },
        new CatalogoServicioDto
        {
            Codigo = "AGUA_MUNICIPAL",
            Nombre = "JMAS / Agua Potable Municipal",
            Categoria = "Agua Potable",
            ComisionRecomendada = 12.00m,
            PermiteVencidos = true,
            FormatoReferencia = "Número de cuenta de contrato"
        }
    };

    public ServicioRecargasYServicios(
        IProveedorRecargas proveedorRecargas,
        IProveedorServicios proveedorServicios,
        IProveedorRnpSoapCliente clienteSoap,
        IContextoPrincipal contexto,
        IOptions<ConfiguracionRnpOptions> opciones,
        ILogger<ServicioRecargasYServicios> logger)
    {
        _proveedorRecargas = proveedorRecargas;
        _proveedorServicios = proveedorServicios;
        _clienteSoap = clienteSoap;
        _contexto = contexto;
        _opciones = opciones.Value;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<EstadoIntegracionServiciosDto> ObtenerEstadoIntegracionAsync(CancellationToken ct = default)
    {
        bool recargasConfigurado = await _proveedorRecargas.ProveedorEstaConfiguradoAsync();
        bool serviciosConfigurado = await _proveedorServicios.ProveedorEstaConfiguradoAsync();
        bool generalConfigurado = recargasConfigurado && serviciosConfigurado;

        decimal saldoBolsa = 0m;
        string mensaje;

        if (generalConfigurado)
        {
            try
            {
                var saldoDto = await _clienteSoap.ConsultarSaldoAsync(ct);
                if (decimal.TryParse(saldoDto.Balance, out var balance))
                {
                    saldoBolsa = balance;
                }
                mensaje = $"Conectado exitosamente con Red Nacional de Pagos (RNP). Saldo disponible: ${saldoBolsa:N2} MXN.";
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error al consultar saldo en vivo para estado de integración.");
                mensaje = "Proveedor RNP configurado pero con aviso de conectividad: " + ex.Message;
            }
        }
        else
        {
            mensaje = "Módulo en Modo Preparado: Credenciales de integración RNP pendientes de configurar en appsettings.json.";
        }

        return new EstadoIntegracionServiciosDto
        {
            EstaConfigurado = generalConfigurado,
            NombreProveedor = generalConfigurado ? "Red Nacional de Pagos (RNP / VentaMovil)" : "Pendiente de Configuración",
            MensajeEstatus = mensaje,
            SaldoBolsaDisponible = saldoBolsa,
            UltimaVerificacion = DateTime.Now
        };
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<CompaniaTelefonicaDto>> ObtenerCompaniasRecargasAsync(CancellationToken ct = default)
    {
        // Si hay productos sincronizados en la base de datos para TAE, usarlos dinámicamente
        var productosDb = await _contexto.CatalogoProductosServicios
            .Where(p => p.Activo && p.Grupo == "TAE")
            .ToListAsync(ct);

        if (productosDb.Count == 0)
        {
            return CompaniasPredefinidas.AsReadOnly();
        }

        var agrupados = productosDb
            .GroupBy(p => p.Descripcion.Trim())
            .Select(g => new CompaniaTelefonicaDto
            {
                Codigo = g.First().CarrierId,
                Nombre = g.Key,
                LogotipoUrl = $"/iconos/companias/{g.Key.ToLowerInvariant().Replace(" ", "_")}.png",
                MontosDisponibles = g.Where(p => p.Monto > 0).Select(p => p.Monto).Distinct().OrderBy(m => m).ToList()
            })
            .ToList();

        return agrupados.Count > 0 ? agrupados.AsReadOnly() : CompaniasPredefinidas.AsReadOnly();
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<CatalogoServicioDto>> ObtenerCatalogoServiciosAsync(CancellationToken ct = default)
    {
        var productosDb = await _contexto.CatalogoProductosServicios
            .Where(p => p.Activo && p.Grupo == "SERVICIO")
            .ToListAsync(ct);

        if (productosDb.Count == 0)
        {
            return ServiciosPredefinidos.AsReadOnly();
        }

        var servicios = productosDb.Select(p => new CatalogoServicioDto
        {
            Codigo = p.CarrierId,
            Nombre = p.Descripcion.Trim(),
            Categoria = "Servicios Públicos",
            ComisionRecomendada = _opciones.ComisionDefaultServicio,
            PermiteVencidos = true,
            FormatoReferencia = p.Observacion ?? "Número de recibo o cuenta"
        }).ToList();

        return servicios.AsReadOnly();
    }

    /// <inheritdoc />
    public async Task<ResultadoRecargaDto> ProcesarRecargaAsync(SolicitudRecargaDto solicitud, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(solicitud.NumeroTelefono))
        {
            throw new ArgumentException("El número telefónico es obligatorio.");
        }

        var telefonoLimpio = Regex.Replace(solicitud.NumeroTelefono, @"\D", "");
        if (telefonoLimpio.Length != 10)
        {
            throw new ArgumentException($"El número telefónico debe constar de 10 dígitos exactamente (se recibieron {telefonoLimpio.Length}).");
        }

        if (!string.IsNullOrWhiteSpace(solicitud.ConfirmarNumeroTelefono))
        {
            var confirmacionLimpia = Regex.Replace(solicitud.ConfirmarNumeroTelefono, @"\D", "");
            if (telefonoLimpio != confirmacionLimpia)
            {
                throw new ArgumentException("La confirmación del número telefónico no coincide.");
            }
        }

        if (solicitud.Monto <= 0)
        {
            throw new ArgumentException("El monto de recarga debe ser mayor a $0.00.");
        }

        solicitud.NumeroTelefono = telefonoLimpio;
        return await _proveedorRecargas.EjecutarRecargaAsync(solicitud, ct);
    }

    /// <inheritdoc />
    public async Task<ResultadoPagoServicioDto> ProcesarPagoServicioAsync(SolicitudPagoServicioDto solicitud, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(solicitud.ReferenciaRecibo))
        {
            throw new ArgumentException("La referencia o código del recibo es obligatoria.");
        }

        if (solicitud.MontoRecibo <= 0)
        {
            throw new ArgumentException("El monto a pagar del recibo debe ser mayor a $0.00.");
        }

        if (solicitud.Comision < 0)
        {
            throw new ArgumentException("La comisión del servicio no puede ser negativa.");
        }

        return await _proveedorServicios.EjecutarPagoServicioAsync(solicitud, ct);
    }

    /// <inheritdoc />
    public Task<ResultadoConsultaAdeudoDto> ConsultarAdeudoServicioAsync(SolicitudConsultaAdeudoDto solicitud, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(solicitud.Referencia))
        {
            throw new ArgumentException("La referencia a consultar es obligatoria.");
        }

        return _proveedorServicios.ConsultarAdeudoServicioAsync(solicitud, ct);
    }

    /// <inheritdoc />
    public async Task<int> SincronizarCatalogoRnpAsync(CancellationToken ct = default)
    {
        _logger.LogInformation("Iniciando sincronización completa del catálogo RNP pos_prices_products...");
        var catalogo = await _clienteSoap.ConsultarCatalogoProductosAsync(ct);

        if (catalogo.PosPricesProducts == null || catalogo.PosPricesProducts.Count == 0)
        {
            throw new InvalidOperationException("El proveedor RNP no devolvió productos para sincronizar.");
        }

        // Limpiar catálogo previo e insertar el nuevo
        var existentes = await _contexto.CatalogoProductosServicios.ToListAsync(ct);
        _contexto.CatalogoProductosServicios.RemoveRange(existentes);

        int insertados = 0;
        foreach (var item in catalogo.PosPricesProducts)
        {
            decimal.TryParse(item.Monto, out var monto);
            bool checkAmount = item.CheckAmount?.Equals("true", StringComparison.OrdinalIgnoreCase) ?? false;
            int.TryParse(item.Orden, out var orden);

            _contexto.CatalogoProductosServicios.Add(new ProductoServicioRnp
            {
                CarrierId = item.Carrier_ID,
                Descripcion = item.Description.Trim(),
                Grupo = item.Group,
                Monto = monto,
                Observacion = item.Observacion?.Trim(),
                PermiteConsultarAdeudo = checkAmount,
                Orden = orden > 0 ? orden : 1,
                Activo = true,
                FechaSincronizacion = DateTime.Now
            });
            insertados++;
        }

        _contexto.BitacoraServicios.Add(new BitacoraServicio
        {
            FolioPos = $"SINC_{DateTime.UtcNow:yyMMddHHmmss}",
            Accion = "CATALOGO_ACTUALIZADO",
            Mensaje = $"Catálogo de RNP sincronizado con éxito. Total registros: {insertados}",
            FechaHora = DateTime.Now
        });

        await _contexto.SaveChangesAsync(ct);
        _logger.LogInformation("Sincronización de catálogo RNP completada: {Total} productos guardados.", insertados);
        return insertados;
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<TransaccionServicioDetalleDto>> ConsultarTransaccionesAsync(
        FiltroTransaccionesServiciosDto filtro,
        CancellationToken ct = default)
    {
        var query = _contexto.TransaccionesServicios.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(filtro.FolioPos))
        {
            query = query.Where(t => t.FolioPos.Contains(filtro.FolioPos));
        }

        if (!string.IsNullOrWhiteSpace(filtro.Referencia))
        {
            query = query.Where(t => t.Referencia.Contains(filtro.Referencia));
        }

        if (!string.IsNullOrWhiteSpace(filtro.Estado))
        {
            query = query.Where(t => t.Estado == filtro.Estado);
        }

        if (!string.IsNullOrWhiteSpace(filtro.TipoTransaccion))
        {
            query = query.Where(t => t.TipoTransaccion == filtro.TipoTransaccion);
        }

        if (filtro.FechaDesde.HasValue)
        {
            query = query.Where(t => t.FechaCreacion >= filtro.FechaDesde.Value);
        }

        if (filtro.FechaHasta.HasValue)
        {
            query = query.Where(t => t.FechaCreacion <= filtro.FechaHasta.Value);
        }

        int limite = filtro.Limite > 0 ? Math.Min(filtro.Limite, 200) : 50;

        var items = await query
            .OrderByDescending(t => t.FechaCreacion)
            .Take(limite)
            .Select(t => new TransaccionServicioDetalleDto
            {
                IdTransaccionServicio = t.IdTransaccionServicio,
                FolioPos = t.FolioPos,
                TipoTransaccion = t.TipoTransaccion,
                CarrierId = t.CarrierId,
                CarrierNombre = t.CarrierNombre,
                Referencia = t.Referencia,
                Monto = t.Monto,
                Comision = t.Comision,
                TotalCobrado = t.TotalCobrado,
                Estado = t.Estado,
                CodigoRespuesta = t.CodigoRespuesta,
                DescripcionRespuesta = t.DescripcionRespuesta,
                FolioProveedor = t.FolioProveedor,
                FolioCarrier = t.FolioCarrier,
                AvisoNotice = t.AvisoNotice,
                SaldoPosterior = t.SaldoPosterior,
                FechaCreacion = t.FechaCreacion,
                ReintentosConsulta = t.ReintentosConsulta,
                UltimaConsultaEstado = t.UltimaConsultaEstado
            })
            .ToListAsync(ct);

        return items.AsReadOnly();
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<RegistroBitacoraDto>> ConsultarBitacoraAsync(
        string? folioPos,
        int limite = 50,
        CancellationToken ct = default)
    {
        var query = _contexto.BitacoraServicios.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(folioPos))
        {
            query = query.Where(b => b.FolioPos.Contains(folioPos));
        }

        limite = limite > 0 ? Math.Min(limite, 200) : 50;

        var items = await query
            .OrderByDescending(b => b.FechaHora)
            .Take(limite)
            .Select(b => new RegistroBitacoraDto
            {
                IdBitacoraServicio = b.IdBitacoraServicio,
                FolioPos = b.FolioPos,
                Accion = b.Accion,
                Mensaje = b.Mensaje,
                DetallesJson = b.DetallesJson,
                Usuario = b.Usuario,
                DireccionIp = b.DireccionIp,
                FechaHora = b.FechaHora
            })
            .ToListAsync(ct);

        return items.AsReadOnly();
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<RegistroLogErrorDto>> ConsultarLogErroresAsync(
        string? folioPos,
        int limite = 50,
        CancellationToken ct = default)
    {
        var query = _contexto.LogErroresServicios.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(folioPos))
        {
            query = query.Where(e => e.FolioPos != null && e.FolioPos.Contains(folioPos));
        }

        limite = limite > 0 ? Math.Min(limite, 200) : 50;

        var items = await query
            .OrderByDescending(e => e.FechaHora)
            .Take(limite)
            .Select(e => new RegistroLogErrorDto
            {
                IdLogError = e.IdLogError,
                FolioPos = e.FolioPos,
                MetodoSoap = e.MetodoSoap,
                TipoError = e.TipoError,
                CodigoError = e.CodigoError,
                MensajeError = e.MensajeError,
                PeticionXmlOJson = e.PeticionXmlOJson,
                RespuestaXmlOJson = e.RespuestaXmlOJson,
                StackTrace = e.StackTrace,
                FechaHora = e.FechaHora
            })
            .ToListAsync(ct);

        return items.AsReadOnly();
    }

    /// <inheritdoc />
    public async Task<RnpBalanceResult> ConsultarSaldoBolsaDetalladoAsync(CancellationToken ct = default)
    {
        return await _clienteSoap.ConsultarSaldoAsync(ct);
    }
}
