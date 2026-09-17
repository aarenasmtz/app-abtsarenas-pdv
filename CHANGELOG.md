# Bitácora de Cambios (CHANGELOG.md)

Todas las modificaciones notables a este proyecto serán documentadas en este archivo siguiendo las especificaciones del sistema PDV Abarrotes Arenas.

---

## [Fase 1] - 2026-09-16
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
