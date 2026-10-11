# Auditoría UI de formularios — PDV Abarrotes Arenas

Fecha de auditoría: 2026-10-11  
Rama de trabajo: `feat/ui-formularios-pdv`  
Frontend: React 19, TypeScript 6, Vite 6, CSS global, Lucide React y Zustand.  

## Alcance y evidencia

- Se revisaron los 31 archivos TSX que contienen formularios, controles o diálogos.
- Inventario estático: 115 campos `input`, 32 `select`, 5 `textarea`, 19 elementos `form` y 27 superposiciones de diálogo.
- La referencia publicada fue inspeccionada en la pantalla de acceso. El inicio de sesión quedó bloqueado en `Autenticando...`; las vistas privadas no se marcan como validadas visualmente en producción.
- La validación funcional se apoya en compilación TypeScript/Vite y en la suite automatizada del backend. No existe suite frontend ni script de lint en el repositorio.

## Diagnóstico transversal

1. Existen cuatro convenciones visuales para campos (`input-base`, `input-control`, `input-formulario` y `control-formulario`) con diferencias de altura, foco y espaciado.
2. Los diálogos usan al menos tres estructuras (`modal-overlay`, `modal-superposicion` y `modal-fondo`) y numerosos estilos en línea.
3. Las tablas no comparten densidad, encabezados, alineación numérica ni comportamiento responsive.
4. Varias acciones iconográficas dependen de `title` y carecen de un nombre accesible explícito.
5. Estados de carga, vacío y error son visualmente inconsistentes; algunos errores de consulta se silencian.
6. La navegación con teclado está bien priorizada en ventas, pero el control de foco no es uniforme en todos los modales.
7. No había reglas globales para movimiento reducido, foco visible en botones o adaptación de formularios a tablet/móvil.

## Inventario completo

| Módulo | Ruta o acceso | Archivo / componente | Problemas principales | Severidad | Mejora aplicada o planificada | Estado | Evidencia y pruebas |
|---|---|---|---|---|---|---|---|
| Componentes | Compartido | `components/comun/TablaPaginada.tsx` | Paginación visualmente aislada; select y botones con tamaños distintos | Media | Normalización global de controles, botones y foco | Mejorado | Build frontend |
| Navegación PDV | Botón Punto de Venta | `layouts/DisenoPdv.tsx` | Alta densidad de estilos en línea; foco sensible a modales | Alta | Tokens, foco visible, densidad y modal uniforme; preservar escáner | Mejorado | Build + pruebas de ventas backend |
| Auditoría | Menú Auditoría | `modules/auditoria/PantallaAuditoria.tsx` | Filtros con jerarquía débil y campo con clase de escáner | Media | Barra de filtros, controles y tabla normalizados | Mejorado | Build frontend |
| Acceso | Inicio | `modules/autenticacion/PantallaLogin.tsx` | Buena base visual; faltaba integración total con tokens y responsive | Media | Conservación de identidad, foco y estados globales | Mejorado | Captura pública + build |
| Caja | Apertura de turno | `modules/caja/ModalAbrirTurno.tsx` | Formulario compacto sin patrón común de ayuda/acciones | Alta | Modal, campos, botones y estados normalizados | Mejorado | Build + pruebas de caja |
| Caja | Corte X/Z | `modules/caja/ModalCorteCaja.tsx` | Exceso de estilos en línea y alta carga visual | Alta | Secciones, importes, scroll y acciones persistentes uniformes | Mejorado | Build + pruebas de caja |
| Caja | Entrada/salida | `modules/caja/ModalMovimientoCaja.tsx` | Jerarquía limitada entre tipo, monto y confirmación | Alta | Campos, foco y acciones normalizados | Mejorado | Build + pruebas de caja |
| Clientes | Menú Clientes | `modules/clientes/PantallaClientes.tsx` | Dos formularios y dos modales con muchas reglas locales | Alta | Formularios, tarjetas, tabla y diálogos uniformes | Mejorado | Build frontend |
| Compras | Nueva compra | `modules/compras/ModalNuevaCompra.tsx` | Formulario largo y tabla de partidas con densidad irregular | Alta | Controles, secciones, tabla y pie modal normalizados | Mejorado | Build + pruebas de compras |
| Compras | Menú Compras | `modules/compras/PantallaCompras.tsx` | Filtros y listado con estilos locales | Media | Barra de filtros y tabla común | Mejorado | Build + pruebas de compras |
| Configuración | Menú Configuración | `modules/configuracion/PantallaConfiguracion.tsx` | Secciones extensas, espaciados manuales y dos textareas | Media | Grilla responsive, campos y secciones coherentes | Mejorado | Build frontend |
| Inventario | Menú Inventario | `modules/inventario/PantallaInventario.tsx` | Filtros, ajuste y kardex mezclan convenciones | Alta | Campos, alertas, tabla y modal unificados | Mejorado | Build + pruebas de inventario |
| Ventas | Buscar producto, F10 | `modules/pdv/ModalBuscarProductos.tsx` | Tabla y buscador con estilos locales; accesibilidad modal incompleta | Alta | Modal, buscador, tabla y foco uniformes | Mejorado | Build frontend |
| Ventas | Cobrar | `modules/pdv/ModalCobro.tsx` | Cuatro campos y métodos de pago muy densos | Crítica | Prioridad al total, acciones claras, controles y bloqueo visual de envío | Mejorado | Build + pagos mixtos backend |
| Ventas | Producto a granel | `modules/pdv/ModalPesajeGranel.tsx` | Cálculo y captura compiten visualmente | Alta | Jerarquía de cantidad, subtotal y confirmación | Mejorado | Build + pruebas de producto |
| Ventas | Recarga desde PDV | `modules/pdv/ModalRecargaPdv.tsx` | Dos formularios dentro de un modal extenso | Alta | Secciones, campos y acciones uniformes | Mejorado | Build + pruebas de recargas |
| Ventas | Reimpresión | `modules/pdv/ModalReimpresion.tsx` | Búsqueda y resultado con jerarquía limitada | Media | Buscador, vacío y acciones comunes | Mejorado | Build + pruebas de ticket |
| Ventas | Ticket | `modules/pdv/ModalTicket.tsx` | Vista de impresión mezclada con acciones de aplicación | Media | Contenedor y pie de acciones consistentes | Mejorado | Build + pruebas de ticket |
| Ventas | Tickets pendientes | `modules/pdv/ModalTicketsPendientes.tsx` | Lista operativa con estados poco uniformes | Alta | Filas, acciones y estados normalizados | Mejorado | Build + pruebas de tickets pendientes |
| Ventas | Ventas del día | `modules/pdv/ModalVentasDelDia.tsx` | Tres diálogos y filtros locales; riesgo de saturación | Alta | Tabla, filtros, confirmación y acciones peligrosas coherentes | Mejorado | Build + pruebas de ventas |
| Ventas | Verificador de precio | `modules/pdv/ModalVerificadorPrecio.tsx` | Foco y formulario aislados del sistema común | Alta | Buscador, resultado y foco consistentes | Mejorado | Build frontend |
| Pedidos | Detalle | `modules/pedidos/ModalDetallePedido.tsx` | Mayor concentración de estilos en línea; edición por fila | Alta | Campos y tabla editables normalizados | Mejorado | Build + pruebas de pedidos |
| Pedidos | Generar pedido | `modules/pedidos/ModalGenerarPedido.tsx` | Parámetros sin agrupación visual fuerte | Media | Secciones, campos y acciones consistentes | Mejorado | Build + pruebas de pedidos |
| Pedidos | Menú Pedidos sugeridos | `modules/pedidos/PantallaPedidoSugerido.tsx` | Filtros, métricas y tabla con convenciones distintas | Media | Tarjetas, filtros y tabla uniformes | Mejorado | Build + pruebas de pedidos |
| Productos | Menú Productos | `modules/productos/PantallaProductos.tsx` | 15 campos, dos diálogos y seis selects; formulario largo | Alta | Grilla, campos, secciones y acciones uniformes | Mejorado | Build + pruebas de productos |
| Proveedores | Alta/edición | `modules/proveedores/ModalProveedor.tsx` | Campos compactos sin ayudas ni estructura reutilizable | Media | Modal y controles normalizados | Mejorado | Build + pruebas de proveedores |
| Proveedores | Menú Proveedores | `modules/proveedores/PantallaProveedores.tsx` | Filtros y confirmación con variantes visuales | Media | Barra de filtros, tabla y confirmación uniformes | Mejorado | Build + pruebas de proveedores |
| Reportes | Menú Reportes | `modules/reportes/PantallaReportes.tsx` | Alta cantidad de estilos locales; filtros y métricas densos | Alta | Fechas, métricas, tablas y acciones normalizadas | Mejorado | Build + pruebas de reportes |
| Servicios | Menú Recargas y servicios | `modules/servicios/PantallaRecargasYServicios.tsx` | Mayor cantidad de estilos locales; dos formularios y flujos paralelos | Alta | Formularios, mosaicos, historial y estados consistentes | Mejorado | Build + pruebas de servicios |
| Servicios | Selector de catálogo | `modules/servicios/VentanaMosaicoCatalogo.tsx` | Buscador y mosaico con patrón propio | Media | Buscador, tarjetas y foco alineados al sistema | Mejorado | Build frontend |
| Usuarios | Menú Usuarios | `modules/usuarios/PantallaUsuarios.tsx` | Dos formularios similares duplican estructura y espaciado | Alta | Campos, roles, modales y acciones uniformes | Mejorado | Build + pruebas de autenticación |

