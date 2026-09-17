using PdvAbarrotes.Aplicacion.Comun;
using Xunit;

namespace PdvAbarrotes.Tests;

/// <summary>
/// Pruebas unitarias para validar modelos base, paginación server-side y respuestas estándar.
/// </summary>
public class PruebasDominio
{
    [Fact]
    public void FiltroPaginacion_ValoresPorDefecto_DebeRetornar25PorDefecto()
    {
        // Arrange & Act
        var filtro = new FiltroPaginacionDto();

        // Assert
        Assert.Equal(1, filtro.Pagina);
        Assert.Equal(25, filtro.RegistrosPorPagina);
    }

    [Theory]
    [InlineData(10, 25)]
    [InlineData(25, 25)]
    [InlineData(40, 50)]
    [InlineData(50, 50)]
    [InlineData(80, 100)]
    [InlineData(100, 100)]
    [InlineData(200, 100)] // Máximo 100 permitido
    public void FiltroPaginacion_AjustaRegistrosPorPagina_SegunRegla25_50_100(int solicitado, int esperado)
    {
        // Arrange
        var filtro = new FiltroPaginacionDto();

        // Act
        filtro.RegistrosPorPagina = solicitado;

        // Assert
        Assert.Equal(esperado, filtro.RegistrosPorPagina);
    }

    [Fact]
    public void ResultadoPaginado_CalculaTotalPaginasCorrectamente()
    {
        // Arrange
        var lista = new List<string> { "Prod1", "Prod2" };

        // Act
        var resultado = new ResultadoPaginado<string>(lista, totalRegistros: 55, paginaActual: 1, registrosPorPagina: 25);

        // Assert
        Assert.Equal(3, resultado.TotalPaginas);
        Assert.False(resultado.TienePaginaAnterior);
        Assert.True(resultado.TienePaginaSiguiente);
    }

    [Fact]
    public void RespuestaApi_Satisfactorio_GeneraRespuestaExitosa()
    {
        // Act
        var respuesta = RespuestaApi<string>.Satisfactorio("Datos de prueba", "Operación correcta");

        // Assert
        Assert.True(respuesta.Exito);
        Assert.Equal("Datos de prueba", respuesta.Datos);
        Assert.Equal("Operación correcta", respuesta.Mensaje);
        Assert.Null(respuesta.Errores);
    }
}
