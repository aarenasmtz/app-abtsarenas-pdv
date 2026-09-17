import os
import fdb
from collections import defaultdict

def main():
    dll_path = os.path.abspath(r'firebird25_embed\fbembed.dll')
    fdb.load_api(dll_path)
    con = fdb.connect(database=os.path.abspath('PDVDATA.FDB'), user='SYSDBA', password='masterkey', charset='NONE')
    cur = con.cursor()

    def decode_str(v):
        if isinstance(v, bytes):
            return v.decode('latin-1', errors='replace')
        return v

    print("================================================================")
    print("1. ANÁLISIS DE FORMA_PAGO 'v' EN VENTATICKETS")
    print("================================================================")
    cur.execute("""
        SELECT 
            MIN(VENDIDO_EN), 
            MAX(VENDIDO_EN), 
            COUNT(*), 
            SUM(TOTAL),
            COUNT(DISTINCT CAJERO_ID),
            COUNT(DISTINCT CLIENTESV2_ID)
        FROM VENTATICKETS 
        WHERE FORMA_PAGO LIKE 'v%'
    """)
    r = cur.fetchone()
    print(f"Rango de fechas: de {r[0]} a {r[1]}")
    print(f"Total tickets 'v': {r[2]}")
    print(f"Total importe 'v': ${r[3]:,.2f}")
    print(f"Cajeros distintos: {r[4]}")
    print(f"Clientes distintos: {r[5]}")

    # Monthly breakdown of 'v' vs 'e' vs 't'
    print("\n--- DISTRIBUCIÓN POR AÑO / MES DE 'v' ---")
    cur.execute("""
        SELECT 
            EXTRACT(YEAR FROM VENDIDO_EN) AS ANIO,
            EXTRACT(MONTH FROM VENDIDO_EN) AS MES,
            COUNT(*) AS CANTIDAD,
            SUM(TOTAL) AS TOTAL
        FROM VENTATICKETS
        WHERE FORMA_PAGO LIKE 'v%'
        GROUP BY 1, 2
        ORDER BY 1, 2
    """)
    for anio, mes, cant, tot in cur.fetchall():
        print(f"  {anio}-{mes:02d}: {cant:>5} tickets | ${tot:>10,.2f}")

    # Check non-empty NOTAS or REFERENCIA in 'v'
    print("\n--- MUESTRA DE NOTAS Y REFERENCIAS EN TICKETS 'v' ---")
    cur.execute("""
        SELECT FIRST 10 ID, FOLIO, CAJERO_ID, TOTAL, VENDIDO_EN, REFERENCIA, NOTAS
        FROM VENTATICKETS
        WHERE FORMA_PAGO LIKE 'v%'
    """)
    for row in cur.fetchall():
        ref = decode_str(row[5])
        notas = decode_str(row[6])
        print(f"  Ticket ID {row[0]} Folio {row[1]} Cajero {row[2]} Total ${row[3]} Fecha {row[4]} | Ref: '{ref}' | Notas: '{notas}'")

    # Check CORTE_MOVIMIENTOS for 'v'
    print("\n================================================================")
    print("2. ANÁLISIS DE 'v' / 'V' EN CORTE_MOVIMIENTOS")
    print("================================================================")
    cur.execute("""
        SELECT FORMA_PAGO, COUNT(*), SUM(MONTO)
        FROM CORTE_MOVIMIENTOS
        GROUP BY FORMA_PAGO
    """)
    print("Por FORMA_PAGO en CORTE_MOVIMIENTOS:")
    for row in cur.fetchall():
        print(" ", row)

    cur.execute("""
        SELECT TIPO, FORMA_PAGO, RAZON_DEVOLUCION, COUNT(*), SUM(MONTO)
        FROM CORTE_MOVIMIENTOS
        GROUP BY 1, 2, 3
    """)
    print("\nDetalle combinaciones en CORTE_MOVIMIENTOS:")
    for row in cur.fetchall():
        print(" ", row)

    # Check CORTE_OPERACIONES: what payment columns exist?
    print("\n================================================================")
    print("3. COLUMNAS DE PAGOS EN CORTE_OPERACIONES")
    print("================================================================")
    cur.execute("""
        SELECT FIRST 3 
            ID, CUANDO_FUE, TOTAL_EN_CAJA, TOTAL_VENTAS, 
            VENTAS_EFECTIVO, VENTAS_TARJETA, VENTAS_VALES, VENTAS_CREDITO
        FROM CORTE_OPERACIONES
        WHERE VENTAS_VALES > 0 OR VENTAS_CREDITO > 0
    """)
    sample_cortes = cur.fetchall()
    print("Cortes con VENTAS_VALES > 0 o VENTAS_CREDITO > 0:")
    for sc in sample_cortes:
        print(" ", sc)

    cur.execute("""
        SELECT 
            COUNT(CASE WHEN VENTAS_VALES > 0 THEN 1 END) AS CORTES_CON_VALES,
            SUM(VENTAS_VALES) AS SUMA_VALES,
            COUNT(CASE WHEN VENTAS_CREDITO > 0 THEN 1 END) AS CORTES_CON_CREDITO,
            SUM(VENTAS_CREDITO) AS SUMA_CREDITO,
            COUNT(CASE WHEN VENTAS_TARJETA > 0 THEN 1 END) AS CORTES_CON_TARJETA,
            SUM(VENTAS_TARJETA) AS SUMA_TARJETA,
            SUM(VENTAS_EFECTIVO) AS SUMA_EFECTIVO
        FROM CORTE_OPERACIONES
    """)
    totals = cur.fetchone()
    print("\nTotales acumulados en CORTE_OPERACIONES:")
    print(f"  Cortes con Vales: {totals[0]} | Total Vales: ${totals[1]:,.2f}")
    print(f"  Cortes con Crédito: {totals[2]} | Total Crédito: ${totals[3] or 0:,.2f}")
    print(f"  Cortes con Tarjeta: {totals[4]} | Total Tarjeta: ${totals[5]:,.2f}")
    print(f"  Total Efectivo: ${totals[6]:,.2f}")

    con.close()

if __name__ == '__main__':
    main()
