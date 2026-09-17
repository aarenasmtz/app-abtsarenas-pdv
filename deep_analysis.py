import os
import fdb
import json
from collections import defaultdict
from decimal import Decimal

def get_connection():
    dll_path = os.path.abspath(r'firebird25_embed\fbembed.dll')
    fdb.load_api(dll_path)
    db_path = os.path.abspath('PDVDATA.FDB')
    return fdb.connect(
        database=db_path,
        user='SYSDBA',
        password='masterkey',
        charset='NONE'
    )

def analyze_all():
    con = get_connection()
    cur = con.cursor()

    # 1. Firebird PKs and FKs
    print("=== EXTRACTING CONSTRAINTS ===")
    cur.execute("""
        SELECT 
            TRIM(rc.RDB$CONSTRAINT_NAME) AS CONSTRAINT_NAME,
            TRIM(rc.RDB$CONSTRAINT_TYPE) AS CONSTRAINT_TYPE,
            TRIM(rc.RDB$RELATION_NAME) AS TABLE_NAME,
            TRIM(s.RDB$FIELD_NAME) AS FIELD_NAME,
            TRIM(c2.RDB$RELATION_NAME) AS REF_TABLE,
            TRIM(s2.RDB$FIELD_NAME) AS REF_FIELD
        FROM RDB$RELATION_CONSTRAINTS rc
        JOIN RDB$RELATIONS rel ON rc.RDB$RELATION_NAME = rel.RDB$RELATION_NAME
        LEFT JOIN RDB$INDEX_SEGMENTS s ON rc.RDB$INDEX_NAME = s.RDB$INDEX_NAME
        LEFT JOIN RDB$REF_CONSTRAINTS ref ON rc.RDB$CONSTRAINT_NAME = ref.RDB$CONSTRAINT_NAME
        LEFT JOIN RDB$RELATION_CONSTRAINTS c2 ON ref.RDB$CONST_NAME_UQ = c2.RDB$CONSTRAINT_NAME
        LEFT JOIN RDB$INDEX_SEGMENTS s2 ON c2.RDB$INDEX_NAME = s2.RDB$INDEX_NAME
        WHERE rel.RDB$SYSTEM_FLAG = 0
        ORDER BY rc.RDB$RELATION_NAME, rc.RDB$CONSTRAINT_TYPE, s.RDB$FIELD_POSITION
    """)
    constraints = cur.fetchall()
    
    table_pks = defaultdict(list)
    table_fks = defaultdict(list)
    for c_name, c_type, t_name, f_name, ref_t, ref_f in constraints:
        if c_type == 'PRIMARY KEY':
            table_pks[t_name].append(f_name)
        elif c_type == 'FOREIGN KEY':
            table_fks[t_name].append((f_name, ref_t, ref_f))

    # 2. Analyze PRODUCTOS
    print("=== ANALYZING PRODUCTOS ===")
    cur.execute("SELECT COUNT(*), COUNT(DISTINCT CODIGO) FROM PRODUCTOS")
    total_prod, dist_cod = cur.fetchone()
    
    cur.execute("SELECT COUNT(*) FROM PRODUCTOS WHERE ELIMINADO_EN IS NOT NULL")
    prod_eliminados = cur.fetchone()[0]
    
    cur.execute("SELECT COUNT(*) FROM PRODUCTOS WHERE ELIMINADO_EN IS NULL")
    prod_activos = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM PRODUCTOS WHERE CODIGO IS NULL OR TRIM(CODIGO) = ''")
    prod_sin_codigo = cur.fetchone()[0]

    # Duplicate codes
    cur.execute("""
        SELECT CODIGO, COUNT(*) 
        FROM PRODUCTOS 
        GROUP BY CODIGO 
        HAVING COUNT(*) > 1
    """)
    dup_codes = cur.fetchall()

    # Types of sale (TVENTA)
    cur.execute("SELECT TVENTA, COUNT(*) FROM PRODUCTOS GROUP BY TVENTA")
    tventas = cur.fetchall()

    # Department references in PRODUCTOS
    cur.execute("""
        SELECT COUNT(*) 
        FROM PRODUCTOS p 
        LEFT JOIN DEPARTAMENTOS d ON p.DEPT = d.ID 
        WHERE p.DEPT IS NOT NULL AND d.ID IS NULL
    """)
    orphan_dept_in_prod = cur.fetchone()[0]

    # 3. Analyze DEPARTAMENTOS
    cur.execute("SELECT COUNT(*), COUNT(DISTINCT NOMBRE) FROM DEPARTAMENTOS")
    total_dept, dist_dept_nom = cur.fetchone()

    # 4. Analyze INVENTARIO
    print("=== ANALYZING INVENTARIO ===")
    cur.execute("SELECT COUNT(*), COUNT(DISTINCT PRODUCTO_ID) FROM INVENTARIO_BALANCES")
    total_bal, dist_bal_prod = cur.fetchone()

    cur.execute("SELECT COUNT(*) FROM INVENTARIO_BALANCES WHERE CANTIDAD_ACTUAL < 0")
    bal_negativos = cur.fetchone()[0]

    cur.execute("""
        SELECT COUNT(*) 
        FROM INVENTARIO_BALANCES b 
        LEFT JOIN PRODUCTOS p ON b.PRODUCTO_ID = p.ID 
        WHERE p.ID IS NULL
    """)
    orphan_bal_prod = cur.fetchone()[0]

    cur.execute("SELECT MIN(CUANDO_FUE), MAX(CUANDO_FUE), COUNT(*) FROM INVENTARIO_HISTORIAL")
    min_inv_hist, max_inv_hist, total_inv_hist = cur.fetchone()

    cur.execute("""
        SELECT COUNT(*) 
        FROM INVENTARIO_HISTORIAL h 
        LEFT JOIN PRODUCTOS p ON h.PRODUCTO_ID = p.ID 
        WHERE p.ID IS NULL
    """)
    orphan_inv_hist_prod = cur.fetchone()[0]

    # 5. Analyze VENTAS
    print("=== ANALYZING VENTAS ===")
    cur.execute("SELECT MIN(CREADO_EN), MAX(CREADO_EN), MIN(VENDIDO_EN), MAX(VENDIDO_EN), COUNT(*) FROM VENTATICKETS")
    min_creado, max_creado, min_vendido, max_vendido, total_tickets = cur.fetchone()

    cur.execute("SELECT ESTA_CANCELADO, COUNT(*), SUM(TOTAL) FROM VENTATICKETS GROUP BY ESTA_CANCELADO")
    tickets_cancelados = cur.fetchall()

    cur.execute("SELECT FORMA_PAGO, COUNT(*), SUM(TOTAL) FROM VENTATICKETS GROUP BY FORMA_PAGO")
    tickets_formas_pago = cur.fetchall()

    cur.execute("SELECT COUNT(*) FROM VENTATICKETS_ARTICULOS")
    total_ticket_art = cur.fetchone()[0]

    cur.execute("""
        SELECT COUNT(*) 
        FROM VENTATICKETS_ARTICULOS a 
        LEFT JOIN VENTATICKETS t ON a.TICKET_ID = t.ID 
        WHERE t.ID IS NULL
    """)
    orphan_ticket_art = cur.fetchone()[0]

    cur.execute("""
        SELECT COUNT(*) 
        FROM VENTATICKETS t 
        LEFT JOIN VENTATICKETS_ARTICULOS a ON t.ID = a.TICKET_ID 
        WHERE a.ID IS NULL
    """)
    tickets_sin_art = cur.fetchone()[0]

    # Check if PRODUCTO_CODIGO in VENTATICKETS_ARTICULOS matches PRODUCTOS
    cur.execute("""
        SELECT COUNT(*) 
        FROM VENTATICKETS_ARTICULOS a 
        LEFT JOIN PRODUCTOS p ON a.PRODUCTO_CODIGO = p.CODIGO 
        WHERE p.ID IS NULL
    """)
    orphan_art_codigo = cur.fetchone()[0]

    # 6. Analyze CLIENTES & CREDITOS
    print("=== ANALYZING CLIENTES & CREDITOS ===")
    cur.execute("SELECT COUNT(*) FROM CLIENTESV2")
    total_clientesv2 = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM CLIENTES")
    total_clientes_v1 = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM CLIENTESV2_CREDITO")
    total_clientes_cred = cur.fetchone()[0]

    # 7. Analyze PROVEEDORES
    cur.execute("SELECT COUNT(*) FROM PROVEEDORES")
    total_prov = cur.fetchone()[0]

    # 8. Analyze USUARIOS & CAJAS & TURNOS
    cur.execute("SELECT COUNT(*) FROM USUARIOS")
    total_usr = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM CAJAS")
    total_cajas = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM TURNOS")
    total_turnos = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM CORTE_OPERACIONES")
    total_cortes = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM CORTE_MOVIMIENTOS")
    total_mov_corte = cur.fetchone()[0]

    # Save summary dictionary
    summary = {
        "pks": {k: v for k, v in table_pks.items()},
        "fks": {k: [(f, rt, rf) for f, rt, rf in v] for k, v in table_fks.items()},
        "productos": {
            "total": total_prod,
            "distintos_codigos": dist_cod,
            "activos": prod_activos,
            "eliminados": prod_eliminados,
            "sin_codigo": prod_sin_codigo,
            "duplicados_count": len(dup_codes),
            "ejemplos_duplicados": [(c, n) for c, n in dup_codes[:10]],
            "tventas": [(t, n) for t, n in tventas],
            "huerfanos_depto": orphan_dept_in_prod
        },
        "departamentos": {
            "total": total_dept,
            "distintos_nombres": dist_dept_nom
        },
        "inventario": {
            "balances_total": total_bal,
            "balances_negativos": bal_negativos,
            "balances_huerfanos": orphan_bal_prod,
            "historial_total": total_inv_hist,
            "historial_min_fecha": str(min_inv_hist),
            "historial_max_fecha": str(max_inv_hist),
            "historial_huerfanos_prod": orphan_inv_hist_prod
        },
        "ventas": {
            "tickets_total": total_tickets,
            "tickets_min_creado": str(min_creado),
            "tickets_max_creado": str(max_creado),
            "tickets_min_vendido": str(min_vendido),
            "tickets_max_vendido": str(max_vendido),
            "tickets_cancelados": [(str(c), n, float(s or 0)) for c, n, s in tickets_cancelados],
            "tickets_formas_pago": [(str(fp), n, float(s or 0)) for fp, n, s in tickets_formas_pago],
            "articulos_total": total_ticket_art,
            "articulos_huerfanos_ticket": orphan_ticket_art,
            "tickets_sin_articulos": tickets_sin_art,
            "articulos_codigo_no_en_productos": orphan_art_codigo
        },
        "otros": {
            "clientesv2": total_clientesv2,
            "clientes_v1": total_clientes_v1,
            "clientesv2_credito": total_clientes_cred,
            "proveedores": total_prov,
            "usuarios": total_usr,
            "cajas": total_cajas,
            "turnos": total_turnos,
            "corte_operaciones": total_cortes,
            "corte_movimientos": total_mov_corte
        }
    }

    with open("analysis_summary.json", "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2, ensure_ascii=False)

    print("=== ANALYSIS SAVED TO analysis_summary.json ===")
    con.close()

if __name__ == '__main__':
    analyze_all()
