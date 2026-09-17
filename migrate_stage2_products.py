import os
import fdb
import pyodbc
import json
from decimal import Decimal

def get_fb():
    dll_path = os.path.abspath(r'firebird25_embed\fbembed.dll')
    fdb.load_api(dll_path)
    return fdb.connect(
        database=os.path.abspath('PDVDATA.FDB'),
        user='SYSDBA',
        password='masterkey',
        charset='NONE'
    )

def get_sql():
    conn_str = 'DRIVER={ODBC Driver 17 for SQL Server};SERVER=AAM;DATABASE=PdvAbarrotesArenas;Trusted_Connection=yes;'
    return pyodbc.connect(conn_str)

def decode_text(v):
    if isinstance(v, bytes):
        return v.decode('latin-1', errors='replace').strip()
    if v is None:
        return ''
    return str(v).strip()

def main():
    print("==================================================================")
    print("ETAPA 2: MIGRACION DE PRODUCTOS, CODIGOS DE BARRAS E INVENTARIO")
    print("==================================================================")

    fb_conn = get_fb()
    fb_cur = fb_conn.cursor()
    sql_conn = get_sql()
    sql_cur = sql_conn.cursor()

    # Load department/brand mapping
    with open('mapeo_departamentos.json', 'r', encoding='utf-8') as f:
        dept_map = json.load(f)

    # Load migration lookup dictionaries from SQL Server
    print("Cargando equivalencias previas...")
    sql_cur.execute("SELECT IdOrigen, IdCategoria FROM dbo.MigracionCategorias")
    cat_lookup = dict(sql_cur.fetchall())

    sql_cur.execute("SELECT NombreMarca, IdMarca FROM dbo.MigracionMarcas")
    brand_lookup = dict(sql_cur.fetchall())

    sql_cur.execute("SELECT IdOrigen, IdProveedor FROM dbo.MigracionProveedores")
    prov_lookup = dict(sql_cur.fetchall())

    # Get UnidadMedida IDs
    sql_cur.execute("SELECT Abreviatura, IdUnidadMedida FROM dbo.UnidadesMedida")
    um_lookup = dict(sql_cur.fetchall())
    id_um_pza = um_lookup.get('PZA', 1)
    id_um_kg = um_lookup.get('KG', 4)

    # Check how many products are already migrated
    sql_cur.execute("SELECT IdOrigen, IdProducto FROM dbo.MigracionProductos")
    already_migrated = dict(sql_cur.fetchall())
    print(f"Productos ya migrados previamente: {len(already_migrated)}")

    # Query current stock from INVENTARIO_BALANCES
    print("Cargando existencias actuales de Eleventa...")
    fb_cur.execute("SELECT PRODUCTO_ID, CANTIDAD_ACTUAL FROM INVENTARIO_BALANCES")
    stock_balances = {}
    for pid, cant in fb_cur.fetchall():
        stock_balances[pid] = cant or 0.0

    # Query all products from Eleventa
    print("Consultando productos de Eleventa...")
    fb_cur.execute("""
        SELECT 
            ID, CODIGO, DESCRIPCION, TVENTA, PCOSTO, PVENTA, MAYOREO,
            DEPT, PROVID, DINVMINIMO, DINVMAXIMO, PORCENTAJE_GANANCIA,
            USA_INVENTARIO, ES_KIT, ELIMINADO_EN
        FROM PRODUCTOS
        ORDER BY ID
    """)
    products = fb_cur.fetchall()
    total_prods = len(products)
    print(f"Total productos a procesar: {total_prods}")

    inserted = 0
    skipped = 0

    for idx, p in enumerate(products, 1):
        (pid, cod, desc, tventa, pcosto, pventa, mayoreo,
         dept, provid, invmin, invmax, ganancia,
         usa_inv, es_kit, elim_en) = p

        if pid in already_migrated:
            skipped += 1
            continue

        codigo_clean = decode_text(cod)
        desc_clean = decode_text(desc) or f'PRODUCTO #{pid}'
        es_fraccionada = 1 if tventa == 'D' else 0
        id_um = id_um_kg if tventa == 'D' else id_um_pza

        # Map Categoria
        id_cat = cat_lookup.get(dept, None)

        # Map Marca from department mapping
        dept_str = str(dept)
        id_marca = None
        if dept_str in dept_map and dept_map[dept_str]['marca_extraida']:
            id_marca = brand_lookup.get(dept_map[dept_str]['marca_extraida'], None)

        # Map Proveedor
        id_prov = prov_lookup.get(provid, None)

        # Numeric conversions
        costo_val = Decimal(str(pcosto or 0.0))
        venta_val = Decimal(str(pventa or 0.0))
        mayoreo_val = Decimal(str(mayoreo or 0.0))
        ganancia_val = Decimal(str(ganancia or 0.0))
        min_val = Decimal(str(invmin or 0.0))
        max_val = Decimal(str(invmax or 0.0))

        maneja_inv = 1 if usa_inv == 't' else 0
        kit_val = 1 if es_kit == 't' else 0
        activo_val = 0 if elim_en is not None else 1

        # Insert into dbo.Productos
        sql_cur.execute("""
            INSERT INTO dbo.Productos 
            (
                CodigoProducto, Descripcion, IdCategoria, IdMarca, IdUnidadMedida,
                IdProveedorPredeterminado, PrecioCosto, PrecioVenta, PrecioMayoreo,
                PorcentajeGanancia, ExistenciaMinima, ExistenciaMaxima,
                PermiteVentaFraccionada, ManejaInventario, EsKit, Activo, FechaBaja
            )
            OUTPUT INSERTED.IdProducto
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            codigo_clean[:50], desc_clean[:250], id_cat, id_marca, id_um,
            id_prov, costo_val, venta_val, mayoreo_val,
            ganancia_val, min_val, max_val,
            es_fraccionada, maneja_inv, kit_val, activo_val, elim_en
        ))
        new_prod_id = sql_cur.fetchone()[0]

        # Insert into dbo.MigracionProductos
        sql_cur.execute("""
            INSERT INTO dbo.MigracionProductos (IdOrigen, CodigoOrigen, IdProducto)
            VALUES (?, ?, ?)
        """, (pid, codigo_clean[:50], new_prod_id))

        # Insert into dbo.CodigosBarras
        sql_cur.execute("""
            INSERT INTO dbo.CodigosBarras (IdProducto, CodigoBarras, EsPrincipal, Activo)
            VALUES (?, ?, 1, ?)
        """, (new_prod_id, codigo_clean[:50], activo_val))

        # Calculate initial stock with business rule
        raw_stock = stock_balances.get(pid, 0.0)
        # Regla confirmada: existencias atípicas (> 10,000) se establecen en 1000
        if raw_stock > 10000.0:
            final_stock = Decimal('1000.0000')
        else:
            final_stock = Decimal(f"{raw_stock:.4f}")

        # Insert into dbo.Inventario
        sql_cur.execute("""
            INSERT INTO dbo.Inventario (IdSucursal, IdProducto, ExistenciaActual)
            VALUES (1, ?, ?)
        """, (new_prod_id, final_stock))

        inserted += 1
        if inserted % 500 == 0:
            sql_conn.commit()
            print(f" -> Procesados {idx}/{total_prods} productos...")

    sql_conn.commit()
    print(f"\n[+] ETAPA 2 COMPLETADA:")
    print(f"    Insertados: {inserted}")
    print(f"    Omitidos (ya existian): {skipped}")
    print(f"    Total en catalogo: {total_prods}")

    # Verify counts in SQL Server
    sql_cur.execute("SELECT COUNT(*) FROM dbo.Productos")
    print(f"Total en dbo.Productos: {sql_cur.fetchone()[0]}")
    sql_cur.execute("SELECT COUNT(*) FROM dbo.CodigosBarras")
    print(f"Total en dbo.CodigosBarras: {sql_cur.fetchone()[0]}")
    sql_cur.execute("SELECT COUNT(*) FROM dbo.Inventario")
    print(f"Total en dbo.Inventario: {sql_cur.fetchone()[0]}")

    fb_conn.close()
    sql_conn.close()

if __name__ == '__main__':
    main()
