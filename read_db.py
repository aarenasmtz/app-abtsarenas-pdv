import os
import fdb

def main():
    dll_path = os.path.abspath(r'firebird25_embed\fbembed.dll')
    fdb.load_api(dll_path)

    db_path = os.path.abspath('PDVDATA.FDB')
    print(f"Connecting to database: {db_path}...")

    con = fdb.connect(
        database=db_path,
        user='SYSDBA',
        password='masterkey',
        charset='NONE'
    )
    cur = con.cursor()

    # Get all tables
    cur.execute("""
        SELECT TRIM(RDB$RELATION_NAME)
        FROM RDB$RELATIONS
        WHERE RDB$SYSTEM_FLAG = 0
          AND RDB$VIEW_BLR IS NULL
        ORDER BY RDB$RELATION_NAME
    """)
    tables = [r[0] for r in cur.fetchall()]
    print(f"\n[+] Total user tables found: {len(tables)}\n")

    # For each table, get row count
    table_counts = {}
    for table in tables:
        try:
            cur.execute(f'SELECT COUNT(*) FROM "{table}"')
            cnt = cur.fetchone()[0]
            table_counts[table] = cnt
        except Exception as e:
            table_counts[table] = f"Error: {e}"

    print(f"{'TABLE NAME':<35} | {'ROWS':<10}")
    print("-" * 48)
    for table, cnt in sorted(table_counts.items(), key=lambda x: (isinstance(x[1], str), -(x[1] if isinstance(x[1], int) else 0))):
        print(f"{table:<35} | {str(cnt):<10}")

    con.close()

if __name__ == '__main__':
    main()
