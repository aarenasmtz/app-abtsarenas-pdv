-- ============================================================================
-- SCRIPT: 16_respaldo_automatico_base_datos.sql
-- SISTEMA: PDV Abarrotes Arenas
-- DESCRIPCIÓN: Procedimiento y script de respaldo físico completo (Full Backup)
--              con compresión nativa, verificación de integridad (CHECKSUM)
--              y script de restauración ante contingencias.
-- MOTOR: Microsoft SQL Server 2022
-- ============================================================================

USE master;
GO

-- 1. VERIFICAR QUE LA BASE DE DATOS EXISTA
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'PdvAbarrotesArenas')
BEGIN
    RAISERROR('La base de datos PdvAbarrotesArenas no existe en esta instancia.', 16, 1);
    RETURN;
END
GO

-- 2. PROCEDIMIENTO ALMACENADO PARA RESPALDO DIARIO AUTOMATIZADO
USE PdvAbarrotesArenas;
GO

IF OBJECT_ID('dbo.sp_GenerarRespaldoDiario', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_GenerarRespaldoDiario;
GO

CREATE PROCEDURE dbo.sp_GenerarRespaldoDiario
    @RutaDirectorio NVARCHAR(500) = N'C:\RespaldosPdvAbarrotes',
    @RetencionDias INT = 15
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Fecha NVARCHAR(30) = CONVERT(NVARCHAR(30), GETDATE(), 112) + '_' + REPLACE(CONVERT(NVARCHAR(8), GETDATE(), 108), ':', '');
    DECLARE @NombreArchivo NVARCHAR(600) = @RutaDirectorio + N'\PdvAbarrotesArenas_Backup_' + @Fecha + N'.bak';
    DECLARE @NombreBackup NVARCHAR(128) = N'PdvAbarrotesArenas-Full Backup ' + @Fecha;
    DECLARE @Sql NVARCHAR(MAX);

    PRINT '=========================================================';
    PRINT '  INICIANDO RESPALDO COMPLETO DE PDV ABARROTES ARENAS   ';
    PRINT '=========================================================';
    PRINT 'Fecha: ' + CONVERT(NVARCHAR(30), GETDATE(), 120);
    PRINT 'Destino: ' + @NombreArchivo;

    -- Validar o crear el comando de respaldo con compresión y checksum
    SET @Sql = N'BACKUP DATABASE [PdvAbarrotesArenas] 
                 TO DISK = N''' + @NombreArchivo + N''' 
                 WITH NOFORMAT, NOINIT,  
                 NAME = N''' + @NombreBackup + N''', 
                 SKIP, NOREWIND, NOUNLOAD, COMPRESSION, CHECKSUM, STATS = 10;';

    BEGIN TRY
        EXEC sp_executesql @Sql;
        PRINT 'Respaldo completado exitosamente.';

        -- Verificación de integridad del archivo recién generado
        PRINT 'Verificando integridad del archivo .bak generado...';
        SET @Sql = N'RESTORE VERIFYONLY FROM DISK = N''' + @NombreArchivo + N''' WITH CHECKSUM;';
        EXEC sp_executesql @Sql;
        PRINT 'Verificación de integridad aprobada (RESTORE VERIFYONLY OK).';
    END TRY
    BEGIN CATCH
        PRINT 'ERROR AL GENERAR O VERIFICAR EL RESPALDO:';
        PRINT ERROR_MESSAGE();
        THROW;
    END CATCH
END;
GO

-- ============================================================================
-- 3. PROCEDIMIENTO DE MANTENIMIENTO PREVENTIVO DE ÍNDICES Y ESTADÍSTICAS
-- ============================================================================
IF OBJECT_ID('dbo.sp_MantenimientoIndicesYEstadisticas', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_MantenimientoIndicesYEstadisticas;
GO

CREATE PROCEDURE dbo.sp_MantenimientoIndicesYEstadisticas
AS
BEGIN
    SET NOCOUNT ON;
    PRINT 'Iniciando optimización de estadísticas e índices...';

    -- Actualización de estadísticas para optimizar planes de ejecución de consultas
    UPDATE STATISTICS dbo.Productos WITH FULLSCAN;
    UPDATE STATISTICS dbo.Inventario WITH FULLSCAN;
    UPDATE STATISTICS dbo.Ventas WITH FULLSCAN;
    UPDATE STATISTICS dbo.DetalleVentas WITH FULLSCAN;
    UPDATE STATISTICS dbo.CodigosBarras WITH FULLSCAN;
    UPDATE STATISTICS dbo.MovimientosInventario WITH FULLSCAN;

    PRINT 'Estadísticas de tablas críticas actualizadas con FULLSCAN.';
END;
GO

-- ============================================================================
-- GUÍA RÁPIDA DE RESTAURACIÓN ANTE CONTINGENCIAS (EJECUTAR DESDE MASTER):
-- ============================================================================
-- 1. Cerrar conexiones activas a la base de datos
--    ALTER DATABASE [PdvAbarrotesArenas] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
--
-- 2. Restaurar la base de datos reemplazando la actual
--    RESTORE DATABASE [PdvAbarrotesArenas]
--    FROM DISK = N'C:\RespaldosPdvAbarrotes\PdvAbarrotesArenas_Backup_YYYYMMDD_HHMMSS.bak'
--    WITH REPLACE, RECOVERY, STATS = 10;
--
-- 3. Regresar la base de datos a multiusuario
--    ALTER DATABASE [PdvAbarrotesArenas] SET MULTI_USER;

