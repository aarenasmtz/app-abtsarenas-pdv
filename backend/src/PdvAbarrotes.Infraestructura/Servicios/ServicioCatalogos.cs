using Microsoft.EntityFrameworkCore;
using PdvAbarrotes.Aplicacion.DTOs.Catalogos;
using PdvAbarrotes.Aplicacion.Interfaces;
using PdvAbarrotes.Dominio.Entidades;
using PdvAbarrotes.Dominio.Excepciones;
using PdvAbarrotes.Infraestructura.Persistencia;

namespace PdvAbarrotes.Infraestructura.Servicios;

/// <summary>
/// Implementación de la gestión de catálogos generales (Categorías, Marcas, Unidades de Medida).
/// </summary>
public class ServicioCatalogos : IServicioCatalogos
{
    private readonly ContextoPrincipal _contexto;
    private readonly IServicioAuditoria _servicioAuditoria;

    public ServicioCatalogos(ContextoPrincipal contexto, IServicioAuditoria servicioAuditoria)
    {
        _contexto = contexto;
        _servicioAuditoria = servicioAuditoria;
    }

    public async Task<IReadOnlyList<CategoriaDto>> ObtenerCategoriasAsync(bool soloActivos = false, CancellationToken cancellationToken = default)
    {
        var consulta = _contexto.Categorias.AsNoTracking().AsQueryable();

        if (soloActivos)
        {
            consulta = consulta.Where(c => c.Activo);
        }

        var lista = await consulta
            .OrderBy(c => c.Descripcion)
            .Select(c => new CategoriaDto
            {
                IdCategoria = c.IdCategoria,
                Descripcion = c.Descripcion,
                Activo = c.Activo,
                TotalProductos = c.Productos.Count()
            })
            .ToListAsync(cancellationToken);

        return lista;
    }

    public async Task<CategoriaDto> GuardarCategoriaAsync(int? idCategoria, CrearActualizarCatalogoDto dto, CancellationToken cancellationToken = default)
    {
        var descripcionLimpia = dto.Descripcion?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(descripcionLimpia))
        {
            throw new ExcepcionReglaNegocio("La descripción de la categoría es requerida.");
        }

        Categoria categoria;

        if (idCategoria.HasValue && idCategoria.Value > 0)
        {
            categoria = await _contexto.Categorias.FirstOrDefaultAsync(c => c.IdCategoria == idCategoria.Value, cancellationToken)
                ?? throw new ExcepcionNoEncontrado("Categoria", idCategoria.Value);

            var valorAnterior = $"Descripcion: {categoria.Descripcion}, Activo: {categoria.Activo}";
            categoria.Descripcion = descripcionLimpia;
            categoria.Activo = dto.Activo;

            await _contexto.SaveChangesAsync(cancellationToken);

            var valorNuevo = $"Descripcion: {categoria.Descripcion}, Activo: {categoria.Activo}";
            await _servicioAuditoria.RegistrarAsync("Categorias", categoria.IdCategoria, "ACTUALIZAR", valorAnterior, valorNuevo, cancellationToken);
        }
        else
        {
            // Validar que no exista con el mismo nombre
            var existe = await _contexto.Categorias.AnyAsync(c => c.Descripcion.ToLower() == descripcionLimpia.ToLower(), cancellationToken);
            if (existe)
            {
                throw new ExcepcionReglaNegocio($"Ya existe una categoría con el nombre '{descripcionLimpia}'.");
            }

            categoria = new Categoria
            {
                Descripcion = descripcionLimpia,
                Activo = dto.Activo,
                FechaRegistro = DateTime.Now
            };

            _contexto.Categorias.Add(categoria);
            await _contexto.SaveChangesAsync(cancellationToken);

            var valorNuevo = $"Descripcion: {categoria.Descripcion}, Activo: {categoria.Activo}";
            await _servicioAuditoria.RegistrarAsync("Categorias", categoria.IdCategoria, "CREAR", null, valorNuevo, cancellationToken);
        }

