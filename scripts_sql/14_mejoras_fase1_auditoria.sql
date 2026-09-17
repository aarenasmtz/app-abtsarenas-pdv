-- ============================================================================
-- SCRIPT: 14_mejoras_fase1_auditoria.sql
-- DESCRIPCIÓN: Implementación de requerimientos detectados en la Fase 1:
--              1. Tabla de Auditoría Granular (BitacoraAuditoria con ValorAnterior y ValorNuevo)
--              2. Tablas para Ventas en Espera (TicketsPendientes y DetalleTicketsPendientes)
--              3. Soporte de Imagen de Producto (ImagenUrl en Productos)
--              4. Tablas para Pedido Sugerido Dominical (PedidosSugeridos y DetallePedidosSugeridos)
--              5. Token de Idempotencia en Ventas
--              6. Habilitación de READ_COMMITTED_SNAPSHOT para evitar bloqueos
-- ============================================================================

USE PdvAbarrotesArenas;
GO

-- 1. BITÁCORA DE AUDITORÍA DETALLADA
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'BitacoraAuditoria')
BEGIN
    CREATE TABLE dbo.BitacoraAuditoria (
        IdAuditoria INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        Tabla NVARCHAR(100) NOT NULL,
        IdRegistro INT NOT NULL,
        Accion NVARCHAR(50) NOT NULL, -- INSERT / UPDATE / DELETE / AJUSTE_STOCK / CAMBIO_PRECIO / CANCELACION
        ValorAnterior NVARCHAR(MAX) NULL,
        ValorNuevo NVARCHAR(MAX) NULL,
        Usuario NVARCHAR(100) NOT NULL,
        FechaHora DATETIME2(7) NOT NULL CONSTRAINT DF_BitacoraAuditoria_FechaHora DEFAULT GETDATE(),
        DireccionIp NVARCHAR(50) NULL
    );

    CREATE NONCLUSTERED INDEX IX_BitacoraAuditoria_Tabla_IdRegistro 
        ON dbo.BitacoraAuditoria(Tabla, IdRegistro);

    CREATE NONCLUSTERED INDEX IX_BitacoraAuditoria_FechaHora 
        ON dbo.BitacoraAuditoria(FechaHora DESC);

    PRINT 'Tabla dbo.BitacoraAuditoria creada exitosamente.';
END
ELSE
BEGIN
    PRINT 'Tabla dbo.BitacoraAuditoria ya existe.';
END
GO

-- 2. TICKETS PENDIENTES / VENTAS EN ESPERA
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TicketsPendientes')
BEGIN
    CREATE TABLE dbo.TicketsPendientes (
        IdTicketPendiente INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        IdCaja INT NOT NULL CONSTRAINT FK_TicketsPendientes_Cajas FOREIGN KEY REFERENCES dbo.Cajas(IdCaja),
        IdUsuario INT NOT NULL CONSTRAINT FK_TicketsPendientes_Usuarios FOREIGN KEY REFERENCES dbo.Usuarios(IdUsuario),
        IdCliente INT NOT NULL CONSTRAINT FK_TicketsPendientes_Clientes FOREIGN KEY REFERENCES dbo.Clientes(IdCliente),
        IdentificadorCliente NVARCHAR(100) NOT NULL, -- Ej: "Cliente gorra azul", "Señora Ana"
        Total DECIMAL(18,2) NOT NULL CONSTRAINT DF_TicketsPendientes_Total DEFAULT 0.00,
        FechaRegistro DATETIME2(7) NOT NULL CONSTRAINT DF_TicketsPendientes_Fecha DEFAULT GETDATE(),
        Activo BIT NOT NULL CONSTRAINT DF_TicketsPendientes_Activo DEFAULT 1
    );

    CREATE NONCLUSTERED INDEX IX_TicketsPendientes_Caja_Activo 
        ON dbo.TicketsPendientes(IdCaja, Activo) INCLUDE (IdentificadorCliente, Total, FechaRegistro);

    PRINT 'Tabla dbo.TicketsPendientes creada exitosamente.';
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'DetalleTicketsPendientes')
BEGIN
    CREATE TABLE dbo.DetalleTicketsPendientes (
        IdDetalleTicketPendiente INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        IdTicketPendiente INT NOT NULL CONSTRAINT FK_DetalleTickets_Tickets FOREIGN KEY REFERENCES dbo.TicketsPendientes(IdTicketPendiente) ON DELETE CASCADE,
        IdProducto INT NOT NULL CONSTRAINT FK_DetalleTickets_Productos FOREIGN KEY REFERENCES dbo.Productos(IdProducto),
        Cantidad DECIMAL(18,4) NOT NULL,
        PrecioUnitario DECIMAL(18,2) NOT NULL,
        Subtotal DECIMAL(18,2) NOT NULL,
        Notas NVARCHAR(250) NULL
    );

    CREATE NONCLUSTERED INDEX IX_DetalleTicketsPendientes_Ticket 
        ON dbo.DetalleTicketsPendientes(IdTicketPendiente);

    PRINT 'Tabla dbo.DetalleTicketsPendientes creada exitosamente.';
