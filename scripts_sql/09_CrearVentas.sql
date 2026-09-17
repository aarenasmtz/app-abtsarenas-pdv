-- ============================================================================
-- SCRIPT 09: CREAR TABLAS DE VENTAS, DETALLES Y PAGOS
-- PROYECTO: SISTEMA PUNTO DE VENTA (PDV) - ABARROTES ARENAS
-- BASE DE DATOS: PdvAbarrotesArenas
-- ============================================================================

USE PdvAbarrotesArenas;
GO

-- 1. VENTAS
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'Ventas' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.Ventas
    (
        IdVenta INT IDENTITY(1,1) NOT NULL,
        FolioVenta INT NOT NULL,
        IdSucursal INT NOT NULL,
        IdCaja INT NOT NULL,
        IdTurnoCaja INT NULL,
        IdUsuario INT NOT NULL,
        IdCliente INT NOT NULL,
        FechaVenta DATETIME2 NOT NULL,
        Subtotal DECIMAL(18,2) NOT NULL DEFAULT 0.00,
        Descuento DECIMAL(18,2) NOT NULL DEFAULT 0.00,
        Impuesto DECIMAL(18,2) NOT NULL DEFAULT 0.00,
        Total DECIMAL(18,2) NOT NULL DEFAULT 0.00,
        Ganancia DECIMAL(18,2) NOT NULL DEFAULT 0.00,
        ImporteRecibido DECIMAL(18,2) NOT NULL DEFAULT 0.00,
        Cambio DECIMAL(18,2) NOT NULL DEFAULT 0.00,
        NumeroArticulos DECIMAL(18,4) NOT NULL DEFAULT 0.0000,
        Estatus VARCHAR(20) NOT NULL DEFAULT 'PAGADA',
        EsCancelada BIT NOT NULL DEFAULT 0,
        FechaCancelacion DATETIME2 NULL,
        IdUsuarioCancelacion INT NULL,
        Notas NVARCHAR(250) NULL,
        FechaRegistro DATETIME2 NOT NULL DEFAULT SYSDATETIME(),

        CONSTRAINT PK_Ventas PRIMARY KEY (IdVenta)
    );
    PRINT 'Tabla dbo.Ventas creada correctamente.';
END
GO

-- 2. DETALLE DE VENTAS
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'DetalleVentas' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.DetalleVentas
    (
        IdDetalleVenta INT IDENTITY(1,1) NOT NULL,
        IdVenta INT NOT NULL,
        IdProducto INT NULL, -- NULL para articulos de 'Producto Comun' o eliminados
        CodigoBarras VARCHAR(50) NOT NULL,
        Descripcion NVARCHAR(250) NOT NULL,
        Cantidad DECIMAL(18,4) NOT NULL,
        PrecioCosto DECIMAL(18,2) NOT NULL DEFAULT 0.00,
        PrecioUnitario DECIMAL(18,2) NOT NULL DEFAULT 0.00,
        Descuento DECIMAL(18,2) NOT NULL DEFAULT 0.00,
        Impuesto DECIMAL(18,2) NOT NULL DEFAULT 0.00,
        Subtotal DECIMAL(18,2) NOT NULL DEFAULT 0.00,
        Total DECIMAL(18,2) NOT NULL DEFAULT 0.00,
        Ganancia DECIMAL(18,2) NOT NULL DEFAULT 0.00,
        EsDevuelto BIT NOT NULL DEFAULT 0,
        CantidadDevuelta DECIMAL(18,4) NOT NULL DEFAULT 0.0000,

        CONSTRAINT PK_DetalleVentas PRIMARY KEY (IdDetalleVenta)
    );
    PRINT 'Tabla dbo.DetalleVentas creada correctamente.';
END
GO

-- 3. FORMAS DE PAGO POR VENTA (SOPORTE DE PAGO MIXTO)
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'VentaPagos' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.VentaPagos
    (
        IdVentaPago INT IDENTITY(1,1) NOT NULL,
        IdVenta INT NOT NULL,
        IdMetodoPago INT NOT NULL,
        Importe DECIMAL(18,2) NOT NULL,
        Referencia VARCHAR(100) NULL,
        FechaRegistro DATETIME2 NOT NULL DEFAULT SYSDATETIME(),

        CONSTRAINT PK_VentaPagos PRIMARY KEY (IdVentaPago)
    );
    PRINT 'Tabla dbo.VentaPagos creada correctamente.';
END
GO

-- 4. DEVOLUCIONES
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'Devoluciones' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.Devoluciones
    (
        IdDevolucion INT IDENTITY(1,1) NOT NULL,
        IdVenta INT NOT NULL,
        IdCaja INT NOT NULL,
        IdUsuario INT NOT NULL,
        IdTurnoCaja INT NULL,
        FechaDevolucion DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        TotalDevuelto DECIMAL(18,2) NOT NULL DEFAULT 0.00,
        Motivo NVARCHAR(250) NULL,

        CONSTRAINT PK_Devoluciones PRIMARY KEY (IdDevolucion)
    );
    PRINT 'Tabla dbo.Devoluciones creada correctamente.';
END
GO

-- 5. DETALLE DE DEVOLUCIONES
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'DetalleDevoluciones' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.DetalleDevoluciones
    (
        IdDetalleDevolucion INT IDENTITY(1,1) NOT NULL,
        IdDevolucion INT NOT NULL,
        IdDetalleVenta INT NULL,
        IdProducto INT NULL,
        Cantidad DECIMAL(18,4) NOT NULL,
        PrecioUnitario DECIMAL(18,2) NOT NULL,
        TotalDevuelto DECIMAL(18,2) NOT NULL,

        CONSTRAINT PK_DetalleDevoluciones PRIMARY KEY (IdDetalleDevolucion)
    );
    PRINT 'Tabla dbo.DetalleDevoluciones creada correctamente.';
END
GO
