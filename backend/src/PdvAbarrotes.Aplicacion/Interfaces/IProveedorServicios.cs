namespace PdvAbarrotes.Aplicacion.Interfaces;

/// <summary>
/// Contrato para integración con proveedor de cobro de servicios (Luz, Agua, Gas, etc.).
/// NOTA DE ARQUITECTURA: Queda pendiente la definición del proveedor externo comercial.
/// No inventar endpoints simulados. Esta interfaz define la abstracción requerida.
/// </summary>
public interface IProveedorServicios
{
    Task<bool> ProveedorEstaConfiguradoAsync();
    Task<string> ConsultarCatalogoServiciosAsync();
}
