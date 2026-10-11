# AGENTS.md — PDV Abarrotes

## Objetivo
Este repositorio contiene un Punto de Venta (PDV) para abarrotes cuyo desarrollo inicial se realiza con Antigravity. Codex es responsable de revisar, corregir, mejorar y validar el código existente, con especial atención al diseño visual, experiencia de usuario, rendimiento y estabilidad. No reemplazar el sistema ni reescribirlo desde cero sin autorización.

## Primera acción obligatoria
1. Inspeccionar el repositorio y detectar el stack, estructura, rutas, componentes, estilos, servicios, contratos API y pruebas existentes. No asumir nombres ni versiones.
2. Revisar `git status`, la rama actual y cambios sin confirmar. No borrar, sobrescribir ni revertir trabajo ajeno.
3. Ejecutar los comandos de instalación, compilación, lint y pruebas que estén disponibles; documentar los resultados y los errores preexistentes.
4. Presentar un diagnóstico breve, un plan priorizado y los archivos afectados antes de cambios estructurales.

## Responsabilidades de Codex
- Corregir defectos funcionales, visuales, de accesibilidad y de usabilidad detectados.
- Modernizar el diseño del PDV de Antigravity conservando las reglas de negocio, endpoints y persistencia.
- Reutilizar componentes y tokens visuales; evitar CSS duplicado, estilos inconsistentes y dependencias innecesarias.
- Mantener una experiencia fluida para cajeros que utilizan teclado y lector de códigos de barras.
- Aplicar cambios pequeños, verificables y reversibles. No realizar migraciones destructivas ni modificaciones productivas sin autorización.

## Diseño y experiencia de usuario
- Crear una interfaz profesional, limpia, coherente y rápida, orientada a operación intensiva en mostrador.
- Priorizar el flujo de cobro: foco estable en escaneo, búsqueda rápida, carrito legible, cantidades editables, total visible y acciones claras.
- Mejorar jerarquía visual, espaciado, tipografía, contraste, estados de carga, vacíos, error y confirmación.
- Garantizar navegación por teclado, indicadores de foco y prevención de dobles clics/cobros.
- Mantener responsividad para escritorio y tablet sin sacrificar densidad operativa.
- No copiar automáticamente la paleta de otros proyectos: detectar los estilos existentes y proponer ajustes coherentes antes de sustituir la identidad visual.
- Las imágenes de productos corresponden al módulo de administración de productos; no agregarlas a la pantalla de cobro salvo nueva autorización.

## Reglas de negocio que no se deben romper
- Ventas rápidas y frecuentes; objetivo operativo aproximado de 300 clientes al día, con operaciones que pueden ocurrir cada 1–5 minutos.
- Lectura de códigos de barras con escáner, incluyendo captura repetida y manejo de códigos inexistentes.
- Venta en mostrador como cliente predeterminado, sin forzar selección de cliente individual.
- Pagos mixtos y conciliación correcta del total; prevenir cobros duplicados.
- Ventas/tickets en espera independientes para atender filas; recuperar cada operación sin mezclar carritos.
- Inventario consistente ante ventas simultáneas, devoluciones y cancelaciones según las reglas implementadas.
- Bitácora de cambios relevantes con usuario, fecha, hora, módulo y acción; no registrar secretos ni datos sensibles innecesarios.
- Paginación, filtros y ordenamiento en consultas de reportes, preferentemente desde servidor cuando corresponda.
- Recargas y pagos de servicios: integración futura; no inventar proveedor ni endpoints.
- Impresión de tickets: respetar el alcance actual y no asumir formato o dispositivo sin definición.

## Backend, seguridad y rendimiento
- Respetar los contratos del backend .NET y la base SQL Server detectados en el repositorio.
- Evitar consultas N+1, renderizados innecesarios, cargas completas de reportes y bloqueo de la interfaz durante operaciones de venta.
- Proteger operaciones de cobro y persistencia con validación, control de concurrencia e idempotencia cuando aplique.
- No exponer cadenas de conexión, claves, tokens, datos personales o configuraciones secretas en código, logs, commits ni respuestas.
- No modificar infraestructura, producción, DNS, Cloudflare ni despliegues automáticos sin autorización explícita.

## Proceso para cada intervención
1. **Diagnosticar:** reproducir el problema y localizar su causa; distinguir errores preexistentes de los nuevos.
2. **Proponer:** explicar alcance, impacto y riesgo. Solicitar aprobación para cambios estructurales o de negocio.
3. **Implementar:** hacer el cambio mínimo necesario y mejorar componentes relacionados sin ampliar el alcance indebidamente.
4. **Verificar:** ejecutar build, lint, pruebas disponibles y validación de flujos críticos. Si faltan pruebas, crear las adecuadas cuando sea viable.
5. **Reportar:** resumir archivos modificados, mejoras visibles, pruebas realizadas, pendientes y riesgos.

## Criterios de aceptación
- El PDV conserva las funciones existentes y no introduce regresiones conocidas.
- Escanear, agregar/quitar productos, editar cantidades, suspender/recuperar ventas y cobrar funcionan según las reglas vigentes.
- Los pagos mixtos no generan diferencias por redondeo ni operaciones duplicadas.
- Las pantallas clave tienen estados de carga, error y vacío comprensibles.
- La interfaz es usable con teclado y escáner, sin movimientos inesperados del foco.
- Los reportes paginados no descargan toda la base al navegador.
- Se documentan las pruebas y cualquier limitación de verificación.

## Coordinación Antigravity ↔ Codex
- Git es la fuente de verdad. Trabajar en ramas separadas para tareas concurrentes y fusionar mediante revisión.
- Antes de comenzar, actualizar referencias y revisar cambios de la otra herramienta.
- No hacer `git reset --hard`, force push, eliminación masiva ni commits de archivos secretos.
- Si Antigravity modifica una pantalla que Codex está corrigiendo, detener la edición conflictiva y comparar diferencias antes de continuar.
- Conservar convenciones del repositorio; cuando sea pertinente, preferir nombres de dominio y documentación en español.

## Solicitud inicial a Codex
Analiza el PDV actual construido con Antigravity. Realiza una auditoría visual y técnica del flujo de ventas y entrega un plan priorizado de correcciones y mejoras. Después, implementa primero mejoras de bajo riesgo en la interfaz, conservando toda la funcionalidad. Valida compilación y pruebas y reporta resultados verificables. No inventes que se ejecutaron pruebas o que se inspeccionaron archivos si no fue posible hacerlo.
