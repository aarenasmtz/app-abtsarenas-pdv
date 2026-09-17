-- ============================================================================
-- SCRIPT 12: CREAR LLAVES FORANEAS (INTEGRIDAD REFERENCIAL)
-- PROYECTO: SISTEMA PUNTO DE VENTA (PDV) - ABARROTES ARENAS
-- BASE DE DATOS: PdvAbarrotesArenas
-- ============================================================================

USE PdvAbarrotesArenas;
GO

-- PRODUCTOS
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Productos_Categorias')
    ALTER TABLE dbo.Productos ADD CONSTRAINT FK_Productos_Categorias 
    FOREIGN KEY (IdCategoria) REFERENCES dbo.Categorias(IdCategoria);

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Productos_Marcas')
    ALTER TABLE dbo.Productos ADD CONSTRAINT FK_Productos_Marcas 
    FOREIGN KEY (IdMarca) REFERENCES dbo.Marcas(IdMarca);

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Productos_UnidadesMedida')
    ALTER TABLE dbo.Productos ADD CONSTRAINT FK_Productos_UnidadesMedida 
    FOREIGN KEY (IdUnidadMedida) REFERENCES dbo.UnidadesMedida(IdUnidadMedida);

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Productos_Proveedores')
    ALTER TABLE dbo.Productos ADD CONSTRAINT FK_Productos_Proveedores 
    FOREIGN KEY (IdProveedorPredeterminado) REFERENCES dbo.Proveedores(IdProveedor);

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_CodigosBarras_Productos')
    ALTER TABLE dbo.CodigosBarras ADD CONSTRAINT FK_CodigosBarras_Productos 
    FOREIGN KEY (IdProducto) REFERENCES dbo.Productos(IdProducto);

-- INVENTARIO
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Inventario_Sucursales')
    ALTER TABLE dbo.Inventario ADD CONSTRAINT FK_Inventario_Sucursales 
    FOREIGN KEY (IdSucursal) REFERENCES dbo.Sucursales(IdSucursal);

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Inventario_Productos')
    ALTER TABLE dbo.Inventario ADD CONSTRAINT FK_Inventario_Productos 
    FOREIGN KEY (IdProducto) REFERENCES dbo.Productos(IdProducto);

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_MovimientosInventario_Sucursales')
    ALTER TABLE dbo.MovimientosInventario ADD CONSTRAINT FK_MovimientosInventario_Sucursales 
    FOREIGN KEY (IdSucursal) REFERENCES dbo.Sucursales(IdSucursal);

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_MovimientosInventario_Productos')
    ALTER TABLE dbo.MovimientosInventario ADD CONSTRAINT FK_MovimientosInventario_Productos 
    FOREIGN KEY (IdProducto) REFERENCES dbo.Productos(IdProducto);

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_MovimientosInventario_TiposMovimiento')
    ALTER TABLE dbo.MovimientosInventario ADD CONSTRAINT FK_MovimientosInventario_TiposMovimiento 
    FOREIGN KEY (IdTipoMovimiento) REFERENCES dbo.TiposMovimientoInventario(IdTipoMovimiento);

-- COMPRAS
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Compras_Sucursales')
    ALTER TABLE dbo.Compras ADD CONSTRAINT FK_Compras_Sucursales 
    FOREIGN KEY (IdSucursal) REFERENCES dbo.Sucursales(IdSucursal);

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Compras_Proveedores')
    ALTER TABLE dbo.Compras ADD CONSTRAINT FK_Compras_Proveedores 
    FOREIGN KEY (IdProveedor) REFERENCES dbo.Proveedores(IdProveedor);

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Compras_Usuarios')
    ALTER TABLE dbo.Compras ADD CONSTRAINT FK_Compras_Usuarios 
    FOREIGN KEY (IdUsuario) REFERENCES dbo.Usuarios(IdUsuario);

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_DetalleCompras_Compras')
    ALTER TABLE dbo.DetalleCompras ADD CONSTRAINT FK_DetalleCompras_Compras 
    FOREIGN KEY (IdCompra) REFERENCES dbo.Compras(IdCompra);

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_DetalleCompras_Productos')
    ALTER TABLE dbo.DetalleCompras ADD CONSTRAINT FK_DetalleCompras_Productos 
    FOREIGN KEY (IdProducto) REFERENCES dbo.Productos(IdProducto);

-- CAJAS Y TURNOS
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Cajas_Sucursales')
    ALTER TABLE dbo.Cajas ADD CONSTRAINT FK_Cajas_Sucursales 
    FOREIGN KEY (IdSucursal) REFERENCES dbo.Sucursales(IdSucursal);

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_TurnosCaja_Cajas')
    ALTER TABLE dbo.TurnosCaja ADD CONSTRAINT FK_TurnosCaja_Cajas 
    FOREIGN KEY (IdCaja) REFERENCES dbo.Cajas(IdCaja);

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_TurnosCaja_Usuarios')
    ALTER TABLE dbo.TurnosCaja ADD CONSTRAINT FK_TurnosCaja_Usuarios 
    FOREIGN KEY (IdUsuario) REFERENCES dbo.Usuarios(IdUsuario);

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_CortesCaja_TurnosCaja')
    ALTER TABLE dbo.CortesCaja ADD CONSTRAINT FK_CortesCaja_TurnosCaja 
    FOREIGN KEY (IdTurnoCaja) REFERENCES dbo.TurnosCaja(IdTurnoCaja);

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_CortesCaja_Cajas')
    ALTER TABLE dbo.CortesCaja ADD CONSTRAINT FK_CortesCaja_Cajas 
    FOREIGN KEY (IdCaja) REFERENCES dbo.Cajas(IdCaja);

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_CortesCaja_Usuarios')
    ALTER TABLE dbo.CortesCaja ADD CONSTRAINT FK_CortesCaja_Usuarios 
    FOREIGN KEY (IdUsuario) REFERENCES dbo.Usuarios(IdUsuario);

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_MovimientosCaja_TurnosCaja')
    ALTER TABLE dbo.MovimientosCaja ADD CONSTRAINT FK_MovimientosCaja_TurnosCaja 
    FOREIGN KEY (IdTurnoCaja) REFERENCES dbo.TurnosCaja(IdTurnoCaja);

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_MovimientosCaja_Cajas')
    ALTER TABLE dbo.MovimientosCaja ADD CONSTRAINT FK_MovimientosCaja_Cajas 
    FOREIGN KEY (IdCaja) REFERENCES dbo.Cajas(IdCaja);

