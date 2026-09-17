using Microsoft.EntityFrameworkCore;
using PdvAbarrotes.Aplicacion.Interfaces;
using PdvAbarrotes.Dominio.Entidades;

namespace PdvAbarrotes.Infraestructura.Persistencia;

/// <summary>
/// Contexto principal de Entity Framework Core mapeado a la base de datos PdvAbarrotesArenas.
/// </summary>
public class ContextoPrincipal : DbContext, IContextoPrincipal
{
    public ContextoPrincipal(DbContextOptions<ContextoPrincipal> opciones) : base(opciones)
    {
    }

    public DbSet<Producto> Productos => Set<Producto>();
    public DbSet<CodigoBarras> CodigosBarras => Set<CodigoBarras>();
    public DbSet<Categoria> Categorias => Set<Categoria>();
    public DbSet<Marca> Marcas => Set<Marca>();
    public DbSet<UnidadMedida> UnidadesMedida => Set<UnidadMedida>();
    public DbSet<Inventario> Inventarios => Set<Inventario>();
    public DbSet<TipoMovimientoInventario> TiposMovimientoInventario => Set<TipoMovimientoInventario>();
    public DbSet<MovimientoInventario> MovimientosInventario => Set<MovimientoInventario>();
    public DbSet<AjusteInventario> AjustesInventario => Set<AjusteInventario>();
    public DbSet<DetalleAjusteInventario> DetalleAjustesInventario => Set<DetalleAjusteInventario>();
    public DbSet<Venta> Ventas => Set<Venta>();
    public DbSet<DetalleVenta> DetalleVentas => Set<DetalleVenta>();
    public DbSet<VentaPago> VentaPagos => Set<VentaPago>();
    public DbSet<TicketPendiente> TicketsPendientes => Set<TicketPendiente>();
    public DbSet<DetalleTicketPendiente> DetalleTicketsPendientes => Set<DetalleTicketPendiente>();
    public DbSet<Cliente> Clientes => Set<Cliente>();
    public DbSet<Proveedor> Proveedores => Set<Proveedor>();
    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<Rol> Roles => Set<Rol>();
    public DbSet<UsuarioRol> UsuarioRoles => Set<UsuarioRol>();
    public DbSet<Caja> Cajas => Set<Caja>();
    public DbSet<TurnoCaja> TurnosCaja => Set<TurnoCaja>();
    public DbSet<CorteCaja> CortesCaja => Set<CorteCaja>();
    public DbSet<MovimientoCaja> MovimientosCaja => Set<MovimientoCaja>();
    public DbSet<MetodoPago> MetodosPago => Set<MetodoPago>();
    public DbSet<BitacoraAuditoria> BitacoraAuditoria => Set<BitacoraAuditoria>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Mapeo Métodos de Pago
        modelBuilder.Entity<MetodoPago>(entidad =>
        {
            entidad.ToTable("MetodosPago");
            entidad.HasKey(e => e.IdMetodoPago);
        });

