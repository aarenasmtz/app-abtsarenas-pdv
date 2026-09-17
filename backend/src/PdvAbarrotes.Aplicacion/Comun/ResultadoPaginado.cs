namespace PdvAbarrotes.Aplicacion.Comun;

/// <summary>
/// Modelo de paginación server-side en español.
/// </summary>
/// <typeparam name="T">Tipo del elemento de la lista.</typeparam>
public class ResultadoPaginado<T>
{
    public IReadOnlyList<T> Elementos { get; set; } = new List<T>();
    public int PaginaActual { get; set; }
    public int RegistrosPorPagina { get; set; }
    public int TotalRegistros { get; set; }
    public int TotalPaginas { get; set; }
    public bool TienePaginaAnterior => PaginaActual > 1;
    public bool TienePaginaSiguiente => PaginaActual < TotalPaginas;

    public ResultadoPaginado()
    {
    }

    public ResultadoPaginado(IReadOnlyList<T> elementos, int totalRegistros, int paginaActual, int registrosPorPagina)
    {
        Elementos = elementos;
        TotalRegistros = totalRegistros;
        PaginaActual = paginaActual;
        RegistrosPorPagina = registrosPorPagina;
        TotalPaginas = registrosPorPagina > 0 ? (int)Math.Ceiling(totalRegistros / (double)registrosPorPagina) : 0;
    }
}
