-- ============================================================================
-- SCRIPT 08: CREAR TABLAS DE CAJA, TURNOS Y CORTES
-- PROYECTO: SISTEMA PUNTO DE VENTA (PDV) - ABARROTES ARENAS
-- BASE DE DATOS: PdvAbarrotesArenas
-- ============================================================================

USE PdvAbarrotesArenas;
GO

-- 1. CAJAS (TERMINALES FISICAS)
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'Cajas' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.Cajas
    (
        IdCaja INT IDENTITY(1,1) NOT NULL,
        IdSucursal INT NOT NULL,
        Nombre NVARCHAR(100) NOT NULL,
        EsPrincipal BIT NOT NULL DEFAULT 1,
        NombreEquipo VARCHAR(100) NULL,
        DireccionIp VARCHAR(50) NULL,
        Activo BIT NOT NULL DEFAULT 1,
        FechaRegistro DATETIME2 NOT NULL DEFAULT SYSDATETIME(),

        CONSTRAINT PK_Cajas PRIMARY KEY (IdCaja)
    );
    PRINT 'Tabla dbo.Cajas creada correctamente.';
END
GO

-- 2. TURNOS DE CAJA
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'TurnosCaja' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.TurnosCaja
    (
        IdTurnoCaja INT IDENTITY(1,1) NOT NULL,
        IdCaja INT NOT NULL,
        IdUsuario INT NOT NULL,
        FechaInicio DATETIME2 NOT NULL,
        FechaCierre DATETIME2 NULL,
        Estatus VARCHAR(20) NOT NULL DEFAULT 'CERRADO',

        CONSTRAINT PK_TurnosCaja PRIMARY KEY (IdTurnoCaja)
    );
    PRINT 'Tabla dbo.TurnosCaja creada correctamente.';
END
GO

-- 3. CORTES DE CAJA
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'CortesCaja' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.CortesCaja
    (
        IdCorteCaja INT IDENTITY(1,1) NOT NULL,
        IdTurnoCaja INT NOT NULL,
        IdCaja INT NOT NULL,
        IdUsuario INT NOT NULL,
        FechaCorte DATETIME2 NOT NULL,
        MontoInicial DECIMAL(18,2) NOT NULL DEFAULT 0.00,
        VentasEfectivo DECIMAL(18,2) NOT NULL DEFAULT 0.00,
        VentasTarjeta DECIMAL(18,2) NOT NULL DEFAULT 0.00,
        VentasVales DECIMAL(18,2) NOT NULL DEFAULT 0.00,
        VentasCredito DECIMAL(18,2) NOT NULL DEFAULT 0.00,
        EntradasEfectivo DECIMAL(18,2) NOT NULL DEFAULT 0.00,
        SalidasEfectivo DECIMAL(18,2) NOT NULL DEFAULT 0.00,
        TotalEsperado DECIMAL(18,2) NOT NULL DEFAULT 0.00,
        TotalContado DECIMAL(18,2) NOT NULL DEFAULT 0.00,
        Diferencia DECIMAL(18,2) NOT NULL DEFAULT 0.00,
        Observaciones NVARCHAR(250) NULL,

        CONSTRAINT PK_CortesCaja PRIMARY KEY (IdCorteCaja)
    );
    PRINT 'Tabla dbo.CortesCaja creada correctamente.';
END
GO

-- 4. MOVIMIENTOS DE CAJA (ENTRADAS Y SALIDAS DE EFECTIVO)
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'MovimientosCaja' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.MovimientosCaja
    (
        IdMovimientoCaja INT IDENTITY(1,1) NOT NULL,
        IdTurnoCaja INT NOT NULL,
        IdCaja INT NOT NULL,
        TipoMovimiento VARCHAR(20) NOT NULL, -- 'ENTRADA', 'SALIDA', 'DEVOLUCION'
        Monto DECIMAL(18,2) NOT NULL,
        Descripcion NVARCHAR(250) NOT NULL,
        FechaMovimiento DATETIME2 NOT NULL DEFAULT SYSDATETIME(),

        CONSTRAINT PK_MovimientosCaja PRIMARY KEY (IdMovimientoCaja)
    );
    PRINT 'Tabla dbo.MovimientosCaja creada correctamente.';
END
GO
