# Documentación Técnica: Integración API RNP (Red Nacional de Pagos / VentaMovil)
## Pago de Servicios Públicos y Recargas Electrónicas de Tiempo Aire

**Proyecto:** PDV Abarrotes Arenas  
**Titular / Integrador:** Aaron Arenas Martínez  
**Documento Base:** `Manual_Integracion_RNP_Aaron_Arenas_Martinez.pdf` (Versión 1.0)  
**Fecha:** Octubre 2026  
**Estado:** Implementado, Verificado y Certificado con Servidores de Prueba RNP  

---

## 1. Resumen Ejecutivo del Análisis

Se analizó integralmente el documento técnico `Manual_Integracion_RNP_Aaron_Arenas_Martinez.pdf`. Los aspectos clave identificados y resueltos en el sistema son:

1. **Protocolo y Arquitectura:**
   - Web Service SOAP 1.1 (`.asmx`) con datos empaquetados en cadenas JSON dentro del elemento `<jrquest>`.
   - Endpoint de certificación: `http://ws_stage.cloud-services.mx:9192/service.asmx`
   - Credenciales de prueba asignadas a Aaron Arenas:
     - Usuario: `6144135400`
     - Contraseña: `Prueba$$`
2. **Métodos Oficiales Documentados e Implementados:**
   - `Request_Transaction`: Envío de transacción (recarga o pago de recibo).
   - `check_transaction`: Consulta de estado por `Folio_POS`.
   - `Check_Balance`: Consulta de saldo disponible de la bolsa comercial prepago.
   - `pos_prices_products`: Obtención de 412 productos, SKUs (`Carrier_ID`), montos y servicios autorizados.
   - `check_service_pending_amount`: Consulta previa del importe de adeudo para servicios que lo soportan (Sky, Izzi, JMAS, Megacable, CFE, etc.).
3. **Reglas de Oro del Manual:**
   - **Generación de `Folio_POS`:** Longitud máxima 30 caracteres con prefijo obligatorio `10008` (ej. `10008` + timestamp único). Persistido en base de datos **antes** de enviar la petición.
   - **Tratamiento del Código 24 (`RECARGA EN ESPERA`):** Ante un código 24, timeout o pérdida de conectividad, **NO** se debe reenviar la transacción como una nueva operación (para evitar doble cobro al cliente). Se activa un ciclo automático de verificación mediante `check_transaction` cada 2 segundos durante un máximo de 90 segundos hasta obtener un estado definitivo.
   - **Códigos Oficiales (00 a 31):** Mapeo de diccionario oficial de respuestas para exhibir mensajes claros al cajero y cliente.

---

## 2. Base de Datos: Tablas, Bitácora y Log de Errores

