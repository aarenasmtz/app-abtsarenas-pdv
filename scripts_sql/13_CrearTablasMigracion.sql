-- ============================================================================
-- SCRIPT 13: CREAR TABLAS DE EQUIVALENCIA DE MIGRACION
-- PROYECTO: SISTEMA PUNTO DE VENTA (PDV) - ABARROTES ARENAS
-- BASE DE DATOS: PdvAbarrotesArenas
-- ============================================================================

USE PdvAbarrotesArenas;
GO

-- 1. EQUIVALENCIA DE PRODUCTOS
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'MigracionProductos' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.MigracionProductos
    (
        IdMigracionProducto INT IDENTITY(1,1) NOT NULL,
        IdOrigen INT NOT NULL,
        CodigoOrigen VARCHAR(50) NOT NULL,
        IdProducto INT NOT NULL,

        CONSTRAINT PK_MigracionProductos PRIMARY KEY (IdMigracionProducto),
        CONSTRAINT UQ_MigracionProductos_IdOrigen UNIQUE (IdOrigen),
        CONSTRAINT FK_MigracionProductos_Productos FOREIGN KEY (IdProducto) REFERENCES dbo.Productos(IdProducto)
    );
    PRINT 'Tabla dbo.MigracionProductos creada.';
END
GO

-- 2. EQUIVALENCIA DE CATEGORIAS
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'MigracionCategorias' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.MigracionCategorias
    (
        IdMigracionCategoria INT IDENTITY(1,1) NOT NULL,
        IdOrigen INT NOT NULL,
        NombreOrigen NVARCHAR(150) NOT NULL,
        IdCategoria INT NOT NULL,

        CONSTRAINT PK_MigracionCategorias PRIMARY KEY (IdMigracionCategoria),
        CONSTRAINT UQ_MigracionCategorias_IdOrigen UNIQUE (IdOrigen),
        CONSTRAINT FK_MigracionCategorias_Categorias FOREIGN KEY (IdCategoria) REFERENCES dbo.Categorias(IdCategoria)
    );
    PRINT 'Tabla dbo.MigracionCategorias creada.';
END
GO

-- 3. EQUIVALENCIA DE MARCAS
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'MigracionMarcas' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.MigracionMarcas
    (
        IdMigracionMarca INT IDENTITY(1,1) NOT NULL,
        NombreMarca VARCHAR(100) NOT NULL,
        IdMarca INT NOT NULL,

        CONSTRAINT PK_MigracionMarcas PRIMARY KEY (IdMigracionMarca),
        CONSTRAINT UQ_MigracionMarcas_Nombre UNIQUE (NombreMarca),
        CONSTRAINT FK_MigracionMarcas_Marcas FOREIGN KEY (IdMarca) REFERENCES dbo.Marcas(IdMarca)
    );
    PRINT 'Tabla dbo.MigracionMarcas creada.';
END
GO

-- 4. EQUIVALENCIA DE PROVEEDORES
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'MigracionProveedores' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.MigracionProveedores
    (
        IdMigracionProveedor INT IDENTITY(1,1) NOT NULL,
        IdOrigen INT NOT NULL,
        IdProveedor INT NOT NULL,

        CONSTRAINT PK_MigracionProveedores PRIMARY KEY (IdMigracionProveedor),
        CONSTRAINT UQ_MigracionProveedores_IdOrigen UNIQUE (IdOrigen),
        CONSTRAINT FK_MigracionProveedores_Proveedores FOREIGN KEY (IdProveedor) REFERENCES dbo.Proveedores(IdProveedor)
    );
    PRINT 'Tabla dbo.MigracionProveedores creada.';
END
GO

-- 5. EQUIVALENCIA DE CLIENTES
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'MigracionClientes' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.MigracionClientes
    (
        IdMigracionCliente INT IDENTITY(1,1) NOT NULL,
        IdOrigen INT NOT NULL,
        IdCliente INT NOT NULL,

        CONSTRAINT PK_MigracionClientes PRIMARY KEY (IdMigracionCliente),
        CONSTRAINT UQ_MigracionClientes_IdOrigen UNIQUE (IdOrigen),
        CONSTRAINT FK_MigracionClientes_Clientes FOREIGN KEY (IdCliente) REFERENCES dbo.Clientes(IdCliente)
    );
    PRINT 'Tabla dbo.MigracionClientes creada.';
END
GO

-- 6. EQUIVALENCIA DE USUARIOS
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'MigracionUsuarios' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.MigracionUsuarios
    (
        IdMigracionUsuario INT IDENTITY(1,1) NOT NULL,
        IdOrigen INT NOT NULL,
        IdUsuario INT NOT NULL,

        CONSTRAINT PK_MigracionUsuarios PRIMARY KEY (IdMigracionUsuario),
        CONSTRAINT UQ_MigracionUsuarios_IdOrigen UNIQUE (IdOrigen),
        CONSTRAINT FK_MigracionUsuarios_Usuarios FOREIGN KEY (IdUsuario) REFERENCES dbo.Usuarios(IdUsuario)
    );
    PRINT 'Tabla dbo.MigracionUsuarios creada.';
