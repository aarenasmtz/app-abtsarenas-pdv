# GUÍA DE DESPLIEGUE EN SERVIDOR VPS (DOCKER COMPOSE)
## PDV Abarrotes Arenas — Servidor Ubuntu 26.04 LTS

---

### 1. Datos del Servidor y Acceso
- **IP Pública:** `179.236.248.165`
- **Sistema Operativo:** Ubuntu 26.04 LTS (x86_64)
- **Directorio de la Aplicación:** `/opt/pdv-abarrotes`
- **URL de Acceso Web:** `http://179.236.248.165/` (o puerto `8081`)

---

### 2. Arquitectura de Contenedores en Producción

El sistema opera bajo **Docker Compose v5.6** con 3 microservicios coordinados:

| Contenedor | Imagen | Puerto Expuesto | Función |
| :--- | :--- | :---: | :--- |
| **`pdv_frontend`** | `nginx:alpine` | `80:80`, `8081:80` | Servidor web estático SPA y Proxy Inverso hacia Backend (`/api/` y `/imagenes/`). |
| **`pdv_backend`** | `pdv-abarrotes-backend` (.NET 9 Runtime) | `5000:5000` | API REST transaccional en C# .NET 9. |
| **`pdv_db`** | `mcr.microsoft.com/mssql/server:2022-latest` | `1433:1433` | Motor de base de datos Microsoft SQL Server 2022 (`PdvAbarrotesArenas`). |

---

### 3. Credenciales del Sistema

#### Usuarios del Punto de Venta (Web):
- **Administrador (Don Juan):**
  - Usuario: `admin`
  - Contraseña: `Admin123*`
  - Acceso: Dashboard, Reportes, Catálogo, Compras, Pedido Sugerido, Configuración.
- **Cajero Principal:**
  - Usuario: `cajero`
  - Contraseña: `Cajero123*`
  - Acceso: Caja de cobro (PDV), Escáner, Granel, Tickets en espera, Cortes X y Z.

#### Base de Datos (SQL Server):
- **Usuario SA:** `sa`
- **Contraseña:** `AbarrotesArenas2026#Sql`
- **Base de Datos:** `PdvAbarrotesArenas`
- **Aislamiento:** `READ_COMMITTED_SNAPSHOT ON`

---

### 4. Comandos de Gestión del Servidor

Para administrar los servicios en el servidor VPS vía SSH:

```bash
# Conectar por SSH
ssh root@179.236.248.165

# Ir al directorio del sistema
cd /opt/pdv-abarrotes

# Ver estado de los contenedores
docker compose ps

# Ver logs en vivo del Backend
docker compose logs -f backend

# Ver logs en vivo del Servidor Web (Nginx)
docker compose logs -f frontend

# Reiniciar todos los servicios
docker compose restart

# Detener los servicios
docker compose down

# Levantar los servicios
docker compose up -d
```

---

### 5. Respaldo de Base de Datos en el VPS

Para generar un respaldo directo de SQL Server desde la consola del servidor:

```bash
docker exec -i pdv_db /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P 'AbarrotesArenas2026#Sql' -C -Q "
BACKUP DATABASE [PdvAbarrotesArenas] 
TO DISK = '/var/opt/mssql/backup/RespaldoManual_$(date +%Y%m%d).bak' 
WITH COMPRESSION, CHECKSUM;
"
```

El archivo `.bak` resultante se guardará en `/opt/pdv-abarrotes/db/backup/`.

---
*Despliegue verificado y operativo al 100% — PDV Abarrotes Arenas (Octubre 2026).*
