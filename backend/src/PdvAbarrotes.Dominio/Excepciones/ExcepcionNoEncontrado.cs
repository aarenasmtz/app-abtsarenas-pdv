namespace PdvAbarrotes.Dominio.Excepciones;

/// <summary>
/// Excepción lanzada cuando una entidad solicitada no existe en la base de datos.
/// </summary>
public class ExcepcionNoEncontrado : Exception
{
    public string NombreEntidad { get; }
    public object Clave { get; }

    public ExcepcionNoEncontrado(string nombreEntidad, object clave)
        : base($"No se encontró el registro de tipo '{nombreEntidad}' con identificador '{clave}'.")
    {
        NombreEntidad = nombreEntidad;
        Clave = clave;
    }
}
