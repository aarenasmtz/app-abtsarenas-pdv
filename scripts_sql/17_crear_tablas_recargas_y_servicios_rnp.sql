-- ============================================================================
-- SCRIPT: 17_crear_tablas_recargas_y_servicios_rnp.sql
-- DESCRIPCIÓN: Implementación de tablas para la integración con Red Nacional de Pagos (RNP / VentaMovil)
--              1. Tabla de Transacciones de Servicios y Recargas (TransaccionesServicios)
--              2. Tabla de Bitácora Operativa / Auditoría de Servicios (BitacoraServicios)
--              3. Tabla de Log de Errores Técnicos y Excepciones SOAP (LogErroresServicios)
--              4. Tabla de Catálogo de Productos y Servicios RNP (CatalogoProductosServicios)
-- ============================================================================

USE PdvAbarrotesArenas;
GO

-- 1. TABLA TRANSACCIONES DE RECARGAS Y SERVICIOS
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TransaccionesServicios')
BEGIN
    CREATE TABLE dbo.TransaccionesServicios (
        IdTransaccionServicio INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        FolioPos NVARCHAR(30) NOT NULL CONSTRAINT UQ_TransaccionesServicios_FolioPos UNIQUE,
        TipoTransaccion NVARCHAR(20) NOT NULL, -- 'RECARGA' | 'SERVICIO'
        CarrierId NVARCHAR(50) NOT NULL,       -- SKU / Carrier_ID de RNP (ej. '01', '17', '122')
        CarrierNombre NVARCHAR(100) NOT NULL,  -- Ej: 'TELCEL', 'CFE', 'SKY'
        Referencia NVARCHAR(100) NOT NULL,     -- Teléfono (10 dígitos) o Cuenta de Recibo
        Monto DECIMAL(18,2) NOT NULL,
        Comision DECIMAL(18,2) NOT NULL CONSTRAINT DF_TransaccionesServicios_Comision DEFAULT 0.00,
        TotalCobrado DECIMAL(18,2) NOT NULL,
        Estado NVARCHAR(30) NOT NULL,          -- 'PENDIENTE', 'EXITOSA', 'FALLIDA', 'EN_ESPERA', 'TIMEOUT'
        CodigoRespuesta NVARCHAR(10) NULL,     -- Código RNP: '00', '24', '01', '02', '05', etc.
        DescripcionRespuesta NVARCHAR(250) NULL,
        FolioProveedor NVARCHAR(50) NULL,      -- Folio devuelto por RNP
        FolioCarrier NVARCHAR(50) NULL,        -- Folio devuelto por la compañía telefónica / operadora
        AvisoNotice NVARCHAR(250) NULL,        -- Campo 'Notice' devuelto por el servicio
        SaldoPosterior DECIMAL(18,2) NULL,     -- Saldo de la bolsa tras la operación
        FechaOperacionRnp DATETIME2 NULL,      -- transaction_date del proveedor
        IdUsuario INT NULL CONSTRAINT FK_TransaccionesServicios_Usuarios FOREIGN KEY REFERENCES dbo.Usuarios(IdUsuario),
        IdCaja INT NULL CONSTRAINT FK_TransaccionesServicios_Cajas FOREIGN KEY REFERENCES dbo.Cajas(IdCaja),
        IdVenta INT NULL CONSTRAINT FK_TransaccionesServicios_Ventas FOREIGN KEY REFERENCES dbo.Ventas(IdVenta),
        ReintentosConsulta INT NOT NULL CONSTRAINT DF_TransaccionesServicios_Reintentos DEFAULT 0,
        UltimaConsultaEstado DATETIME2 NULL,
        DatosPeticionJson NVARCHAR(MAX) NULL,
        DatosRespuestaJson NVARCHAR(MAX) NULL,
        FechaCreacion DATETIME2(7) NOT NULL CONSTRAINT DF_TransaccionesServicios_FechaCreacion DEFAULT GETDATE(),
        FechaActualizacion DATETIME2(7) NULL
    );

    CREATE NONCLUSTERED INDEX IX_TransaccionesServicios_FechaCreacion 
        ON dbo.TransaccionesServicios(FechaCreacion DESC);

    CREATE NONCLUSTERED INDEX IX_TransaccionesServicios_Estado 
        ON dbo.TransaccionesServicios(Estado) INCLUDE (TipoTransaccion, Monto, Referencia);

    CREATE NONCLUSTERED INDEX IX_TransaccionesServicios_Referencia 
        ON dbo.TransaccionesServicios(Referencia);

    PRINT 'Tabla dbo.TransaccionesServicios creada exitosamente.';
END
ELSE
BEGIN
    PRINT 'Tabla dbo.TransaccionesServicios ya existe.';
END
GO