-- VENTAS
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Ventas_Sucursales')
    ALTER TABLE dbo.Ventas ADD CONSTRAINT FK_Ventas_Sucursales 
    FOREIGN KEY (IdSucursal) REFERENCES dbo.Sucursales(IdSucursal);

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Ventas_Cajas')
    ALTER TABLE dbo.Ventas ADD CONSTRAINT FK_Ventas_Cajas 
    FOREIGN KEY (IdCaja) REFERENCES dbo.Cajas(IdCaja);

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Ventas_TurnosCaja')
    ALTER TABLE dbo.Ventas ADD CONSTRAINT FK_Ventas_TurnosCaja 
    FOREIGN KEY (IdTurnoCaja) REFERENCES dbo.TurnosCaja(IdTurnoCaja);

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Ventas_Usuarios')
    ALTER TABLE dbo.Ventas ADD CONSTRAINT FK_Ventas_Usuarios 
    FOREIGN KEY (IdUsuario) REFERENCES dbo.Usuarios(IdUsuario);

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Ventas_Clientes')
    ALTER TABLE dbo.Ventas ADD CONSTRAINT FK_Ventas_Clientes 
    FOREIGN KEY (IdCliente) REFERENCES dbo.Clientes(IdCliente);

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_DetalleVentas_Ventas')
    ALTER TABLE dbo.DetalleVentas ADD CONSTRAINT FK_DetalleVentas_Ventas 
    FOREIGN KEY (IdVenta) REFERENCES dbo.Ventas(IdVenta);

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_DetalleVentas_Productos')
    ALTER TABLE dbo.DetalleVentas ADD CONSTRAINT FK_DetalleVentas_Productos 
    FOREIGN KEY (IdProducto) REFERENCES dbo.Productos(IdProducto);

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_VentaPagos_Ventas')
    ALTER TABLE dbo.VentaPagos ADD CONSTRAINT FK_VentaPagos_Ventas 
    FOREIGN KEY (IdVenta) REFERENCES dbo.Ventas(IdVenta);

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_VentaPagos_MetodosPago')
    ALTER TABLE dbo.VentaPagos ADD CONSTRAINT FK_VentaPagos_MetodosPago 
    FOREIGN KEY (IdMetodoPago) REFERENCES dbo.MetodosPago(IdMetodoPago);

-- DEVOLUCIONES
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Devoluciones_Ventas')
    ALTER TABLE dbo.Devoluciones ADD CONSTRAINT FK_Devoluciones_Ventas 
    FOREIGN KEY (IdVenta) REFERENCES dbo.Ventas(IdVenta);

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_DetalleDevoluciones_Devoluciones')
    ALTER TABLE dbo.DetalleDevoluciones ADD CONSTRAINT FK_DetalleDevoluciones_Devoluciones 
    FOREIGN KEY (IdDevolucion) REFERENCES dbo.Devoluciones(IdDevolucion);

-- CLIENTES Y SEGURIDAD
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_CreditosClientes_Clientes')
    ALTER TABLE dbo.CreditosClientes ADD CONSTRAINT FK_CreditosClientes_Clientes 
    FOREIGN KEY (IdCliente) REFERENCES dbo.Clientes(IdCliente);

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_MovimientosCuentaCliente_Clientes')
    ALTER TABLE dbo.MovimientosCuentaCliente ADD CONSTRAINT FK_MovimientosCuentaCliente_Clientes 
    FOREIGN KEY (IdCliente) REFERENCES dbo.Clientes(IdCliente);

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_UsuarioRoles_Usuarios')
    ALTER TABLE dbo.UsuarioRoles ADD CONSTRAINT FK_UsuarioRoles_Usuarios 
    FOREIGN KEY (IdUsuario) REFERENCES dbo.Usuarios(IdUsuario);

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_UsuarioRoles_Roles')
    ALTER TABLE dbo.UsuarioRoles ADD CONSTRAINT FK_UsuarioRoles_Roles 
    FOREIGN KEY (IdRol) REFERENCES dbo.Roles(IdRol);

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_RolPermisos_Roles')
    ALTER TABLE dbo.RolPermisos ADD CONSTRAINT FK_RolPermisos_Roles 
    FOREIGN KEY (IdRol) REFERENCES dbo.Roles(IdRol);

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_RolPermisos_Permisos')
    ALTER TABLE dbo.RolPermisos ADD CONSTRAINT FK_RolPermisos_Permisos 
    FOREIGN KEY (IdPermiso) REFERENCES dbo.Permisos(IdPermiso);

PRINT 'Todas las llaves foraneas fueron verificadas/creadas correctamente.';
GO