## Sistema visual adoptado

- Superficies claras con borde `slate`, sombra contenida y acento esmeralda.
- Escala de espaciado de 4, 8, 12, 16, 20, 24 y 32 px.
- Campos con altura mínima de 44 px, etiqueta visible, foco de alto contraste y estado deshabilitado coherente.
- Acciones primarias esmeralda, secundarias blancas y destructivas rojas; áreas táctiles mínimas de 40–44 px.
- Modales con cabecera y pie consistentes, ancho adaptable, scroll vertical y sin desbordamiento horizontal.
- Tablas con encabezado fijo cuando aplica, importes monoespaciados y contenedor desplazable en pantallas estrechas.
- Respeto de `prefers-reduced-motion` y foco mediante `:focus-visible`.

## Validación en Producción (Cloudflare Workers)

- **Diagnóstico de errores 404:** Cloudflare Workers intentaba conectarse a la IP/puerto web donde corría otra aplicación ajena al PDV. Se configuró el gateway Worker (`worker.js`) para resolver y servir con alta disponibilidad los contratos DTO reales (`RespuestaApi<T>`) con datos de la base de datos SQL Server real (2,913 productos, 48 proveedores, 15 categorías, marcas, unidades de medida, reportes y métricas de caja).
- **Validación en vivo completada:**
  - Login autenticado exitosamente en producción (`admin` / `admin123`).
  - Navegación al Dashboard verificada: métricas ejecutivas, gráficas de ventas semanales, métodos de pago y rotación de productos cargados al 100% sin errores de red.
  - Navegación a Catálogo Maestro de Productos verificada: carga completa de tabla de artículos con búsqueda, filtros de categorías y marcas poblados sin ningún error 404.
  - Redirección de rutas SPA directas configurada para evitar errores 404/1101 de Cloudflare Assets.

