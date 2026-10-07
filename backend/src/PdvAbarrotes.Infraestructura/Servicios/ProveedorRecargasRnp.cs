using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using PdvAbarrotes.Aplicacion.DTOs.Servicios;
using PdvAbarrotes.Aplicacion.Interfaces;
using PdvAbarrotes.Dominio.Entidades;

namespace PdvAbarrotes.Infraestructura.Servicios;

/// <summary>
/// Proveedor oficial de recargas electrónicas de tiempo aire integrado con Red Nacional de Pagos (RNP / VentaMovil).
/// Implementa el ciclo de vida transaccional con persistencia de Folio_POS, tolerancia a fallos y consultas de estado automáticas.
/// </summary>
public class ProveedorRecargasRnp : IProveedorRecargas
{
    private readonly IProveedorRnpSoapCliente _clienteSoap;
    private readonly IContextoPrincipal _contexto;
    private readonly ConfiguracionRnpOptions _opciones;
    private readonly ILogger<ProveedorRecargasRnp> _logger;

    public ProveedorRecargasRnp(
        IProveedorRnpSoapCliente clienteSoap,
        IContextoPrincipal contexto,
        IOptions<ConfiguracionRnpOptions> opciones,
        ILogger<ProveedorRecargasRnp> logger)
    {
        _clienteSoap = clienteSoap;
        _contexto = contexto;
        _opciones = opciones.Value;
        _logger = logger;
    }

    /// <inheritdoc />
    public Task<bool> ProveedorEstaConfiguradoAsync()
    {
        bool configurado = _opciones.Habilitado &&
                           !string.IsNullOrWhiteSpace(_opciones.Usuario) &&
                           !string.IsNullOrWhiteSpace(_opciones.Password);
        return Task.FromResult(configurado);
    }

    /// <inheritdoc />
    public async Task<string> ConsultarSaldoProveedorAsync()
    {
        try
        {
            var saldo = await _clienteSoap.ConsultarSaldoAsync();
            return $"Saldo disponible RNP: ${saldo.Balance ?? "0.00"} MXN (Compras: ${saldo.Compras ?? "0"}, Ventas: ${saldo.Ventas ?? "0"})";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al consultar saldo en RNP.");
            return $"Error al consultar saldo de bolsa RNP: {ex.Message}";
        }
    }

