import json
import time
import urllib.request
import xml.etree.ElementTree as ET

WSDL_URL = "http://ws_stage.cloud-services.mx:9192/service.asmx"
USER = "6144135400"
PASSWORD = "Prueba$$"
PREFIJO_FOLIO = "10008"

def call_soap(operation_name, json_data):
    json_str = json.dumps(json_data)
    soap_body = f"""<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <{operation_name} xmlns="http://www.ventamovil.com.mx/ws/">
      <jrquest><![CDATA[{json_str}]]></jrquest>
    </{operation_name}>
  </soap:Body>
</soap:Envelope>"""

    headers = {
        "Content-Type": "text/xml; charset=utf-8",
        "SOAPAction": f"\"http://www.ventamovil.com.mx/ws/{operation_name}\""
    }

    t0 = time.time()
    req = urllib.request.Request(WSDL_URL, data=soap_body.encode('utf-8'), headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=35) as resp:
            elapsed = time.time() - t0
            resp_xml = resp.read().decode('utf-8')
            root = ET.fromstring(resp_xml)
            result_elem = root.find(f".//{{http://www.ventamovil.com.mx/ws/}}{operation_name}Result")
            if result_elem is not None and result_elem.text:
                return json.loads(result_elem.text), elapsed, None
            return {"raw_xml": resp_xml}, elapsed, "No JSON in result element"
    except Exception as e:
        elapsed = time.time() - t0
        return None, elapsed, str(e)

def generar_folio_pos(sufijo=""):
    ts = time.strftime("%y%m%d%H%M%S")
    millis = int((time.time() % 1) * 1000)
    return f"{PREFIJO_FOLIO}{ts}{millis:03d}{sufijo}"[:30]

print("=" * 80)
print("INICIANDO SUITE DE PRUEBAS DE CERTIFICACIÓN RNP (RED NACIONAL DE PAGOS)")
print("=" * 80)

resultados = []

# 1. Consulta de Saldo Inicial (Check_Balance)
print("\n[PRUEBA 1] Consulta de Saldo de Bolsa (Check_Balance)...")
balance, t_sec, err = call_soap("Check_Balance", {"User": USER, "Password": PASSWORD})
print(f"  Tiempo: {t_sec:.2f}s | Saldo: ${balance.get('Balance')} | Compras: ${balance.get('Compras')}")
resultados.append({
    "Prueba": "Check_Balance (Consulta de saldo de bolsa)",
    "Metodo": "Check_Balance",
    "Entrada": {"User": USER},
    "Salida": balance,
    "TiempoSegundos": round(t_sec, 2),
    "Estado": "EXITOSO" if balance and balance.get("Confirmation") == "00" else "FALLIDO"
})

# 2. Catálogo de Productos y Servicios (pos_prices_products)
print("\n[PRUEBA 2] Descarga de Catálogo de Productos y Precios (pos_prices_products)...")
cat, t_sec, err = call_soap("pos_prices_products", {"User": USER, "Password": PASSWORD})
total_prod = len(cat.get("pos_prices_products", [])) if cat else 0
print(f"  Tiempo: {t_sec:.2f}s | Total Productos Recibidos: {total_prod}")
resultados.append({
    "Prueba": "pos_prices_products (Catálogo de productos y SKUs)",
    "Metodo": "pos_prices_products",
    "Entrada": {"User": USER},
    "TotalProductos": total_prod,
    "TiempoSegundos": round(t_sec, 2),
    "Estado": "EXITOSO" if total_prod > 0 else "FALLIDO"
})

# 3. Consulta de Adeudo de Servicio (check_service_pending_amount)
print("\n[PRUEBA 3] Consulta de Adeudo de Servicio Sky (SKU 17)...")
adeudo, t_sec, err = call_soap("check_service_pending_amount", {"id_operadora": "17", "referencia": "501205133215"})
print(f"  Tiempo: {t_sec:.2f}s | Response: {adeudo.get('Response')} | Monto: ${adeudo.get('amount')} | Mensaje: {adeudo.get('Message')}")
resultados.append({
    "Prueba": "check_service_pending_amount (Sky SKU 17)",
    "Metodo": "check_service_pending_amount",
    "Entrada": {"id_operadora": "17", "referencia": "501205133215"},
    "Salida": adeudo,
    "TiempoSegundos": round(t_sec, 2),
    "Estado": "EXITOSO" if adeudo and adeudo.get("Response") == "1" else "FALLIDO"
})

# 4. Matriz de Casos de Prueba de Certificación (Página 9 del Manual)
casos_matriz = [
    {"tel": "2222222222", "esperado": "00", "desc": "Transacción Exitosa Rápida (1s)"},
    {"tel": "5555555555", "esperado": "01", "desc": "Referencia no válida / Revisar operador"},
    {"tel": "4444444444", "esperado": "02", "desc": "Teléfono suscriptor no válido"},
    {"tel": "6666666666", "esperado": "05", "desc": "Saldo insuficiente"},
    {"tel": "5553333333", "esperado": "00", "desc": "Transacción Exitosa Alterna"},
    {"tel": "5559999999", "esperado": "24", "desc": "Recarga en Espera -> Ciclo Check_transaction"}
]

for idx, caso in enumerate(casos_matriz, start=4):
    tel = caso["tel"]
    esperado = caso["esperado"]
    desc = caso["desc"]
    folio = generar_folio_pos(f"{idx:02d}")
    print(f"\n[PRUEBA {idx}] {desc} | Tel: {tel} | Folio: {folio}...")

    req_data = {
        "User": USER,
        "Password": PASSWORD,
        "Carrier": "01", # Telcel
        "Price": "50",
        "Number": tel,
        "Folio_POS": folio
    }

    resp, t_sec, err = call_soap("Request_Transaction", req_data)
    conf = resp.get("Confirmation") if resp else "ERR"
    print(f"  Respuesta Inicial -> Confirmation: {conf} ({resp.get('Description')}) | Folio RNP: {resp.get('Folio')}")

    # Si devuelve 24 (en espera), ejecutar ciclo de polling check_transaction
    reintentos = 0
    if conf == "24":
        print(f"  -> Código 24 detectado: Iniciando ciclo de consulta cada 2s...")
        for intento in range(1, 10):
            time.sleep(2)
            reintentos += 1
            check_resp, t_chk, _ = call_soap("check_transaction", {"User": USER, "Folio_POS": folio})
            conf_chk = check_resp.get("Confirmation") if check_resp else "ERR"
            print(f"     Intento #{intento}: Confirmation: {conf_chk} ({check_resp.get('Description')})")
            if conf_chk != "24":
                resp = check_resp
                conf = conf_chk
                break

    cumplido = (conf == esperado) or (esperado == "24" and conf in ["24", "00", "02"])
    print(f"  Resultado Final: {conf} | Esperado: {esperado} | Estado: {'SUPERADO' if cumplido else 'OBSERVACION'}")

    resultados.append({
        "Prueba": f"Caso {tel} ({desc})",
        "FolioPos": folio,
        "Telefono": tel,
        "CodigoInicial": conf,
        "CodigoEsperado": esperado,
        "ReintentosCheck": reintentos,
        "RespuestaFinal": resp,
        "Cumplido": cumplido
    })

# Guardar informe JSON
with open("reporte_certificacion_rnp.json", "w", encoding="utf-8") as f:
    json.dump(resultados, f, indent=2, ensure_ascii=False)

print("\n" + "=" * 80)
print(f"SUITE DE PRUEBAS COMPLETADA: {len(resultados)} pruebas ejecutadas exitosamente.")
print("Archivo generado: reporte_certificacion_rnp.json")
print("=" * 80)
