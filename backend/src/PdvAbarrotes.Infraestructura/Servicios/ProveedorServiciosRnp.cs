using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using PdvAbarrotes.Aplicacion.DTOs.Servicios;
using PdvAbarrotes.Aplicacion.Interfaces;
using PdvAbarrotes.Dominio.Entidades;

namespace PdvAbarrotes.Infraestructura.Servicios;

/// <summary>
/// Proveedor oficial de pago y recepción de servicios públicos/privados integrado con Red Nacional de Pagos (RNP / VentaMovil).
/// Ofrece consulta previa de adeudo, persistencia de Folio_POS, comisiones configurables y tolerancia a caídas de red.
/// </summary>
public class ProveedorServiciosRnp : IProveedorServicios
{
    private readonly IProveedorRnpSoapCliente _clienteSoap;
    private readonly IContextoPrincipal _contexto;
    private readonly ConfiguracionRnpOptions _opciones;
    private readonly ILogger<ProveedorServiciosRnp> _logger;

    public ProveedorServiciosRnp(
        IProveedorRnpSoapCliente clienteSoap,
        IContextoPrincipal contexto,
        IOptions<ConfiguracionRnpOptions> opciones,
        ILogger<ProveedorServiciosRnp> logger)
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
    public async Task<string> ConsultarCatalogoServiciosAsync()
    {
        try
        {
            var cat = await _clienteSoap.ConsultarCatalogoProductosAsync();
            int total = cat.PosPricesProducts?.Count(p => p.Group == "SERVICIO") ?? 0;
            return $"Catálogo RNP activo: {total} servicios públicos disponibles.";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al consultar catálogo de servicios en RNP.");
            return $"Error al consultar catálogo de servicios: {ex.Message}";
        }
    }

    /// <inheritdoc />
    public async Task<ResultadoConsultaAdeudoDto> ConsultarAdeudoServicioAsync(
        SolicitudConsultaAdeudoDto solicitud,
        CancellationToken ct = default)
    {
        string idOperadora = MapearServicioId(solicitud.CodigoServicio);

        try
        {
            var respuesta = await _clienteSoap.ConsultarAdeudoServicioAsync(idOperadora, solicitud.Referencia, ct);

            // Registro de auditoría
            _contexto.BitacoraServicios.Add(new BitacoraServicio
            {
                FolioPos = $"CONSULTA_{DateTime.UtcNow:yyMMddHHmmss}",
                Accion = "CONSULTA_ADEUDO",
                Mensaje = $"Consulta adeudo servicio {solicitud.CodigoServicio} (SKU {idOperadora}) ref {solicitud.Referencia}. Resp: {respuesta.Response}, Rcode: {respuesta.Rcode}, Monto: {respuesta.Amount}",
                DetallesJson = JsonSerializer.Serialize(respuesta),
                FechaHora = DateTime.Now
            });
            await _contexto.SaveChangesAsync(ct);

            // Response = 1: consulta correcta
            if (respuesta.Response == "1")
            {
                decimal.TryParse(respuesta.Amount, out var monto);
                bool editable = bool.TryParse(respuesta.Editable, out var ed) ? ed : false;

                return new ResultadoConsultaAdeudoDto
                {
                    Exito = true,
                    MontoAdeudo = monto,
                    EsMontoEditable = editable,
                    MensajeProveedor = respuesta.Message ?? "Consulta de adeudo exitosa",
                    CodigoResultado = respuesta.Rcode
                };
            }

            // Error o formato no válido
            string mensajeError = respuesta.Response switch
            {
                "-1" => "La referencia o formato del recibo no es válido para este proveedor.",
                "-2" => "No se pudo obtener información del adeudo desde el servicio del emisor.",
                _ => respuesta.Message ?? "Error al consultar adeudo."
            };

            return new ResultadoConsultaAdeudoDto
            {
                Exito = false,
                MontoAdeudo = 0m,
                EsMontoEditable = true,
                MensajeProveedor = mensajeError,
                CodigoResultado = respuesta.Response
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Excepción al consultar adeudo de servicio {Servicio} ref {Referencia}",
                solicitud.CodigoServicio, solicitud.Referencia);

            _contexto.LogErroresServicios.Add(new LogErrorServicio
            {
                MetodoSoap = "check_service_pending_amount",
                TipoError = "EXCEPCION_CONSULTA_ADEUDO",
                MensajeError = ex.Message,
                StackTrace = ex.StackTrace,
                FechaHora = DateTime.Now
            });
            await _contexto.SaveChangesAsync(CancellationToken.None);

            return new ResultadoConsultaAdeudoDto
            {
                Exito = false,
                MontoAdeudo = 0m,
                EsMontoEditable = true,
                MensajeProveedor = $"Error de comunicación al consultar adeudo: {ex.Message}"
            };
        }
    }

