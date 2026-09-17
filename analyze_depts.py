import os
import fdb

def main():
    dll_path = os.path.abspath(r'firebird25_embed\fbembed.dll')
    fdb.load_api(dll_path)
    con = fdb.connect(database=os.path.abspath('PDVDATA.FDB'), user='SYSDBA', password='masterkey', charset='NONE')
    cur = con.cursor()

    cur.execute("""
        SELECT 
            d.ID,
            TRIM(d.NOMBRE) AS NOMBRE,
            d.ACTIVO,
            COUNT(p.ID) AS TOTAL_PRODUCTOS,
            COUNT(CASE WHEN p.ELIMINADO_EN IS NULL THEN 1 END) AS ACTIVOS
        FROM DEPARTAMENTOS d
        LEFT JOIN PRODUCTOS p ON d.ID = p.DEPT
        GROUP BY d.ID, d.NOMBRE, d.ACTIVO
        ORDER BY TOTAL_PRODUCTOS DESC, d.NOMBRE
    """)
    depts = cur.fetchall()

    print(f"Total departamentos: {len(depts)}\n")
    print(f"{'ID':<5} | {'NOMBRE':<35} | {'ACT':<3} | {'PRODS':<6} | {'ACTIVOS':<6}")
    print("-" * 65)
    for d_id, nom, act, prods, act_prods in depts:
        print(f"{d_id:<5} | {nom:<35} | {act:<3} | {prods:<6} | {act_prods:<6}")

    con.close()

if __name__ == '__main__':
    main()
