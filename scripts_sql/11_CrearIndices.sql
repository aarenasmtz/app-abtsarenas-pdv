-- ============================================================================
-- SCRIPT 11: CREAR INDICES OPTIMIZADOS PARA PDV
-- PROYECTO: SISTEMA PUNTO DE VENTA (PDV) - ABARROTES ARENAS
-- BASE DE DATOS: PdvAbarrotesArenas
-- ============================================================================

USE PdvAbarrotesArenas;
GO

-- 1. INDICES PARA PRODUCTOS Y CODIGOS DE BARRAS (BUSQUEDA INSTANTANEA EN PDV)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_CodigosBarras_CodigoBarras' AND object_id = OBJECT_ID(N'dbo.CodigosBarras'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_CodigosBarras_CodigoBarras
    ON dbo.CodigosBarras(CodigoBarras)
    INCLUDE (IdProducto, EsPrincipal, Activo);
    PRINT 'Indice IX_CodigosBarras_CodigoBarras creado.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_CodigosBarras_IdProducto' AND object_id = OBJECT_ID(N'dbo.CodigosBarras'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_CodigosBarras_IdProducto
    ON dbo.CodigosBarras(IdProducto);
    PRINT 'Indice IX_CodigosBarras_IdProducto creado.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Productos_Descripcion' AND object_id = OBJECT_ID(N'dbo.Productos'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Productos_Descripcion
    ON dbo.Productos(Descripcion)
    INCLUDE (PrecioVenta, PrecioCosto, Activo);
    PRINT 'Indice IX_Productos_Descripcion creado.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Productos_IdCategoria' AND object_id = OBJECT_ID(N'dbo.Productos'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Productos_IdCategoria
    ON dbo.Productos(IdCategoria);
    PRINT 'Indice IX_Productos_IdCategoria creado.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Productos_IdMarca' AND object_id = OBJECT_ID(N'dbo.Productos'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Productos_IdMarca
    ON dbo.Productos(IdMarca);
    PRINT 'Indice IX_Productos_IdMarca creado.';
END
GO

-- 2. INDICES PARA VENTAS Y FACTURACION
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Ventas_FechaVenta' AND object_id = OBJECT_ID(N'dbo.Ventas'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Ventas_FechaVenta
    ON dbo.Ventas(FechaVenta)
    INCLUDE (FolioVenta, Total, Ganancia, IdCliente, IdCaja, EsCancelada);
    PRINT 'Indice IX_Ventas_FechaVenta creado.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Ventas_FolioVenta' AND object_id = OBJECT_ID(N'dbo.Ventas'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Ventas_FolioVenta
    ON dbo.Ventas(FolioVenta);
    PRINT 'Indice IX_Ventas_FolioVenta creado.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Ventas_IdCliente' AND object_id = OBJECT_ID(N'dbo.Ventas'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Ventas_IdCliente
    ON dbo.Ventas(IdCliente);
    PRINT 'Indice IX_Ventas_IdCliente creado.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Ventas_IdTurnoCaja' AND object_id = OBJECT_ID(N'dbo.Ventas'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Ventas_IdTurnoCaja
    ON dbo.Ventas(IdTurnoCaja);
    PRINT 'Indice IX_Ventas_IdTurnoCaja creado.';
END
GO

-- 3. INDICES PARA DETALLE DE VENTAS
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_DetalleVentas_IdVenta' AND object_id = OBJECT_ID(N'dbo.DetalleVentas'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_DetalleVentas_IdVenta
    ON dbo.DetalleVentas(IdVenta)
    INCLUDE (IdProducto, Cantidad, PrecioUnitario, Total);
    PRINT 'Indice IX_DetalleVentas_IdVenta creado.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_DetalleVentas_IdProducto' AND object_id = OBJECT_ID(N'dbo.DetalleVentas'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_DetalleVentas_IdProducto
    ON dbo.DetalleVentas(IdProducto);
    PRINT 'Indice IX_DetalleVentas_IdProducto creado.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_DetalleVentas_CodigoBarras' AND object_id = OBJECT_ID(N'dbo.DetalleVentas'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_DetalleVentas_CodigoBarras
    ON dbo.DetalleVentas(CodigoBarras);
    PRINT 'Indice IX_DetalleVentas_CodigoBarras creado.';
END
GO

-- 4. INDICES PARA KARDEX E INVENTARIO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_MovimientosInventario_IdProducto_Fecha' AND object_id = OBJECT_ID(N'dbo.MovimientosInventario'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_MovimientosInventario_IdProducto_Fecha
    ON dbo.MovimientosInventario(IdProducto, FechaMovimiento DESC);
    PRINT 'Indice IX_MovimientosInventario_IdProducto_Fecha creado.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_MovimientosInventario_FechaMovimiento' AND object_id = OBJECT_ID(N'dbo.MovimientosInventario'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_MovimientosInventario_FechaMovimiento
    ON dbo.MovimientosInventario(FechaMovimiento);
    PRINT 'Indice IX_MovimientosInventario_FechaMovimiento creado.';
END
GO

-- 5. INDICES PARA CAJAS Y CORTES
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_CortesCaja_FechaCorte' AND object_id = OBJECT_ID(N'dbo.CortesCaja'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_CortesCaja_FechaCorte
    ON dbo.CortesCaja(FechaCorte);
    PRINT 'Indice IX_CortesCaja_FechaCorte creado.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_TurnosCaja_FechaInicio' AND object_id = OBJECT_ID(N'dbo.TurnosCaja'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_TurnosCaja_FechaInicio
    ON dbo.TurnosCaja(FechaInicio);
    PRINT 'Indice IX_TurnosCaja_FechaInicio creado.';
END
GO
