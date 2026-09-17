namespace PdvAbarrotes.Aplicacion.Interfaces;

/// <summary>
/// Contrato para integración con proveedor de recargas de tiempo aire.
/// NOTA DE ARQUITECTURA: Queda pendiente la definición del proveedor externo comercial.
/// No inventar endpoints simulados. Esta interfaz define la abstracción requerida.
/// </summary>
public interface IProveedorRecargas
{
    Task<bool> ProveedorEstaConfiguradoAsync();
    Task<string> ConsultarSaldoProveedorAsync();
}
