# FASE 1 — AUDITORÍA DE BASE DE DATOS Y REPOSITORIO
**Proyecto:** PDV Abarrotes Arenas  
**Entorno:** SQL Server 2022 (`AAM`) / .NET 9 / React + TypeScript + Vite  
**Fecha:** 2026-09-16  

---

## 1. Análisis de Toda la Estructura SQL Server
* **Servidor Local:** `AAM` (SQL Server 2022 Developer Edition v16.0.1000.6).
* **Autenticación:** Windows Authentication.
* **Base de Datos:** `PdvAbarrotesArenas`.
* **Collation:** `Modern_Spanish_CI_AI` (insensible a mayúsculas/minúsculas y acentos).
* **Total de Tablas:** 46 tablas (34 de negocio operativo + 12 de control y migración histórica).
* **Datos Históricos Migrados:**
  - 3,586 Productos con códigos de barras e inventario inicial balanceado.
  - 238,424 Ventas históricas y 478,521 partidas de detalle.
  - 238,424 Pagos vinculados y balanceados centavo a centavo.
  - 486,950 Movimientos de inventario (Kardex completo).
  - 10,030 Compras con sus partidas de detalle.
  - 2,002 Turnos de caja y 1,003 Cortes.
  - 8,177 Movimientos de entrada/salida de caja.

---

## 2. Identificación de Tablas
Las tablas se clasifican en los siguientes módulos:
1. **Catálogos Base:** `Sucursales`, `Cajas`, `Categorias`, `Marcas`, `UnidadesMedida`, `MetodosPago`, `TiposMovimientoInventario`.
2. **Productos e Inventario:** `Productos`, `CodigosBarras`, `Inventario`, `MovimientosInventario`, `AjustesInventario`, `DetalleAjustesInventario`.
3. **Terceros y Crédito:** `Clientes`, `Proveedores`, `CreditosClientes`, `MovimientosCuentaCliente`.
4. **Compras:** `Compras`, `DetalleCompras`.
5. **Ventas y Operación:** `Ventas`, `DetalleVentas`, `VentaPagos`, `Devoluciones`, `DetalleDevoluciones`.
6. **Caja y Turnos:** `TurnosCaja`, `CortesCaja`, `MovimientosCaja`.
7. **Seguridad y Auditoría:** `Usuarios`, `Roles`, `Permisos`, `RolPermisos`, `UsuarioRoles`, `BitacoraSistema`, `Configuracion`.
8. **Control de Migración:** 12 tablas con prefijo `Migracion*` para trazabilidad de IDs de Eleventa.

---

## 3. Identificación de Primary Keys (PK)
* **Regla:** El 100% de las 46 tablas cuentan con una clave primaria de una sola columna denominada `Id[NombreTabla]` o convención homóloga.
* **Tipo de dato:** `INT` entero de 4 bytes.

---

## 4. Identificación de Foreign Keys (FK)
* Se auditaron **52 Foreign Keys** activas en la base de datos que aseguran la consistencia relacional entre sucursales, cajas, usuarios, productos, ventas, pagos y movimientos de stock.

---

## 5. Identificación de Identity
* El 100% de las 46 tablas implementan `IDENTITY(1,1)` autoincrementable gestionado por el motor SQL Server.
* Tras la migración, los valores de semilla (`last_value`) quedaron actualizados al último ID importado de Eleventa para evitar conflictos en nuevas inserciones.

---

## 6. Identificación de Índices
Existen **33 índices especializados no-PK**:
* `IX_CodigosBarras_CodigoBarras` (NONCLUSTERED UNIQUE): Indexa la búsqueda por escáner HID en `dbo.CodigosBarras`.
* `IX_Inventario_IdSucursal_IdProducto` (NONCLUSTERED UNIQUE): Control de stock por sucursal.
* `IX_Ventas_FechaVenta`, `IX_Ventas_Folio`, `IX_Ventas_IdTurno`: Consultas rápidas para cortes y filtros de tickets.
* `IX_DetalleVentas_IdVenta`, `IX_VentaPagos_IdVenta`: Desglose instantáneo de partidas y métodos de pago.
* `IX_MovimientosInventario_IdProducto`: Kardex de producto.

