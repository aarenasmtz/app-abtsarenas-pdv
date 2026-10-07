namespace PdvAbarrotes.Dominio.Enums;

/// <summary>
/// Estados posibles del ciclo de vida de una transacción de servicios o recargas RNP.
/// </summary>
public enum EstadoTransaccionServicio
{
    Pendiente = 0,
    EnEspera = 1,     // Código 24 - RECARGA EN ESPERA
    Exitosa = 2,      // Código 00 - TRANSACCIÓN EXITOSA
    Fallida = 3,      // Códigos de error definitivos (01, 02, 05, etc.)
    Timeout = 4       // Se agotó el ciclo de consulta de 90 segundos sin estado definitivo
}
