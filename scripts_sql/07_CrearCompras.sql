-- ============================================================================
-- SCRIPT 07: CREAR TABLAS DE COMPRAS
-- PROYECTO: SISTEMA PUNTO DE VENTA (PDV) - ABARROTES ARENAS
-- BASE DE DATOS: PdvAbarrotesArenas
-- ============================================================================

USE PdvAbarrotesArenas;
GO

-- 1. COMPRAS (RECIBOS DE MERCANCIA)
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'Compras' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.Compras
    (
        IdCompra INT IDENTITY(1,1) NOT NULL,
        FolioCompra INT NOT NULL,
        IdSucursal INT NOT NULL,
        IdProveedor INT NULL,
        IdUsuario INT NOT NULL,
        FechaCompra DATETIME2 NOT NULL,
        TotalCompra DECIMAL(18,2) NOT NULL DEFAULT 0.00,
        Estatus VARCHAR(20) NOT NULL DEFAULT 'RECIBIDO',
        Observaciones NVARCHAR(250) NULL,
        FechaRegistro DATETIME2 NOT NULL DEFAULT SYSDATETIME(),

        CONSTRAINT PK_Compras PRIMARY KEY (IdCompra)
    );
    PRINT 'Tabla dbo.Compras creada correctamente.';
END
GO

-- 2. DETALLE DE COMPRAS
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'DetalleCompras' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.DetalleCompras
    (
        IdDetalleCompra INT IDENTITY(1,1) NOT NULL,
        IdCompra INT NOT NULL,
        IdProducto INT NOT NULL,
        NumeroRenglon INT NOT NULL,
        CantidadRecibida DECIMAL(18,4) NOT NULL,
        CostoUnitario DECIMAL(18,2) NOT NULL,
        TotalRenglon DECIMAL(18,2) NOT NULL,

        CONSTRAINT PK_DetalleCompras PRIMARY KEY (IdDetalleCompra)
    );
    PRINT 'Tabla dbo.DetalleCompras creada correctamente.';
END
GO
