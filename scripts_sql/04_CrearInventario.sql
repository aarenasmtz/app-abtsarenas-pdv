-- ============================================================================
-- SCRIPT 04: CREAR TABLAS DE INVENTARIO Y MOVIMIENTOS
-- PROYECTO: SISTEMA PUNTO DE VENTA (PDV) - ABARROTES ARENAS
-- BASE DE DATOS: PdvAbarrotesArenas
-- ============================================================================

USE PdvAbarrotesArenas;
GO

-- 1. INVENTARIO (STOCK ACTUAL POR SUCURSAL)
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'Inventario' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.Inventario
    (
        IdInventario INT IDENTITY(1,1) NOT NULL,
        IdSucursal INT NOT NULL,
        IdProducto INT NOT NULL,
        ExistenciaActual DECIMAL(18,4) NOT NULL DEFAULT 0.0000,
        FechaUltimaModificacion DATETIME2 NOT NULL DEFAULT SYSDATETIME(),

        CONSTRAINT PK_Inventario PRIMARY KEY (IdInventario),
        CONSTRAINT UQ_Inventario_Sucursal_Producto UNIQUE (IdSucursal, IdProducto)
    );
    PRINT 'Tabla dbo.Inventario creada correctamente.';
END
GO

-- 2. MOVIMIENTOS DE INVENTARIO (KARDEX HISTORICO)
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'MovimientosInventario' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.MovimientosInventario
    (
        IdMovimientoInventario INT IDENTITY(1,1) NOT NULL,
        IdSucursal INT NOT NULL,
        IdProducto INT NOT NULL,
        IdTipoMovimiento INT NOT NULL,
        CantidadAnterior DECIMAL(18,4) NOT NULL,
        CantidadMovimiento DECIMAL(18,4) NOT NULL,
        CantidadNueva DECIMAL(18,4) NOT NULL,
        PrecioCosto DECIMAL(18,2) NOT NULL DEFAULT 0.00,
        ReferenciaModulo VARCHAR(50) NULL, -- 'COMPRA', 'VENTA', 'AJUSTE', 'INICIAL'
        IdReferencia INT NULL,             -- IdVenta, IdCompra, IdAjusteInventario
        Motivo NVARCHAR(250) NULL,
        IdUsuario INT NULL,
        FechaMovimiento DATETIME2 NOT NULL DEFAULT SYSDATETIME(),

        CONSTRAINT PK_MovimientosInventario PRIMARY KEY (IdMovimientoInventario)
    );
    PRINT 'Tabla dbo.MovimientosInventario creada correctamente.';
END
GO

-- 3. AJUSTES DE INVENTARIO (ENCABEZADOS DE AJUSTE)
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'AjustesInventario' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.AjustesInventario
    (
        IdAjusteInventario INT IDENTITY(1,1) NOT NULL,
        FolioAjuste INT NOT NULL,
        IdSucursal INT NOT NULL,
        IdUsuario INT NOT NULL,
        FechaAjuste DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        Motivo NVARCHAR(250) NOT NULL,
        Observaciones NVARCHAR(500) NULL,

        CONSTRAINT PK_AjustesInventario PRIMARY KEY (IdAjusteInventario)
    );
    PRINT 'Tabla dbo.AjustesInventario creada correctamente.';
END
GO

-- 4. DETALLE DE AJUSTES DE INVENTARIO
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'DetalleAjustesInventario' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.DetalleAjustesInventario
    (
        IdDetalleAjuste INT IDENTITY(1,1) NOT NULL,
        IdAjusteInventario INT NOT NULL,
        IdProducto INT NOT NULL,
        Cantidad DECIMAL(18,4) NOT NULL,
        PrecioCosto DECIMAL(18,2) NOT NULL DEFAULT 0.00,

        CONSTRAINT PK_DetalleAjustesInventario PRIMARY KEY (IdDetalleAjuste)
    );
    PRINT 'Tabla dbo.DetalleAjustesInventario creada correctamente.';
END
GO
