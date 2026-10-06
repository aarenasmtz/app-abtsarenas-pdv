# MANUAL DE OPERACIÓN Y GUÍA DE USUARIO
## Sistema de Punto de Venta — Abarrotes Arenas

---

### Introducción
Bienvenido al **Manual de Operación del Sistema PDV Abarrotes Arenas**. Este sistema fue diseñado especialmente para agilizar la atención en mostrador, garantizar el control exacto de dinero en caja, vigilar el inventario en tiempo real y facilitar la toma de decisiones comerciales para Don Juan y su equipo de cajeros.

El sistema funciona de forma rápida, segura y soporta el ritmo intenso de una tienda de abarrotes mexicana con lectura instantánea de código de barras, venta de productos a granel, tickets en espera, pagos mixtos y pedido sugerido dominical.

---

## 1. Acceso al Sistema y Roles de Usuario

El sistema cuenta con 3 niveles de acceso protegidos por contraseña:

| Rol | Pantalla Predeterminada | Permisos Principales |
| :--- | :--- | :--- |
| **Cajero** | Punto de Venta (PDV) | Cobro, venta a granel, tickets en espera, arqueo ciego (Corte Z), reporte preliminar (Corte X), recargas y servicios. |
| **Supervisor** | Punto de Venta / Inventario | Todo lo de cajero más: cancelaciones, entradas y salidas de efectivo especiales, ajustes de inventario y recepción de compras. |
| **Administrador** (Don Juan) | Dashboard General | Acceso total: Reportes de utilidades, catálogo maestro de productos, pedidos dominicales, compras, auditoría y configuración de usuarios. |

### Cómo Iniciar Sesión:
1. Abra el navegador web en la terminal de mostrador (o acceda a la dirección local del sistema, ej. `http://localhost:8081` o `http://192.168.1.X:8081`).
2. Ingrese su **Nombre de Usuario** y **Contraseña**.
3. Haga clic en **Entrar al Sistema**. Si su rol es cajero, el sistema lo llevará automáticamente a la pantalla de mostrador de cobro.

---

## 2. Control de Caja y Turnos (Corte X y Corte Z)

El control de caja previene discrepancias de efectivo y asegura que cada peso esté contabilizado con total claridad.

### 2.1 Apertura de Turno
Antes de realizar cualquier cobro, el cajero debe abrir su turno:
1. El sistema mostrará la ventana: **"Apertura de Caja"**.
2. Ingrese el **Fondo Inicial de Efectivo** (morralla y billetes con los que inicia el turno, por ejemplo `$500.00`).
3. Presione **Abrir Turno**. A partir de este momento, la caja está lista para cobrar.

### 2.2 Entradas y Salidas de Efectivo (Movimientos Manuales)
Si se necesita ingresar cambio extra o pagar a un proveedor menor de mostrador (ej. pago de hielo o refresco en ruta):
1. En el menú superior o barra de acciones de caja, presione **Movimiento de Efectivo**.
2. Seleccione el tipo:
   - **Entrada (+):** Para agregar cambio adicional a la caja.
   - **Salida (-):** Para retiros autorizados (pago a proveedores locales, retiro preventivo de billetes grandes).
3. Ingrese el monto y escriba un **Motivo obligatorio** (ej. *"Pago a repartidor de hielo"*).
4. El sistema valida automáticamente que no se pueda retirar más dinero del disponible en caja.

### 2.3 Corte X (Lectura Preliminar en Vivo)
El **Corte X** permite al cajero o a Don Juan conocer en cualquier momento del día cuánto dinero debería haber en caja sin cerrar el turno.
- Presione el botón **Corte X**.
- Muestra: Ventas totales en efectivo, ventas con tarjeta, transferencias, entradas/salidas manuales y el efectivo esperado acumulado.
- Puede imprimirse en la impresora térmica para revisión interna. El turno continúa abierto.

### 2.4 Corte Z (Cierre de Turno y Arqueo Ciego)
Al finalizar la jornada o cambio de cajero, se realiza el **Corte Z**:
1. Presione **Cierre de Turno (Corte Z)**.
2. **Arqueo Ciego:** Por seguridad, el sistema no le dice al cajero cuánto dinero debe haber. El cajero debe contar físicamente los billetes y monedas e ingresar el desglose:
   - Monedas de $1, $2, $5, $10, $20.
   - Billetes de $20, $50, $100, $200, $500, $1000.
