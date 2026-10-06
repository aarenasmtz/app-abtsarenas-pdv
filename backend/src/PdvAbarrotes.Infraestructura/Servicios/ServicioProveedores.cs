using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using PdvAbarrotes.Aplicacion.Comun;
using PdvAbarrotes.Aplicacion.DTOs.Proveedores;
using PdvAbarrotes.Aplicacion.Interfaces;
using PdvAbarrotes.Dominio.Entidades;

namespace PdvAbarrotes.Infraestructura.Servicios;

/// <summary>
/// Implementación del catálogo y mantenimiento de proveedores comerciales.
/// </summary>
public class ServicioProveedores : IServicioProveedores
{
    private readonly IContextoPrincipal _contexto;
    private readonly IServicioAuditoria _servicioAuditoria;
    private readonly ILogger<ServicioProveedores> _logger;

    public ServicioProveedores(
        IContextoPrincipal contexto,
        IServicioAuditoria servicioAuditoria,
        ILogger<ServicioProveedores> logger)
    {
        _contexto = contexto;
        _servicioAuditoria = servicioAuditoria;
        _logger = logger;
    }

    public async Task<ResultadoPaginado<ProveedorDto>> ObtenerPaginadoAsync(FiltroProveedoresDto filtro, CancellationToken ct = default)
    {
        var consulta = _contexto.Proveedores.AsNoTracking().AsQueryable();

        if (filtro.SoloActivos == true)
        {
            consulta = consulta.Where(p => p.Activo);
        }

        if (!string.IsNullOrWhiteSpace(filtro.TerminoBusqueda))
        {
            var termino = filtro.TerminoBusqueda.Trim().ToLower();
            consulta = consulta.Where(p => 
                p.Nombre.ToLower().Contains(termino) ||
                (p.NombreContacto != null && p.NombreContacto.ToLower().Contains(termino)) ||
                (p.Rfc != null && p.Rfc.ToLower().Contains(termino)) ||
                (p.Telefono != null && p.Telefono.Contains(termino)));
        }

        var totalRegistros = await consulta.CountAsync(ct);

        var proveedores = await consulta
            .OrderBy(p => p.Nombre)
            .Skip((filtro.Pagina - 1) * filtro.RegistrosPorPagina)
            .Take(filtro.RegistrosPorPagina)
            .ToListAsync(ct);

        var elementosDto = proveedores.Select(p => new ProveedorDto
        {
            IdProveedor = p.IdProveedor,
            Nombre = p.Nombre,
            NombreContacto = p.NombreContacto,
            Rfc = p.Rfc,
            Telefono = p.Telefono,
            Correo = p.Correo,
            Direccion = p.Direccion,
            Notas = p.Notas,
            Activo = p.Activo,
            FechaRegistro = p.FechaRegistro,
            TotalComprasRegistradas = 0
        }).ToList();

        return new ResultadoPaginado<ProveedorDto>(
            elementosDto,
            totalRegistros,
            filtro.Pagina,
            filtro.RegistrosPorPagina);
    }

    public async Task<IReadOnlyList<ProveedorDto>> ObtenerTodosActivosAsync(CancellationToken ct = default)
    {
        var lista = await _contexto.Proveedores
            .AsNoTracking()
            .Where(p => p.Activo)
            .OrderBy(p => p.Nombre)
            .ToListAsync(ct);

        return lista.Select(p => new ProveedorDto
        {
            IdProveedor = p.IdProveedor,
            Nombre = p.Nombre,
            NombreContacto = p.NombreContacto,
            Rfc = p.Rfc,
            Telefono = p.Telefono,
            Correo = p.Correo,
            Direccion = p.Direccion,
            Notas = p.Notas,
            Activo = p.Activo,
            FechaRegistro = p.FechaRegistro,
            TotalComprasRegistradas = 0
        }).ToList();
    }

    public async Task<ProveedorDto?> ObtenerPorIdAsync(int id, CancellationToken ct = default)
    {
        var p = await _contexto.Proveedores
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.IdProveedor == id, ct);

        if (p == null) return null;

