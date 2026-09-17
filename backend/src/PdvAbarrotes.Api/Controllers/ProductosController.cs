using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PdvAbarrotes.Aplicacion.Comun;
using PdvAbarrotes.Aplicacion.DTOs.Productos;
using PdvAbarrotes.Aplicacion.Interfaces;

namespace PdvAbarrotes.Api.Controllers;

/// <summary>
/// Controlador principal para el catálogo de productos y operaciones rápidas de venta en PDV.
/// </summary>
[Authorize]
public class ProductosController : ControladorBase
{
    private readonly IServicioProductos _servicioProductos;

    public ProductosController(IServicioProductos servicioProductos)
    {
        _servicioProductos = servicioProductos;
    }

    /// <summary>
    /// Consulta paginada server-side del catálogo para el panel administrativo (25/50/100 registros con filtros).
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "Administrador")]
    public async Task<ActionResult<RespuestaApi<ResultadoPaginado<ProductoAdminDto>>>> ObtenerPaginado(
        [FromQuery] FiltroProductosDto filtro, 
        CancellationToken cancellationToken)
    {
        var resultado = await _servicioProductos.ObtenerPaginadoAdminAsync(filtro, cancellationToken);
        return RespuestaExito(resultado);
    }

    /// <summary>
    /// Consulta el detalle completo de un producto por su Id (Exclusivo Administrador).
    /// </summary>
    [HttpGet("{id:int}")]
    [Authorize(Roles = "Administrador")]
    public async Task<ActionResult<RespuestaApi<ProductoAdminDto>>> ObtenerPorId(
        int id, 
        CancellationToken cancellationToken)
    {
        var producto = await _servicioProductos.ObtenerPorIdAsync(id, cancellationToken);
        return RespuestaExito(producto);
    }

    /// <summary>
    /// Da de alta un nuevo producto en el catálogo y genera su inventario inicial (Exclusivo Administrador).
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Administrador")]
    public async Task<ActionResult<RespuestaApi<ProductoAdminDto>>> Crear(
        [FromBody] CrearProductoDto nuevoProducto, 
        CancellationToken cancellationToken)
    {
        var creado = await _servicioProductos.CrearAsync(nuevoProducto, cancellationToken);
        return StatusCode(201, RespuestaApi<ProductoAdminDto>.Satisfactorio(creado, "Producto registrado exitosamente"));
    }

    /// <summary>
    /// Actualiza los datos comerciales, precios o códigos de un producto (Exclusivo Administrador).
    /// </summary>
    [HttpPut("{id:int}")]
    [Authorize(Roles = "Administrador")]
    public async Task<ActionResult<RespuestaApi<ProductoAdminDto>>> Actualizar(
        int id, 
        [FromBody] ActualizarProductoDto datosActualizados, 
        CancellationToken cancellationToken)
    {
        var actualizado = await _servicioProductos.ActualizarAsync(id, datosActualizados, cancellationToken);
        return RespuestaExito(actualizado, "Producto actualizado correctamente");
    }

    /// <summary>
    /// Activa o desactiva un producto del catálogo (Exclusivo Administrador).
    /// </summary>
    [HttpPatch("{id:int}/estado")]
    [Authorize(Roles = "Administrador")]
    public async Task<ActionResult<RespuestaApi<bool>>> CambiarEstado(
        int id, 
        [FromQuery] bool activo, 
        CancellationToken cancellationToken)
    {
        var exito = await _servicioProductos.CambiarEstadoActivoAsync(id, activo, cancellationToken);
        var mensaje = activo ? "Producto reactivado exitosamente" : "Producto desactivado exitosamente";
        return RespuestaExito(exito, mensaje);
    }

    /// <summary>
    /// Sube y asocia una imagen al producto (Exclusivo Administrador).
    /// </summary>
    [HttpPost("{id:int}/imagen")]
    [Authorize(Roles = "Administrador")]
    public async Task<ActionResult<RespuestaApi<string>>> SubirImagen(
        int id, 
        IFormFile archivoImagen, 
        CancellationToken cancellationToken)
    {
        if (archivoImagen == null || archivoImagen.Length == 0)
        {
            return BadRequest(RespuestaApi<string>.Fallido("Debe seleccionar un archivo de imagen válido."));
        }

        using var stream = archivoImagen.OpenReadStream();
        var urlRelativa = await _servicioProductos.ActualizarImagenAsync(id, stream, archivoImagen.FileName, cancellationToken);

        return RespuestaExito(urlRelativa, "Imagen guardada y asociada exitosamente al producto");
    }

    /// <summary>
    /// Consulta ultrarrápida para escáner de código de barras en el Punto de Venta (&lt;50ms).
    /// REGLA ESTRICTA: Retorna modelo ProductoCobroDto sin imagen ni costos confidenciales.
    /// </summary>
    [HttpGet("codigo-barras/{codigo}")]
    public async Task<ActionResult<RespuestaApi<ProductoCobroDto>>> BuscarPorCodigoBarras(
        string codigo, 
        CancellationToken cancellationToken)
    {
        var producto = await _servicioProductos.BuscarPorCodigoBarrasAsync(codigo, cancellationToken);
        return RespuestaExito(producto);
    }

    /// <summary>
    /// Buscador predictivo rápido para la caja del PDV (máximo 15 resultados, sin imágenes).
    /// </summary>
    [HttpGet("buscar-pdv")]
    public async Task<ActionResult<RespuestaApi<IReadOnlyList<ResultadoBusquedaPdvDto>>>> BuscarPdv(
        [FromQuery] string termino, 
        [FromQuery] int limite = 15, 
        CancellationToken cancellationToken = default)
    {
        var resultados = await _servicioProductos.BuscarPdvAsync(termino, limite, cancellationToken);
        return RespuestaExito(resultados);
    }
}
