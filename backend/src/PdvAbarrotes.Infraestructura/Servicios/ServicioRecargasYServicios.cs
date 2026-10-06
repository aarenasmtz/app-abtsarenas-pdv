using System.Text.RegularExpressions;
using PdvAbarrotes.Aplicacion.DTOs.Servicios;
using PdvAbarrotes.Aplicacion.Interfaces;

namespace PdvAbarrotes.Infraestructura.Servicios;

/// <summary>
/// Servicio de aplicación para recargas de tiempo aire y cobro de servicios públicos.
/// Coordina la validación de negocio con los contratos de proveedores externos.
/// </summary>
public class ServicioRecargasYServicios : IServicioRecargasYServicios
{
    private readonly IProveedorRecargas _proveedorRecargas;
    private readonly IProveedorServicios _proveedorServicios;

    // Catálogo canónico de operadoras móviles en México
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

    // Catálogo canónico de recibos y servicios habituales
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
            Codigo = "AGUA_MUNICIPAL",
            Nombre = "Agua Potable y Alcantarillado (SAPAL / SIMAPAG)",
            Categoria = "Agua Potable",
            ComisionRecomendada = 12.00m,
            PermiteVencidos = true,
            FormatoReferencia = "Número de cuenta de 8 a 12 dígitos"
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
            Codigo = "NATURGY",
            Nombre = "Naturgy México (Gas Natural)",
            Categoria = "Gas Natural",
            ComisionRecomendada = 14.00m,
            PermiteVencidos = false,
            FormatoReferencia = "Referencia de pago del recibo"
        },
        new CatalogoServicioDto
        {
            Codigo = "IZZI",
            Nombre = "Izzi Telecom (Televisión / Internet)",
            Categoria = "Televisión e Internet",
            ComisionRecomendada = 12.00m,
            PermiteVencidos = true,
            FormatoReferencia = "Referencia única de suscriptor"
        },
        new CatalogoServicioDto
        {
            Codigo = "SKY",
            Nombre = "Sky México / VeTV",
            Categoria = "Televisión Satelital",
            ComisionRecomendada = 12.00m,
            PermiteVencidos = true,
            FormatoReferencia = "Número de cuenta inteligente de 12 dígitos"
        },
        new CatalogoServicioDto
        {
            Codigo = "TOTALPLAY",
            Nombre = "Totalplay Telecomunicaciones",
            Categoria = "Televisión e Internet",
            ComisionRecomendada = 12.00m,
            PermiteVencidos = false,
            FormatoReferencia = "Número de cuenta de 10 dígitos"
        }
    };

    public ServicioRecargasYServicios(
        IProveedorRecargas proveedorRecargas,
        IProveedorServicios proveedorServicios)
    {
        _proveedorRecargas = proveedorRecargas;
        _proveedorServicios = proveedorServicios;
    }

    /// <inheritdoc />
    public async Task<EstadoIntegracionServiciosDto> ObtenerEstadoIntegracionAsync(CancellationToken ct = default)
    {
        bool recargasConfigurado = await _proveedorRecargas.ProveedorEstaConfiguradoAsync();
        bool serviciosConfigurado = await _proveedorServicios.ProveedorEstaConfiguradoAsync();
        bool generalConfigurado = recargasConfigurado && serviciosConfigurado;

        string mensaje;
        if (generalConfigurado)
        {
            mensaje = "Proveedores externos de recargas y servicios conectados y operando en línea.";
        }
        else
        {
            mensaje = "Módulo en Modo Preparado: Interfaces y contratos definidos. Pendiente de suscripción y alta con proveedor comercial externo (ej. TAE México, Qiubo, Taecel o RecargaPlus).";
        }

        return new EstadoIntegracionServiciosDto
        {
            EstaConfigurado = generalConfigurado,
            NombreProveedor = generalConfigurado ? "Proveedor Externo Activo" : "Pendiente de Contratación Comercial",
            MensajeEstatus = mensaje,
            SaldoBolsaDisponible = 0m,
            UltimaVerificacion = DateTime.Now
        };
    }

    /// <inheritdoc />
    public Task<IReadOnlyList<CompaniaTelefonicaDto>> ObtenerCompaniasRecargasAsync(CancellationToken ct = default)
    {
        return Task.FromResult<IReadOnlyList<CompaniaTelefonicaDto>>(CompaniasPredefinidas.AsReadOnly());
    }

    /// <inheritdoc />
    public Task<IReadOnlyList<CatalogoServicioDto>> ObtenerCatalogoServiciosAsync(CancellationToken ct = default)
    {
        return Task.FromResult<IReadOnlyList<CatalogoServicioDto>>(ServiciosPredefinidos.AsReadOnly());
    }

    /// <inheritdoc />
    public async Task<ResultadoRecargaDto> ProcesarRecargaAsync(SolicitudRecargaDto solicitud, CancellationToken ct = default)
    {
        // 1. Validaciones previas de seguridad
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

        var compania = CompaniasPredefinidas.FirstOrDefault(c =>
            c.Codigo.Equals(solicitud.CodigoCompania, StringComparison.OrdinalIgnoreCase));

        if (compania == null)
        {
            throw new ArgumentException($"La compañía telefónica '{solicitud.CodigoCompania}' no es válida.");
        }

        solicitud.NumeroTelefono = telefonoLimpio;

        // 2. Ejecutar mediante el contrato de proveedor externo
        return await _proveedorRecargas.EjecutarRecargaAsync(solicitud, ct);
    }

    /// <inheritdoc />
    public async Task<ResultadoPagoServicioDto> ProcesarPagoServicioAsync(SolicitudPagoServicioDto solicitud, CancellationToken ct = default)
    {
        // 1. Validaciones previas de seguridad
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

        var servicio = ServiciosPredefinidos.FirstOrDefault(s =>
            s.Codigo.Equals(solicitud.CodigoServicio, StringComparison.OrdinalIgnoreCase));

        if (servicio == null)
        {
            throw new ArgumentException($"El servicio '{solicitud.CodigoServicio}' no se encuentra en el catálogo.");
        }

        // 2. Ejecutar mediante el contrato de proveedor externo
        return await _proveedorServicios.EjecutarPagoServicioAsync(solicitud, ct);
    }
}
