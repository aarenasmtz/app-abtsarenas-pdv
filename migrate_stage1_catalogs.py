import os
import fdb
import pyodbc
import json

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
    print("ETAPA 1: MIGRACION DE CATALOGOS, SUCURSAL, USUARIOS Y TERCEROS")
    print("==================================================================")

    fb_conn = get_fb()
    fb_cur = fb_conn.cursor()
    sql_conn = get_sql()
    sql_cur = sql_conn.cursor()

    # 1. SUCURSAL PRINCIPAL
    print("\n1. Verificando Sucursal...")
    sql_cur.execute("SELECT COUNT(*) FROM dbo.Sucursales")
    if sql_cur.fetchone()[0] == 0:
        sql_cur.execute("""
            INSERT INTO dbo.Sucursales (Nombre, Direccion, Telefono, EsPrincipal, Activo)
            VALUES ('Abarrotes Arenas - Matriz', 'Matriz', '', 1, 1)
        """)
        sql_conn.commit()
        print(" -> Sucursal principal registrada con exito.")
    else:
        print(" -> Sucursal ya registrada.")

    # 2. UNIDADES DE MEDIDA
    print("\n2. Migrando Unidades de Medida...")
    unidades_base = [
        ('Pieza', 'PZA', 0, 1.0),
        ('No Aplica', 'NA', 0, 1.0),
        ('Metro', 'M', 1, 100.0),
        ('Kilogramo', 'KG', 1, 1000.0),
        ('Litro', 'L', 1, 1000.0),
        ('Hora', 'H', 0, 60.0)
    ]
    for nom, abrev, perm_dec, fact in unidades_base:
        sql_cur.execute("SELECT COUNT(*) FROM dbo.UnidadesMedida WHERE Abreviatura = ?", (abrev,))
        if sql_cur.fetchone()[0] == 0:
            sql_cur.execute("""
                INSERT INTO dbo.UnidadesMedida (Nombre, Abreviatura, PermiteDecimales, FactorConversion, Activo)
                VALUES (?, ?, ?, ?, 1)
            """, (nom, abrev, perm_dec, fact))
    sql_conn.commit()
    print(" -> Unidades de medida verificadas/insertadas.")

    # 3. METODOS DE PAGO
    print("\n3. Migrando Metodos de Pago...")
    metodos = [
        ('EFECTIVO', 'Efectivo', 0),
        ('TARJETA', 'Tarjeta Debito/Credito (Clip / Terminal Bancaria)', 1),
        ('VALES', 'Vales de Despensa', 1),
        ('CREDITO', 'Credito en Tienda', 0),
        ('TRANSFERENCIA', 'Transferencia Electronica', 1)
    ]
    for cod, desc, req_ref in metodos:
        sql_cur.execute("SELECT COUNT(*) FROM dbo.MetodosPago WHERE CodigoMetodo = ?", (cod,))
        if sql_cur.fetchone()[0] == 0:
            sql_cur.execute("""
                INSERT INTO dbo.MetodosPago (CodigoMetodo, Descripcion, RequiereReferencia, Activo)
                VALUES (?, ?, ?, 1)
            """, (cod, desc, req_ref))
    sql_conn.commit()
    print(" -> Metodos de pago verificados/insertados.")

    # 4. TIPOS DE MOVIMIENTO DE INVENTARIO
    print("\n4. Migrando Tipos de Movimiento de Inventario...")
    tipos_mov = [
        ('ENTRADA_COMPRA', 'Entrada por Compra / Recepcion', 1),
        ('VENTA', 'Salida por Venta en Mostrador', -1),
        ('DEVOLUCION_VENTA', 'Entrada por Devolucion de Venta', 1),
        ('DEVOLUCION_COMPRA', 'Salida por Devolucion a Proveedor', -1),
        ('AJUSTE_ENTRADA', 'Entrada por Ajuste de Inventario', 1),
        ('AJUSTE_SALIDA', 'Salida por Ajuste / Merma', -1),
        ('INVENTARIO_INICIAL', 'Carga Inicial de Inventario', 1),
        ('CANCELACION_VENTA', 'Entrada por Cancelacion de Ticket', 1)
    ]
    for cod, desc, ef in tipos_mov:
        sql_cur.execute("SELECT COUNT(*) FROM dbo.TiposMovimientoInventario WHERE CodigoTipo = ?", (cod,))
        if sql_cur.fetchone()[0] == 0:
            sql_cur.execute("""
                INSERT INTO dbo.TiposMovimientoInventario (CodigoTipo, Descripcion, EfectoStock, Activo)
                VALUES (?, ?, ?, 1)
            """, (cod, desc, ef))
    sql_conn.commit()
    print(" -> Tipos de movimiento verificados/insertados.")

    # 5. CATEGORIAS Y MARCAS (DESDE MAPEO)
    print("\n5. Migrando Categorias y Marcas (Desacopladas)...")
    with open('mapeo_departamentos.json', 'r', encoding='utf-8') as f:
        dept_map = json.load(f)

    # Insert distinct categories
    cats_set = sorted(list(set(v['categoria_normalizada'] for v in dept_map.values())))
    for cat_name in cats_set:
        sql_cur.execute("SELECT COUNT(*) FROM dbo.Categorias WHERE Descripcion = ?", (cat_name,))
        if sql_cur.fetchone()[0] == 0:
            sql_cur.execute("INSERT INTO dbo.Categorias (Descripcion, Activo) VALUES (?, 1)", (cat_name,))
    sql_conn.commit()

    # Insert distinct brands
    brands_set = sorted(list(set(v['marca_extraida'] for v in dept_map.values() if v['marca_extraida'])))
    for brand_name in brands_set:
        sql_cur.execute("SELECT COUNT(*) FROM dbo.Marcas WHERE Descripcion = ?", (brand_name,))
        if sql_cur.fetchone()[0] == 0:
            sql_cur.execute("INSERT INTO dbo.Marcas (Descripcion, Activo) VALUES (?, 1)", (brand_name,))
    sql_conn.commit()

    # Map each department from Eleventa into MigracionCategorias
    for d_id_str, info in dept_map.items():
        d_id = int(d_id_str)
        cat_norm = info['categoria_normalizada']
        sql_cur.execute("SELECT IdCategoria FROM dbo.Categorias WHERE Descripcion = ?", (cat_norm,))
        id_cat_destino = sql_cur.fetchone()[0]

        sql_cur.execute("SELECT COUNT(*) FROM dbo.MigracionCategorias WHERE IdOrigen = ?", (d_id,))
        if sql_cur.fetchone()[0] == 0:
            sql_cur.execute("""
                INSERT INTO dbo.MigracionCategorias (IdOrigen, NombreOrigen, IdCategoria)
                VALUES (?, ?, ?)
            """, (d_id, info['nombre_origen'][:150], id_cat_destino))
    sql_conn.commit()
    print(f" -> {len(cats_set)} Categorias y {len(brands_set)} Marcas migradas y mapeadas con exito.")

    # 6. PROVEEDORES
    print("\n6. Migrando Proveedores...")
    fb_cur.execute("SELECT ID, NOMBRE, REPRESENTANTE, TELEFONOS, CORREOS, NOTAS, BORRADO_EN FROM PROVEEDORES")
    prov_rows = fb_cur.fetchall()
    for pid, nom, rep, tel, mail, nots, borrado in prov_rows:
        sql_cur.execute("SELECT COUNT(*) FROM dbo.MigracionProveedores WHERE IdOrigen = ?", (pid,))
        if sql_cur.fetchone()[0] == 0:
            nom_clean = decode_text(nom) or 'PROVEEDOR SIN NOMBRE'
            rep_clean = decode_text(rep)
            tel_clean = decode_text(tel)
            mail_clean = decode_text(mail)
            not_clean = decode_text(nots)
            activo = 0 if borrado is not None else 1

            sql_cur.execute("""
                INSERT INTO dbo.Proveedores (Nombre, NombreContacto, Telefono, Correo, Notas, Activo)
                OUTPUT INSERTED.IdProveedor
                VALUES (?, ?, ?, ?, ?, ?)
            """, (nom_clean[:150], rep_clean[:150], tel_clean[:50], mail_clean[:100], not_clean[:500], activo))
            new_prov_id = sql_cur.fetchone()[0]

            sql_cur.execute("""
                INSERT INTO dbo.MigracionProveedores (IdOrigen, IdProveedor)
                VALUES (?, ?)
            """, (pid, new_prov_id))
    sql_conn.commit()
    print(f" -> {len(prov_rows)} Proveedores migrados y mapeados.")

    # 7. USUARIOS
    print("\n7. Migrando Usuarios...")
    fb_cur.execute("SELECT ID, NOMBRE_COMPLETO, USUARIO, CLAVE, CORREO, TELEFONO, ELIMINADO_EN FROM USUARIOS")
    usr_rows = fb_cur.fetchall()
    for uid, nom, usr, clave, mail, tel, elim in usr_rows:
        sql_cur.execute("SELECT COUNT(*) FROM dbo.MigracionUsuarios WHERE IdOrigen = ?", (uid,))
        if sql_cur.fetchone()[0] == 0:
            nom_clean = decode_text(nom) or 'Usuario'
            usr_clean = decode_text(usr) or f'user_{uid}'
            mail_clean = decode_text(mail)
            tel_clean = decode_text(tel)
            activo = 0 if elim is not None else 1
            es_admin = 1 if 'admin' in usr_clean.lower() or uid == 5 else 0
            clave_plana = decode_text(clave)
            # We preserve the legacy plain key with a prefix or placeholder hash until updated
            clave_hash = f"LEGACY_HASH:{clave_plana}"

            sql_cur.execute("""
                INSERT INTO dbo.Usuarios (NombreCompleto, NombreUsuario, ClaveHash, Correo, Telefono, EsAdministrador, Activo)
                OUTPUT INSERTED.IdUsuario
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (nom_clean[:150], usr_clean[:50], clave_hash[:255], mail_clean[:100], tel_clean[:20], es_admin, activo))
            new_usr_id = sql_cur.fetchone()[0]

            sql_cur.execute("""
                INSERT INTO dbo.MigracionUsuarios (IdOrigen, IdUsuario)
                VALUES (?, ?)
            """, (uid, new_usr_id))
    sql_conn.commit()
    print(f" -> {len(usr_rows)} Usuarios migrados y mapeados.")

    # 8. CAJAS
    print("\n8. Migrando Cajas...")
    fb_cur.execute("SELECT ID, NOMBRE, NOMBRE_PC, ULTIMA_IP, ELIMINADA_EN FROM CAJAS")
    caja_rows = fb_cur.fetchall()
    for cid, nom, pc, ip, elim in caja_rows:
        sql_cur.execute("SELECT COUNT(*) FROM dbo.MigracionCajas WHERE IdOrigen = ?", (cid,))
        if sql_cur.fetchone()[0] == 0:
            nom_clean = decode_text(nom) or 'Caja Principal'
            pc_clean = decode_text(pc)
            ip_clean = decode_text(ip)
            activo = 0 if elim is not None else 1

            sql_cur.execute("""
                INSERT INTO dbo.Cajas (IdSucursal, Nombre, EsPrincipal, NombreEquipo, DireccionIp, Activo)
                OUTPUT INSERTED.IdCaja
                VALUES (1, ?, 1, ?, ?, ?)
            """, (nom_clean[:100], pc_clean[:100], ip_clean[:50], activo))
            new_caja_id = sql_cur.fetchone()[0]

            sql_cur.execute("""
                INSERT INTO dbo.MigracionCajas (IdOrigen, IdCaja)
                VALUES (?, ?)
            """, (cid, new_caja_id))
    sql_conn.commit()
    print(f" -> {len(caja_rows)} Cajas migradas y mapeadas.")

    # 9. CLIENTES
    print("\n9. Migrando Clientes...")
    fb_cur.execute("""
        SELECT ID, FOLIO, NOMBRES, APELLIDOS, EMAIL, TELEFONO, DOMICILIO1, COLONIA, CODIGO_POSTAL, TOTAL_VENTAS, ACTIVO, DE_SISTEMA 
        FROM CLIENTESV2
    """)
    cli_rows = fb_cur.fetchall()
    for cid, fol, noms, apes, mail, tel, dom, col, cp, tot_v, act, de_sis in cli_rows:
        sql_cur.execute("SELECT COUNT(*) FROM dbo.MigracionClientes WHERE IdOrigen = ?", (cid,))
        if sql_cur.fetchone()[0] == 0:
            nom_clean = decode_text(noms)
            ape_clean = decode_text(apes)
            mail_clean = decode_text(mail)
            tel_clean = decode_text(tel)
            dom_clean = decode_text(dom)
            col_clean = decode_text(col)
            cp_clean = decode_text(cp)
            es_sistema = 1 if de_sis == 1 or cid in (1, 2) else 0
            activo = 1 if act in (1, '1', True) else 0

            sql_cur.execute("""
                INSERT INTO dbo.Clientes (NumeroCliente, Nombre, Apellidos, Telefono, Correo, Direccion, Colonia, CodigoPostal, EsSistema, Activo)
                OUTPUT INSERTED.IdCliente
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (fol, nom_clean[:100], ape_clean[:100], tel_clean[:20], mail_clean[:100], dom_clean[:250], col_clean[:100], cp_clean[:10], es_sistema, activo))
            new_cli_id = sql_cur.fetchone()[0]

            sql_cur.execute("""
                INSERT INTO dbo.MigracionClientes (IdOrigen, IdCliente)
                VALUES (?, ?)
            """, (cid, new_cli_id))
    sql_conn.commit()
    print(f" -> {len(cli_rows)} Clientes migrados y mapeados.")

    fb_conn.close()
    sql_conn.close()
    print("\n[+] ETAPA 1 COMPLETADA CON EXITO!")

if __name__ == '__main__':
    main()