-- 2. TABLA DE BITÁCORA DE OPERACIONES DE SERVICIOS
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'BitacoraServicios')
BEGIN
    CREATE TABLE dbo.BitacoraServicios (
        IdBitacoraServicio INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        FolioPos NVARCHAR(30) NOT NULL,
        Accion NVARCHAR(60) NOT NULL, -- 'SOLICITUD_INICIADA', 'RESPUESTA_RECIBIDA', 'CONSULTA_ESTADO', 'ESTADO_DEFINITIVO', 'CONSULTA_SALDO', 'CATALOGO_ACTUALIZADO', 'CONSULTA_ADEUDO'
        Mensaje NVARCHAR(500) NOT NULL,
        DetallesJson NVARCHAR(MAX) NULL,
        Usuario NVARCHAR(100) NULL,
        DireccionIp NVARCHAR(50) NULL,
        FechaHora DATETIME2(7) NOT NULL CONSTRAINT DF_BitacoraServicios_FechaHora DEFAULT GETDATE()
    );

    CREATE NONCLUSTERED INDEX IX_BitacoraServicios_FolioPos 
        ON dbo.BitacoraServicios(FolioPos);

    CREATE NONCLUSTERED INDEX IX_BitacoraServicios_FechaHora 
        ON dbo.BitacoraServicios(FechaHora DESC);

    PRINT 'Tabla dbo.BitacoraServicios creada exitosamente.';
END
ELSE
BEGIN
    PRINT 'Tabla dbo.BitacoraServicios ya existe.';
END
GO

-- 3. TABLA DE LOG DE ERRORES TÉCNICOS Y EXCEPCIONES SOAP
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'LogErroresServicios')
BEGIN
    CREATE TABLE dbo.LogErroresServicios (
        IdLogError INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        FolioPos NVARCHAR(30) NULL,
        MetodoSoap NVARCHAR(100) NOT NULL, -- 'Request_Transaction', 'check_transaction', 'Check_Balance', 'pos_prices_products', 'check_service_pending_amount'
        TipoError NVARCHAR(100) NOT NULL,  -- 'TIMEOUT', 'CONEXION_RED', 'ERROR_SOAP', 'RESPUESTA_RECHAZADA', 'EXCEPCION_SISTEMA'
        CodigoError NVARCHAR(20) NULL,
        MensajeError NVARCHAR(MAX) NOT NULL,
        PeticionXmlOJson NVARCHAR(MAX) NULL,
        RespuestaXmlOJson NVARCHAR(MAX) NULL,
        StackTrace NVARCHAR(MAX) NULL,
        FechaHora DATETIME2(7) NOT NULL CONSTRAINT DF_LogErroresServicios_FechaHora DEFAULT GETDATE()
    );

    CREATE NONCLUSTERED INDEX IX_LogErroresServicios_FechaHora 
        ON dbo.LogErroresServicios(FechaHora DESC);

    CREATE NONCLUSTERED INDEX IX_LogErroresServicios_FolioPos 
        ON dbo.LogErroresServicios(FolioPos);

    PRINT 'Tabla dbo.LogErroresServicios creada exitosamente.';
END
ELSE
BEGIN
    PRINT 'Tabla dbo.LogErroresServicios ya existe.';
END
GO

-- 4. TABLA DE CATÁLOGO DE PRODUCTOS Y SERVICIOS RNP
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'CatalogoProductosServicios')
BEGIN
    CREATE TABLE dbo.CatalogoProductosServicios (
        IdCatalogoProducto INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        CarrierId NVARCHAR(50) NOT NULL,    -- SKU RNP (ej. '01', '17', '122')
        Descripcion NVARCHAR(200) NOT NULL,
        Grupo NVARCHAR(50) NOT NULL,        -- 'TAE', 'SERVICIO', 'PIN', etc.
        Monto DECIMAL(18,2) NOT NULL,       -- 0 si es monto variable o monto fijo (ej. 10, 20, 50)
        Observacion NVARCHAR(300) NULL,
        PermiteConsultarAdeudo BIT NOT NULL CONSTRAINT DF_CatProdServ_CheckAmount DEFAULT 0,
        Orden INT NOT NULL CONSTRAINT DF_CatProdServ_Orden DEFAULT 1,
        Activo BIT NOT NULL CONSTRAINT DF_CatProdServ_Activo DEFAULT 1,
        FechaSincronizacion DATETIME2(7) NOT NULL CONSTRAINT DF_CatProdServ_FechaSinc DEFAULT GETDATE()
    );

    CREATE NONCLUSTERED INDEX IX_CatalogoProductosServicios_CarrierId 
        ON dbo.CatalogoProductosServicios(CarrierId);

    CREATE NONCLUSTERED INDEX IX_CatalogoProductosServicios_Grupo 
        ON dbo.CatalogoProductosServicios(Grupo, Activo);

    PRINT 'Tabla dbo.CatalogoProductosServicios creada exitosamente.';
END
ELSE
BEGIN
    PRINT 'Tabla dbo.CatalogoProductosServicios ya existe.';
END
GO
