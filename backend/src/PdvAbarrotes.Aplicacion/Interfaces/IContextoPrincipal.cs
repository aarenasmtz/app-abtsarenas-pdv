using Microsoft.EntityFrameworkCore;
using PdvAbarrotes.Dominio.Entidades;

namespace PdvAbarrotes.Aplicacion.Interfaces;

/// <summary>
/// Contrato de abstracción para el contexto de base de datos de Entity Framework Core.
/// </summary>
public interface IContextoPrincipal
{
    DbSet<Producto> Productos { get; }
    DbSet<CodigoBarras> CodigosBarras { get; }
    DbSet<Categoria> Categorias { get; }
    DbSet<Marca> Marcas { get; }
    DbSet<UnidadMedida> UnidadesMedida { get; }
    DbSet<Inventario> Inventarios { get; }
    DbSet<TipoMovimientoInventario> TiposMovimientoInventario { get; }
    DbSet<MovimientoInventario> MovimientosInventario { get; }
    DbSet<AjusteInventario> AjustesInventario { get; }
    DbSet<DetalleAjusteInventario> DetalleAjustesInventario { get; }
    DbSet<Venta> Ventas { get; }
    DbSet<DetalleVenta> DetalleVentas { get; }
    DbSet<VentaPago> VentaPagos { get; }
    DbSet<TicketPendiente> TicketsPendientes { get; }
    DbSet<DetalleTicketPendiente> DetalleTicketsPendientes { get; }
    DbSet<Cliente> Clientes { get; }
    DbSet<Proveedor> Proveedores { get; }
    DbSet<Usuario> Usuarios { get; }
    DbSet<Rol> Roles { get; }
    DbSet<UsuarioRol> UsuarioRoles { get; }
    DbSet<Caja> Cajas { get; }
    DbSet<TurnoCaja> TurnosCaja { get; }
    DbSet<CorteCaja> CortesCaja { get; }
    DbSet<MovimientoCaja> MovimientosCaja { get; }
    DbSet<BitacoraAuditoria> BitacoraAuditoria { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
