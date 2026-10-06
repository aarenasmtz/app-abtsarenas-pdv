-- ============================================================================
-- SCRIPT 15: ÍNDICES CUBRIENTES DE ALTO RENDIMIENTO (FASE 16)
-- BASE DE DATOS: PdvAbarrotesArenas
-- MOTOR: Microsoft SQL Server 2022
-- OBJETIVO: Optimizar lecturas de escáner HID en caja (<50ms), pedidos sugeridos dominicales
--           y reportes agregados de Dashboard sin bloqueos bajo READ_COMMITTED_SNAPSHOT.
-- ============================================================================

USE PdvAbarrotesArenas;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- 1. ÍNDICE CUBRIENTE PARA VENTAS POR FECHA Y CANCELACIONES (DASHBOARD & REPORTES)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Ventas_Fecha_EsCancelada' AND object_id = OBJECT_ID('dbo.Ventas'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Ventas_Fecha_EsCancelada
    ON dbo.Ventas (FechaVenta DESC, EsCancelada)
    INCLUDE (Total, Ganancia, IdUsuario, NumeroArticulos, IdTurnoCaja)
    WITH (ONLINE = OFF, DATA_COMPRESSION = PAGE);

    PRINT 'Índice IX_Ventas_Fecha_EsCancelada creado exitosamente con compresión PAGE.';
END
ELSE
BEGIN
    PRINT 'Índice IX_Ventas_Fecha_EsCancelada ya existe.';
END
GO

-- 2. ÍNDICE CUBRIENTE PARA DETALLE DE VENTAS (PEDIDO SUGERIDO DOMINICAL & VELOCIDAD DE ROTACIÓN)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_DetalleVentas_Producto_Periodo' AND object_id = OBJECT_ID('dbo.DetalleVentas'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_DetalleVentas_Producto_Periodo
    ON dbo.DetalleVentas (IdProducto)
    INCLUDE (IdVenta, Cantidad, CantidadDevuelta, PrecioCosto, Total, Ganancia)
    WITH (ONLINE = OFF, DATA_COMPRESSION = PAGE);

    PRINT 'Índice IX_DetalleVentas_Producto_Periodo creado exitosamente con compresión PAGE.';
END
ELSE
BEGIN
    PRINT 'Índice IX_DetalleVentas_Producto_Periodo ya existe.';
END
GO

-- 3. ÍNDICE CUBRIENTE PARA EXISTENCIAS EN CAJA DE COBRO (INVENTARIO EN VIVO)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Inventario_Sucursal_Producto_Stock' AND object_id = OBJECT_ID('dbo.Inventario'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Inventario_Sucursal_Producto_Stock
    ON dbo.Inventario (IdSucursal, IdProducto)
    INCLUDE (ExistenciaActual, FechaUltimaModificacion)
    WITH (ONLINE = OFF, DATA_COMPRESSION = PAGE);

    PRINT 'Índice IX_Inventario_Sucursal_Producto_Stock creado exitosamente con compresión PAGE.';
END
ELSE
BEGIN
    PRINT 'Índice IX_Inventario_Sucursal_Producto_Stock ya existe.';
END
GO

-- 4. ÍNDICE CUBRIENTE PARA BÚSQUEDA RÁPIDA POR CÓDIGO DE BARRAS (ESCÁNER HID <100ms)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_CodigosBarras_Codigo_Busqueda' AND object_id = OBJECT_ID('dbo.CodigosBarras'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_CodigosBarras_Codigo_Busqueda
    ON dbo.CodigosBarras (CodigoBarras, Activo)
    INCLUDE (IdProducto, EsPrincipal)
    WITH (ONLINE = OFF, DATA_COMPRESSION = PAGE);

    PRINT 'Índice IX_CodigosBarras_Codigo_Busqueda creado exitosamente con compresión PAGE.';
END
ELSE
BEGIN
    PRINT 'Índice IX_CodigosBarras_Codigo_Busqueda ya existe.';
END
GO

-- 5. ÍNDICE PARA KARDEX HISTÓRICO Y TRAZABILIDAD
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_MovimientosInventario_Producto_Fecha' AND object_id = OBJECT_ID('dbo.MovimientosInventario'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_MovimientosInventario_Producto_Fecha
    ON dbo.MovimientosInventario (IdProducto, FechaMovimiento DESC)
    INCLUDE (IdTipoMovimiento, CantidadMovimiento, CantidadNueva, IdSucursal)
    WITH (ONLINE = OFF, DATA_COMPRESSION = PAGE);

    PRINT 'Índice IX_MovimientosInventario_Producto_Fecha creado exitosamente con compresión PAGE.';
END
ELSE
BEGIN
    PRINT 'Índice IX_MovimientosInventario_Producto_Fecha ya existe.';
END
GO

PRINT '============================================================================';
PRINT 'OPTIMIZACIÓN DE ÍNDICES DE RENDIMIENTO (FASE 16) COMPLETADA EXITOSAMENTE.';
PRINT '============================================================================';
GO
