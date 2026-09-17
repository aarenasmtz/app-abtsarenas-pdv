-- ============================================================================
-- SCRIPT 02: CREAR CATALOGOS GENERALES
-- PROYECTO: SISTEMA PUNTO DE VENTA (PDV) - ABARROTES ARENAS
-- BASE DE DATOS: PdvAbarrotesArenas
-- ============================================================================

USE PdvAbarrotesArenas;
GO

-- 1. SUCURSALES
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'Sucursales' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.Sucursales
    (
        IdSucursal INT IDENTITY(1,1) NOT NULL,
        Nombre NVARCHAR(150) NOT NULL,
        Direccion NVARCHAR(250) NULL,
        Telefono VARCHAR(20) NULL,
        EsPrincipal BIT NOT NULL DEFAULT 1,
        Activo BIT NOT NULL DEFAULT 1,
        FechaRegistro DATETIME2 NOT NULL DEFAULT SYSDATETIME(),

        CONSTRAINT PK_Sucursales PRIMARY KEY (IdSucursal)
    );
    PRINT 'Tabla dbo.Sucursales creada correctamente.';
END
GO

-- 2. CATEGORIAS
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'Categorias' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.Categorias
    (
        IdCategoria INT IDENTITY(1,1) NOT NULL,
        Descripcion NVARCHAR(150) NOT NULL,
        Activo BIT NOT NULL DEFAULT 1,
        FechaRegistro DATETIME2 NOT NULL DEFAULT SYSDATETIME(),

        CONSTRAINT PK_Categorias PRIMARY KEY (IdCategoria)
    );
    PRINT 'Tabla dbo.Categorias creada correctamente.';
END
GO

-- 3. MARCAS
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'Marcas' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.Marcas
    (
        IdMarca INT IDENTITY(1,1) NOT NULL,
        Descripcion NVARCHAR(150) NOT NULL,
        Activo BIT NOT NULL DEFAULT 1,
        FechaRegistro DATETIME2 NOT NULL DEFAULT SYSDATETIME(),

        CONSTRAINT PK_Marcas PRIMARY KEY (IdMarca)
    );
    PRINT 'Tabla dbo.Marcas creada correctamente.';
END
GO

-- 4. UNIDADES DE MEDIDA
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'UnidadesMedida' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.UnidadesMedida
    (
        IdUnidadMedida INT IDENTITY(1,1) NOT NULL,
        Nombre NVARCHAR(50) NOT NULL,
        Abreviatura VARCHAR(10) NOT NULL,
        PermiteDecimales BIT NOT NULL DEFAULT 0,
        FactorConversion DECIMAL(18,4) NOT NULL DEFAULT 1.0000,
        Activo BIT NOT NULL DEFAULT 1,

        CONSTRAINT PK_UnidadesMedida PRIMARY KEY (IdUnidadMedida)
    );
    PRINT 'Tabla dbo.UnidadesMedida creada correctamente.';
END
GO

-- 5. METODOS DE PAGO
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'MetodosPago' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.MetodosPago
    (
        IdMetodoPago INT IDENTITY(1,1) NOT NULL,
        CodigoMetodo VARCHAR(20) NOT NULL,
        Descripcion NVARCHAR(100) NOT NULL,
        RequiereReferencia BIT NOT NULL DEFAULT 0,
        Activo BIT NOT NULL DEFAULT 1,

        CONSTRAINT PK_MetodosPago PRIMARY KEY (IdMetodoPago),
        CONSTRAINT UQ_MetodosPago_CodigoMetodo UNIQUE (CodigoMetodo)
    );
    PRINT 'Tabla dbo.MetodosPago creada correctamente.';
END
GO

-- 6. TIPOS DE MOVIMIENTO DE INVENTARIO
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'TiposMovimientoInventario' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.TiposMovimientoInventario
    (
        IdTipoMovimiento INT IDENTITY(1,1) NOT NULL,
        CodigoTipo VARCHAR(30) NOT NULL,
        Descripcion NVARCHAR(100) NOT NULL,
        EfectoStock SMALLINT NOT NULL, -- +1: Entrada, -1: Salida, 0: Neutro
        Activo BIT NOT NULL DEFAULT 1,

        CONSTRAINT PK_TiposMovimientoInventario PRIMARY KEY (IdTipoMovimiento),
        CONSTRAINT UQ_TiposMovimientoInventario_CodigoTipo UNIQUE (CodigoTipo)
    );
    PRINT 'Tabla dbo.TiposMovimientoInventario creada correctamente.';
END
GO
