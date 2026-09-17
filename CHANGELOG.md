# Bitácora de Cambios (CHANGELOG.md)

Todas las modificaciones notables a este proyecto serán documentadas en este archivo siguiendo las especificaciones del sistema PDV Abarrotes Arenas.

---

## [Fase 9] - 2026-09-17
### Agregado
- Tickets en Espera / Pendientes:
  - Suspensión y reanudación rápida de ventas para agilizar el flujo de clientes en caja:
    - Entidades `TicketPendiente` y `DetalleTicketPendiente` mapeadas a `dbo.TicketsPendientes` y `dbo.DetalleTicketsPendientes`.
    - DTOs en español `CrearTicketPendienteDto`, `ItemTicketPendienteDto` y `TicketPendienteDto`.
    - Servicio `IServicioTicketsPendientes` / `ServicioTicketsPendientes` con auditoría de acciones:
      - `GuardarTicketPendienteAsync`: pone en espera los artículos del carrito con referencia de cliente.
      - `ObtenerTicketsPendientesActivosAsync`: consulta tickets activos ordenados cronológicamente.
      - `RecuperarTicketPendienteAsync`: desactiva el ticket de la cola y extrae las partidas para montarlas en caja.
      - `DescartarTicketPendienteAsync`: anula un ticket si el cliente no regresó.
    - Controlador API `TicketsPendientesController` con endpoints RESTful protegidos por JWT.
    - 5 pruebas unitarias en `PruebasTicketsPendientes.cs` verificando guardado, recuperación, descarte y filtros de activos. Suite de backend con 38 pruebas unitarias superadas (100% de éxito).
  - Frontend React 19:
    - Componente `ModalTicketsPendientes.tsx` para explorar, desglosar partidas y reanudar o descartar ventas en espera.
    - Integración en `DisenoPdv.tsx`:
      - Atajo `F6` y botón "Poner en Espera" con diálogo rápido para ingresar nombre/referencia de reconocimiento del cliente.
      - Atajo `F7` y botón con contador reactivo en la barra superior `En Espera (N) (F7)` resaltado en ámbar cuando hay tickets pendientes.
      - Carga atómica de artículos al carrito con retroalimentación sonora (`reproducirBeepExito`).

## [Fase 8] - 2026-09-17
### Agregado
- Pagos Mixtos y Catálogo de Métodos de Pago:
  - Soporte integral de múltiples métodos de pago combinados en una sola transacción atómica:
    - Entidades `MetodoPago` (`CodigoMetodo`, `Descripcion`, `RequiereReferencia`, `Activo`) y `VentaPago` mapeadas en `ContextoPrincipal` con relación explícita a `dbo.MetodosPago`.
    - DTO `MetodoPagoDto` expuesto a través de `GET /api/v1/ventas/metodos-pago` en `VentasController`.
    - Regla contable estricta en `ServicioVentas.cs`:
      - La suma de pagos con métodos no en efectivo (tarjeta, vales o transferencia) no puede exceder el total de la venta, previniendo disposición o cambio fraudulento de efectivo no autorizado.
      - El cambio se calcula estrictamente a partir del excedente entregado en efectivo: $\text{Cambio} = \max(0, \text{SumaEfectivo} - (\text{Total} - \text{SumaNoEfectivo}))$.
      - En `dbo.VentaPagos` se registra cada método con su importe neto aplicado, asegurando que la sumatoria de pagos registrados sea idéntica al total de la venta ($\sum \text{Importe} = \text{Total}$).
    - 4 nuevas pruebas unitarias en `PruebasPagosMixtos.cs`: pago mixto exacto, pago mixto con cambio de efectivo, rechazo por tarjeta excesiva y rechazo por monto insuficiente. Suite de backend con 33 pruebas exitosas (100% de aprobación).
  - Frontend React 19 en `ModalCobro.tsx`:
    - Selector dual de modo: **Cobro Directo** (flujo ultra rápido en efectivo/tarjeta con billetes $50, $100, $200, $500 y Exacto) vs **Pago Mixto** (combinar varios métodos).
    - Modo Pago Mixto con interfaz interactiva: desglose de pagos con insignias y botón de eliminación, formulario con botón rápido "Asignar Restante ($X.XX)", barra visual de progreso de cobertura (ámbar/verde), indicador reactivo de faltante y cambio en efectivo.
    - Teclado numérico táctil en pantalla y atajo global `Enter` para finalizar venta una vez cubierta al 100%.

