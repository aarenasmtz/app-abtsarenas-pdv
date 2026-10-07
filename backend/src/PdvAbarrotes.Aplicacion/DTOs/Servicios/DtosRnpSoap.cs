using System.Text.Json.Serialization;

namespace PdvAbarrotes.Aplicacion.DTOs.Servicios;

/// <summary>
/// Diccionario canónico de códigos de respuesta oficiales del Web Service RNP (páginas 9 y 10 del manual de integración).
/// </summary>
public static class CodigosRespuestaRnp
{
    public const string Exito = "00";
    public const string ReferenciaNoValida = "01";
    public const string TelefonoNoValido = "02";
    public const string MontoNoValido = "03";
    public const string NoSePuedeAbonar4 = "04";
    public const string SaldoInsuficiente = "05";
    public const string MantenimientoOperadora = "06";
    public const string NoSePuedeAbonar7 = "07";
    public const string IntermitenciaEnServicio = "08";
    public const string AutorizadorNoDisponible = "09";
    public const string RegionNoPermitida = "10";
    public const string OperadoraNoDisponible = "11";
    public const string NoTienePermisoAsignado = "12";
    public const string FechaPdvNoValida = "13";
    public const string UsuarioBloqueado = "14";
    public const string PosibleDuplicado = "15";
    public const string ProductoNoDisponible = "16";
    public const string MovimientoNoEncontrado = "17";
    public const string MovimientoYaReversado = "18";
    public const string MovimientoNoAutorizado = "19";
    public const string ErrorIndeterminado = "20";
    public const string NoSePudoReversar = "21";
    public const string SospechaFraude = "22";
    public const string ErrorBaseDatosOperadora = "23";
    public const string RecargaEnEspera = "24";
    public const string CredencialesInvalidas = "25";
    public const string CuentaConSuscripcionVigente = "26";
    public const string TelefonoNoSusceptibleActivacion = "27";
    public const string TelefonoNoSusceptibleAbono = "29";
    public const string ReferenciaIncorrecta = "30";
    public const string CorteDelDiaEnProgreso = "31";

    private static readonly Dictionary<string, string> Descripciones = new()
    {
        { Exito, "TRANSACCIÓN EXITOSA" },
        { ReferenciaNoValida, "REFERENCIA NO VÁLIDA / REVISAR OPERADOR" },
        { TelefonoNoValido, "TELÉFONO SUSCRIPTOR NO VÁLIDO" },
        { MontoNoValido, "MONTO NO VÁLIDO" },
        { NoSePuedeAbonar4, "NO SE PUEDE ABONAR" },
        { SaldoInsuficiente, "SALDO INSUFICIENTE" },
        { MantenimientoOperadora, "MANTENIMIENTO OPERADORA EN CURSO" },
        { NoSePuedeAbonar7, "NO SE PUEDE ABONAR" },
        { IntermitenciaEnServicio, "INTERMITENCIA EN SERVICIO" },
        { AutorizadorNoDisponible, "AUTORIZADOR NO DISPONIBLE" },
        { RegionNoPermitida, "REGIÓN NO PERMITIDA" },
        { OperadoraNoDisponible, "OPERADORA NO DISPONIBLE" },
        { NoTienePermisoAsignado, "NO TIENE PERMISO ASIGNADO" },
        { FechaPdvNoValida, "FECHA PDV NO VÁLIDA" },
        { UsuarioBloqueado, "USUARIO BLOQUEADO" },
        { PosibleDuplicado, "POSIBLE DUPLICADO, REVISAR CORTE" },
        { ProductoNoDisponible, "PRODUCTO NO DISPONIBLE" },
        { MovimientoNoEncontrado, "MOVIMIENTO NO ENCONTRADO" },
        { MovimientoYaReversado, "MOVIMIENTO YA REVERSADO" },
        { MovimientoNoAutorizado, "MOVIMIENTO NO AUTORIZADO" },
        { ErrorIndeterminado, "ERROR INDETERMINADO" },
        { NoSePudoReversar, "NO SE PUDO REVERSAR" },
        { SospechaFraude, "SOSPECHA DE FRAUDE" },
        { ErrorBaseDatosOperadora, "ERROR DE LA BASE DE DATOS DE OPERADORA" },
        { RecargaEnEspera, "RECARGA EN ESPERA" },
        { CredencialesInvalidas, "USUARIO / PASSWORD INVÁLIDOS" },
        { CuentaConSuscripcionVigente, "CUENTA CON UNA SUSCRIPCIÓN VIGENTE" },
        { TelefonoNoSusceptibleActivacion, "TELÉFONO NO SUSCEPTIBLE DE ACTIVACIÓN" },
        { TelefonoNoSusceptibleAbono, "TELÉFONO NO SUSCEPTIBLE DE ABONO" },
        { ReferenciaIncorrecta, "REFERENCIA INCORRECTA" },
        { CorteDelDiaEnProgreso, "CORTE DEL DÍA EN PROGRESO" }
    };

