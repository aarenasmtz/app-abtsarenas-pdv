# CONTEXTO RÁPIDO PARA IA (AI_CONTEXT.md)

## 1. Proyecto y Objetivo
* **Nombre:** PDV Abarrotes Arenas
* **Objetivo:** Sistema de Punto de Venta (PDV) de alta rotación para tienda de abarrotes. Concurrencia de 1 venta cada 1-2 minutos, lectura de escáner de código de barras HID en <100ms, soporte de tickets en espera, pagos mixtos (efectivo/tarjeta/vales), auditoría estricta de cambios, cortes de caja X y Z, pedidos sugeridos dominicales y reportes desacoplados sin bloqueo de base de datos.
* **REGLA CRÍTICA INNEGOCIABLE:** Variables, nombres de controladores, entidades, DTOs, métodos, servicios, componentes React y funciones **TODO VA EN ESPAÑOL**, con código limpio, tipado estricto y comentarios claros para facilitar el mantenimiento futuro por parte del usuario.

## 2. Stack Tecnológico
* **Backend:** .NET 9 Web API C# (Clean Modular Architecture: Api, Aplicacion, Dominio, Infraestructura, Tests).
* **Base de Datos:** Microsoft SQL Server 2022 (`AAM`), Base de Datos `PdvAbarrotesArenas`, `READ_COMMITTED_SNAPSHOT` habilitado.
* **Frontend:** React 19 + TypeScript + Vite (`pdv-abarrotes-web`), Tailwind CSS / Vanilla CSS, Lucide React, Axios, Zustand.
* **ORM & Acceso a Datos:** Entity Framework Core 9 (transaccional OLTP) + Dapper / Consultas compiladas (reportes pesados).
* **Autenticación:** JWT Bearer con roles (`Administrador`, `Cajero`, `Supervisor`).

## 3. Arquitectura y Convenciones
* **IDs:** Llaves primarias simples `INT IDENTITY(1,1)`.
* **Moneda:** `DECIMAL(18,2)`.
* **Pesos / Cantidades Fraccionadas:** `DECIMAL(18,4)`.
* **Idioma:** Español en código C#, TypeScript, base de datos y documentación.
* **Paginación:** Server-side obligatoria (25 por defecto, selector 25/50/100, máx 100).
* **Escáner HID:** Detección de ráfaga de pulsaciones (<30ms) mediante hook `useEscanerCodigoBarras`.
* **Imágenes:** Solo en módulo administrativo. **CERO** imágenes en el flujo del cajero (PDV) para latencia cero.
* **Recargas y Servicios:** Pendientes de contratación externa. Interfaces `IProveedorRecargas` e `IProveedorServicios` listas sin endpoints simulados.
* **Auditoría:** Tabla `dbo.BitacoraAuditoria` registra usuario (de JWT), acción, fecha, IP y `ValorAnterior` vs `ValorNuevo`.

## 4. Estructura de Proyectos
```text
/
├── backend/
│   ├── PdvAbarrotes.sln
│   ├── src/
│   │   ├── PdvAbarrotes.Api/            (Controladores en español, Middlewares, Swagger)
│   │   ├── PdvAbarrotes.Aplicacion/     (Casos de uso, DTOs, Validadores, Interfaces)
│   │   ├── PdvAbarrotes.Dominio/        (Entidades, Enums, Excepciones de negocio)
│   │   └── PdvAbarrotes.Infraestructura/(EF Core ContextoPrincipal, Dapper, Servicios)
│   └── tests/
│       └── PdvAbarrotes.Tests/          (Pruebas unitarias e integración)
├── pdv-abarrotes-web/                   (App React + TypeScript + Vite)
├── scripts_sql/                         (Scripts DDL y mejoras)
└── docs/                                (Estado, mapeos y bitácoras)
```

