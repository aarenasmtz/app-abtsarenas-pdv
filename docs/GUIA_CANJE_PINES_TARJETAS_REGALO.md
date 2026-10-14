# Guía Operativa: Venta y Canje de Tarjetas de Regalo y Pines Digitales (RNP)

## 1. Objetivo y Alcance
Este documento describe el flujo operativo y técnico para la emisión, cobro y canje de **Tarjetas de Regalo y Pines Electrónicos** (Xbox Game Pass, PlayStation Network, Nintendo eShop, Spotify Premium, Netflix, Google Play, Steam, Uber, etc.) en el Punto de Venta (PDV) Abarrotes Arenas, integrado con el Web Service de la **Red Nacional de Pagos (RNP / VentaMovil)**.

---

## 2. Diferencia Fundamental: Recibos Públicos vs. Pines Digitales

| Criterio | Cobro de Recibos Públicos (CFE, Agua, Telmex) | Venta de Pines / Tarjetas de Regalo (Xbox, Spotify, etc.) |
| :--- | :--- | :--- |
| **Naturaleza** | Liquidación de un adeudo vencido o por vencer de un servicio ya consumido. | Compra directa de saldo prepagado para consumo futuro en una plataforma digital. |
| **Consulta de Adeudo** | **Obligatoria / Recomendada**: Se consulta el monto pendiente ante el proveedor en línea. | **No aplica**: No existe adeudo previo; el cliente decide el monto o denominación a adquirir. |
| **Referencia de Entrada** | Código de barras del recibo o número de contrato del cliente. | **Opcional**: Número celular del cliente (para respaldo por SMS) o folio interno de venta. |
| **Resultado para el Cliente** | Comprobante fiscal/bancario de pago que extingue el adeudo con la empresa proveedora. | **Código Digital de Canje (PIN)** impreso en su ticket para ingresar en su consola o cuenta. |
| **Reversibilidad** | Sujeto a reglas de compensación del proveedor. | **No reembolsable**: Una vez emitido el PIN, se considera entregado y activo ante el proveedor. |

---

## 3. Flujo Operativo en Mostrador (Paso a Paso para el Cajero)

### Paso 1: Solicitud del Cliente
1. El cliente se acerca al mostrador solicitando una tarjeta de regalo o pin digital (Ej: *"Deme un código de Xbox Game Pass de $500 pesos"*).

### Paso 2: Selección del Producto en el PDV
1. El cajero presiona el atajo **F11** en el teclado o hace clic en **"Recargas y Servicios (F11)"**.
2. Ingresa a la pestaña **Pago de Servicios** o busca en el **Catálogo en Mosaico RNP (412+)**.
3. Selecciona la operadora deseada (ej. **Xbox Game Pass / Microsoft Store**).
4. El sistema detecta automáticamente que es un **PIN Digital / Tarjeta de Regalo**:
   - Cambia el título a *"Venta de Tarjetas de Regalo y Pines Digitales"*.
   - Muestra el distintivo verde informativo de PIN Digital.
   - Oculta el botón de "Consultar Adeudo" (evitando errores innecesarios).
   - Hace opcional la referencia (permite registrar el celular del cliente si desea respaldo).

### Paso 3: Captura de Denominación y Cobro
1. El cajero ingresa el valor solicitado por el cliente (Ej: `$500.00`).
2. El sistema calcula automáticamente la comisión del servicio (Ej: `+$15.00 MXN`).
3. El total en caja a cobrar al cliente se muestra claramente (Ej: `$515.00 MXN`).
4. El cajero recibe el pago del cliente (efectivo, tarjeta, etc.) y presiona **"Cobrar y Emitir PIN de Canje"**.

### Paso 4: Emisión y Entrega del PIN
1. El Web Service de RNP descuenta el importe de la bolsa prepagada del comercio y genera en tiempo real el **Código Digital de Canje (PIN)** (ejemplo: `XBX-74K9-22MP-89RT`).
2. El sistema muestra el PIN en pantalla en tipografía monoespaciada grande y destacada.
3. Se imprime el ticket térmico de venta con el PIN visible y las instrucciones de canje.
4. El cajero entrega el ticket al cliente recordándole que conserve su ticket hasta canjearlo.

---

## 4. Guía de Canje por Plataforma (Instrucciones para el Cliente)

El ticket impreso contendrá las siguientes instrucciones según la empresa seleccionada:

### 🟢 Xbox Game Pass / Microsoft Store
- **Sitio web:** Ingresar a [https://microsoft.com/redeem](https://microsoft.com/redeem) con su cuenta Microsoft.
- **En la Consola:** Presionar el botón Xbox > Ir a **Store** > Presionar botón Vista > Seleccionar **Canjear** e ingresar los 25 caracteres del PIN.

### 🔵 PlayStation Network (PSN)
- **Sitio web:** Iniciar sesión en [https://playstation.com](https://playstation.com) > Clic en el avatar > **Canjear código**.
- **En la Consola:** Ir a **PlayStation Store** > Menú lateral > **Canjear códigos** e ingresar los 12 dígitos del código.

### 🔴 Nintendo eShop
- **En la Consola:** Abrir **Nintendo eShop** > Seleccionar su perfil > Ir a la opción **Canjear código** en la columna izquierda e ingresar los 16 caracteres.

### 🟢 Spotify Premium
- **Sitio web:** Ingresar a [https://spotify.com/redeem](https://spotify.com/redeem) > Iniciar sesión en su cuenta > Escribir el PIN y hacer clic en **Canjear**.

### 🔴 Netflix
- **Sitio web:** Ingresar a [https://netflix.com/redeem](https://netflix.com/redeem) > Ingresar el código del PIN o tarjeta y hacer clic en **Canjear**. El saldo se abonará a su cuenta mensual.

---

## 5. Políticas y Seguridad
1. **Pines de Entrega Única:** Los códigos de canje se generan una sola vez. No se reimprimen ni se transfieren entre clientes.
2. **Cero Devoluciones:** Debido a las políticas de seguridad de Microsoft, Sony, Nintendo y Spotify, una vez emitido el PIN digital no se admiten cancelaciones ni reembolsos en efectivo.
3. **Auditoría:** Todas las compras de pines se registran en la bitácora interna con fecha, hora, usuario, folio RNP y folio POS para conciliación contra el saldo de bolsa prepago.