END
GO

-- 3. IMAGEN DEL PRODUCTO (EXCLUSIVA MÓDULO ADMINISTRATIVO)
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('dbo.Productos') AND name = 'ImagenUrl'
)
BEGIN
    ALTER TABLE dbo.Productos ADD ImagenUrl VARCHAR(500) NULL;
    PRINT 'Columna ImagenUrl agregada a dbo.Productos.';
END
ELSE
BEGIN
    PRINT 'Columna ImagenUrl ya existe en dbo.Productos.';
END
GO

-- 4. PEDIDO SUGERIDO DOMINICAL
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PedidosSugeridos')
BEGIN
    CREATE TABLE dbo.PedidosSugeridos (
        IdPedidoSugerido INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        IdSucursal INT NOT NULL CONSTRAINT FK_PedidosSugeridos_Sucursales FOREIGN KEY REFERENCES dbo.Sucursales(IdSucursal),
        FechaGeneracion DATETIME2(7) NOT NULL CONSTRAINT DF_PedidosSugeridos_Fecha DEFAULT GETDATE(),
        SemanaAnio INT NOT NULL,
        Anio INT NOT NULL,
        Estado NVARCHAR(50) NOT NULL CONSTRAINT DF_PedidosSugeridos_Estado DEFAULT 'GENERADO', -- GENERADO / REVISADO / PROCESADO
        Observaciones NVARCHAR(500) NULL
    );

    PRINT 'Tabla dbo.PedidosSugeridos creada exitosamente.';
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'DetallePedidosSugeridos')
BEGIN
    CREATE TABLE dbo.DetallePedidosSugeridos (
        IdDetallePedidoSugerido INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        IdPedidoSugerido INT NOT NULL CONSTRAINT FK_DetallePedidos_Pedidos FOREIGN KEY REFERENCES dbo.PedidosSugeridos(IdPedidoSugerido) ON DELETE CASCADE,
        IdProducto INT NOT NULL CONSTRAINT FK_DetallePedidos_Productos FOREIGN KEY REFERENCES dbo.Productos(IdProducto),
        IdProveedor INT NOT NULL CONSTRAINT FK_DetallePedidos_Proveedores FOREIGN KEY REFERENCES dbo.Proveedores(IdProveedor),
        StockActual DECIMAL(18,4) NOT NULL,
        VentaPromedioDiaria DECIMAL(18,4) NOT NULL,
        DiasCobertura INT NOT NULL CONSTRAINT DF_DetallePedidos_Dias DEFAULT 7,
        CantidadSugerida DECIMAL(18,4) NOT NULL,
        CantidadAjustada DECIMAL(18,4) NULL,
        PrecioCostoUnitario DECIMAL(18,2) NOT NULL,
        SubtotalSugerido DECIMAL(18,2) NOT NULL
    );

    CREATE NONCLUSTERED INDEX IX_DetallePedidosSugeridos_Pedido 
        ON dbo.DetallePedidosSugeridos(IdPedidoSugerido);

    PRINT 'Tabla dbo.DetallePedidosSugeridos creada exitosamente.';
END
GO

-- 5. TOKEN DE IDEMPOTENCIA EN VENTAS
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('dbo.Ventas') AND name = 'TokenIdempotencia'
)
BEGIN
    ALTER TABLE dbo.Ventas ADD TokenIdempotencia UNIQUEIDENTIFIER NULL;
    PRINT 'Columna TokenIdempotencia agregada a dbo.Ventas.';
END
GO

IF NOT EXISTS (
    SELECT * FROM sys.indexes 
    WHERE object_id = OBJECT_ID('dbo.Ventas') AND name = 'UQ_Ventas_TokenIdempotencia'
)
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX UQ_Ventas_TokenIdempotencia 
        ON dbo.Ventas(TokenIdempotencia) 
        WHERE TokenIdempotencia IS NOT NULL;

    PRINT 'Indice TokenIdempotencia agregado a dbo.Ventas.';
END
GO