## 5. Estado Actual
* **Fase 1:** Auditoría completada y documentada. Esquema SQL auditado y actualizado (46 tablas base + 5 mejoras aplicadas: `BitacoraAuditoria`, `TicketsPendientes`, `DetalleTicketsPendientes`, `ImagenUrl`, `PedidosSugeridos`, `TokenIdempotencia`).
* **Fase 2:** Creación de solución .NET 9 en español, scaffolding de React + TypeScript + Vite, configuración de dependencias y middlewares base.
* **Fase 4:** Catálogo Maestro de Productos, Categorías, Marcas, Unidades de Medida, subida y almacenamiento de imágenes administrativas, paginación server-side (25/50/100), auditoría de cambio de precios, buscador predictivo ultrarrápido y escáner de caja en PDV sin imágenes.
* **Fase 5:** Módulo de Control de Inventario, Kardex Histórico (486k movimientos) y Alertas de Reorden completado. Transacciones atómicas de ajuste de inventario, auditoría granular y semáforo de existencias.
* **Fase 6:** Núcleo del PDV completado. Cobro rápido con teclado táctil y denominaciones ($50, $100, $200, $500, Exacto), cálculo de cambio en tiempo real, transacción SQL atómica con deducción de existencias y registro en Kardex, blindaje de idempotencia (UUID), tickets térmicos imprimibles y panel de reimpresión de tickets. (27/27 pruebas unitarias superadas).
* **Fase 7:** Escáner de Código de Barras HID, Retroalimentación Auditiva Web Audio API nativa (`reproducirBeepExito`, `reproducirBeepError`), detección y decodificación de códigos de báscula de autoservicio EAN-13 (prefijos `20`/`21`) con peso automático, y modal de pesaje a granel `ModalPesajeGranel` con atajos de porciones frecuentes (29/29 pruebas unitarias superadas).
* **Fase 8:** Pagos Mixtos completado. Soporte en frontend y backend para dividir un cobro en múltiples métodos (Efectivo, Tarjeta, Vales, Transferencia) en una sola transacción atómica, validación de reglas contables (imposibilidad de cambio sobre tarjeta/vales, cambio exclusivo de excedente en efectivo, registro neto en `dbo.VentaPagos`), catálogo dinámico de métodos de pago y modal con selector Cobro Rápido vs Pago Mixto (33/33 pruebas unitarias superadas).
* **Fase 9:** Tickets en Espera / Pendientes completado. Suspensión temporal de ventas en curso con atajo `F6` y almacenamiento en `dbo.TicketsPendientes` y `dbo.DetalleTicketsPendientes`, contador dinámico reactivo en barra superior de caja, atajo `F7` y modal `ModalTicketsPendientes` para desglosar y reanudar o descartar tickets en espera (38/38 pruebas unitarias superadas).
* **Fase 10:** Control de Caja y Cortes X/Z completado. Apertura de turno con fondo inicial, registro y control de movimientos manuales de efectivo (entradas y salidas con validación de saldo disponible), lectura preliminar acumulada en vivo (Corte X) y cierre formal de turno con arqueo ciego por denominaciones (Corte Z), cálculo automático de diferencias (cuadrado, sobrante, faltante), tira térmica de auditoría para 58mm/80mm e integración en el flujo del PDV (44/44 pruebas unitarias superadas).
* **Fase 11:** Proveedores y Compras completado. Gestión y catálogo maestro de proveedores comerciales (alta, edición, RFC, contactos, teléfonos y estatus), registro y recepción de facturas/compras con captura ágil de partidas y búsqueda predictiva, cálculo y actualización automática del costo promedio ponderado en catálogo de productos, incremento atómico de existencias y trazabilidad en Kardex histórico con tipo `ENTRADA_COMPRA` (73/73 pruebas unitarias superadas).
* **Fase 12:** Dashboard y Reportes Gerenciales completado. Panel ejecutivo interactivo con KPIs de ventas del día/semana/mes, utilidades netas, ticket promedio, margen bruto %, gráfico dinámico de tendencia de ventas (últimos 7 días), distribución de métodos de pago, ranking Top 10 productos más vendidos, alertas de catálogo bajo stock y agotados, historial de tickets paginado server-side (25/50/100) con filtros y análisis de rentabilidad por producto con exportación a CSV e impresión. Consultas 100% desacopladas mediante aislamiento Snapshot / `AsNoTracking()` para garantizar latencia cero en la caja de cobro (80/80 pruebas unitarias superadas).
* **Fase 13:** Pedido Sugerido Dominical completado. Cálculo predictivo dominical para reabastecimiento eficiente de abarrotes. Analiza velocidad de venta histórica (7, 14, 21 o 28 días), cobertura proyectada, colchón de seguridad por stock mínimo (`(VentaPromedioDiaria × DiasCobertura + StockMinimo) − StockActual`) con redondeo de piezas no fraccionadas hacia arriba (`Ceiling`), agrupación automática por proveedor predeterminado, ajuste manual inline de cantidades pedidas, ciclo de vida de pedidos (`GENERADO` -> `REVISADO` -> `PROCESADO`), exportación con formato listo para WhatsApp por proveedor e impresión térmica/oficina (86/86 pruebas unitarias superadas).
* **Fase 14:** Recargas y Servicios (Interfaces) completado. Contratos, DTOs y arquitectura desacoplada para recargas electrónicas de tiempo aire (Telcel, Movistar, AT&T, Bait, Unefon, Virgin) y pago de recibos de servicios públicos (CFE, Telmex, Agua Potable, Naturgy Gas, Izzi, Sky, Totalplay). Validación de 10 dígitos y confirmación, comisiones configurables, diagnóstico de estado de bolsa prepago, interfaz web con pestañas operativas y guía técnica para enchufar el proveedor externo (94/94 pruebas unitarias superadas).
* **Fase 15:** Pruebas de Carga y Concurrencia completado. Evaluación de atomicidad de inventario ante ráfagas concurrentes (25 ventas simultáneas con 0 fugas de stock), blindaje de idempotencia en peticiones paralelas (10 hilos simultáneos resultan en 1 sola venta registrada), verificación de aislamiento no bloqueante (`READ_COMMITTED_SNAPSHOT` activo en SQL Server 2022) y benchmark con latencia de cobro promedio de 72 ms en SQL Server y 1.7 ms en memoria, cumpliendo ampliamente la meta de <100ms (98/98 pruebas unitarias superadas).
* **Fase 16:** Optimización de Rendimiento completado. Bundle splitting y lazy loading con `React.lazy` y `Suspense` en frontend (reducción del bundle inicial de 608 kB a 112 kB, -81% de payload), manual chunks configurados en Vite/Rollup eliminando todas las advertencias de compilación; compresión HTTP Brotli y Gzip habilitada en .NET 9 Web API; caché en memoria RAM (`IMemoryCache`) con invalidación automática para catálogos estáticos; y creación de 5 índices SQL cubrientes de alto rendimiento con compresión PAGE en SQL Server 2022 (98/98 pruebas unitarias superadas).
* **Fase 17 (Cierre, Manuales y Documentación Final):** Proyecto 100% completado. Manual de operación exhaustivo en español para Don Juan y cajeros (`docs/MANUAL_DE_OPERACION.md`), Guía de despliegue en Windows como servicio / Kiosk mode con configuración de hardware de mostrador (`docs/GUIA_DE_DESPLIEGUE_WINDOWS.md`), Plan de mantenimiento y respaldos con procedimientos de compresión nativa y restauración (`docs/MANTENIMIENTO_Y_RESPALDOS.md`), script automatizado `scripts_sql/16_respaldo_automatico_base_datos.sql` compilado en SQL Server 2022, suite de 98 pruebas unitarias superadas y bundle web optimizado a 112 kB.