## [Fase 7] - 2026-09-17
### Agregado
- Escáner de Código de Barras HID, Retroalimentación Auditiva (Web Audio) y Pesaje de Granel:
  - Soporte de Códigos de Báscula EAN-13 (prefijo `20` / `21`):
    - Decodificación en backend .NET 9 (`ServicioProductos.cs`) del estándar de etiquetas de báscula de autoservicio (`20PPPPPWWWWWC`), extrayendo el PLU y los gramos para calcular automáticamente los kilogramos fraccionados (`pesoGramos / 1000m`).
    - DTO `ProductoCobroDto` enriquecido con `CantidadSugerida` y `EsPesableConCodigo`.
    - Pruebas unitarias en `PruebasProductos.cs` verificando la decodificación de etiquetas de báscula con peso variable y productos regulares (29/29 pruebas superadas).
  - Retroalimentación Auditiva Web Audio API nativa (`sonidosPdv.ts`):
    - `reproducirBeepExito()`: sintetizador de onda senoidal de 1760 Hz (tono idéntico a escáneres industriales Zebra/Honeywell) de 65ms con decaimiento exponencial, sin necesidad de archivos MP3 externos.
    - `reproducirBeepError()`: sintetizador de onda diente de sierra de 440 Hz a 220 Hz para alertas sonoras de error de lectura o producto inexistente.
  - Componente `ModalPesajeGranel.tsx`:
    - Modal de pesaje rápido para productos con `permiteVentaFraccionada = true`.
    - Atajos rápidos de porciones comunes (¼ kg, ½ kg, ¾ kg, 1 kg), campo numérico editable con máscara de decimales, cálculo dinámico de subtotal y atajos de teclado (`Enter` para confirmar, `Escape` para cancelar).
  - Integración en el PDV Central (`DisenoPdv.tsx`):
    - Interceptación y ráfaga rápida mediante `useEscanerCodigoBarras`.
    - Detección automática: si el producto es pesable con código incrustado, se agrega directamente con su peso en kg; si es a granel manual, se abre `ModalPesajeGranel`; si es unitario, se suma a la partida.
    - Control fino de incrementos fraccionados (pasos de 0.250 kg) o unitarios (+1/-1) en la tabla del carrito.

## [Fase 6] - 2026-09-17
### Agregado
- Auditoría integral de los 46 objetos de base de datos en SQL Server 2022 (`AAM`).
- Mapeo y verificación de integridad referencial (52 FKs y 33 índices especializados).
- Verificación del soporte de pagos mixtos mediante `dbo.VentaPagos`.
- Script DDL `scripts_sql/14_mejoras_fase1_auditoria.sql` para incorporar:
  - `dbo.BitacoraAuditoria` con `ValorAnterior` y `ValorNuevo` para auditoría granular.
  - `dbo.TicketsPendientes` y `dbo.DetalleTicketsPendientes` para ventas en espera.
  - Columna `ImagenUrl` en `dbo.Productos` (exclusiva para administración).
  - `dbo.PedidosSugeridos` y `dbo.DetallePedidosSugeridos` para cálculo dominical.
  - Columna e índice condicional único `TokenIdempotencia` en `dbo.Ventas`.
- Activación de `READ_COMMITTED_SNAPSHOT` en `PdvAbarrotesArenas` para consultas sin bloqueo.
- Inicialización de repositorio Git con ramas `main`, `develop` y `feature/fase2-arquitectura-base`.
- Archivo `AI_CONTEXT.md` para orientación de contexto ágil.

