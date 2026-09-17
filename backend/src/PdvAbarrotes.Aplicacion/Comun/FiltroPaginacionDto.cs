namespace PdvAbarrotes.Aplicacion.Comun;

/// <summary>
/// Parámetros para solicitudes con paginación server-side.
/// Aplica reglas innegociables: 25 por defecto, opciones 25/50/100, máximo 100.
/// </summary>
public class FiltroPaginacionDto
{
    private int _pagina = 1;
    private int _registrosPorPagina = 25;

    public int Pagina
    {
        get => _pagina;
        set => _pagina = value < 1 ? 1 : value;
    }

    public int RegistrosPorPagina
    {
        get => _registrosPorPagina;
        set
        {
            // Opciones permitidas: 25, 50, 100. Máximo 100 por página.
            if (value <= 25) _registrosPorPagina = 25;
            else if (value <= 50) _registrosPorPagina = 50;
            else _registrosPorPagina = 100;
        }
    }

    public string? Busqueda { get; set; }
}
