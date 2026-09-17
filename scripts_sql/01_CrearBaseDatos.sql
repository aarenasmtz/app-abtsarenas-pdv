-- ============================================================================
-- SCRIPT 01: CREAR BASE DE DATOS
-- PROYECTO: SISTEMA PUNTO DE VENTA (PDV) - ABARROTES ARENAS
-- SERVIDOR: AAM
-- ============================================================================

IF NOT EXISTS (SELECT 1 FROM sys.databases WHERE name = N'PdvAbarrotesArenas')
BEGIN
    PRINT 'Creando base de datos PdvAbarrotesArenas...';
    CREATE DATABASE PdvAbarrotesArenas
    COLLATE Modern_Spanish_CI_AI;
END
ELSE
BEGIN
    PRINT 'La base de datos PdvAbarrotesArenas ya existe.';
END
GO
