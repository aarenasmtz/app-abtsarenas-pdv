# GUÍA DE DESPLIEGUE Y PUESTA EN PRODUCCIÓN EN WINDOWS
## Sistema de Punto de Venta — Abarrotes Arenas

---

### 1. Resumen y Arquitectura de Despliegue
El sistema **PDV Abarrotes Arenas** está optimizado para funcionar como una aplicación local cliente-servidor de alto desempeño en la tienda:
- **Servidor Local / Terminal Principal (Caja 1):** Aloja la base de datos SQL Server 2022, el Backend Web API en .NET 9 y el servidor estático del Frontend React.
- **Terminales Secundarias / Tablets (Caja 2, Bodega, Don Juan):** Se conectan a través de la Red Local (LAN o Wi-Fi de la tienda) accediendo mediante su navegador web sin necesidad de instalar nada en las terminales secundarias.

---

### 2. Requisitos Previos del Sistema Operativo

#### Hardware Mínimo Recomendado para Servidor / Caja Principal:
- **Procesador:** Intel Core i3 / AMD Ryzen 3 (o superior).
- **Memoria RAM:** 8 GB RAM (16 GB recomendado para soporte holgado de SQL Server y múltiples terminales).
- **Almacenamiento:** Disco de Estado Sólido (SSD) con al menos 20 GB de espacio libre.
- **Sistema Operativo:** Windows 10 Pro (64 bits), Windows 11 Pro o Windows Server 2022.

#### Software Base a Instalar:
1. **Microsoft SQL Server 2022** (Express o Standard).
2. **.NET 9 Hosting Bundle / ASP.NET Core Runtime 9.0 (x64)** (Descargar de Microsoft).
3. **Navegador Web Moderno:** Google Chrome o Microsoft Edge.

---

### 3. Publicación del Backend (.NET 9 Web API)

Para compilar y empaquetar la versión final optimizada y sin dependencias de depuración:

```powershell
# Desde la raíz del proyecto backend:
cd d:\PDV-ABARROTESARENAS\backend\src\PdvAbarrotes.Api

# Compilar en modo Release optimizado
dotnet publish -c Release -r win-x64 --no-self-contained -o C:\PdvAbarrotes\Backend
```

#### Archivo de Configuración de Producción (`appsettings.Production.json`):
Cree o ajuste en `C:\PdvAbarrotes\Backend\appsettings.Production.json`:
```json
{
  "ConnectionStrings": {
    "CadenaConexion": "Server=AAM;Database=PdvAbarrotesArenas;Trusted_Connection=True;TrustServerCertificate=True;"
  },
  "Jwt": {
    "ClaveSecreta": "PdvAbarrotesArenas_SuperClaveSecretaSegura2026_JWT_Token_Key_987654321",
    "Emisor": "PdvAbarrotesApi",
    "Audiencia": "PdvAbarrotesWeb",
    "ExpiracionMinutos": 480
  },
  "Cors": {
    "OrigenesPermitidos": [
      "http://localhost:8081",
      "http://127.0.0.1:8081",
      "http://192.168.1.100:8081"
    ]
  },
  "AllowedHosts": "*"
}
```
*(Reemplace `192.168.1.100` por la IP local fija del servidor de la tienda).*

---

### 4. Publicación del Frontend (React 19 + TypeScript + Vite)

El frontend está optimizado con división de código (code-splitting) generando un bundle inicial ultraliviano de 112 kB.

```powershell
# Desde la raíz del proyecto web:
cd d:\PDV-ABARROTESARENAS\pdv-abarrotes-web

# Instalar dependencias y compilar bundle de producción
npm run build

# Copiar la carpeta 'dist' compilada a la ruta de producción
New-Item -ItemType Directory -Path "C:\PdvAbarrotes\Frontend" -Force
Copy-Item -Path "dist\*" -Destination "C:\PdvAbarrotes\Frontend" -Recurse -Force
```

---

### 5. Configuración del Backend como Servicio de Windows (Auto-Arranque)

Para que el sistema inicie automáticamente al encender la computadora sin necesidad de que un usuario inicie sesión en Windows:

#### Opción Recomendada con NSSM (Non-Sucking Service Manager):
1. Descargar `nssm.exe` y colocarlo en `C:\PdvAbarrotes\`.
2. Abrir PowerShell como Administrador y ejecutar:
```powershell
# Registrar servicio de Windows
C:\PdvAbarrotes\nssm.exe install PdvAbarrotesBackend "C:\PdvAbarrotes\Backend\PdvAbarrotes.Api.exe"

# Configurar directorio de trabajo
C:\PdvAbarrotes\nssm.exe set PdvAbarrotesBackend AppDirectory "C:\PdvAbarrotes\Backend"

