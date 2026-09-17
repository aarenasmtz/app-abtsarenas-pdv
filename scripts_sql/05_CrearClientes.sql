-- ============================================================================
-- SCRIPT 05: CREAR TABLAS DE CLIENTES Y CREDITOS
-- PROYECTO: SISTEMA PUNTO DE VENTA (PDV) - ABARROTES ARENAS
-- BASE DE DATOS: PdvAbarrotesArenas
-- ============================================================================

USE PdvAbarrotesArenas;
GO

-- 1. CLIENTES
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'Clientes' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.Clientes
    (
        IdCliente INT IDENTITY(1,1) NOT NULL,
        NumeroCliente INT NULL,
        Nombre NVARCHAR(100) NOT NULL,
        Apellidos NVARCHAR(100) NULL,
        Telefono VARCHAR(20) NULL,
        Correo VARCHAR(100) NULL,
        Direccion NVARCHAR(250) NULL,
        Colonia NVARCHAR(100) NULL,
        CodigoPostal VARCHAR(10) NULL,
        Rfc VARCHAR(15) NULL,
        TieneCredito BIT NOT NULL DEFAULT 0,
        LimiteCredito DECIMAL(18,2) NOT NULL DEFAULT 0.00,
        SaldoActual DECIMAL(18,2) NOT NULL DEFAULT 0.00,
        DiasCredito INT NOT NULL DEFAULT 0,
        EsSistema BIT NOT NULL DEFAULT 0, -- 1 para Publico en General
        Activo BIT NOT NULL DEFAULT 1,
        FechaRegistro DATETIME2 NOT NULL DEFAULT SYSDATETIME(),

        CONSTRAINT PK_Clientes PRIMARY KEY (IdCliente)
    );
    PRINT 'Tabla dbo.Clientes creada correctamente.';
END
GO

-- 2. CREDITOS CLIENTES
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'CreditosClientes' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.CreditosClientes
    (
        IdCreditoCliente INT IDENTITY(1,1) NOT NULL,
        IdCliente INT NOT NULL,
        LimiteCredito DECIMAL(18,2) NOT NULL,
        SaldoPendiente DECIMAL(18,2) NOT NULL DEFAULT 0.00,
        DiasCredito INT NOT NULL DEFAULT 0,
        FechaUltimoAbono DATETIME2 NULL,
        Activo BIT NOT NULL DEFAULT 1,

        CONSTRAINT PK_CreditosClientes PRIMARY KEY (IdCreditoCliente)
    );
    PRINT 'Tabla dbo.CreditosClientes creada correctamente.';
END
GO

-- 3. MOVIMIENTOS CUENTA CLIENTE (HISTORIAL DE CREDITOS Y ABONOS)
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'MovimientosCuentaCliente' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.MovimientosCuentaCliente
    (
        IdMovimientoCuentaCliente INT IDENTITY(1,1) NOT NULL,
        IdCliente INT NOT NULL,
        TipoMovimiento VARCHAR(20) NOT NULL, -- 'CARGO_VENTA', 'ABONO_PAGO'
        IdVenta INT NULL,
        Cargo DECIMAL(18,2) NOT NULL DEFAULT 0.00,
        Abono DECIMAL(18,2) NOT NULL DEFAULT 0.00,
        SaldoAnterior DECIMAL(18,2) NOT NULL,
        SaldoNuevo DECIMAL(18,2) NOT NULL,
        Referencia NVARCHAR(150) NULL,
        IdUsuario INT NULL,
        FechaMovimiento DATETIME2 NOT NULL DEFAULT SYSDATETIME(),

        CONSTRAINT PK_MovimientosCuentaCliente PRIMARY KEY (IdMovimientoCuentaCliente)
    );
    PRINT 'Tabla dbo.MovimientosCuentaCliente creada correctamente.';
END
GO
