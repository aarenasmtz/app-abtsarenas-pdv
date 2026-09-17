-- ============================================================================
-- SCRIPT 15: AGREGAR COLUMNA TipoCorte EN TABLA CortesCaja
-- PROYECTO: SISTEMA PUNTO DE VENTA (PDV) - ABARROTES ARENAS
-- ============================================================================

USE PdvAbarrotesArenas;
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.CortesCaja') AND name = 'TipoCorte')
BEGIN
    ALTER TABLE dbo.CortesCaja ADD TipoCorte VARCHAR(10) NOT NULL DEFAULT 'Z';
    PRINT 'Columna TipoCorte agregada exitosamente a dbo.CortesCaja.';
END
ELSE
BEGIN
    PRINT 'La columna TipoCorte ya existe en dbo.CortesCaja.';
END
GO