        return new CategoriaDto
        {
            IdCategoria = categoria.IdCategoria,
            Descripcion = categoria.Descripcion,
            Activo = categoria.Activo,
            TotalProductos = await _contexto.Productos.CountAsync(p => p.IdCategoria == categoria.IdCategoria, cancellationToken)
        };
    }

    public async Task<IReadOnlyList<MarcaDto>> ObtenerMarcasAsync(bool soloActivos = false, CancellationToken cancellationToken = default)
    {
        var consulta = _contexto.Marcas.AsNoTracking().AsQueryable();

        if (soloActivos)
        {
            consulta = consulta.Where(m => m.Activo);
        }

        var lista = await consulta
            .OrderBy(m => m.Descripcion)
            .Select(m => new MarcaDto
            {
                IdMarca = m.IdMarca,
                Descripcion = m.Descripcion,
                Activo = m.Activo,
                TotalProductos = m.Productos.Count()
            })
            .ToListAsync(cancellationToken);

        return lista;
    }

    public async Task<MarcaDto> GuardarMarcaAsync(int? idMarca, CrearActualizarCatalogoDto dto, CancellationToken cancellationToken = default)
    {
        var descripcionLimpia = dto.Descripcion?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(descripcionLimpia))
        {
            throw new ExcepcionReglaNegocio("La descripción de la marca es requerida.");
        }

        Marca marca;

        if (idMarca.HasValue && idMarca.Value > 0)
        {
            marca = await _contexto.Marcas.FirstOrDefaultAsync(m => m.IdMarca == idMarca.Value, cancellationToken)
                ?? throw new ExcepcionNoEncontrado("Marca", idMarca.Value);

            var valorAnterior = $"Descripcion: {marca.Descripcion}, Activo: {marca.Activo}";
            marca.Descripcion = descripcionLimpia;
            marca.Activo = dto.Activo;

            await _contexto.SaveChangesAsync(cancellationToken);

            var valorNuevo = $"Descripcion: {marca.Descripcion}, Activo: {marca.Activo}";
            await _servicioAuditoria.RegistrarAsync("Marcas", marca.IdMarca, "ACTUALIZAR", valorAnterior, valorNuevo, cancellationToken);
        }
        else
        {
            var existe = await _contexto.Marcas.AnyAsync(m => m.Descripcion.ToLower() == descripcionLimpia.ToLower(), cancellationToken);
            if (existe)
            {
                throw new ExcepcionReglaNegocio($"Ya existe una marca con el nombre '{descripcionLimpia}'.");
            }

            marca = new Marca
            {
                Descripcion = descripcionLimpia,
                Activo = dto.Activo,
                FechaRegistro = DateTime.Now
            };

            _contexto.Marcas.Add(marca);
            await _contexto.SaveChangesAsync(cancellationToken);

            var valorNuevo = $"Descripcion: {marca.Descripcion}, Activo: {marca.Activo}";
            await _servicioAuditoria.RegistrarAsync("Marcas", marca.IdMarca, "CREAR", null, valorNuevo, cancellationToken);
        }

        return new MarcaDto
        {
            IdMarca = marca.IdMarca,
            Descripcion = marca.Descripcion,
            Activo = marca.Activo,
            TotalProductos = await _contexto.Productos.CountAsync(p => p.IdMarca == marca.IdMarca, cancellationToken)
        };
    }

    public async Task<IReadOnlyList<UnidadMedidaDto>> ObtenerUnidadesMedidaAsync(bool soloActivos = true, CancellationToken cancellationToken = default)
    {
        var consulta = _contexto.UnidadesMedida.AsNoTracking().AsQueryable();

        if (soloActivos)
        {
            consulta = consulta.Where(u => u.Activo);
        }

        var lista = await consulta
            .OrderBy(u => u.IdUnidadMedida)
            .Select(u => new UnidadMedidaDto
            {
                IdUnidadMedida = u.IdUnidadMedida,
                Nombre = u.Nombre,
                Abreviatura = u.Abreviatura,
                PermiteDecimales = u.PermiteDecimales,
                FactorConversion = u.FactorConversion,
                Activo = u.Activo
            })
            .ToListAsync(cancellationToken);

        return lista;
    }
}
