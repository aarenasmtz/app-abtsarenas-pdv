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



## Referencias oficiales del proyecto
- Aplicación publicada: https://app-abtsarenas-pdv.aaronarenasmartinez.workers.dev/
- Repositorio: https://github.com/aarenasmtz/app-abtsarenas-pdv
- Directorio del frontend identificado en el repositorio: `pdv-abarrotes-web/`.
- Directorio del backend identificado en el repositorio: `backend/`.
- La URL pública es una referencia de comportamiento e identidad actual, NO autorización para efectuar cambios en producción. Si requiere autenticación, no eludirla ni solicitar credenciales para incluirlas en código o documentación. Comparar con localhost o un ambiente autorizado.

## Misión prioritaria: rediseñar TODOS los formularios y módulos del PDV
**No limitar la auditoría ni la implementación a ventas.** Catalogar todas las rutas, páginas, formularios, diálogos, cajones laterales, ventanas emergentes, componentes compartidos y tablas realmente implementados. No asumir que un módulo existe solo porque aparece en esta lista.

### Inventario visual obligatorio
Crear o actualizar `docs/AUDITORIA_UI_FORMULARIOS.md` con una tabla: módulo / ruta / archivo o componente / problemas / severidad / mejora / estado / evidencia y pruebas. Auditar, si existen:
1. Inicio de sesión, acceso y navegación principal; dashboard y menú.
2. Punto de venta, escaneo, búsqueda, carrito, cobro y pagos mixtos.
3. Ventas en espera, recuperación de tickets, devoluciones/cancelaciones y consulta de ventas.
4. Productos: alta, edición, consulta, detalles, imagen, categorías, marcas, códigos de barras, precios.
5. Inventario, ajustes, movimientos, existencias, alertas y compras/proveedores.
6. Cortes de caja, aperturas/cierres, arqueo, métodos de pago y movimientos de caja.
7. Reportes, consultas, filtros, exportaciones y paginación.
8. Usuarios, roles, permisos, configuración y bitácora de auditoría.
9. Recargas, pagos de servicios, clientes y otros módulos que realmente existan.
10. Todos los formularios auxiliares, selectores, confirmaciones, mensajes, estados vacíos y de error.

### Sistema de diseño reutilizable
- Primero detectar librerías UI, estilos y tokens existentes. Consolidar variables de color, tipografía, espaciado, radios, sombras, tamaños e iconografía; conservar identidad o justificar cambios.
- Construir o refactorizar componentes reutilizables de campos, `select`, autocompletado, buscador, botones, alertas, etiquetas, diálogos, tablas, paginación y encabezados de formulario, según el stack real.
- Aplicar patrones constantes a todos los formularios: título y descripción, secciones agrupadas, etiquetas visibles, campos obligatorios, ayudas, validación en línea, errores comprensibles, botones Guardar/Cancelar, estados de envío y confirmación.
- Formularios largos: dividir en secciones lógicas sin ocultar campos esenciales; conservar datos al navegar y advertir sobre cambios sin guardar cuando corresponda.
- Modales: ancho adecuado al contenido, sin scroll horizontal, foco controlado, cierre seguro y acciones siempre visibles.
- Tablas: encabezados claros, alineación de importes a la derecha, filas legibles, filtros, orden, paginación y estados de carga/vacío/error.
- Mantener consistencia en desktop (prioridad para cajeros), tablet y móvil donde aplique; evitar superficies grandes e ineficientes en el módulo de ventas.
- Cumplir pautas razonables de accesibilidad WCAG 2.2 AA en campos, contraste, navegación y estados de foco. Respetar movimiento reducido.
- Textos visibles en español mexicano; formatos monetarios MXN, fecha/hora y decimales consistentes.
- Evitar animaciones excesivas, imágenes decorativas pesadas o rediseños vistosos que ralenticen el flujo del cajero.

### Método de evaluación y ejecución
1. Abrir la URL pública para identificar experiencia accesible sin alterar datos. Si no puede navegarla, **no afirmar** haberla inspeccionado: basarse en código y entorno local.
2. Inventariar el 100 % de los formularios presentes en el código, incluyendo rutas anidadas y componentes compartidos. Mostrar conteo de formularios encontrados y revisados.
3. Evaluar cada pantalla con criterios: jerarquía, consistencia, legibilidad, densidad, mensajes, validaciones, teclado, accesibilidad, responsive y rendimiento. Adjuntar capturas *si hay herramientas disponibles*, sin capturar información privada.
4. Definir sistema de diseño común y plan de trabajo por módulos. Priorizar primero componentes compartidos y flujo de ventas; después cubrir **todos** los formularios inventariados. No declarar tarea concluida mientras existan formularios inventariados sin revisión.
5. Implementar mejoras progresivas en una rama dedicada (`feat/ui-formularios-pdv` o equivalente). Evitar cambios de contratos API o reglas de negocio: cualquier necesidad debe justificarse y aprobarse.
6. Verificar visualmente cuando haya entorno de navegador disponible, y ejecutar build, lint, tests y pruebas de regresión de flujos críticos. Si faltan automatizaciones, proponerlas o crearlas cuando sea seguro.
7. Documentar `antes/después`, archivos editados, incidencias corregidas, cobertura por formulario y problemas pendientes. No marcar una pantalla como validada sin evidencia.

### Criterios de aceptación de este rediseño
- **Cobertura:** todas las rutas y formularios existentes inventariados, con estado y revisión documentados.
- **Uniformidad:** formularios con componentes y estilos consistentes, sin mezclas arbitrarias de estilos.
- **Usabilidad:** tareas rápidas con teclado, escáner funcional, feedback en validaciones y acciones peligrosas protegidas.
- **Estabilidad:** ventas, pagos mixtos, inventario, tickets en espera y permisos siguen funcionando.
- **Calidad:** compilación y pruebas disponibles ejecutadas o bloqueos explicados; sin errores nuevos conocidos en consola ni pérdida de datos.
- **Publicación:** NO desplegar automáticamente ni tocar claves, Cloudflare o producción sin autorización explícita.

## Solicitud inicial a Codex
Analiza el repositorio completo del PDV Abarrotes, desarrollado originalmente con Antigravity, y toma como referencia la URL publicada. Quiero que mejores **el diseño de TODOS los formularios y módulos que existan**, no solamente la pantalla de ventas. Comienza por el inventario exhaustivo, crea `docs/AUDITORIA_UI_FORMULARIOS.md`, define componentes y estilos reutilizables e implementa mejoras visuales consistentes de forma incremental. Preserva toda la funcionalidad y las reglas del negocio. No sustituyas la arquitectura actual ni modifiques producción. Valida y reporta pruebas, pantallas cubiertas, mejoras visibles y pendientes con evidencia; no afirmes haber navegado interfaces o realizado pruebas que no hayas podido ejecutar.
