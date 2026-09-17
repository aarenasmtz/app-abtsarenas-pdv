import os
import fdb

def inspect_table_schema(cur, table_name):
    # Query column info from Firebird system tables
    cur.execute("""
        SELECT 
            TRIM(rf.RDB$FIELD_NAME) as field_name,
            f.RDB$FIELD_TYPE as field_type,
            f.RDB$FIELD_LENGTH as field_length,
            f.RDB$FIELD_SCALE as field_scale,
            rf.RDB$NULL_FLAG as null_flag,
            TRIM(t.RDB$TYPE_NAME) as type_name
        FROM RDB$RELATION_FIELDS rf
        JOIN RDB$FIELDS f ON rf.RDB$FIELD_SOURCE = f.RDB$FIELD_NAME
        LEFT JOIN RDB$TYPES t ON f.RDB$FIELD_TYPE = t.RDB$TYPE AND t.RDB$FIELD_NAME = 'RDB$FIELD_TYPE'
        WHERE rf.RDB$RELATION_NAME = ?
        ORDER BY rf.RDB$FIELD_POSITION
    """, (table_name,))
    cols = cur.fetchall()
    return cols

def main():
    dll_path = os.path.abspath(r'firebird25_embed\fbembed.dll')
    fdb.load_api(dll_path)

    db_path = os.path.abspath('PDVDATA.FDB')
    con = fdb.connect(
        database=db_path,
        user='SYSDBA',
        password='masterkey',
        charset='NONE'
    )
    cur = con.cursor()

    key_tables = [
        'DEPARTAMENTOS',
        'PRODUCTOS',
        'PRODUCTOS_BASE',
        'INVENTARIO_BALANCES',
        'VENTATICKETS',
        'VENTATICKETS_ARTICULOS',
        'CORTE_MOVIMIENTOS',
        'INVENTARIO_RECIBOS',
        'INVENTARIO_RECIBOS_DETALLE',
        'INVENTARIO_AJUSTES',
        'INVENTARIO_HISTORIAL'
    ]

    for table in key_tables:
        print(f"\n{'='*70}")
        print(f"TABLA: {table}")
        print(f"{'='*70}")
        
        # Columns
        cols = inspect_table_schema(cur, table)
        col_names = [c[0] for c in cols]
        print(f"Columnas ({len(cols)}):")
        for col in cols:
            fname, ftype, flen, fscale, nflag, tname = col
            scale_str = f"({fscale})" if fscale != 0 else ""
            not_null = "NOT NULL" if nflag == 1 else "NULL"
            print(f"  - {fname:<30} {tname or str(ftype)} len={flen}{scale_str} {not_null}")

        # Sample row
        try:
            cur.execute(f'SELECT FIRST 1 * FROM "{table}"')
            sample = cur.fetchone()
            if sample:
                print("\nEjemplo de fila (1er registro):")
                for name, val in zip(col_names, sample):
                    if isinstance(val, bytes):
                        try:
                            val = val.decode('latin-1', errors='replace')
                        except:
                            val = repr(val)
                    print(f"    {name:<28}: {repr(val)}")
        except Exception as e:
            print(f"Error al obtener muestra: {e}")

    con.close()

if __name__ == '__main__':
    main()