---

## 7. Identificación de Módulos Existentes
* **Módulos con estructura completa:** Catálogos (Categorías, Marcas, Unidades), Productos, Inventario (Stock + Kardex), Ventas (Tickets + Detalle + Pagos), Devoluciones, Compras, Caja (Turnos + Cortes + Movimientos de Efectivo), Clientes y Proveedores.
* **Módulos pendientes de funcionalidad/tablas:** Tickets Pendientes, Imágenes de productos, Bitácora detallada de auditoría con valores antes/después, Pedido sugerido dominical.

---

## 8. Identificación de Tablas Necesarias para Auditoría
* **Estado Actual:** Existe la tabla `dbo.BitacoraSistema` (`IdBitacora`, `IdUsuario`, `Modulo`, `Accion`, `Entidad`, `IdEntidad`, `Detalle`, `DireccionIp`, `FechaRegistro`).
* **Requisito Sección 34:** La especificación exige auditar cambios críticos (precios, stock, cancelaciones, descuentos) almacenando el estado anterior y nuevo.
* `[CAMBIO REQUERIDO EN BASE DE DATOS]`: Se debe crear `dbo.BitacoraAuditoria` (o expandir `dbo.BitacoraSistema`) con:
  - `ValorAnterior NVARCHAR(MAX) NULL`
  - `ValorNuevo NVARCHAR(MAX) NULL`
  - `Usuario NVARCHAR(100) NOT NULL` (obtenido del JWT)
  - `FechaHora DATETIME2 DEFAULT GETDATE()`
  - `DireccionIp NVARCHAR(50) NULL`

---

## 9. Identificación de Soporte para Pagos Múltiples
* **Estado:** **TOTALMENTE SOPORTADO.**
* La tabla relacional `dbo.VentaPagos` desacopla el pago de la cabecera `dbo.Ventas`. Permite registrar múltiples formas de pago para un mismo ticket (ej. Efectivo + Tarjeta, Vales + Efectivo).

---

## 10. Identificación de Soporte para Tickets Pendientes
* **Estado:** **NO EXISTE EN SQL SERVER.**
* `[CAMBIO REQUERIDO EN BASE DE DATOS]`:
  - Crear tabla `dbo.TicketsPendientes` (`IdTicketPendiente`, `IdCaja`, `IdUsuario`, `IdCliente`, `IdentificadorCliente`, `Total`, `FechaRegistro`, `Activo`).
  - Crear tabla `dbo.DetalleTicketsPendientes` (`IdDetalleTicketPendiente`, `IdTicketPendiente`, `IdProducto`, `Cantidad`, `PrecioUnitario`, `Subtotal`, `Notas`).

---

## 11. Identificación de Soporte para Imágenes
* **Estado:** **NO EXISTE EN SQL SERVER.**
* `[CAMBIO REQUERIDO EN BASE DE DATOS]`:
  - `ALTER TABLE dbo.Productos ADD ImagenUrl VARCHAR(500) NULL;`
* **Regla estricta:** La imagen solo se expone y renderiza en el módulo administrativo. El PDV de cobro **NUNCA** recibe ni renderiza imágenes para garantizar latencia cero.

---

## 12. Identificación de Soporte para Recargas y Servicios
* **Estado:** No existen tablas ni proveedores contratados.
* **Regla estricta:** No inventar endpoints ni simulaciones. Se diseñarán las interfaces backend `IProveedorRecargas` e `IProveedorServicios` para inyección de dependencias a futuro.

---

