namespace PdvAbarrotes.Aplicacion.Comun;

/// <summary>
/// Envoltorio estándar en español para todas las respuestas de la API.
/// </summary>
/// <typeparam name="T">Tipo de dato contenido en la respuesta.</typeparam>
public class RespuestaApi<T>
{
    public bool Exito { get; set; }
    public string Mensaje { get; set; } = string.Empty;
    public T? Datos { get; set; }
    public List<string>? Errores { get; set; }

    public static RespuestaApi<T> Satisfactorio(T datos, string mensaje = "Operación exitosa")
    {
        return new RespuestaApi<T>
        {
            Exito = true,
            Mensaje = mensaje,
            Datos = datos,
            Errores = null
        };
    }

    public static RespuestaApi<T> Fallido(string mensaje, List<string>? errores = null)
    {
        return new RespuestaApi<T>
        {
            Exito = false,
            Mensaje = mensaje,
            Datos = default,
            Errores = errores ?? new List<string> { mensaje }
        };
    }

    public static RespuestaApi<T> CrearExito(T datos, string mensaje = "Operación exitosa") => Satisfactorio(datos, mensaje);
    public static RespuestaApi<T> CrearError(string mensaje, List<string>? errores = null) => Fallido(mensaje, errores);
}