## [Fase 6] - 2026-09-17
### Agregado
- Núcleo del Punto de Venta (PDV Central, Cobro Básico, Tickets Térmicos y Transacciones Atómicas):
  - Entidad `MetodoPago` en `PdvAbarrotes.Dominio/Entidades` mapeada a `dbo.MetodosPago`.
  - DTOs especializados en español: `ItemVentaDto`, `RegistrarVentaDto`, `VentaPagoDto`, `VentaRealizadaDto`, `TicketVentaDto`, `FiltroVentasDto`, `VentaResumenDto`.
  - Servicio central de ventas (`ServicioVentas` / `IServicioVentas`):
    - Transacción SQL atómica: inserción en `dbo.Ventas`, `dbo.DetalleVentas`, `dbo.VentaPagos`, deducción de existencias en `dbo.Inventario`, inserción de salida en `dbo.MovimientosInventario` (Tipo: Venta) y registro en `dbo.BitacoraAuditoria`.
    - Blindaje de Idempotencia: el envío duplicado del mismo `TokenIdempotencia` (UUID generado por el cliente) recupera la venta previa sin duplicar inventario ni cargos.
    - Generación de folio comercial legible y correlativo (`V-YYYYMMDD-XXXX`).
    - Soporte completo de comprobante térmico estándar para tiras de 58mm y 80mm con desglose de partidas, formas de pago, cambio y pie de página comercial.
    - Cancelación de ventas con reversión atómica de inventario al stock disponible y trazabilidad en bitácora.
  - Controlador API `VentasController`: `POST /api/v1/ventas`, `GET /api/v1/ventas/{id}/ticket`, `GET /api/v1/ventas/recientes`, `POST /api/v1/ventas/{id}/cancelar`.
  - Pruebas unitarias completas en `PruebasVentas.cs`: cobro en efectivo con cálculo de cambio y descuento de existencias, idempotencia comprobada, pagos insuficientes, carrito vacío y estructura de ticket (27/27 pruebas unitarias superadas en la solución .NET 9).
  - Componentes Frontend en React 19 + TypeScript:
    - `ModalCobro.tsx`: modal de alta velocidad con totalizador gigante, botones de efectivo rápido ($50, $100, $200, $500, Exacto), cálculo de cambio en tiempo real, teclado numérico táctil y escucha de atajos de teclado (`Enter` para cobrar, `Esc` para cancelar).
    - `ModalTicket.tsx`: previsualización de ticket térmico, impresión con `window.print()` y botón de "Nueva Venta (Enter)" con reinicio automático de caja.
    - `ModalReimpresion.tsx`: explorador de últimas ventas de la caja para reimpresión instantánea en 1 clic.
    - Integración en `DisenoPdv.tsx`: conexión del botón `Cobrar (F12)`, atajo `F4` para limpiar carrito, atajo `F8` para reimprimir y botón directo en la cabecera.