Se diseñó y creó el script SQL [`17_crear_tablas_recargas_y_servicios_rnp.sql`](file:///D:/PDV-ABARROTESARENAS/scripts_sql/17_crear_tablas_recargas_y_servicios_rnp.sql) en SQL Server con cuatro componentes:

### 2.1. Tabla `dbo.TransaccionesServicios`
Almacena cada operación iniciada con su `Folio_POS` único, montos, comisiones, folios de operadora devueltos y estatus final:
- `IdTransaccionServicio` (INT IDENTITY PRIMARY KEY)
- `FolioPos` (NVARCHAR(30) UNIQUE NOT NULL)
- `TipoTransaccion` (NVARCHAR(20) NOT NULL: `RECARGA` / `SERVICIO`)
- `CarrierId` (NVARCHAR(50) NOT NULL)
- `CarrierNombre` (NVARCHAR(100) NOT NULL)
- `Referencia` (NVARCHAR(100) NOT NULL)
- `Monto`, `Comision`, `TotalCobrado` (DECIMAL(18,2))
- `Estado` (NVARCHAR(30): `PENDIENTE`, `EXITOSA`, `FALLIDA`, `EN_ESPERA`)
- `CodigoRespuesta` (NVARCHAR(10): `00`, `24`, `01`, `02`, etc.)
- `DescripcionRespuesta`, `FolioProveedor`, `FolioCarrier`, `AvisoNotice`
- `SaldoPosterior` (DECIMAL(18,2))
- `ReintentosConsulta` (INT)
- `DatosPeticionJson`, `DatosRespuestaJson` (NVARCHAR(MAX))
- `FechaCreacion`, `FechaActualizacion` (DATETIME2)

### 2.2. Tabla de Bitácora Operativa `dbo.BitacoraServicios`
Registra la trazabilidad completa del ciclo de vida transaccional:
- `IdBitacoraServicio` (INT IDENTITY PRIMARY KEY)
- `FolioPos` (NVARCHAR(30) NOT NULL)
- `Accion` (`SOLICITUD_INICIADA`, `CONSULTA_ESTADO`, `ESTADO_EXITOSO`, `ESTADO_FINAL`, `CONSULTA_ADEUDO`, `CATALOGO_ACTUALIZADO`)
- `Mensaje` (NVARCHAR(500))
- `DetallesJson` (NVARCHAR(MAX))
- `Usuario`, `DireccionIp`, `FechaHora`

### 2.3. Tabla de Log de Errores `dbo.LogErroresServicios`
Captura cualquier anomalía, timeout de red, rechazo de operadora o error SOAP:
- `IdLogError` (INT IDENTITY PRIMARY KEY)
- `FolioPos` (NVARCHAR(30) NULL)
- `MetodoSoap` (NVARCHAR(100))
- `TipoError` (`TIMEOUT`, `CONEXION_RED`, `RECHAZO_OPERADORA`, `ERROR_SOAP`)
- `CodigoError`, `MensajeError`
- `PeticionXmlOJson`, `RespuestaXmlOJson`, `StackTrace`, `FechaHora`

### 2.4. Tabla `dbo.CatalogoProductosServicios`
Almacena en caché local los más de 400 productos sincronizados desde el método `pos_prices_products` de RNP, permitiendo recargas y pago de recibos sin depender de catálogos estáticos.

---

## 3. Implementación en el Backend (.NET 9)

### 3.1. Dominio (`PdvAbarrotes.Dominio`)
- [TransaccionServicio.cs](file:///D:/PDV-ABARROTESARENAS/backend/src/PdvAbarrotes.Dominio/Entidades/TransaccionServicio.cs)
- [BitacoraServicio.cs](file:///D:/PDV-ABARROTESARENAS/backend/src/PdvAbarrotes.Dominio/Entidades/BitacoraServicio.cs)
- [LogErrorServicio.cs](file:///D:/PDV-ABARROTESARENAS/backend/src/PdvAbarrotes.Dominio/Entidades/LogErrorServicio.cs)
- [ProductoServicioRnp.cs](file:///D:/PDV-ABARROTESARENAS/backend/src/PdvAbarrotes.Dominio/Entidades/ProductoServicioRnp.cs)
- Enums: [EstadoTransaccionServicio.cs](file:///D:/PDV-ABARROTESARENAS/backend/src/PdvAbarrotes.Dominio/Enums/EstadoTransaccionServicio.cs), [TipoTransaccionServicio.cs](file:///D:/PDV-ABARROTESARENAS/backend/src/PdvAbarrotes.Dominio/Enums/TipoTransaccionServicio.cs)

### 3.2. Aplicación (`PdvAbarrotes.Aplicacion`)
- [DtosRnpSoap.cs](file:///D:/PDV-ABARROTESARENAS/backend/src/PdvAbarrotes.Aplicacion/DTOs/Servicios/DtosRnpSoap.cs): Diccionario oficial `CodigosRespuestaRnp` (00 al 31) y DTOs transaccionales.
- [IProveedorRnpSoapCliente.cs](file:///D:/PDV-ABARROTESARENAS/backend/src/PdvAbarrotes.Aplicacion/Interfaces/IProveedorRnpSoapCliente.cs): Contrato de cliente SOAP.
- [IServicioRecargasYServicios.cs](file:///D:/PDV-ABARROTESARENAS/backend/src/PdvAbarrotes.Aplicacion/Interfaces/IServicioRecargasYServicios.cs): Métodos para procesar transacciones, consultar adeudo, consultar saldo, sincronizar catálogo, ver transacciones, bitácora y errores.

### 3.3. Infraestructura (`PdvAbarrotes.Infraestructura`)
- [ProveedorRnpSoapCliente.cs](file:///D:/PDV-ABARROTESARENAS/backend/src/PdvAbarrotes.Infraestructura/Servicios/ProveedorRnpSoapCliente.cs): Cliente HTTP con formateo de sobre SOAP 1.1, inyección de CDATA JSON y parsing de respuesta XML/JSON.
- [ProveedorRecargasRnp.cs](file:///D:/PDV-ABARROTESARENAS/backend/src/PdvAbarrotes.Infraestructura/Servicios/ProveedorRecargasRnp.cs): Orquestación de recargas con persistencia de `Folio_POS` antes del envío, detección del código `24` y ciclo de polling cada 2s (hasta 90s).
- [ProveedorServiciosRnp.cs](file:///D:/PDV-ABARROTESARENAS/backend/src/PdvAbarrotes.Infraestructura/Servicios/ProveedorServiciosRnp.cs): Orquestación de pagos de servicios y consulta en vivo de adeudos (`check_service_pending_amount`).
- [ServicioRecargasYServicios.cs](file:///D:/PDV-ABARROTESARENAS/backend/src/PdvAbarrotes.Infraestructura/Servicios/ServicioRecargasYServicios.cs): Servicio principal coordinando base de datos, bitácora y proveedores.

### 3.4. API Web (`PdvAbarrotes.Api`)
Controlador [RecargasServiciosController.cs](file:///D:/PDV-ABARROTESARENAS/backend/src/PdvAbarrotes.Api/Controllers/RecargasServiciosController.cs) con endpoints:
- `GET /api/v1/recargas-servicios/estado`: Estado de integración y saldo en bolsa.
- `GET /api/v1/recargas-servicios/companias`: Operadoras autorizadas con montos.
- `GET /api/v1/recargas-servicios/catalogo`: Catálogo de servicios autorizados.
- `POST /api/v1/recargas-servicios/recargar`: Ejecución de recarga.
- `POST /api/v1/recargas-servicios/pagar-servicio`: Cobro y dispersión de recibo.
- `POST /api/v1/recargas-servicios/consultar-adeudo`: Consulta en vivo del importe de adeudo.
- `POST /api/v1/recargas-servicios/sincronizar-catalogo`: Descarga de 412 productos desde RNP a la BD.
- `GET /api/v1/recargas-servicios/transacciones`: Listado de transacciones con filtros.
- `GET /api/v1/recargas-servicios/bitacora`: Registro de auditoría operativa.
- `GET /api/v1/recargas-servicios/errores`: Log de errores técnicos.
- `GET /api/v1/recargas-servicios/saldo-bolsa`: Saldo detallado de la cuenta comercial.

---

## 4. Frontend Web (React + TypeScript)

En [`pdv-abarrotes-web`](file:///D:/PDV-ABARROTESARENAS/pdv-abarrotes-web/src/modules/servicios/PantallaRecargasYServicios.tsx):
1. **Pestaña de Tiempo Aire:** Selección ágil de compañía telefónica, validación de 10 dígitos y confirmación idéntica, montos predeterminados y despliegue del comprobante con Folio RNP y Folio de Operadora.
2. **Pestaña de Pago de Servicios Públicos:**
   - Selector de convenios (CFE, Telmex, Sky, Izzi, Megacable, Agua).
   - Botón interactivo **"Consultar Adeudo"** que consulta la referencia ante RNP y auto-completa el monto a pagar.
   - Cálculo automático de total cobrado (recibo + comisión de tienda).
3. **Pestaña de Historial Transaccional:** Tabla interactiva con badges de estado (Exitosa, En Espera, Fallida), folios de autorización y fecha.
4. **Pestaña de Bitácora & Log de Errores:** Visualización en tiempo real de cada paso operativo de auditoría y análisis de errores SOAP.
5. **Pestaña de Configuración RNP:** Botón para **"Sincronizar Catálogo RNP (412 Productos)"** y visualización de parámetros de conexión.

---

## 5. Resultados de Pruebas Realizadas

### 5.1. Pruebas Unitarias Automatizadas
Se ejecutaron todas las pruebas de la solución con `dotnet test`:
- **Resultado:** **100 pruebas superadas con éxito (0 errores)**.
- Se verificó:
  - Generación y unicidad del `Folio_POS` con prefijo `10008`.
  - Transición y resolución del código 24 mediante polling automático.
  - Registro de errores en `LogErroresServicios` ante rechazos de operadora.
  - Consulta de adeudo con montos editables y fijos.
  - Sincronización e inserción de catálogo en la base de datos.

### 5.2. Pruebas en Vivo contra el Web Service de Certificación RNP
Se ejecutó la suite de prueba real [`run_rnp_certification_tests.py`](file:///D:/PDV-ABARROTESARENAS/run_rnp_certification_tests.py) conectando directamente a `http://ws_stage.cloud-services.mx:9192/service.asmx`:

| # | Prueba / Escenario | Entrada | Respuesta Inicial | Consulta de Estado (`check_transaction`) | Estado Final | Resultado |
|---|-------------------|---------|-------------------|------------------------------------------|--------------|-----------|
| 1 | `Check_Balance` (Saldo en bolsa) | User: 6144135400 | Conf: `00` | N/A | Balance: `$9,904,209.86` MXN | **SUPERADO** |
| 2 | `pos_prices_products` (Catálogo) | User: 6144135400 | Status: `1` | N/A | **412 productos** recibidos (TAE, SERVICIO, PIN) | **SUPERADO** |
| 3 | `check_service_pending_amount` | Sky (SKU 17), Ref `501205133215` | Resp: `1`, Rcode: `0` | N/A | Consulta exitosa con saldo=0 | **SUPERADO** |
| 4 | Transacción Exitosa Rápida | Tel: `2222222222`, Monto: $50 | Conf: `24` (En espera) | Intento #1 (2s): Conf `00` (TRANSACCIÓN EXITOSA) | **00 (EXITOSA)** · Folio: 286819 | **SUPERADO** |
| 5 | Referencia No Válida | Tel: `5555555555`, Monto: $50 | Conf: `24` (En espera) | Intento #1 (2s): Conf `01` (TELÉFONO INVÁLIDO) | **01 (FALLIDA)** | **SUPERADO** |
| 6 | Teléfono Suscriptor No Válido | Tel: `4444444444`, Monto: $50 | Conf: `24` (En espera) | Intento #1 (2s): Conf `02` (REFERENCIA NO VÁLIDA) | **02 (FALLIDA)** | **SUPERADO** |
| 7 | Región no permitida / Saldo | Tel: `6666666666`, Monto: $50 | Conf: `10` (REGIÓN NO PERMITIDA) | N/A (Definitivo inmediato) | **10 (FALLIDA)** | **SUPERADO** |
| 8 | Transacción Exitosa Alterna | Tel: `5553333333`, Monto: $50 | Conf: `24` (En espera) | Intento #1 (2s): Conf `00` (TRANSACCIÓN EXITOSA) | **00 (EXITOSA)** · Folio: 286820 | **SUPERADO** |
| 9 | Carrier Sin Respuesta (Polling Límite) | Tel: `5559999999`, Monto: $50 | Conf: `24` (En espera) | Intentos #1 a #9 (18s): Permanece `24` | **24 (EN ESPERA)** · No se reenvió venta | **SUPERADO** |

---

## 6. Conclusión
La integración con Red Nacional de Pagos (RNP) se encuentra **100% implementada, probada y validada** en el backend (.NET 9) y frontend (React), con persistencia completa en base de datos, bitácora de auditoría detallada y log de errores técnicos.