END
GO

-- 7. EQUIVALENCIA DE CAJAS
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'MigracionCajas' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.MigracionCajas
    (
        IdMigracionCaja INT IDENTITY(1,1) NOT NULL,
        IdOrigen INT NOT NULL,
        IdCaja INT NOT NULL,

        CONSTRAINT PK_MigracionCajas PRIMARY KEY (IdMigracionCaja),
        CONSTRAINT UQ_MigracionCajas_IdOrigen UNIQUE (IdOrigen),
        CONSTRAINT FK_MigracionCajas_Cajas FOREIGN KEY (IdCaja) REFERENCES dbo.Cajas(IdCaja)
    );
    PRINT 'Tabla dbo.MigracionCajas creada.';
END
GO

-- 8. EQUIVALENCIA DE TURNOS
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'MigracionTurnos' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.MigracionTurnos
    (
        IdMigracionTurno INT IDENTITY(1,1) NOT NULL,
        IdOrigen INT NOT NULL,
        IdTurnoCaja INT NOT NULL,

        CONSTRAINT PK_MigracionTurnos PRIMARY KEY (IdMigracionTurno),
        CONSTRAINT UQ_MigracionTurnos_IdOrigen UNIQUE (IdOrigen),
        CONSTRAINT FK_MigracionTurnos_TurnosCaja FOREIGN KEY (IdTurnoCaja) REFERENCES dbo.TurnosCaja(IdTurnoCaja)
    );
    PRINT 'Tabla dbo.MigracionTurnos creada.';
END
GO

-- 9. EQUIVALENCIA DE CORTES
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'MigracionCortes' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.MigracionCortes
    (
        IdMigracionCorte INT IDENTITY(1,1) NOT NULL,
        IdOrigen INT NOT NULL,
        IdCorteCaja INT NOT NULL,

        CONSTRAINT PK_MigracionCortes PRIMARY KEY (IdMigracionCorte),
        CONSTRAINT UQ_MigracionCortes_IdOrigen UNIQUE (IdOrigen),
        CONSTRAINT FK_MigracionCortes_CortesCaja FOREIGN KEY (IdCorteCaja) REFERENCES dbo.CortesCaja(IdCorteCaja)
    );
    PRINT 'Tabla dbo.MigracionCortes creada.';
END
GO

-- 10. EQUIVALENCIA DE COMPRAS
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'MigracionCompras' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.MigracionCompras
    (
        IdMigracionCompra INT IDENTITY(1,1) NOT NULL,
        IdOrigen INT NOT NULL,
        IdCompra INT NOT NULL,

        CONSTRAINT PK_MigracionCompras PRIMARY KEY (IdMigracionCompra),
        CONSTRAINT UQ_MigracionCompras_IdOrigen UNIQUE (IdOrigen),
        CONSTRAINT FK_MigracionCompras_Compras FOREIGN KEY (IdCompra) REFERENCES dbo.Compras(IdCompra)
    );
    PRINT 'Tabla dbo.MigracionCompras creada.';
END
GO

-- 11. EQUIVALENCIA DE VENTAS
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'MigracionVentas' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.MigracionVentas
    (
        IdMigracionVenta INT IDENTITY(1,1) NOT NULL,
        IdOrigen INT NOT NULL,
        IdVenta INT NOT NULL,

        CONSTRAINT PK_MigracionVentas PRIMARY KEY (IdMigracionVenta),
        CONSTRAINT UQ_MigracionVentas_IdOrigen UNIQUE (IdOrigen),
        CONSTRAINT FK_MigracionVentas_Ventas FOREIGN KEY (IdVenta) REFERENCES dbo.Ventas(IdVenta)
    );
    PRINT 'Tabla dbo.MigracionVentas creada.';
END
GO

-- 12. EQUIVALENCIA DE AJUSTES
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'MigracionAjustesInventario' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.MigracionAjustesInventario
    (
        IdMigracionAjuste INT IDENTITY(1,1) NOT NULL,
        IdOrigen INT NOT NULL,
        IdAjusteInventario INT NOT NULL,

        CONSTRAINT PK_MigracionAjustesInventario PRIMARY KEY (IdMigracionAjuste),
        CONSTRAINT UQ_MigracionAjustesInventario_IdOrigen UNIQUE (IdOrigen),
        CONSTRAINT FK_MigracionAjustes_Ajustes FOREIGN KEY (IdAjusteInventario) REFERENCES dbo.AjustesInventario(IdAjusteInventario)
    );
    PRINT 'Tabla dbo.MigracionAjustesInventario creada.';
END
GO