## [Fase 5] - 2026-09-17
### Agregado
- Módulo de Control de Inventario, Kardex Histórico y Alertas de Reorden:
  - Entidades de dominio en español: `TipoMovimientoInventario`, `MovimientoInventario`, `AjusteInventario`, `DetalleAjusteInventario`.
  - Mapeo EF Core 9 en `ContextoPrincipal` con claves foráneas explícitas y navegación optimizada para `dbo.Inventario`, `dbo.MovimientosInventario` (más de 486,000 registros históricos) y tablas de ajustes.
  - DTOs en español: `StockProductoDto`, `MovimientoKardexDto`, `FiltroInventarioDto`, `FiltroKardexDto`, `RegistrarAjusteStockDto`, `AlertaStockDto`, `TipoMovimientoInventarioDto`.
  - Servicio de Inventario (`ServicioInventario` / `IServicioInventario`):
    - Consulta de stock con paginación server-side (25/50/100 registros), filtros por texto/código de barras, categoría y alertas de nivel (Agotado, Bajo, Óptimo, Exceso).
    - Kardex cronológico paginado ultra-eficiente con índices compuestos y sin tracking de memoria.
    - Ajuste atómico de inventario en transacción SQL: cálculo automático de diferencia, actualización del stock en `dbo.Inventario`, inserción del movimiento en `dbo.MovimientosInventario`, registro de cabecera/detalle de ajuste y asiento en `dbo.BitacoraAuditoria` con `ValorAnterior` y `ValorNuevo`.
    - Detección de alertas de reorden prioritarias (crítico, advertencia) según stock mínimo y punto de reorden configurado.
  - Controlador API `InventarioController`: endpoints seguros con autorización basada en roles (Cajeros con lectura, Administradores y Supervisores con permisos de ajuste).
  - Pruebas unitarias completas en `PruebasInventario.cs` (22/22 pruebas unitarias totales superadas en la solución .NET 9).
  - Interfaz gráfica en React 19 + TypeScript (`PantallaInventario.tsx`):
    - Pestaña de Existencias: semaforización de stock (Agotado, Bajo, Óptimo, Exceso), paginación 25/50/100, filtros instantáneos y botón de ajuste rápido.
    - Pestaña de Kardex: explorador de historial con filtro por producto, tipo de movimiento, fechas y visualización clara de entradas (verde) y salidas (rojo).
    - Pestaña de Alertas de Reorden: panel prioritario para gestión de compras y abastecimiento de abarrotes.
    - Modal interactivo de ajuste de stock con previsualización en vivo de la diferencia resultante antes de confirmar.
    - Conexión e integración completa en `App.tsx` y `DisenoAdmin.tsx`.

## [Fase 4] - 2026-09-17
### Agregado
- Módulo Maestro de Catálogos (Productos, Categorías, Marcas, Unidades de Medida) y Buscador PDV:
  - DTOs especializados en español: `ProductoAdminDto` (vista administrativa con costos e imagen), `ProductoCobroDto` (ultraligero sin imágenes ni costos), `ResultadoBusquedaPdvDto` (predictivo para caja), `CrearProductoDto`, `ActualizarProductoDto`, `FiltroProductosDto`, `CategoriaDto`, `MarcaDto`, `UnidadMedidaDto`.
  - Servicio de Catálogos (`ServicioCatalogos` / `IServicioCatalogos`): consulta eficiente con conteo de productos asociados y mantenimiento ABC con auditoría granular.
  - Servicio de Productos (`ServicioProductos` / `IServicioProductos`):
    - Paginación server-side con opciones validadas (25/50/100 registros), filtros dinámicos por categoría, marca, estado y bajo stock.
    - Detección y registro específico de auditoría `CAMBIO_PRECIO` cuando se modifican costos o precios de venta, indicando valores anteriores y nuevos.
    - Cálculo automático de margen de utilidad en tiempo real.
    - Carga y almacenamiento local de fotografías en `wwwroot/imagenes/productos/` mediante `POST /api/v1/productos/{id}/imagen`.
    - Escáner de caja ultrarrápido `<50ms` mediante `GET /api/v1/productos/codigo-barras/{codigo}` con `AsNoTracking()` y proyección estricta sin imágenes.
    - Buscador predictivo optimizado para caja mediante `GET /api/v1/productos/buscar-pdv?termino={query}` (límite 15 coincidencias, sin imágenes).
  - Controladores API: `CatalogosController` y `ProductosController` con autorización basada en roles (Cajero/Supervisor para venta, Administrador para gestión).
  - Pruebas unitarias en `PruebasProductos.cs`: cálculo de márgenes, auditoría de precios, ausencia estricta de imágenes en modelo de cobro y buscador, y validación de productos inactivos (17/17 pruebas exitosas).
- Frontend en React 19 + TypeScript:
  - `PantallaProductos.tsx`: tabla administrativa moderna con paginación server-side, filtros reactivos, modal para creación/edición con cálculo de margen en vivo y modal para subida/previsualización de fotografías.
  - `servicioProductos.ts` y `servicioCatalogos.ts`: clientes HTTP tipados con Axios.
  - `DisenoPdv.tsx`: integración en tiempo real del lector de código de barras físico/manual contra el endpoint `/productos/codigo-barras/{codigo}` y menú desplegable predictivo mientras el cajero escribe, sin sobrecargar la memoria con imágenes.
