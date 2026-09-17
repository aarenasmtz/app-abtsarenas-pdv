-- ============================================================================
-- SCRIPT 06: CREAR TABLA DE PROVEEDORES
-- PROYECTO: SISTEMA PUNTO DE VENTA (PDV) - ABARROTES ARENAS
-- BASE DE DATOS: PdvAbarrotesArenas
-- ============================================================================

USE PdvAbarrotesArenas;
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'Proveedores' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.Proveedores
    (
        IdProveedor INT IDENTITY(1,1) NOT NULL,
        Nombre NVARCHAR(150) NOT NULL,
        NombreContacto NVARCHAR(150) NULL,
        Rfc VARCHAR(15) NULL,
        Telefono VARCHAR(50) NULL,
        Correo VARCHAR(100) NULL,
        Direccion NVARCHAR(250) NULL,
        Notas NVARCHAR(500) NULL,
        Activo BIT NOT NULL DEFAULT 1,
        FechaRegistro DATETIME2 NOT NULL DEFAULT SYSDATETIME(),

        CONSTRAINT PK_Proveedores PRIMARY KEY (IdProveedor)
    );
    PRINT 'Tabla dbo.Proveedores creada correctamente.';
END
GO
