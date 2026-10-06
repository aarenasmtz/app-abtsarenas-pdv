# PLAN DE MANTENIMIENTO Y RESPALDOS DE BASE DE DATOS
## PDV Abarrotes Arenas — SQL Server 2022

---

### 1. Resumen Ejecutivo de Continuidad de Negocio
Para un negocio de abarrotes de alta rotación, la información de ventas, inventario, cuentas y compras es el activo más valioso. Una pérdida de datos por falla de hardware, corte de energía o error humano puede paralizar las operaciones.

Este documento establece las políticas, procedimientos y scripts automatizados para asegurar **RPO (Punto Objetivo de Recuperación) < 24 horas** y **RTO (Tiempo Objetivo de Recuperación) < 15 minutos**.

---

### 2. Estrategia de Respaldo

| Parámetro | Configuración | Justificación |
| :--- | :--- | :--- |
| **Tipo de Respaldo** | Completo (Full Backup) | Simplifica al máximo la restauración a un único archivo `.bak`. |
| **Frecuencia** | Diario al cierre del día (11:30 PM) | No interfiere con el pico de ventas del día. |
| **Compresión** | Activada (`COMPRESSION`) | Reduce el tamaño del archivo `.bak` en un 70-80% y acelera la escritura. |
| **Verificación** | Activada (`CHECKSUM` + `RESTORE VERIFYONLY`) | Garantiza matemáticamente que el archivo no esté corrupto. |
| **Directorio Local** | `C:\RespaldosPdvAbarrotes\` | Ruta estándar dedicada en el servidor principal. |
| **Copia Externa** | Memoria USB o Nube (OneDrive / Google Drive) | Protección contra robo físico o daño catastrófico de la computadora. |
| **Retención** | 15 a 30 días | Mantiene historial suficiente sin saturar el almacenamiento. |

---

### 3. Procedimiento Almacenado de Respaldo (`sp_GenerarRespaldoDiario`)

El procedimiento está instalado en la base de datos `PdvAbarrotesArenas`. Para ejecutarlo manualmente desde SQL Server Management Studio (SSMS) o cualquier consola:

```sql
USE PdvAbarrotesArenas;
GO

EXEC dbo.sp_GenerarRespaldoDiario 
    @RutaDirectorio = N'C:\RespaldosPdvAbarrotes',
    @RetencionDias = 15;
GO
```

#### Características del procedimiento:
- Crea el archivo con nomenclatura por fecha y hora: `PdvAbarrotesArenas_Backup_YYYYMMDD_HHMMSS.bak`.
- Realiza el respaldo con verificación de páginas `CHECKSUM`.
- Ejecuta de inmediato `RESTORE VERIFYONLY` para validar la legibilidad del archivo.

---

### 4. Automatización con el Programador de Tareas de Windows (Task Scheduler)

Para tiendas que utilizan SQL Server Express (donde SQL Server Agent no está disponible de forma nativa), se utiliza una tarea programada en Windows con PowerShell.

#### Script PowerShell de Automatización (`respaldo_diario.ps1`):
Guarde el siguiente script en `C:\RespaldosPdvAbarrotes\respaldo_diario.ps1`:

```powershell
# ==============================================================================
# Script de Respaldo Automatizado - PDV Abarrotes Arenas
# ==============================================================================
$Servidor = "AAM"
$BaseDatos = "PdvAbarrotesArenas"
$DirectorioRespaldos = "C:\RespaldosPdvAbarrotes"
$Fecha = Get-Date -Format "yyyyMMdd_HHmmss"
$ArchivoBak = "$DirectorioRespaldos\PdvAbarrotesArenas_Backup_$Fecha.bak"

# 1. Crear directorio si no existe
if (!(Test-Path -Path $DirectorioRespaldos)) {
    New-Item -ItemType Directory -Path $DirectorioRespaldos -Force | Out-Null
}

# 2. Comando T-SQL de respaldo con compresión y checksum
$QuerySql = @"
BACKUP DATABASE [$BaseDatos] 
TO DISK = N'$ArchivoBak' 
WITH NOFORMAT, NOINIT, 
NAME = N'$BaseDatos-Full Backup $Fecha', 
SKIP, NOREWIND, NOUNLOAD, COMPRESSION, CHECKSUM;

