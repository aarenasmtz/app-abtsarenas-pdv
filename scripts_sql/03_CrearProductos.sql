-- ============================================================================
-- SCRIPT 03: CREAR TABLAS DE PRODUCTOS Y CODIGOS DE BARRAS
-- PROYECTO: SISTEMA PUNTO DE VENTA (PDV) - ABARROTES ARENAS
-- BASE DE DATOS: PdvAbarrotesArenas
-- ============================================================================

USE PdvAbarrotesArenas;
GO

-- 1. PRODUCTOS
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'Productos' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.Productos
    (
        IdProducto INT IDENTITY(1,1) NOT NULL,
        CodigoProducto VARCHAR(50) NULL,
        Descripcion NVARCHAR(250) NOT NULL,
        IdCategoria INT NULL,
        IdMarca INT NULL,
        IdUnidadMedida INT NOT NULL,
        IdProveedorPredeterminado INT NULL,
        PrecioCosto DECIMAL(18,2) NOT NULL DEFAULT 0.00,
        PrecioVenta DECIMAL(18,2) NOT NULL DEFAULT 0.00,
        PrecioMayoreo DECIMAL(18,2) NOT NULL DEFAULT 0.00,
        PorcentajeGanancia DECIMAL(18,2) NOT NULL DEFAULT 0.00,
        ExistenciaMinima DECIMAL(18,4) NOT NULL DEFAULT 0.0000,
        ExistenciaMaxima DECIMAL(18,4) NOT NULL DEFAULT 0.0000,
        PermiteVentaFraccionada BIT NOT NULL DEFAULT 0,
        ManejaInventario BIT NOT NULL DEFAULT 1,
        EsKit BIT NOT NULL DEFAULT 0,
        Activo BIT NOT NULL DEFAULT 1,
        FechaRegistro DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        FechaModificacion DATETIME2 NULL,
        FechaBaja DATETIME2 NULL,

        CONSTRAINT PK_Productos PRIMARY KEY (IdProducto)
    );
    PRINT 'Tabla dbo.Productos creada correctamente.';
END
GO

-- 2. CODIGOS DE BARRAS
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'CodigosBarras' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.CodigosBarras
    (
        IdCodigoBarras INT IDENTITY(1,1) NOT NULL,
        IdProducto INT NOT NULL,
        CodigoBarras VARCHAR(50) NOT NULL,
        EsPrincipal BIT NOT NULL DEFAULT 1,
        Activo BIT NOT NULL DEFAULT 1,
        FechaRegistro DATETIME2 NOT NULL DEFAULT SYSDATETIME(),

        CONSTRAINT PK_CodigosBarras PRIMARY KEY (IdCodigoBarras)
    );
    PRINT 'Tabla dbo.CodigosBarras creada correctamente.';
END
GO