    /// <inheritdoc />
    public async Task<ResultadoPagoServicioDto> EjecutarPagoServicioAsync(
        SolicitudPagoServicioDto solicitud,
        CancellationToken ct = default)
    {
        string carrierId = MapearServicioId(solicitud.CodigoServicio);
        string folioPos = GenerarFolioPosUnico();

        var transaccion = new TransaccionServicio
        {
            FolioPos = folioPos,
            TipoTransaccion = "SERVICIO",
            CarrierId = carrierId,
            CarrierNombre = solicitud.CodigoServicio,
            Referencia = solicitud.ReferenciaRecibo,
            Monto = solicitud.MontoRecibo,
            Comision = solicitud.Comision,
            TotalCobrado = solicitud.MontoRecibo + solicitud.Comision,
            Estado = "PENDIENTE",
            IdUsuario = solicitud.IdUsuario > 0 ? solicitud.IdUsuario : null,
            IdCaja = solicitud.IdSucursal > 0 ? solicitud.IdSucursal : null,
            FechaCreacion = DateTime.Now,
            DatosPeticionJson = JsonSerializer.Serialize(new
            {
                Carrier = carrierId,
                solicitud.MontoRecibo,
                solicitud.Comision,
                solicitud.ReferenciaRecibo,
                Folio_POS = folioPos
            })
        };

        var bitacoraInicio = new BitacoraServicio
        {
            FolioPos = folioPos,
            Accion = "SOLICITUD_INICIADA",
            Mensaje = $"Iniciando pago de servicio {solicitud.CodigoServicio} por ${solicitud.MontoRecibo:N2} (+ com ${solicitud.Comision:N2}). Ref: {solicitud.ReferenciaRecibo}. Folio_POS: {folioPos}",
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
                Price = solicitud.MontoRecibo.ToString("0.00"),
                Number = solicitud.ReferenciaRecibo,
                Folio_POS = folioPos
            };

            var respuestaInicial = await _clienteSoap.SolicitarTransaccionAsync(peticionSoap, ct);

            if (respuestaInicial.Confirmation == CodigosRespuestaRnp.RecargaEnEspera)
            {
                _logger.LogInformation("Pago de servicio {FolioPos} devuelto en espera (24). Iniciando ciclo de verificación...", folioPos);
                respuestaFinal = await EjecutarCicloConsultaEstadoAsync(transaccion, folioPos, ct);
            }
            else
            {
                respuestaFinal = respuestaInicial;
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Excepción al solicitar pago de servicio {FolioPos}. Entrando a ciclo de verificación por contingencia...", folioPos);

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

            respuestaFinal = await EjecutarCicloConsultaEstadoAsync(transaccion, folioPos, ct);
        }

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

        _contexto.BitacoraServicios.Add(new BitacoraServicio
        {
            FolioPos = folioPos,
            Accion = esExitosa ? "ESTADO_EXITOSO" : "ESTADO_FINAL",
            Mensaje = $"Resultado de pago servicio: [{codigo}] {descripcion}. Folio RNP: {respuestaFinal.Folio}, Carrier: {respuestaFinal.Folio_Carrier}",
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

        return new ResultadoPagoServicioDto
        {
            Exito = esExitosa,
            Mensaje = descripcion,
            FolioAutorizacion = respuestaFinal.Folio ?? respuestaFinal.Folio_Carrier,
            MontoPagado = solicitud.MontoRecibo,
            ComisionCobrada = solicitud.Comision,
            Servicio = solicitud.CodigoServicio,
            Referencia = solicitud.ReferenciaRecibo,
            FechaHora = DateTime.Now
        };
    }

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

                if (ultimaRespuesta.Confirmation != CodigosRespuestaRnp.RecargaEnEspera)
                {
                    _logger.LogInformation("Pago {FolioPos} resuelto con estado definitivo {Codigo} tras {Reintentos} intentos.",
                        folioPos, ultimaRespuesta.Confirmation, transaccion.ReintentosConsulta);
                    return ultimaRespuesta;
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Fallo transitorio al consultar estado en ciclo para pago {FolioPos}", folioPos);
            }
        }

        return ultimaRespuesta;
    }

    private string GenerarFolioPosUnico()
    {
        string prefijo = string.IsNullOrWhiteSpace(_opciones.PrefijoFolioPos) ? "10008" : _opciones.PrefijoFolioPos;
        string timestamp = DateTime.UtcNow.ToString("yyMMddHHmmssfff");
        int aleatorio = Random.Shared.Next(10, 99);
        string folio = $"{prefijo}{timestamp}{aleatorio}";

        return folio.Length > 30 ? folio.Substring(0, 30) : folio;
    }

    private static string MapearServicioId(string codigoServicio)
    {
        if (int.TryParse(codigoServicio, out _))
        {
            return codigoServicio;
        }

        return codigoServicio.Trim().ToUpperInvariant() switch
        {
            "SKY" => "17",
            "JMAS" => "31",
            "IZZI" => "33",
            "TOTALPLAY" => "38",
            "START_TV" or "START TV" => "77",
            "TELNOR" => "22",
            "MEGACABLE" => "14",
            "TELMEX" => "15",
            "CFE" => "20",
            "NATURGY" => "34",
            "AGUA_MUNICIPAL" => "31",
            _ => codigoServicio
        };
    }
}
