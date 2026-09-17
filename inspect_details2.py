import os
import fdb

def main():
    dll_path = os.path.abspath(r'firebird25_embed\fbembed.dll')
    fdb.load_api(dll_path)
    con = fdb.connect(database=os.path.abspath('PDVDATA.FDB'), user='SYSDBA', password='masterkey', charset='NONE')
    cur = con.cursor()

    def decode_row(cursor, r):
        cols = [d[0] for d in cursor.description]
        out = {}
        for c, v in zip(cols, r):
            if isinstance(v, bytes):
                try: v = v.decode('latin-1', errors='replace')
                except: pass
            out[c] = v
        return out

    print("=== USUARIOS ===")
    cur.execute("SELECT * FROM USUARIOS")
    for r in cur.fetchall():
        print(decode_row(cur, r))

    print("\n=== CLIENTESV2 ===")
    cur.execute("SELECT * FROM CLIENTESV2")
    for r in cur.fetchall():
        print(decode_row(cur, r))

    print("\n=== CLIENTESV2_CREDITO ===")
    cur.execute("SELECT * FROM CLIENTESV2_CREDITO")
    for r in cur.fetchall():
        print(decode_row(cur, r))

    print("\n=== MEDIDAS ===")
    cur.execute("SELECT * FROM MEDIDAS")
    for r in cur.fetchall():
        print(decode_row(cur, r))

    print("\n=== ALMACENES ===")
    cur.execute("SELECT * FROM ALMACENES")
    for r in cur.fetchall():
        print(decode_row(cur, r))

    print("\n=== CAJAS ===")
    cur.execute("SELECT * FROM CAJAS")
    for r in cur.fetchall():
        print(decode_row(cur, r))

    print("\n=== CONFIGURACION (claves principales) ===")
    cur.execute("SELECT FIRST 15 * FROM CONFIGURACION")
    for r in cur.fetchall():
        print(decode_row(cur, r))

    print("\n=== ARTICULOS DE VENTA CON CODIGOS NO EN PRODUCTOS (Muestra 5) ===")
    cur.execute("""
        SELECT FIRST 5 a.ID, a.TICKET_ID, a.PRODUCTO_CODIGO, a.PRODUCTO_NOMBRE, a.CANTIDAD, a.PRECIO_FINAL, a.PAGADO_EN
        FROM VENTATICKETS_ARTICULOS a
        LEFT JOIN PRODUCTOS p ON a.PRODUCTO_CODIGO = p.CODIGO
        WHERE p.ID IS NULL
    """)
    for r in cur.fetchall():
        print(decode_row(cur, r))

    print("\n=== PROVEEDORES (Muestra 3) ===")
    cur.execute("SELECT FIRST 3 * FROM PROVEEDORES")
    for r in cur.fetchall():
        print(decode_row(cur, r))

    con.close()

if __name__ == '__main__':
    main()