3. El sistema suma el total físico y calcula la diferencia de inmediato:
   - **Cuadrado ($0.00):** Caja perfecta.
   - **Sobrante (+):** Hay más dinero del registrado.
   - **Faltante (-):** Falta dinero contra el registro de ventas.
4. Presione **Confirmar Cierre de Turno**.
5. Se imprime automáticamente la **Tira de Auditoría de Corte Z** en la impresora térmica con el desglose completo.

---

## 3. Punto de Venta (Mostrador y Cobro Rápido)

La pantalla principal de cobro está optimizada para que un cajero despache un cliente en menos de 15 segundos sin usar el ratón.

### 3.1 Venta con Escáner de Código de Barras (Pistola HID)
- Simplemente apunte la pistola al código de barras del producto.
- El escáner lee el código en menos de 30 milisegundos y el producto se añade de inmediato al carrito.
- El sistema emite un **tono auditivo de éxito (Beep)** confirmando la lectura. Si el producto no existe o está agotado, emite un tono grave de advertencia.
- Si pasa el mismo producto varias veces, el sistema incrementa la cantidad automáticamente sin duplicar renglones.

### 3.2 Búsqueda Manual de Productos
Para productos sin código de barras o códigos dañados:
- Escriba en la barra de búsqueda el nombre o código (ej. *"huevo"*, *"leche lala"*, *"coca"*).
- Presione la tecla `Flecha Abajo` para seleccionar el producto y presione `Enter` para agregarlo.

### 3.3 Venta de Productos a Granel y Pesaje Decimal
Para frutas, verduras, semillas, jamón, queso o alimento para mascotas:
1. Busque o escanee el producto a granel (ej. *"Jitomate Saladet"* o *"Huevo Blanco"*).
2. Se abre automáticamente el **Modal de Pesaje a Granel**.
3. Ingrese el peso en kilogramos con hasta 4 decimales (ej. `1.350` kg).
4. El sistema incluye botones de acceso rápido para porciones frecuentes:
   - **1/4 kg (0.250 kg)**
   - **1/2 kg (0.500 kg)**
   - **3/4 kg (0.750 kg)**
   - **1.0 kg**
5. Presione `Enter` o haga clic en **Agregar al Carrito**. El total a pagar se calcula multiplicando exactamente el precio por el peso.
- *Nota sobre básculas con etiqueta:* Si su báscula genera códigos de barras EAN-13 (prefijos 20 o 21), la pistola los decodifica automáticamente extrayendo el código del producto y el peso en gramos sin intervención manual.

### 3.4 Tickets en Espera / Suspensión de Venta (Atajos F6 y F7)
Si un cliente está en caja y olvida un artículo, o va por otro producto al pasillo:
1. Presione **F6** (o el botón *Poner en Espera*).
2. La venta actual se guarda temporalmente en el sistema y la pantalla queda limpia de inmediato para atender al siguiente cliente en la fila.
3. El contador en la parte superior mostrará `Tickets en Espera: 1`.
4. Cuando el cliente regrese, presione **F7** (o el botón *Ver Pendientes*).
5. Seleccione el ticket del cliente y presione **Reanudar**. Todo el carrito regresa exactamente como estaba.

### 3.5 Cobro Rápido en Efectivo
1. Presione la tecla **F12** o el botón verde **Cobrar**.
2. Aparece la ventana de cobro con el total a pagar en grande.
3. Presione el botón de denominación correspondiente:
   - **$50**, **$100**, **$200**, **$500**, o **Pago Exacto**.
   - O escriba en el teclado el monto entregado por el cliente.
4. El sistema muestra el **Cambio a Entregar** de forma gigante y clara.
5. Presione `Enter`. La venta se registra, se descuenta del inventario y se abre el cajón / se imprime el ticket.

### 3.6 Cobro con Pagos Mixtos (Efectivo + Tarjeta / Vales)
Cuando un cliente paga una parte con tarjeta y otra en efectivo:
1. En la ventana de cobro, seleccione la pestaña **Pago Mixto**.
2. Agregue el primer método: ej. `Tarjeta de Débito`, ingrese `$150.00` y presione **Agregar Abono**.
3. El sistema calcula el saldo restante (ej. `Resta: $85.50`).
4. Agregue el segundo método: ej. `Efectivo`, ingrese `$100.00`.
5. El sistema calcula el cambio exacto (`Cambio: $14.50`) aplicando las reglas contables (el cambio solo aplica sobre el efectivo recibido).
6. Presione **Completar Venta**.

