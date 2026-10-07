using System.Text;
using System.Text.Json;
using System.Xml.Linq;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using PdvAbarrotes.Aplicacion.DTOs.Servicios;
using PdvAbarrotes.Aplicacion.Interfaces;

namespace PdvAbarrotes.Infraestructura.Servicios;

/// <summary>
/// Implementación de cliente SOAP 1.1 para la integración con Red Nacional de Pagos (VentaMovil).
/// Consume los métodos .asmx enviando payloads JSON encapsulados en etiquetas jrquest.
/// </summary>
public class ProveedorRnpSoapCliente : IProveedorRnpSoapCliente
{
    private readonly HttpClient _httpClient;
    private readonly ConfiguracionRnpOptions _opciones;
    private readonly ILogger<ProveedorRnpSoapCliente> _logger;

    private static readonly XNamespace SoapEnv = "http://schemas.xmlsoap.org/soap/envelope/";
    private static readonly XNamespace RnpNs = "http://www.ventamovil.com.mx/ws/";

    public ProveedorRnpSoapCliente(
        HttpClient httpClient,
        IOptions<ConfiguracionRnpOptions> opciones,
        ILogger<ProveedorRnpSoapCliente> logger)
    {
        _httpClient = httpClient;
        _opciones = opciones.Value;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<RnpTransactionResult> SolicitarTransaccionAsync(
        RnpRequestTransactionPayload peticion,
        CancellationToken ct = default)
    {
        peticion.User = string.IsNullOrWhiteSpace(peticion.User) ? _opciones.Usuario : peticion.User;
        peticion.Password = string.IsNullOrWhiteSpace(peticion.Password) ? _opciones.Password : peticion.Password;

        var respuestaJson = await InvocarMetodoSoapAsync("Request_Transaction", peticion, ct);
        var resultado = JsonSerializer.Deserialize<RnpTransactionResult>(respuestaJson, OpcionesJson);
        return resultado ?? new RnpTransactionResult
        {
            Confirmation = CodigosRespuestaRnp.ErrorIndeterminado,
            Description = "Respuesta nula al procesar transacción."
        };
    }

    /// <inheritdoc />
    public async Task<RnpTransactionResult> ConsultarEstadoTransaccionAsync(
        string folioPos,
        CancellationToken ct = default)
    {
        var payload = new RnpCheckTransactionPayload
        {
            User = _opciones.Usuario,
            Folio_POS = folioPos
        };

        var respuestaJson = await InvocarMetodoSoapAsync("check_transaction", payload, ct);
        var resultado = JsonSerializer.Deserialize<RnpTransactionResult>(respuestaJson, OpcionesJson);
        return resultado ?? new RnpTransactionResult
        {
            Confirmation = CodigosRespuestaRnp.ErrorIndeterminado,
            Description = "Respuesta nula al consultar estado."
        };
    }

    /// <inheritdoc />
    public async Task<RnpBalanceResult> ConsultarSaldoAsync(CancellationToken ct = default)
    {
        var payload = new RnpCheckBalancePayload
        {
            User = _opciones.Usuario,
            Password = _opciones.Password
        };

        var respuestaJson = await InvocarMetodoSoapAsync("Check_Balance", payload, ct);
        var resultado = JsonSerializer.Deserialize<RnpBalanceResult>(respuestaJson, OpcionesJson);
        return resultado ?? new RnpBalanceResult
        {
            Confirmation = CodigosRespuestaRnp.ErrorIndeterminado,
            Balance = "0"
        };
    }

    /// <inheritdoc />
    public async Task<RnpPosPricesResult> ConsultarCatalogoProductosAsync(CancellationToken ct = default)
    {
        var payload = new RnpPosPricesPayload
        {
            User = _opciones.Usuario,
            Password = _opciones.Password
        };

        var respuestaJson = await InvocarMetodoSoapAsync("pos_prices_products", payload, ct);
        var resultado = JsonSerializer.Deserialize<RnpPosPricesResult>(respuestaJson, OpcionesJson);
        return resultado ?? new RnpPosPricesResult
        {
            Response = "-1",
            PosPricesProducts = new List<RnpProductItem>()
        };
    }

    /// <inheritdoc />
    public async Task<RnpPendingAmountResult> ConsultarAdeudoServicioAsync(
        string idOperadora,
        string referencia,
        CancellationToken ct = default)
    {
        var payload = new RnpCheckPendingAmountPayload
        {
            IdOperadora = idOperadora,
            Referencia = referencia
        };

        var respuestaJson = await InvocarMetodoSoapAsync("check_service_pending_amount", payload, ct);
        var resultado = JsonSerializer.Deserialize<RnpPendingAmountResult>(respuestaJson, OpcionesJson);
        return resultado ?? new RnpPendingAmountResult
        {
            Response = "-2",
            Message = "No se obtuvo respuesta del servicio de adeudo."
        };
    }

    /// <summary>
    /// Construye y envía el sobre SOAP 1.1 envolviendo el JSON dentro de jrquest.
    /// </summary>
    private async Task<string> InvocarMetodoSoapAsync<T>(
        string metodoSoap,
        T payload,
        CancellationToken ct)
    {
        string jsonPayload = JsonSerializer.Serialize(payload, OpcionesJson);

        string soapEnvelope = $@"<?xml version=""1.0"" encoding=""utf-8""?>
<soap:Envelope xmlns:xsi=""http://www.w3.org/2001/XMLSchema-instance"" xmlns:xsd=""http://www.w3.org/2001/XMLSchema"" xmlns:soap=""http://schemas.xmlsoap.org/soap/envelope/"">
  <soap:Body>
    <{metodoSoap} xmlns=""http://www.ventamovil.com.mx/ws/"">
      <jrquest><![CDATA[{jsonPayload}]]></jrquest>
    </{metodoSoap}>
  </soap:Body>
</soap:Envelope>";

        var endpoint = _opciones.UrlEndpoint;
        using var mensaje = new HttpRequestMessage(HttpMethod.Post, endpoint);
        mensaje.Content = new StringContent(soapEnvelope, Encoding.UTF8, "text/xml");
        mensaje.Headers.Add("SOAPAction", $"\"http://www.ventamovil.com.mx/ws/{metodoSoap}\"");

        _logger.LogInformation("Enviando petición SOAP RNP {Metodo} a {Endpoint}", metodoSoap, endpoint);

        using var respuesta = await _httpClient.SendAsync(mensaje, ct);
        string cuerpoXml = await respuesta.Content.ReadAsStringAsync(ct);

        if (!respuesta.IsSuccessStatusCode)
        {
            _logger.LogError("Error HTTP al invocar SOAP RNP {Metodo}: Código {Codigo}. Respuesta: {Respuesta}",
                metodoSoap, (int)respuesta.StatusCode, cuerpoXml);
            throw new HttpRequestException($"Fallo en servidor RNP (HTTP {(int)respuesta.StatusCode}): {cuerpoXml}");
        }

        try
        {
            var doc = XDocument.Parse(cuerpoXml);
            var nodoResultado = doc.Descendants(RnpNs + $"{metodoSoap}Result").FirstOrDefault();

            if (nodoResultado == null || string.IsNullOrWhiteSpace(nodoResultado.Value))
            {
                _logger.LogWarning("Respuesta SOAP RNP no contiene nodo {Metodo}Result. XML: {Xml}",
                    metodoSoap, cuerpoXml);
                throw new InvalidOperationException($"La respuesta SOAP no contiene el resultado de {metodoSoap}.");
            }

            return nodoResultado.Value;
        }
        catch (Exception ex) when (ex is not InvalidOperationException && ex is not HttpRequestException)
        {
            _logger.LogError(ex, "Error analizando XML SOAP para {Metodo}. Contenido: {Xml}", metodoSoap, cuerpoXml);
            throw new InvalidOperationException($"Error analizando respuesta XML del Web Service RNP: {ex.Message}", ex);
        }
    }

    private static readonly JsonSerializerOptions OpcionesJson = new()
    {
        PropertyNameCaseInsensitive = true,
        WriteIndented = false
    };
}
