namespace PdvAbarrotes.Aplicacion.DTOs.Autenticacion;

/// <summary>
/// Parámetros para actualizar la contraseña del usuario actual autenticado.
/// </summary>
public class CambiarClaveDto
{
    public string ClaveActual { get; set; } = string.Empty;
    public string NuevaClave { get; set; } = string.Empty;
}