### 3.7 Impresión y Reimpresión de Tickets Térmicos
- Al completar cada venta se genera el ticket de venta con formato térmico estándar (compatible con impresoras de 58 mm y 80 mm).
- **Para reimprimir un ticket anterior:**
  - Vaya a la barra lateral o presione el botón **Reimprimir Ticket**.
  - Muestra los últimos tickets emitidos en el día con folio, hora, total y cajero.
  - Haga clic en el ícono de la impresora del ticket deseado para reimprimir una copia exacta.

---

## 4. Recargas Electrónicas y Pago de Servicios

El sistema cuenta con un módulo dedicado para generar ingresos adicionales en la tienda:

### 4.1 Venta de Recargas de Tiempo Aire
1. En el menú principal, ingrese a **Recargas y Servicios**.
2. Seleccione la compañía telefónica (Telcel, Movistar, AT&T, Bait, Unefon, Virgin).
3. Ingrese el **Número de Teléfono a 10 dígitos**.
4. Ingrese la **Confirmación del Número** (evita errores de dedo del cajero).
5. Seleccione el paquete o monto ($20, $30, $50, $100, $150, $200, $500).
6. Presione **Procesar Recarga**. Se emitirá el comprobante térmico con el folio de autorización para el cliente.

### 4.2 Pago de Recibos y Servicios Públicos
1. Seleccione la pestaña **Pago de Servicios**.
2. Elija la empresa: CFE (Luz), Telmex (Teléfono/Internet), Agua Potable, Naturgy (Gas), Izzi, Sky, etc.
3. Ingrese la referencia del recibo o escanee el código de barras impreso en el recibo.
4. Ingrese el monto a pagar.
5. El sistema sumará la **comisión de servicio de mostrador** configurada y emitirá el comprobante de pago oficial.

---

## 5. Control de Inventario y Kardex

El inventario se mantiene sincronizado de manera automática con cada venta y compra.

### 5.1 Catálogo de Productos
- Desde el módulo **Catálogo de Productos** (solo Administrador/Supervisor), se pueden dar de alta nuevos productos:
  - Nombre, Marca, Categoría, Unidad de Medida (Pieza, Kg, Litro).
  - Código de barras principal y códigos secundarios.
  - Precio de costo, Precio de venta mayoreo y menudeo.
  - Stock mínimo para alertas de reorden.
- Cada cambio en precios o costos queda registrado en la bitácora de auditoría con fecha, hora y usuario responsable.

### 5.2 Ajustes Manuales y Trazabilidad en Kardex
Si se detecta merma, producto caducado o rotura:
1. Ingrese al módulo **Inventario**.
2. Busque el producto y seleccione **Ajustar Existencia**.
3. Seleccione el tipo: *Merma / Caducidad / Ajuste por Inventario Físico*.
4. Ingrese la cantidad y motivo.
5. La consulta en el **Kardex** muestra el historial completo de entradas, salidas, ventas y devoluciones con saldos acumulados precisos.

---

## 6. Proveedores y Recepción de Mercancías (Compras)

### 6.1 Registro de Facturas y Notas de Entrada
1. Ingrese a **Compras**.
2. Haga clic en **Nueva Compra**.
3. Seleccione el proveedor (ej. *Bimbo, Coca-Cola FEMSA, Sabritas, Abarrotes Mayoreo*).
4. Ingrese el folio de remisión o factura del proveedor.
5. Agregue los productos recibidos con su cantidad y costo unitario de compra.
6. Presione **Guardar y Aplicar Compra**:
   - Las existencias del almacén aumentan de inmediato.
   - El **Costo Promedio Ponderado** se actualiza automáticamente.
   - Se genera el movimiento `ENTRADA_COMPRA` en el Kardex.

---

## 7. Pedido Sugerido Dominical

Herramienta diseñada para Don Juan para hacer los pedidos de la semana los domingos en menos de 5 minutos.

### 7.1 Cómo Generar el Pedido Sugerido
1. Ingrese a la opción **Pedido Sugerido** en el menú administrativo.
2. Seleccione el parámetro de análisis:
   - **Historial de Ventas:** 7, 14, 21 o 28 días (se recomiendan 14 días para mayor precisión).
   - **Días de Cobertura:** Cuántos días debe durar la mercancía (típicamente 7 días hasta la siguiente visita del proveedor).
