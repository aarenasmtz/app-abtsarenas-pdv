import os
import fdb
import inspect_schema

def main():
    dll_path = os.path.abspath(r'firebird25_embed\fbembed.dll')
    fdb.load_api(dll_path)
    con = fdb.connect(database=os.path.abspath('PDVDATA.FDB'), user='SYSDBA', password='masterkey', charset='NONE')
    cur = con.cursor()
    for table in ['DEPARTAMENTOS', 'PRODUCTOS', 'INVENTARIO_BALANCES', 'VENTATICKETS']:
        print(f"\n{'='*70}\nTABLA: {table}\n{'='*70}")
        cols = inspect_schema.inspect_table_schema(cur, table)
        for c in cols:
            fname, ftype, flen, fscale, nflag, tname = c
            scale_str = f"({fscale})" if fscale != 0 else ""
            not_null = "NOT NULL" if nflag == 1 else "NULL"
            print(f"  - {fname:<30} {tname or str(ftype)} len={flen}{scale_str} {not_null}")
        
        cur.execute(f'SELECT FIRST 1 * FROM "{table}"')
        sample = cur.fetchone()
        print("\nEjemplo:")
        for c, v in zip(cols, sample):
            if isinstance(v, bytes):
                try: v = v.decode('latin-1', errors='replace')
                except: pass
            print(f"    {c[0]:<28}: {repr(v)}")
    con.close()

if __name__ == '__main__':
    main()