## 13. Resumen de Cambios SQL Necesarios
* `[CAMBIO REQUERIDO EN BASE DE DATOS]` 1: Crear `dbo.BitacoraAuditoria` con `ValorAnterior` y `ValorNuevo`.
* `[CAMBIO REQUERIDO EN BASE DE DATOS]` 2: Crear `dbo.TicketsPendientes` y `dbo.DetalleTicketsPendientes`.
* `[CAMBIO REQUERIDO EN BASE DE DATOS]` 3: Agregar columna `ImagenUrl VARCHAR(500) NULL` a `dbo.Productos`.
* `[CAMBIO REQUERIDO EN BASE DE DATOS]` 4: Crear `dbo.PedidosSugeridos` y `dbo.DetallePedidosSugeridos` para el cálculo dominical.
* `[CAMBIO REQUERIDO EN BASE DE DATOS]` 5: Agregar columna `TokenIdempotencia UNIQUEIDENTIFIER NULL` con índice único condicional a `dbo.Ventas`.

---

## 14. Revisión de Estructura Git
* **Estado Actual:** Repositorio Git no inicializado en la carpeta raíz.
* **Estrategia a Implementar:**
  - Inicializar repositorio local (`git init`).
  - Configurar `.gitignore` robusto que excluya `PDVDATA.FDB` (549 MB), binarios `.NET`, dependencias `node_modules`, builds `dist`.
  - Crear rama base `main` y rama de trabajo `develop`.
  - Flujo de ramas por funcionalidad: `feature/[modulo]`.

---

## 15. Revisión de Backend Existente
* **Estado Actual:** No existe backend previo.
* **Solución Propuesta:** .NET 9 Web API con Arquitectura Limpia Modular (`PdvAbarrotes.Api`, `PdvAbarrotes.Application`, `PdvAbarrotes.Domain`, `PdvAbarrotes.Infrastructure`).

---

## 16. Revisión de Frontend Existente
* **Estado Actual:** No existe frontend previo.
* **Solución Propuesta:** Aplicación SPA React 19 + TypeScript + Vite con diseño premium y estética profesional para negocio de abarrotes de alta rotación.

---

## 17. Propuesta de Arquitectura Técnica
```text
React (Vite + TS + Tailwind/CSS)
   │  [HTTP / JWT Bearer]
   ▼
.NET 9 Web API (Controllers + Middlewares de Excepciones, Idempotencia y Auditoría)
   │
Application Layer (Commands, Queries, DTOs, FluentValidation, Servicios)
   │
Infrastructure Layer (EF Core 9 para OLTP transaccional + Dapper para reportes)
   │
SQL Server 2022 (PdvAbarrotesArenas - READ_COMMITTED_SNAPSHOT activado)
```

---

## 18. Mapa React → API → SQL
Consulte la sección 5 del documento `implementation_plan.md` para la matriz completa de los 16 endpoints clave vinculados con sus componentes y tablas SQL.

---

## 19. Backlog Técnico por Fases
Desglosado en 17 fases consecutivas (de Fase 1 a Fase 17), garantizando desarrollo en paralelo entre API .NET 9 y Frontend React para cada módulo funcional.

---

## 20. Identificación de Riesgos de Rendimiento y Mitigaciones
1. **Concurrencia de ventas (1 venta cada 1-2 min):**
   * Transacciones ultracortas en `dbo.Ventas` y `dbo.Inventario`.
   * Activación de `READ_COMMITTED_SNAPSHOT` en la base de datos para evitar bloqueos entre lecturas y escrituras.
2. **Escaneo de Códigos de Barras (<100ms):**
   * Endpoint específico `/api/v1/productos/barcode/{codigo}` que consulta directamente el índice `IX_CodigosBarras_CodigoBarras` con `AsNoTracking()`.
   * Listener global de teclado en el frontend con temporizador para buffer HID (<30ms por carácter).
3. **Aislamiento de Reportes:**
   * Las consultas gerenciales y reportes de utilidades no compiten con el cajero gracias al aislamiento de instantánea (Snapshot Isolation) y consultas optimizadas asíncronas.
4. **Paginación Server-Side Estricta:**
   * Tamaño por defecto de 25 registros, opciones 25/50/100, evitando cargas masivas de memoria en navegador y servidor.
5. **Cero Imágenes en PDV:**
   * La interfaz del cajero es 100% texto/datos limpios para mantener velocidad de respuesta instantánea.
