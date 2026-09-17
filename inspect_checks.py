import deep_analysis
con = deep_analysis.get_connection()
cur = con.cursor()

print("=== DEPARTAMENTOS EN PRODUCTOS ===")
cur.execute("""
    SELECT p.DEPT, d.NOMBRE, COUNT(*)
    FROM PRODUCTOS p
    LEFT JOIN DEPARTAMENTOS d ON p.DEPT = d.ID
    GROUP BY p.DEPT, d.NOMBRE
    ORDER BY 3 DESC
""")
for r in cur.fetchall()[:15]:
    print(r)

print("\n=== VALORES EXTRAÑOS EN PRECIOS / COSTOS ===")
cur.execute("""
    SELECT 
        COUNT(CASE WHEN PCOSTO < 0 THEN 1 END) AS COSTO_NEG,
        COUNT(CASE WHEN PVENTA < 0 THEN 1 END) AS VENTA_NEG,
        COUNT(CASE WHEN PVENTA = 0 THEN 1 END) AS VENTA_CERO,
        COUNT(CASE WHEN PCOSTO = 0 THEN 1 END) AS COSTO_CERO,
        COUNT(CASE WHEN PVENTA < PCOSTO THEN 1 END) AS VENTA_MENOR_COSTO
    FROM PRODUCTOS
    WHERE ELIMINADO_EN IS NULL
""")
print(cur.fetchone())

print("\n=== VALORES EXTRAÑOS EN INVENTARIO ===")
cur.execute("""
    SELECT 
        COUNT(CASE WHEN CANTIDAD_ACTUAL < 0 THEN 1 END) AS STOCK_NEG,
        COUNT(CASE WHEN CANTIDAD_ACTUAL = 0 THEN 1 END) AS STOCK_CERO,
        COUNT(CASE WHEN CANTIDAD_ACTUAL > 0 THEN 1 END) AS STOCK_POS,
        MIN(CANTIDAD_ACTUAL), MAX(CANTIDAD_ACTUAL), SUM(CANTIDAD_ACTUAL)
    FROM INVENTARIO_BALANCES
""")
print(cur.fetchone())

print("\n=== DEVOLUCIONES ===")
cur.execute("SELECT COUNT(*) FROM DEVOLUCIONES")
print("Total Devoluciones:", cur.fetchone()[0])
cur.execute("SELECT COUNT(*) FROM DEVOLUCIONES_ARTICULOS")
print("Total Devoluciones Articulos:", cur.fetchone()[0])

print("\n=== COMPRAS / RECIBOS ===")
cur.execute("SELECT COUNT(*), MIN(RECIBIDO_EN), MAX(RECIBIDO_EN) FROM INVENTARIO_RECIBOS")
print("Total Recibos (Compras):", cur.fetchone())

con.close()