3. Presione **Calcular Pedido Sugerido**.
4. El sistema ejecuta el algoritmo:
   $$\text{Sugerido} = (\text{Venta Promedio Diaria} \times \text{Días Cobertura} + \text{Stock Mínimo}) - \text{Stock Actual}$$
   *(Los productos por pieza se redondean hacia arriba al entero más cercano).*
5. El sistema agrupa los productos automáticamente por proveedor.

### 7.2 Ajuste Manual y Envío por WhatsApp
1. Don Juan puede revisar la lista y modificar manualmente las piezas de cualquier producto en la columna **Cantidad a Pedir**.
2. Puede agregar notas específicas (ej. *"Traer fecha de caducidad larga"*).
3. Haga clic en **Exportar a WhatsApp**:
   - El sistema genera un mensaje con formato limpio y profesional listo para enviar:
   ```text
   *PEDIDO ABARROTES ARENAS*
   Proveedor: Sabritas
   Fecha: 05/10/2026
   -----------------------------------
   - Sabritas Sal 45g: 24 pzas
   - Doritos Nacho 58g: 30 pzas
   - Ruffles Queso 50g: 20 pzas
   -----------------------------------
   Total de líneas: 3
   Confirmar recepción de pedido. ¡Gracias!
   ```
4. Se abre WhatsApp Web o la app en el teléfono de la tienda para enviarlo directamente al repartidor o preventista con un solo clic.

---

## 8. Dashboard y Reportes Gerenciales

El Dashboard le permite a Don Juan supervisar el negocio en tiempo real desde la computadora de mostrador o una tablet en red local.

- **KPIs Principales:** Ventas del día, Ganancia bruta en dinero ($), Margen de ganancia general (%), Ticket promedio y Conteo de operaciones.
- **Gráfica de Tendencia:** Evolución diaria de ventas comparando los últimos 7 días.
- **Top 10 Más Vendidos:** Ranking de los productos con mayor rotación en la semana.
- **Métodos de Pago:** Proporción de ingresos recibidos en Efectivo vs Tarjetas vs Vales.
- **Alertas de Existencias:** Lista prioritaria de artículos agotados y por debajo del stock mínimo.
- **Exportación:** Todos los reportes cuentan con botón para exportar a formato Excel/CSV e impresión limpia para contabilidad.

---

## 9. Atajos de Teclado en el Mostrador

Para que el cajero cobre a máxima velocidad sin depender del mouse:

| Tecla | Acción en el Punto de Venta |
| :---: | :--- |
| `F1` | Ayuda y lista de atajos rápidos |
| `F2` | Enfocar la barra de búsqueda de productos |
| `F4` | Abrir modal de pesaje a granel |
| `F6` | Poner la venta actual en espera |
| `F7` | Abrir lista de tickets en espera |
| `F9` | Registrar movimiento manual de efectivo |
| `F10` | Ver reporte preliminar (Corte X) |
| `F12` | Cobrar venta actual (abrir modal de cobro) |
| `Esc` | Cancelar venta actual / Cerrar ventanas modales |
| `Enter` | Confirmar producto / Confirmar cobro rápido |
| `Supr` | Eliminar el producto seleccionado del carrito |

---

## 10. Preguntas Frecuentes y Solución de Problemas

### P1: El escáner lee el código pero no se agrega el producto.
- **Causa:** El lector de código de barras no tiene configurado el retorno de carro (Enter/CR) al final de la lectura.
- **Solución:** Escanee el código de barras de configuración *"Suffix Enter (CR/LF)"* que viene en el manual del fabricante del escáner.

### P2: No se abre la ventana de cobro al presionar F12.
- **Causa:** El carrito de compras está vacío o el turno de caja no ha sido abierto.
- **Solución:** Verifique que haya registrado la apertura de turno con fondo inicial y que haya al menos un producto agregado a la lista.

### P3: ¿Puedo vender si se va el internet en la tienda?
- **Respuesta:** **Sí.** El sistema opera 100% de manera local en el servidor de la tienda con SQL Server 2022. No requiere conexión a internet para ventas, escáner, tickets térmicos, inventario ni cortes de caja. (Solo las recargas telefónicas y el envío por WhatsApp requieren internet).

### P4: ¿Cómo sacar una copia de seguridad rápida?
- Ingrese como Administrador a Configuración y presione **Generar Respaldo de Base de Datos**, o solicite la ejecución del respaldo programado diario en `C:\RespaldosPdvAbarrotes`.

---
*Manual elaborado para Abarrotes Arenas — Versión 1.0 (Octubre 2026).*