# Configurar puerto HTTP de producción (ej. 5000)
C:\PdvAbarrotes\nssm.exe set PdvAbarrotesBackend AppEnvironmentExtra ASPNETCORE_ENVIRONMENT=Production ASPNETCORE_URLS=http://0.0.0.0:5000

# Iniciar el servicio
Start-Service PdvAbarrotesBackend
```

---

### 6. Servir el Frontend en Red Local (LAN)

Para servir los archivos estáticos de `C:\PdvAbarrotes\Frontend` en el puerto 8081:

#### Opción A: Servidor Ligero con Node.js / `serve`
```powershell
# Instalar serve globalmente
npm install -g serve

# Registrar como servicio con NSSM:
C:\PdvAbarrotes\nssm.exe install PdvAbarrotesFrontend "C:\Program Files\nodejs\node.exe" "C:\Users\<Usuario>\AppData\Roaming\npm\node_modules\serve\build\main.js" -s "C:\PdvAbarrotes\Frontend" -l 8081
Start-Service PdvAbarrotesFrontend
```

#### Opción B: IIS (Internet Information Services) en Windows
1. Habilitar la característica de IIS en Windows con el módulo *URL Rewrite*.
2. Crear un sitio web apuntando a `C:\PdvAbarrotes\Frontend` en el puerto 8081.

---

### 7. Configuración de Hardware en Mostrador

#### 7.1 Escáner de Código de Barras USB (Pistola HID)
- **Modo:** Emulación de Teclado USB (HID Keyboard).
- **Configuración de Sufijo Obligatoria:** Debe tener habilitado el retorno de carro (**Suffix Enter / CR / LF**). La mayoría de los escáneres (Honeywell, Zebra, Tera, Netum) traen un código de barras en su folleto titulado *"Add CR/Enter Suffix"*. Escanéelo una sola vez y quedará memorizado.
- **Verificación:** Al escanear una lata en el bloc de notas, debe escribir el número y brincar inmediatamente al siguiente renglón.

#### 7.2 Impresora Térmica de Tickets (58 mm / 80 mm)
- **Conexión:** USB o Red Ethernet.
- **Controlador:** Instalar el driver oficial de la impresora (ej. Xprinter, Epson TM-T20, POS-58, Bixolon).
- **Configuración en Windows:**
  - Definir la impresora térmica como **Impresora Predeterminada**.
  - En *Propiedades del Servidor de Impresión* o *Preferencias de Impresión*:
    - Tamaño de papel: `58 x 210 mm` o `80 x 297 mm`.
    - Márgenes: 0 mm.
- **Impresión silenciosa en navegador (Kiosk Mode):**
  - Para evitar que aparezca la ventana emergente de impresión de Chrome/Edge en cada ticket:
  - Crear un acceso directo de Chrome con el parámetro:
    `"C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk-printing http://localhost:8081`

#### 7.3 Cajón de Dinero Electrónico
- Conectar el cable RJ11 del cajón directamente al puerto **DK (Drawer Kick)** de la impresora térmica.
- En las propiedades de la impresora en Windows, marcar la casilla *"Abrir cajón de dinero antes de imprimir"* o *"Open drawer on print"*.

---

### 8. Configuración del Firewall de Windows para Terminales en Red

Para que la segunda terminal o la tablet de Don Juan puedan conectarse:
1. Abra PowerShell como Administrador.
2. Habilite las reglas de entrada para los puertos del sistema:

```powershell
# Permitir acceso al Frontend (8081)
New-NetFirewallRule -DisplayName "PDV Abarrotes Arenas - Web Frontend" -Direction Inbound -LocalPort 8081 -Protocol TCP -Action Allow

# Permitir acceso a la API Backend (5000)
New-NetFirewallRule -DisplayName "PDV Abarrotes Arenas - Backend API" -Direction Inbound -LocalPort 5000 -Protocol TCP -Action Allow
```

3. Desde la segunda computadora o tablet conectada a la misma red Wi-Fi, abra el navegador en:
   `http://192.168.1.100:8081`

---

### 9. Protocolo de Verificación Final (Sanity Check)

Antes de abrir la tienda al público:
1. [ ] Ingresar con usuario `admin` o `cajero`.
2. [ ] Abrir turno con fondo de $500.00.
3. [ ] Escanear 3 productos con la pistola y verificar que se escuche el tono auditivo y se agreguen en pantalla en <50ms.
4. [ ] Agregar un producto a granel (ej. 0.500 kg de jitomate) y verificar el cálculo de precio.
5. [ ] Suspender con `F6` y reanudar con `F7`.
6. [ ] Cobrar con `F12` en efectivo, registrar cambio y verificar impresión del ticket físico.
7. [ ] Realizar Corte X y validar que refleje exactamente el efectivo cobrado.
8. [ ] Comprobar que el respaldo diario automatizado esté programado en el Programador de Tareas.

---
*Guía de Despliegue en Windows — PDV Abarrotes Arenas (2026).*
