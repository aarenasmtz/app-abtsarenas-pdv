namespace PdvAbarrotes.Dominio.Excepciones;

/// <summary>
/// Excepción lanzada cuando se infringe una regla de negocio del sistema PDV.
/// </summary>
public class ExcepcionReglaNegocio : Exception
{
    public ExcepcionReglaNegocio(string mensaje) : base(mensaje)
    {
    }

    public ExcepcionReglaNegocio(string mensaje, Exception excepcionInterna) : base(mensaje, excepcionInterna)
    {
    }
}