        return new ProveedorDto
        {
            IdProveedor = p.IdProveedor,
            Nombre = p.Nombre,
            NombreContacto = p.NombreContacto,
            Rfc = p.Rfc,
            Telefono = p.Telefono,
            Correo = p.Correo,
            Direccion = p.Direccion,
            Notas = p.Notas,
            Activo = p.Activo,
            FechaRegistro = p.FechaRegistro,
            TotalComprasRegistradas = 0
        };
    }

    public async Task<ProveedorDto> CrearAsync(CrearProveedorDto dto, int idUsuario, CancellationToken ct = default)
    {
        var existe = await _contexto.Proveedores
            .AnyAsync(p => p.Nombre.ToLower() == dto.Nombre.Trim().ToLower(), ct);

        if (existe)
        {
            throw new InvalidOperationException($"Ya existe un proveedor registrado con el nombre '{dto.Nombre.Trim()}'.");
        }

        var nuevo = new Proveedor
        {
            Nombre = dto.Nombre.Trim(),
            NombreContacto = dto.NombreContacto?.Trim(),
            Rfc = dto.Rfc?.Trim().ToUpper(),
            Telefono = dto.Telefono?.Trim(),
            Correo = dto.Correo?.Trim().ToLower(),
            Direccion = dto.Direccion?.Trim(),
            Notas = dto.Notas?.Trim(),
            Activo = true,
            FechaRegistro = DateTime.Now
        };

        _contexto.Proveedores.Add(nuevo);
        await _contexto.SaveChangesAsync(ct);

        await _servicioAuditoria.RegistrarAsync(
            "Proveedores",
            nuevo.IdProveedor,
            "CREAR",
            null,
            $"Nombre: {nuevo.Nombre}, RFC: {nuevo.Rfc}",
            ct
        );

        return new ProveedorDto
        {
            IdProveedor = nuevo.IdProveedor,
            Nombre = nuevo.Nombre,
            NombreContacto = nuevo.NombreContacto,
            Rfc = nuevo.Rfc,
            Telefono = nuevo.Telefono,
            Correo = nuevo.Correo,
            Direccion = nuevo.Direccion,
            Notas = nuevo.Notas,
            Activo = nuevo.Activo,
            FechaRegistro = nuevo.FechaRegistro,
            TotalComprasRegistradas = 0
        };
    }

    public async Task<ProveedorDto> ActualizarAsync(ActualizarProveedorDto dto, int idUsuario, CancellationToken ct = default)
    {
        var proveedor = await _contexto.Proveedores.FindAsync(new object[] { dto.IdProveedor }, ct);
        if (proveedor == null)
        {
            throw new KeyNotFoundException($"El proveedor #{dto.IdProveedor} no fue encontrado.");
        }

        var duplicado = await _contexto.Proveedores
            .AnyAsync(p => p.IdProveedor != dto.IdProveedor && p.Nombre.ToLower() == dto.Nombre.Trim().ToLower(), ct);

        if (duplicado)
        {
            throw new InvalidOperationException($"Ya existe otro proveedor registrado con el nombre '{dto.Nombre.Trim()}'.");
        }

        string valorAnterior = $"Nombre: {proveedor.Nombre}, Contacto: {proveedor.NombreContacto}, Tel: {proveedor.Telefono}, Activo: {proveedor.Activo}";

        proveedor.Nombre = dto.Nombre.Trim();
        proveedor.NombreContacto = dto.NombreContacto?.Trim();
        proveedor.Rfc = dto.Rfc?.Trim().ToUpper();
        proveedor.Telefono = dto.Telefono?.Trim();
        proveedor.Correo = dto.Correo?.Trim().ToLower();
        proveedor.Direccion = dto.Direccion?.Trim();
        proveedor.Notas = dto.Notas?.Trim();
        proveedor.Activo = dto.Activo;

        await _contexto.SaveChangesAsync(ct);

        string valorNuevo = $"Nombre: {proveedor.Nombre}, Contacto: {proveedor.NombreContacto}, Tel: {proveedor.Telefono}, Activo: {proveedor.Activo}";

        await _servicioAuditoria.RegistrarAsync(
            "Proveedores",
            proveedor.IdProveedor,
            "ACTUALIZAR",
            valorAnterior,
            valorNuevo,
            ct
        );

        return new ProveedorDto
        {
            IdProveedor = proveedor.IdProveedor,
            Nombre = proveedor.Nombre,
            NombreContacto = proveedor.NombreContacto,
            Rfc = proveedor.Rfc,
            Telefono = proveedor.Telefono,
            Correo = proveedor.Correo,
            Direccion = proveedor.Direccion,
            Notas = proveedor.Notas,
            Activo = proveedor.Activo,
            FechaRegistro = proveedor.FechaRegistro,
            TotalComprasRegistradas = 0
        };
    }

    public async Task<bool> CambiarEstadoActivoAsync(int id, bool activo, int idUsuario, CancellationToken ct = default)
    {
        var proveedor = await _contexto.Proveedores.FindAsync(new object[] { id }, ct);
        if (proveedor == null)
        {
            throw new KeyNotFoundException($"El proveedor #{id} no fue encontrado.");
        }

        bool estadoAnterior = proveedor.Activo;
        proveedor.Activo = activo;
        await _contexto.SaveChangesAsync(ct);

        await _servicioAuditoria.RegistrarAsync(
            "Proveedores",
            proveedor.IdProveedor,
            activo ? "ACTIVAR" : "DESACTIVAR",
            $"Activo: {estadoAnterior}",
            $"Activo: {activo}",
            ct
        );

        return true;
    }
}