RESTORE VERIFYONLY FROM DISK = N'$ArchivoBak' WITH CHECKSUM;
"@

# 3. Ejecutar mediante sqlcmd o módulo de SQL Server
sqlcmd -S $Servidor -E -Q $QuerySql

# 4. Depuración de respaldos antiguos (más de 15 días)
Get-ChildItem -Path $DirectorioRespaldos -Filter "*.bak" | Where-Object {
    $_.CreationTime -lt (Get-Date).AddDays(-15)
} | Remove-Item -Force

Write-Host "Respaldo y verificación completados con éxito: $ArchivoBak"
```

#### Configurar la Tarea en Windows:
1. Abra el **Programador de Tareas** (`taskschd.msc`).
2. Haga clic en **Crear Tarea**.
   - **General:** Nombre: *"Respaldo Diario PDV Abarrotes Arenas"*. Marcar *"Ejecutar con los privilegios más altos"*.
   - **Desencadenadores:** Diariamente a las `23:30` (11:30 PM).
   - **Acciones:** Iniciar un programa:
     - Programa: `powershell.exe`
     - Argumentos: `-ExecutionPolicy Bypass -File "C:\RespaldosPdvAbarrotes\respaldo_diario.ps1"`
3. Guardar la tarea.

---

### 5. Procedimiento de Restauración Ante Contingencias (Disaster Recovery)

Si se daña el disco duro o se migra el sistema a una nueva computadora:

#### Paso 1: Instalar requisitos en el nuevo equipo
1. Instalar SQL Server 2022.
2. Instalar el runtime de .NET 9.
3. Copiar el archivo `.bak` más reciente (ej. `PdvAbarrotesArenas_Backup_20261005_233000.bak`) a `C:\RespaldosPdvAbarrotes\`.

#### Paso 2: Ejecutar el script T-SQL de Restauración
Abra SQL Server Management Studio o ejecute en consola conectándose a `master`:

```sql
USE master;
GO

-- 1. Si la base de datos existe, desconectar usuarios activos inmediatamente
IF EXISTS (SELECT name FROM sys.databases WHERE name = N'PdvAbarrotesArenas')
BEGIN
    ALTER DATABASE [PdvAbarrotesArenas] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
END
GO

-- 2. Restaurar la base de datos desde el archivo .bak
RESTORE DATABASE [PdvAbarrotesArenas]
FROM DISK = N'C:\RespaldosPdvAbarrotes\PdvAbarrotesArenas_Backup_20261005_233000.bak'
WITH REPLACE, RECOVERY, STATS = 10;
GO

-- 3. Confirmar que el aislamiento no bloqueante siga activo
ALTER DATABASE [PdvAbarrotesArenas] SET READ_COMMITTED_SNAPSHOT ON WITH ROLLBACK IMMEDIATE;
GO

-- 4. Devolver la base de datos al modo multiusuario
ALTER DATABASE [PdvAbarrotesArenas] SET MULTI_USER;
GO

PRINT 'Base de datos restaurada y lista para operar.';
```

---

### 6. Mantenimiento Preventivo Semanal

Para mantener los tiempos de consulta en mostrador por debajo de los 30 milisegundos a lo largo de los meses y años:

#### Actualización de Estadísticas e Índices
Ejecutar semanalmente (domingos después del cierre):
```sql
USE PdvAbarrotesArenas;
GO
EXEC dbo.sp_MantenimientoIndicesYEstadisticas;
GO
```

Este procedimiento ejecuta `UPDATE STATISTICS ... WITH FULLSCAN` sobre las tablas de mayor volumen (`Productos`, `Inventario`, `Ventas`, `DetalleVentas`, `CodigosBarras`, `MovimientosInventario`), asegurando que el optimizador de SQL Server elija siempre los índices cubrientes creados en la Fase 16.

---

### 7. Lista de Verificación (Checklist) para Don Juan

- [ ] ¿Se verificó que la carpeta `C:\RespaldosPdvAbarrotes\` contiene archivos `.bak` generados diariamente?
- [ ] ¿Se copia al menos una vez por semana el respaldo a una memoria USB externa que se guarda fuera del local?
- [ ] ¿Se probó la restauración en un entorno de pruebas al menos una vez cada 6 meses?

---
*Documento de Mantenimiento y Respaldos — PDV Abarrotes Arenas (2026).*