- Verificación end-to-end con 2,913 productos reales migrados en SQL Server `AAM`.

## [Fase 3] - 2026-09-17
### Agregado
- Módulo completo de Autenticación y Seguridad en .NET 9 y React 19:
  - Generador de tokens JWT (`ServicioGeneradorJwt`) con claims `IdUsuario`, `NombreUsuario`, `NombreCompleto` y `Rol`.
  - Hashing seguro de contraseñas con BCrypt (`BCrypt.Net-Next`) y migración automática de credenciales Eleventa.
  - Endpoints en `AutenticacionController`: `POST /api/v1/autenticacion/login`, `POST /api/v1/autenticacion/cambiar-clave`, `GET /api/v1/autenticacion/perfil`.
  - Endpoints en `UsuariosController`: ABC completo de usuarios con paginación server-side (25/50/100) y protección por rol `Administrador`.
  - Endpoints en `AuditoriaController`: consulta paginada de la bitácora con filtros por tabla, acción, usuario y fechas.
  - Servicio de auditoría granular (`ServicioAuditoria`) registrando automáticamente cada inicio de sesión y modificación en `dbo.BitacoraAuditoria`.
  - Inicializador automático de datos base (`InicializadorDatos`) sembrando roles (`Administrador`, `Cajero`, `Supervisor`) y credenciales seguras.
  - Pruebas unitarias de emisión de tokens JWT y hashing BCrypt en `PruebasAutenticacion.cs` (12/12 pruebas exitosas).
- Módulos Frontend en React + TypeScript:
  - `PantallaLogin`: formulario estilizado con manejo de errores, interceptor Axios y accesos directos para desarrollo.
  - `PantallaUsuarios`: listado paginado server-side, filtros y modal para registro de nuevos cajeros.
  - `PantallaAuditoria`: visor detallado de cambios con diferencias entre `ValorAnterior` y `ValorNuevo`.
  - Store Zustand `useStoreAutenticacion` y protección de rutas en `App.tsx`.

---

## [Fase 2] - 2026-09-16
### Agregado
- Scaffolding de la solución .NET 9 Web API con nomenclatura 100% en español:
  - `PdvAbarrotes.Dominio`: 15 entidades base, enums de métodos de pago, tipos de movimiento, roles y excepciones de negocio.
  - `PdvAbarrotes.Aplicacion`: interfaces de contexto, modelos estándar `RespuestaApi<T>`, paginación server-side `ResultadoPaginado<T>` con regla estricta 25/50/100, e interfaces para proveedores de recargas y servicios.
  - `PdvAbarrotes.Infraestructura`: `ContextoPrincipal` (EF Core 9) mapeado a SQL Server 2022 `AAM`, `ServicioAuditoria`, `ServicioUsuarioActual`.
  - `PdvAbarrotes.Api`: middleware global `ManejadorExcepcionesMiddleware`, controlador base `ControladorBase`, endpoint de salud `DiagnosticoController` verificado en `http://localhost:5000/api/v1/diagnostico/estado`.
  - `PdvAbarrotes.Tests`: pruebas unitarias en xUnit verificando paginación y respuestas (10/10 pruebas superadas).
- Scaffolding del frontend `pdv-abarrotes-web` (React 19 + TypeScript + Vite):
  - Organización modular en español: `api`, `components`, `hooks`, `layouts`, `routes`, `types`, `modules`.
  - Cliente Axios `clienteApi` con interceptores de JWT y errores.
  - Hook global `useEscanerCodigoBarras` para detección HID sin pérdida de foco (<40ms).
  - Componente genérico `TablaPaginada` con selector 25/50/100.
  - Layouts duales: `DisenoAdmin` (backoffice) y `DisenoPdv` (cajero de alta velocidad).
  - Store Zustand `useStoreCarritoPdv` en memoria con cliente general predeterminado (Id=1).
  - Verificación de compilación limpia con `npm run build`.