    public static string ObtenerDescripcion(string? codigo, string? descripcionOriginal = null)
    {
        if (string.IsNullOrWhiteSpace(codigo))
        {
            return descripcionOriginal ?? "Respuesta sin código del proveedor";
        }

        if (Descripciones.TryGetValue(codigo, out var desc))
        {
            return desc;
        }

        return string.IsNullOrWhiteSpace(descripcionOriginal)
            ? $"Respuesta {codigo} de la operadora"
            : descripcionOriginal;
    }
}

/// <summary>
/// Opciones de configuración para la integración SOAP con RNP (appsettings.json).
/// </summary>
public class ConfiguracionRnpOptions
{
    public const string Seccion = "RnpServicios";
    
    public string UrlEndpoint { get; set; } = "http://ws_stage.cloud-services.mx:9192/service.asmx";
    public string Usuario { get; set; } = "6144135400";
    public string Password { get; set; } = "Prueba$$";
    public string PrefijoFolioPos { get; set; } = "10008";
    public int TimeoutSegundos { get; set; } = 30;
    public int MaxSegundosConsultaEstado { get; set; } = 90;
    public int IntervaloConsultaSegundos { get; set; } = 2;
    public bool Habilitado { get; set; } = true;
    public bool ModoPruebas { get; set; } = true;
    public decimal ComisionDefaultServicio { get; set; } = 12.00m;
}

// ==========================================
// DTOs PARA EL WEB SERVICE SOAP DE RNP
// ==========================================

public class RnpRequestTransactionPayload
{
    [JsonPropertyName("User")]
    public string User { get; set; } = string.Empty;

    [JsonPropertyName("Password")]
    public string Password { get; set; } = string.Empty;

    [JsonPropertyName("Carrier")]
    public string Carrier { get; set; } = string.Empty;

    [JsonPropertyName("Price")]
    public string Price { get; set; } = string.Empty;

    [JsonPropertyName("Number")]
    public string Number { get; set; } = string.Empty;

    [JsonPropertyName("Folio_POS")]
    public string Folio_POS { get; set; } = string.Empty;
}

public class RnpTransactionResult
{
    [JsonPropertyName("Confirmation")]
    public string Confirmation { get; set; } = string.Empty;

    [JsonPropertyName("Description")]
    public string? Description { get; set; }

    [JsonPropertyName("Folio")]
    public string? Folio { get; set; }

    [JsonPropertyName("Folio_Carrier")]
    public string? Folio_Carrier { get; set; }

    [JsonPropertyName("Notice")]
    public string? Notice { get; set; }

    [JsonPropertyName("Balance")]
    public string? Balance { get; set; }

    [JsonPropertyName("transaction_date")]
    public string? TransactionDate { get; set; }

    [JsonPropertyName("productVersion")]
    public string? ProductVersion { get; set; }
}

public class RnpCheckTransactionPayload
{
    [JsonPropertyName("User")]
    public string User { get; set; } = string.Empty;

    [JsonPropertyName("Folio_POS")]
    public string Folio_POS { get; set; } = string.Empty;
}

public class RnpCheckBalancePayload
{
    [JsonPropertyName("User")]
    public string User { get; set; } = string.Empty;

    [JsonPropertyName("Password")]
    public string Password { get; set; } = string.Empty;
}

public class RnpBalanceResult
{
    [JsonPropertyName("Confirmation")]
    public string? Confirmation { get; set; }

    [JsonPropertyName("Saldo_Inicial")]
    public string? SaldoInicial { get; set; }

    [JsonPropertyName("Compras")]
    public string? Compras { get; set; }

    [JsonPropertyName("Ventas")]
    public string? Ventas { get; set; }

    [JsonPropertyName("Comision")]
    public string? Comision { get; set; }

    [JsonPropertyName("Balance")]
    public string? Balance { get; set; }
}

public class RnpPosPricesPayload
{
    [JsonPropertyName("User")]
    public string User { get; set; } = string.Empty;

    [JsonPropertyName("Password")]
    public string Password { get; set; } = string.Empty;
}

