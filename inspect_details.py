import os
import fdb

def main():
    dll_path = os.path.abspath(r'firebird25_embed\fbembed.dll')
    fdb.load_api(dll_path)
    con = fdb.connect(database=os.path.abspath('PDVDATA.FDB'), user='SYSDBA', password='masterkey', charset='NONE')
    cur = con.cursor()

    def decode_val(v):
        if isinstance(v, bytes):
            return v.decode('latin-1', errors='replace')
        return v

    print("=== USUARIOS ===")
    cur.execute("SELECT ID, NOMBRE, ACTIVO, ES_ADMINISTRADOR FROM USUARIOS")
    for r in cur.fetchall():
        print([decode_val(x) for x in r])

    print("\n=== CLIENTESV2 ===")
    cur.execute("SELECT ID, NUMERO, NOMBRE, RFC, TELEFONO, DIRECCION FROM CLIENTESV2")
    for r in cur.fetchall():
        print([decode_val(x) for x in r])

    print("\n=== CLIENTESV2_CREDITO ===")
    cur.execute("SELECT CLIENTESV2_ID, LIMITE, SALDO, DIAS_CREDITO, ACTIVO FROM CLIENTESV2_CREDITO")
    for r in cur.fetchall():
        print([decode_val(x) for x in r])

    print("\n=== MEDIDAS ===")
    cur.execute("SELECT ID, NOMBRE, SIMBOLO FROM MEDIDAS")
    for r in cur.fetchall():
        print([decode_val(x) for x in r])

    print("\n=== ALMACENES ===")
    cur.execute("SELECT ID, NOMBRE, DESCRIPCION FROM ALMACENES")
    for r in cur.fetchall():
        print([decode_val(x) for x in r])

    print("\n=== CONFIGURACION (claves principales) ===")
    cur.execute("SELECT FIRST 20 CLAVE, VALOR FROM CONFIGURACION")
    for r in cur.fetchall():
        print(f"  {decode_val(r[0])}: {decode_val(r[1])}")

    print("\n=== FORMAS DE PAGO EN VENTATICKETS ===")
    cur.execute("SELECT FORMA_PAGO, COUNT(*), MIN(CREADO_EN), MAX(CREADO_EN) FROM VENTATICKETS GROUP BY FORMA_PAGO")
    for r in cur.fetchall():
        print([decode_val(x) for x in r])

    print("\n=== ARTICULOS DE VENTA CON CODIGOS NO EN PRODUCTOS (Muestra 5) ===")
    cur.execute("""
        SELECT FIRST 5 a.ID, a.TICKET_ID, a.PRODUCTO_CODIGO, a.PRODUCTO_NOMBRE, a.CANTIDAD, a.PRECIO_FINAL, a.PAGADO_EN
        FROM VENTATICKETS_ARTICULOS a
        LEFT JOIN PRODUCTOS p ON a.PRODUCTO_CODIGO = p.CODIGO
        WHERE p.ID IS NULL
    """)
    for r in cur.fetchall():
        print([decode_val(x) for x in r])

    print("\n=== PROVEEDORES (Muestra 5) ===")
    cur.execute("SELECT FIRST 5 ID, NOMBRE, RFC, TELEFONO, CONTACTO FROM PROVEEDORES")
    for r in cur.fetchall():
        print([decode_val(x) for x in r])

    print("\n=== PROMOCIONES_POR_CANTIDAD ===")
    cur.execute("SELECT * FROM PROMOCIONES_POR_CANTIDAD")
    for r in cur.fetchall():
        print([decode_val(x) for x in r])

    con.close()

if __name__ == '__main__':
    main()