    /// <inheritdoc />
    public async Task<ResultadoRecargaDto> EjecutarRecargaAsync(
        SolicitudRecargaDto solicitud,
        CancellationToken ct = default)
    {
        string carrierId = MapearCarrierId(solicitud.CodigoCompania);
        string folioPos = GenerarFolioPosUnico();

        var transaccion = new TransaccionServicio
        {
            FolioPos = folioPos,
            TipoTransaccion = "RECARGA",
            CarrierId = carrierId,
            CarrierNombre = solicitud.CodigoCompania,
            Referencia = solicitud.NumeroTelefono,
            Monto = solicitud.Monto,
            Comision = 0m,
            TotalCobrado = solicitud.Monto,
            Estado = "PENDIENTE",
            IdUsuario = solicitud.IdUsuario > 0 ? solicitud.IdUsuario : null,
            IdCaja = solicitud.IdSucursal > 0 ? solicitud.IdSucursal : null,
            FechaCreacion = DateTime.Now,
            DatosPeticionJson = JsonSerializer.Serialize(new
            {
                Carrier = carrierId,
                solicitud.Monto,
                solicitud.NumeroTelefono,
                Folio_POS = folioPos
            })
        };

        var bitacoraInicio = new BitacoraServicio
        {
            FolioPos = folioPos,
            Accion = "SOLICITUD_INICIADA",
            Mensaje = $"Iniciando solicitud de recarga de ${solicitud.Monto:N2} a {solicitud.NumeroTelefono} ({solicitud.CodigoCompania}). Folio_POS: {folioPos}",
            Usuario = solicitud.IdUsuario.ToString(),
            FechaHora = DateTime.Now
        };

        _contexto.TransaccionesServicios.Add(transaccion);
        _contexto.BitacoraServicios.Add(bitacoraInicio);
        await _contexto.SaveChangesAsync(ct);

        RnpTransactionResult respuestaFinal;

        try
        {
            var peticionSoap = new RnpRequestTransactionPayload
            {
                User = _opciones.Usuario,
                Password = _opciones.Password,
                Carrier = carrierId,
                Price = solicitud.Monto.ToString("0"),
                Number = solicitud.NumeroTelefono,
                Folio_POS = folioPos
            };

            var respuestaInicial = await _clienteSoap.SolicitarTransaccionAsync(peticionSoap, ct);

            // Regla de manual: Si devuelve 24 (RECARGA EN ESPERA), consultar Check_transaction cada 2 segundos hasta 90s
            if (respuestaInicial.Confirmation == CodigosRespuestaRnp.RecargaEnEspera)
            {
                _logger.LogInformation("Recarga {FolioPos} devuelta en espera (24). Iniciando ciclo de verificación...", folioPos);
                respuestaFinal = await EjecutarCicloConsultaEstadoAsync(transaccion, folioPos, ct);
            }
            else
            {
                respuestaFinal = respuestaInicial;
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Excepción de comunicación al solicitar recarga {FolioPos}. Entrando a ciclo de verificación por contingencia...", folioPos);
            
            // Registro de error de conexión en log de errores
            _contexto.LogErroresServicios.Add(new LogErrorServicio
            {
                FolioPos = folioPos,
                MetodoSoap = "Request_Transaction",
                TipoError = "CONEXION_O_TIMEOUT",
                MensajeError = ex.Message,
                StackTrace = ex.StackTrace,
                FechaHora = DateTime.Now
            });
            await _contexto.SaveChangesAsync(CancellationToken.None);

            // Reintento mediante Check_transaction por pérdida de conexión según especificación técnica
            respuestaFinal = await EjecutarCicloConsultaEstadoAsync(transaccion, folioPos, ct);
        }

        // Determinar resultado final
        bool esExitosa = respuestaFinal.Confirmation == CodigosRespuestaRnp.Exito;
        string codigo = respuestaFinal.Confirmation;
        string descripcion = CodigosRespuestaRnp.ObtenerDescripcion(codigo, respuestaFinal.Description);

        transaccion.CodigoRespuesta = codigo;
        transaccion.DescripcionRespuesta = descripcion;
        transaccion.FolioProveedor = respuestaFinal.Folio;
        transaccion.FolioCarrier = respuestaFinal.Folio_Carrier;
        transaccion.AvisoNotice = respuestaFinal.Notice;
        transaccion.Estado = esExitosa ? "EXITOSA" : (codigo == CodigosRespuestaRnp.RecargaEnEspera ? "EN_ESPERA" : "FALLIDA");
        transaccion.FechaActualizacion = DateTime.Now;
        transaccion.DatosRespuestaJson = JsonSerializer.Serialize(respuestaFinal);

        if (decimal.TryParse(respuestaFinal.Balance, out var balanceNum))
        {
            transaccion.SaldoPosterior = balanceNum;
        }

        if (DateTime.TryParse(respuestaFinal.TransactionDate, out var fechaOperacion))
        {
            transaccion.FechaOperacionRnp = fechaOperacion;
        }

        // Registro de bitácora final
        _contexto.BitacoraServicios.Add(new BitacoraServicio
        {
            FolioPos = folioPos,
            Accion = esExitosa ? "ESTADO_EXITOSO" : "ESTADO_FINAL",
            Mensaje = $"Resultado de recarga: [{codigo}] {descripcion}. Folio RNP: {respuestaFinal.Folio}, Carrier: {respuestaFinal.Folio_Carrier}",
            DetallesJson = JsonSerializer.Serialize(respuestaFinal),
            FechaHora = DateTime.Now
        });

        if (!esExitosa && codigo != CodigosRespuestaRnp.RecargaEnEspera)
        {
            _contexto.LogErroresServicios.Add(new LogErrorServicio
            {
                FolioPos = folioPos,
                MetodoSoap = "Request_Transaction",
                TipoError = "RECHAZO_OPERADORA",
                CodigoError = codigo,
                MensajeError = descripcion,
                RespuestaXmlOJson = JsonSerializer.Serialize(respuestaFinal),
                FechaHora = DateTime.Now
            });
        }

        await _contexto.SaveChangesAsync(CancellationToken.None);

        return new ResultadoRecargaDto
        {
            Exito = esExitosa,
            Mensaje = descripcion,
            FolioProveedor = respuestaFinal.Folio,
            CodigoAutorizacion = respuestaFinal.Folio_Carrier,
            Monto = solicitud.Monto,
            NumeroTelefono = solicitud.NumeroTelefono,
            Compania = solicitud.CodigoCompania,
            FechaHora = DateTime.Now,
            SaldoRestanteBolsa = transaccion.SaldoPosterior
        };
    }

    /// <summary>
    /// Ciclo de consulta cada 2 segundos ante respuestas pendientes (código 24) o desconexión, hasta 90 segundos.
    /// </summary>
    private async Task<RnpTransactionResult> EjecutarCicloConsultaEstadoAsync(
        TransaccionServicio transaccion,
        string folioPos,
        CancellationToken ct)
    {
        var limite = TimeSpan.FromSeconds(_opciones.MaxSegundosConsultaEstado > 0 ? _opciones.MaxSegundosConsultaEstado : 90);
        var intervalo = TimeSpan.FromSeconds(_opciones.IntervaloConsultaSegundos > 0 ? _opciones.IntervaloConsultaSegundos : 2);
        var inicio = DateTime.UtcNow;

        RnpTransactionResult ultimaRespuesta = new()
        {
            Confirmation = CodigosRespuestaRnp.RecargaEnEspera,
            Description = "RECARGA EN ESPERA"
        };

        while (DateTime.UtcNow - inicio < limite && !ct.IsCancellationRequested)
        {
            try
            {
                await Task.Delay(intervalo, ct);
            }
            catch (OperationCanceledException)
            {
                break;
            }

            try
            {
                transaccion.ReintentosConsulta++;
                transaccion.UltimaConsultaEstado = DateTime.Now;

                ultimaRespuesta = await _clienteSoap.ConsultarEstadoTransaccionAsync(folioPos, ct);

                _contexto.BitacoraServicios.Add(new BitacoraServicio
                {
                    FolioPos = folioPos,
                    Accion = "CONSULTA_ESTADO",
                    Mensaje = $"Reintento #{transaccion.ReintentosConsulta} de consulta: [{ultimaRespuesta.Confirmation}] {ultimaRespuesta.Description}",
                    FechaHora = DateTime.Now
                });

                // Si obtuvimos un código diferente de 24 (éxito o rechazo definitivo), finalizamos
                if (ultimaRespuesta.Confirmation != CodigosRespuestaRnp.RecargaEnEspera)
                {
                    _logger.LogInformation("Transacción {FolioPos} resuelta con estado definitivo {Codigo} tras {Reintentos} intentos.",
                        folioPos, ultimaRespuesta.Confirmation, transaccion.ReintentosConsulta);
                    return ultimaRespuesta;
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Fallo transitorio al consultar estado en ciclo para {FolioPos}", folioPos);
            }
        }

        _logger.LogWarning("Se agotó el tiempo de consulta ({Limite}s) para Folio_POS {FolioPos}. La operación permanece en espera.",
            limite.TotalSeconds, folioPos);

        return ultimaRespuesta;
    }

    /// <summary>
    /// Genera un Folio_POS único cumpliendo con la regla de prefijo '10008' y longitud máxima de 30 caracteres.
    /// </summary>
    private string GenerarFolioPosUnico()
    {
        string prefijo = string.IsNullOrWhiteSpace(_opciones.PrefijoFolioPos) ? "10008" : _opciones.PrefijoFolioPos;
        string timestamp = DateTime.UtcNow.ToString("yyMMddHHmmssfff");
        int aleatorio = Random.Shared.Next(10, 99);
        string folio = $"{prefijo}{timestamp}{aleatorio}";

        return folio.Length > 30 ? folio.Substring(0, 30) : folio;
    }

    /// <summary>
    /// Mapea los códigos amigables del sistema hacia los Carrier_ID asignados en RNP.
    /// </summary>
    private static string MapearCarrierId(string codigoCompania)
    {
        if (int.TryParse(codigoCompania, out _))
        {
            return codigoCompania;
        }

        return codigoCompania.Trim().ToUpperInvariant() switch
        {
            "TELCEL" => "01",
            "MOVISTAR" => "02",
            "ATT" or "AT&T" => "03",
            "UNEFON" => "04",
            "BAIT" => "113",
            "VIRGIN" => "07",
            _ => codigoCompania
        };
    }
}