public class RnpProductItem
{
    [JsonPropertyName("Carrier_ID")]
    public string Carrier_ID { get; set; } = string.Empty;

    [JsonPropertyName("Description")]
    public string Description { get; set; } = string.Empty;

    [JsonPropertyName("Group")]
    public string Group { get; set; } = string.Empty;

    [JsonPropertyName("Monto")]
    public string Monto { get; set; } = "0";

    [JsonPropertyName("observacion")]
    public string? Observacion { get; set; }

    [JsonPropertyName("check_amount")]
    public string? CheckAmount { get; set; }

    [JsonPropertyName("orden")]
    public string? Orden { get; set; }
}

public class RnpPosPricesResult
{
    [JsonPropertyName("Response")]
    public string? Response { get; set; }

    [JsonPropertyName("pos_prices_products")]
    public List<RnpProductItem>? PosPricesProducts { get; set; }
}

public class RnpCheckPendingAmountPayload
{
    [JsonPropertyName("id_operadora")]
    public string IdOperadora { get; set; } = string.Empty;

    [JsonPropertyName("referencia")]
    public string Referencia { get; set; } = string.Empty;
}

public class RnpPendingAmountResult
{
    [JsonPropertyName("Response")]
    public string? Response { get; set; }

    [JsonPropertyName("editable")]
    public string? Editable { get; set; }

    [JsonPropertyName("rcode")]
    public string? Rcode { get; set; }

    [JsonPropertyName("amount")]
    public string? Amount { get; set; }

    [JsonPropertyName("Message")]
    public string? Message { get; set; }
}

// ==========================================
// DTOs PARA CONSULTA DE ADEUDOS EN PDV
// ==========================================

public class SolicitudConsultaAdeudoDto
{
    public string CodigoServicio { get; set; } = string.Empty;
    public string Referencia { get; set; } = string.Empty;
}

public class ResultadoConsultaAdeudoDto
{
    public bool Exito { get; set; }
    public decimal MontoAdeudo { get; set; }
    public bool EsMontoEditable { get; set; }
    public string? MensajeProveedor { get; set; }
    public string? CodigoResultado { get; set; }
}

// ==========================================
// DTOs PARA BITÁCORA Y LOG DE ERRORES
// ==========================================

public class RegistroBitacoraDto
{
    public int IdBitacoraServicio { get; set; }
    public string FolioPos { get; set; } = string.Empty;
    public string Accion { get; set; } = string.Empty;
    public string Mensaje { get; set; } = string.Empty;
    public string? DetallesJson { get; set; }
    public string? Usuario { get; set; }
    public string? DireccionIp { get; set; }
    public DateTime FechaHora { get; set; }
}

public class RegistroLogErrorDto
{
    public int IdLogError { get; set; }
    public string? FolioPos { get; set; }
    public string MetodoSoap { get; set; } = string.Empty;
    public string TipoError { get; set; } = string.Empty;
    public string? CodigoError { get; set; }
    public string MensajeError { get; set; } = string.Empty;
    public string? PeticionXmlOJson { get; set; }
    public string? RespuestaXmlOJson { get; set; }
    public string? StackTrace { get; set; }
    public DateTime FechaHora { get; set; }
}

public class TransaccionServicioDetalleDto
{
    public int IdTransaccionServicio { get; set; }
    public string FolioPos { get; set; } = string.Empty;
    public string TipoTransaccion { get; set; } = string.Empty;
    public string CarrierId { get; set; } = string.Empty;
    public string CarrierNombre { get; set; } = string.Empty;
    public string Referencia { get; set; } = string.Empty;
    public decimal Monto { get; set; }
    public decimal Comision { get; set; }
    public decimal TotalCobrado { get; set; }
    public string Estado { get; set; } = string.Empty;
    public string? CodigoRespuesta { get; set; }
    public string? DescripcionRespuesta { get; set; }
    public string? FolioProveedor { get; set; }
    public string? FolioCarrier { get; set; }
    public string? AvisoNotice { get; set; }
    public decimal? SaldoPosterior { get; set; }
    public DateTime FechaCreacion { get; set; }
    public int ReintentosConsulta { get; set; }
    public DateTime? UltimaConsultaEstado { get; set; }
}

public class FiltroTransaccionesServiciosDto
{
    public string? FolioPos { get; set; }
    public string? Referencia { get; set; }
    public string? Estado { get; set; }
    public string? TipoTransaccion { get; set; }
    public DateTime? FechaDesde { get; set; }
    public DateTime? FechaHasta { get; set; }
    public int Limite { get; set; } = 50;
}
