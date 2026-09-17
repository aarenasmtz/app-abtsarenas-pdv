-- ============================================================================
-- SCRIPT 10: CREAR TABLAS DE USUARIOS, SEGURIDAD Y AUDITORIA
-- PROYECTO: SISTEMA PUNTO DE VENTA (PDV) - ABARROTES ARENAS
-- BASE DE DATOS: PdvAbarrotesArenas
-- ============================================================================

USE PdvAbarrotesArenas;
GO

-- 1. USUARIOS
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'Usuarios' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.Usuarios
    (
        IdUsuario INT IDENTITY(1,1) NOT NULL,
        NombreCompleto NVARCHAR(150) NOT NULL,
        NombreUsuario VARCHAR(50) NOT NULL,
        ClaveHash VARCHAR(255) NOT NULL,
        Correo VARCHAR(100) NULL,
        Telefono VARCHAR(20) NULL,
        EsAdministrador BIT NOT NULL DEFAULT 0,
        Activo BIT NOT NULL DEFAULT 1,
        FechaRegistro DATETIME2 NOT NULL DEFAULT SYSDATETIME(),

        CONSTRAINT PK_Usuarios PRIMARY KEY (IdUsuario),
        CONSTRAINT UQ_Usuarios_NombreUsuario UNIQUE (NombreUsuario)
    );
    PRINT 'Tabla dbo.Usuarios creada correctamente.';
END
GO

-- 2. ROLES
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'Roles' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.Roles
    (
        IdRol INT IDENTITY(1,1) NOT NULL,
        Nombre VARCHAR(50) NOT NULL,
        Descripcion NVARCHAR(200) NULL,
        Activo BIT NOT NULL DEFAULT 1,

        CONSTRAINT PK_Roles PRIMARY KEY (IdRol),
        CONSTRAINT UQ_Roles_Nombre UNIQUE (Nombre)
    );
    PRINT 'Tabla dbo.Roles creada correctamente.';
END
GO

-- 3. PERMISOS
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'Permisos' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.Permisos
    (
        IdPermiso INT IDENTITY(1,1) NOT NULL,
        CodigoPermiso VARCHAR(100) NOT NULL,
        Modulo VARCHAR(50) NOT NULL,
        Descripcion NVARCHAR(200) NULL,

        CONSTRAINT PK_Permisos PRIMARY KEY (IdPermiso),
        CONSTRAINT UQ_Permisos_CodigoPermiso UNIQUE (CodigoPermiso)
    );
    PRINT 'Tabla dbo.Permisos creada correctamente.';
END
GO

-- 4. USUARIO ROLES
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'UsuarioRoles' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.UsuarioRoles
    (
        IdUsuarioRol INT IDENTITY(1,1) NOT NULL,
        IdUsuario INT NOT NULL,
        IdRol INT NOT NULL,

        CONSTRAINT PK_UsuarioRoles PRIMARY KEY (IdUsuarioRol),
        CONSTRAINT UQ_UsuarioRoles_Usuario_Rol UNIQUE (IdUsuario, IdRol)
    );
    PRINT 'Tabla dbo.UsuarioRoles creada correctamente.';
END
GO

-- 5. ROL PERMISOS
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'RolPermisos' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.RolPermisos
    (
        IdRolPermiso INT IDENTITY(1,1) NOT NULL,
        IdRol INT NOT NULL,
        IdPermiso INT NOT NULL,

        CONSTRAINT PK_RolPermisos PRIMARY KEY (IdRolPermiso),
        CONSTRAINT UQ_RolPermisos_Rol_Permiso UNIQUE (IdRol, IdPermiso)
    );
    PRINT 'Tabla dbo.RolPermisos creada correctamente.';
END
GO

-- 6. CONFIGURACION DEL NEGOCIO
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'Configuracion' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.Configuracion
    (
        IdConfiguracion INT IDENTITY(1,1) NOT NULL,
        Clave VARCHAR(100) NOT NULL,
        Valor NVARCHAR(MAX) NOT NULL,
        Descripcion NVARCHAR(250) NULL,
        FechaModificacion DATETIME2 NOT NULL DEFAULT SYSDATETIME(),

        CONSTRAINT PK_Configuracion PRIMARY KEY (IdConfiguracion),
        CONSTRAINT UQ_Configuracion_Clave UNIQUE (Clave)
    );
    PRINT 'Tabla dbo.Configuracion creada correctamente.';
END
GO

-- 7. BITACORA DEL SISTEMA (AUDITORIA)
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'BitacoraSistema' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.BitacoraSistema
    (
        IdBitacora INT IDENTITY(1,1) NOT NULL,
        IdUsuario INT NULL,
        Modulo VARCHAR(50) NOT NULL,
        Accion VARCHAR(50) NOT NULL,
        Entidad VARCHAR(50) NOT NULL,
        IdEntidad INT NULL,
        Detalle NVARCHAR(MAX) NULL,
        DireccionIp VARCHAR(50) NULL,
        FechaRegistro DATETIME2 NOT NULL DEFAULT SYSDATETIME(),

        CONSTRAINT PK_BitacoraSistema PRIMARY KEY (IdBitacora)
    );
    PRINT 'Tabla dbo.BitacoraSistema creada correctamente.';
END
GO
