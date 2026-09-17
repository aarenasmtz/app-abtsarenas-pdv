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
* **Fase 7 (Siguiente):** Escáner de Código de Barras HID (Buffer de teclado de alta velocidad <30ms, prevención de pérdida de foco, soporte para códigos de barras múltiples e identificación automática de productos pesables/a granel).