        // Mapeo Producto
        modelBuilder.Entity<Producto>(entidad =>
        {
            entidad.ToTable("Productos");
            entidad.HasKey(e => e.IdProducto);
            entidad.Property(e => e.PrecioCosto).HasPrecision(18, 2);
            entidad.Property(e => e.PrecioVenta).HasPrecision(18, 2);
            entidad.Property(e => e.PrecioMayoreo).HasPrecision(18, 2);
            entidad.Property(e => e.PorcentajeGanancia).HasPrecision(18, 2);
            entidad.Property(e => e.ExistenciaMinima).HasPrecision(18, 4);
            entidad.Property(e => e.ExistenciaMaxima).HasPrecision(18, 4);
            entidad.Property(e => e.ImagenUrl).HasMaxLength(500);

            entidad.HasOne(e => e.Categoria)
                .WithMany(c => c.Productos)
                .HasForeignKey(e => e.IdCategoria)
                .OnDelete(DeleteBehavior.SetNull);

            entidad.HasOne(e => e.Marca)
                .WithMany(m => m.Productos)
                .HasForeignKey(e => e.IdMarca)
                .OnDelete(DeleteBehavior.SetNull);

            entidad.HasOne(e => e.UnidadMedida)
                .WithMany(u => u.Productos)
                .HasForeignKey(e => e.IdUnidadMedida)
                .OnDelete(DeleteBehavior.SetNull);

            entidad.HasOne(e => e.ProveedorPredeterminado)
                .WithMany()
                .HasForeignKey(e => e.IdProveedorPredeterminado)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // Mapeo CodigoBarras
        modelBuilder.Entity<CodigoBarras>(entidad =>
        {
            entidad.ToTable("CodigosBarras");
            entidad.HasKey(e => e.IdCodigoBarras);
            entidad.Property(e => e.CodigoValor).HasColumnName("CodigoBarras").HasMaxLength(100).IsRequired();

            entidad.HasOne(e => e.Producto)
                .WithMany(p => p.CodigosBarras)
                .HasForeignKey(e => e.IdProducto)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Mapeo Categorias
        modelBuilder.Entity<Categoria>(entidad =>
        {
            entidad.ToTable("Categorias");
            entidad.HasKey(e => e.IdCategoria);
        });

        // Mapeo Marcas
        modelBuilder.Entity<Marca>(entidad =>
        {
            entidad.ToTable("Marcas");
            entidad.HasKey(e => e.IdMarca);
        });

        // Mapeo UnidadesMedida
        modelBuilder.Entity<UnidadMedida>(entidad =>
        {
            entidad.ToTable("UnidadesMedida");
            entidad.HasKey(e => e.IdUnidadMedida);
            entidad.Property(e => e.FactorConversion).HasPrecision(18, 4);
        });

        // Mapeo Inventario
        modelBuilder.Entity<Inventario>(entidad =>
        {
            entidad.ToTable("Inventario");
            entidad.HasKey(e => e.IdInventario);
            entidad.Property(e => e.ExistenciaActual).HasPrecision(18, 4);

            entidad.HasOne(e => e.Producto)
                .WithMany(p => p.Inventarios)
                .HasForeignKey(e => e.IdProducto)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Mapeo TiposMovimientoInventario
        modelBuilder.Entity<TipoMovimientoInventario>(entidad =>
        {
            entidad.ToTable("TiposMovimientoInventario");
            entidad.HasKey(e => e.IdTipoMovimiento);
        });

        // Mapeo MovimientosInventario (Kardex)
        modelBuilder.Entity<MovimientoInventario>(entidad =>
        {
            entidad.ToTable("MovimientosInventario");
            entidad.HasKey(e => e.IdMovimientoInventario);
            entidad.Property(e => e.CantidadAnterior).HasPrecision(18, 4);
            entidad.Property(e => e.CantidadMovimiento).HasPrecision(18, 4);
            entidad.Property(e => e.CantidadNueva).HasPrecision(18, 4);
            entidad.Property(e => e.PrecioCosto).HasPrecision(18, 2);

            entidad.HasOne(e => e.Producto)
                .WithMany()
                .HasForeignKey(e => e.IdProducto)
                .OnDelete(DeleteBehavior.Restrict);

            entidad.HasOne(e => e.TipoMovimiento)
                .WithMany()
                .HasForeignKey(e => e.IdTipoMovimiento)
                .OnDelete(DeleteBehavior.Restrict);

            entidad.HasOne(e => e.Usuario)
                .WithMany()
                .HasForeignKey(e => e.IdUsuario)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // Mapeo AjustesInventario
        modelBuilder.Entity<AjusteInventario>(entidad =>
        {
            entidad.ToTable("AjustesInventario");
            entidad.HasKey(e => e.IdAjusteInventario);

            entidad.HasOne(e => e.Usuario)
                .WithMany()
                .HasForeignKey(e => e.IdUsuario)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Mapeo DetalleAjustesInventario
        modelBuilder.Entity<DetalleAjusteInventario>(entidad =>
        {
            entidad.ToTable("DetalleAjustesInventario");
            entidad.HasKey(e => e.IdDetalleAjuste);
            entidad.Property(e => e.Cantidad).HasPrecision(18, 4);
            entidad.Property(e => e.PrecioCosto).HasPrecision(18, 2);

            entidad.HasOne(e => e.AjusteInventario)
                .WithMany(a => a.Detalles)
                .HasForeignKey(e => e.IdAjusteInventario)
                .OnDelete(DeleteBehavior.Cascade);

            entidad.HasOne(e => e.Producto)
                .WithMany()
                .HasForeignKey(e => e.IdProducto)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Mapeo Ventas
        modelBuilder.Entity<Venta>(entidad =>
        {
            entidad.ToTable("Ventas");
            entidad.HasKey(e => e.IdVenta);
            entidad.Property(e => e.Subtotal).HasPrecision(18, 2);
            entidad.Property(e => e.Descuento).HasPrecision(18, 2);
            entidad.Property(e => e.Impuesto).HasPrecision(18, 2);
            entidad.Property(e => e.Total).HasPrecision(18, 2);
            entidad.Property(e => e.Ganancia).HasPrecision(18, 2);
            entidad.Property(e => e.ImporteRecibido).HasPrecision(18, 2);
            entidad.Property(e => e.Cambio).HasPrecision(18, 2);
            entidad.Property(e => e.NumeroArticulos).HasPrecision(18, 4);

            entidad.HasOne(e => e.Cliente)
                .WithMany()
                .HasForeignKey(e => e.IdCliente)
                .OnDelete(DeleteBehavior.Restrict);

            entidad.HasOne(e => e.Usuario)
                .WithMany()
                .HasForeignKey(e => e.IdUsuario)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Mapeo DetalleVentas
        modelBuilder.Entity<DetalleVenta>(entidad =>
        {
            entidad.ToTable("DetalleVentas");
            entidad.HasKey(e => e.IdDetalleVenta);
            entidad.Property(e => e.Cantidad).HasPrecision(18, 4);
            entidad.Property(e => e.PrecioCosto).HasPrecision(18, 2);
            entidad.Property(e => e.PrecioUnitario).HasPrecision(18, 2);
            entidad.Property(e => e.Descuento).HasPrecision(18, 2);
            entidad.Property(e => e.Impuesto).HasPrecision(18, 2);
            entidad.Property(e => e.Subtotal).HasPrecision(18, 2);
            entidad.Property(e => e.Total).HasPrecision(18, 2);
            entidad.Property(e => e.Ganancia).HasPrecision(18, 2);
            entidad.Property(e => e.CantidadDevuelta).HasPrecision(18, 4);

            entidad.HasOne(e => e.Venta)
                .WithMany(v => v.Detalles)
                .HasForeignKey(e => e.IdVenta)
                .OnDelete(DeleteBehavior.Cascade);

            entidad.HasOne(e => e.Producto)
                .WithMany()
                .HasForeignKey(e => e.IdProducto)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Mapeo VentaPagos
        modelBuilder.Entity<VentaPago>(entidad =>
        {
            entidad.ToTable("VentaPagos");
            entidad.HasKey(e => e.IdVentaPago);
            entidad.Property(e => e.Importe).HasPrecision(18, 2);

            entidad.HasOne(e => e.Venta)
                .WithMany(v => v.Pagos)
                .HasForeignKey(e => e.IdVenta)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Mapeo TicketsPendientes
        modelBuilder.Entity<TicketPendiente>(entidad =>
        {
            entidad.ToTable("TicketsPendientes");
            entidad.HasKey(e => e.IdTicketPendiente);
            entidad.Property(e => e.Total).HasPrecision(18, 2);
        });

        // Mapeo DetalleTicketsPendientes
        modelBuilder.Entity<DetalleTicketPendiente>(entidad =>
        {
            entidad.ToTable("DetalleTicketsPendientes");
            entidad.HasKey(e => e.IdDetalleTicketPendiente);
            entidad.Property(e => e.Cantidad).HasPrecision(18, 4);
            entidad.Property(e => e.PrecioUnitario).HasPrecision(18, 2);
            entidad.Property(e => e.Subtotal).HasPrecision(18, 2);

            entidad.HasOne(e => e.TicketPendiente)
                .WithMany(t => t.Detalles)
                .HasForeignKey(e => e.IdTicketPendiente)
                .OnDelete(DeleteBehavior.Cascade);

            entidad.HasOne(e => e.Producto)
                .WithMany()
                .HasForeignKey(e => e.IdProducto)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Mapeo Clientes
        modelBuilder.Entity<Cliente>(entidad =>
        {
            entidad.ToTable("Clientes");
            entidad.HasKey(e => e.IdCliente);
            entidad.Property(e => e.LimiteCredito).HasPrecision(18, 2);
            entidad.Property(e => e.SaldoActual).HasPrecision(18, 2);
        });

        // Mapeo Proveedores
        modelBuilder.Entity<Proveedor>(entidad =>
        {
            entidad.ToTable("Proveedores");
            entidad.HasKey(e => e.IdProveedor);
        });

        // Mapeo Usuarios y Roles
        modelBuilder.Entity<Usuario>(entidad =>
        {
            entidad.ToTable("Usuarios");
            entidad.HasKey(e => e.IdUsuario);
        });

        modelBuilder.Entity<Rol>(entidad =>
        {
            entidad.ToTable("Roles");
            entidad.HasKey(e => e.IdRol);
        });

        modelBuilder.Entity<UsuarioRol>(entidad =>
        {
            entidad.ToTable("UsuarioRoles");
            entidad.HasKey(e => e.IdUsuarioRol);

            entidad.HasOne(e => e.Usuario)
                .WithMany()
                .HasForeignKey(e => e.IdUsuario)
                .OnDelete(DeleteBehavior.Cascade);

            entidad.HasOne(e => e.Rol)
                .WithMany()
                .HasForeignKey(e => e.IdRol)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Mapeo Caja y Turnos
        modelBuilder.Entity<Caja>(entidad =>
        {
            entidad.ToTable("Cajas");
            entidad.HasKey(e => e.IdCaja);
        });

        modelBuilder.Entity<TurnoCaja>(entidad =>
        {
            entidad.ToTable("TurnosCaja");
            entidad.HasKey(e => e.IdTurnoCaja);

            entidad.HasOne(e => e.Caja)
                .WithMany()
                .HasForeignKey(e => e.IdCaja)
                .OnDelete(DeleteBehavior.Restrict);

            entidad.HasOne(e => e.Usuario)
                .WithMany()
                .HasForeignKey(e => e.IdUsuario)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<CorteCaja>(entidad =>
        {
            entidad.ToTable("CortesCaja");
            entidad.HasKey(e => e.IdCorteCaja);
            entidad.Property(e => e.MontoInicial).HasPrecision(18, 2);
            entidad.Property(e => e.VentasEfectivo).HasPrecision(18, 2);
            entidad.Property(e => e.VentasTarjeta).HasPrecision(18, 2);
            entidad.Property(e => e.VentasVales).HasPrecision(18, 2);
            entidad.Property(e => e.VentasCredito).HasPrecision(18, 2);
            entidad.Property(e => e.EntradasEfectivo).HasPrecision(18, 2);
            entidad.Property(e => e.SalidasEfectivo).HasPrecision(18, 2);
            entidad.Property(e => e.TotalEsperado).HasPrecision(18, 2);
            entidad.Property(e => e.TotalContado).HasPrecision(18, 2);
            entidad.Property(e => e.Diferencia).HasPrecision(18, 2);
        });

        modelBuilder.Entity<MovimientoCaja>(entidad =>
        {
            entidad.ToTable("MovimientosCaja");
            entidad.HasKey(e => e.IdMovimientoCaja);
            entidad.Property(e => e.Monto).HasPrecision(18, 2);
        });

        // Mapeo BitacoraAuditoria
        modelBuilder.Entity<BitacoraAuditoria>(entidad =>
        {
            entidad.ToTable("BitacoraAuditoria");
            entidad.HasKey(e => e.IdAuditoria);
        });
    }
}
