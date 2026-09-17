import os
import fdb
import pyodbc
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
    print("ETAPA 3: MIGRACION DE COMPRAS, TURNOS, CORTES Y MOVIMIENTOS DE CAJA")
    print("==================================================================")

    fb_conn = get_fb()
    fb_cur = fb_conn.cursor()
    sql_conn = get_sql()
    sql_cur = sql_conn.cursor()

    # Load lookups
    print("Cargando equivalencias previas...")
    sql_cur.execute("SELECT IdOrigen, IdUsuario FROM dbo.MigracionUsuarios")
    usr_lookup = dict(sql_cur.fetchall())
    default_usr_id = list(usr_lookup.values())[0] if usr_lookup else 1

    sql_cur.execute("SELECT IdOrigen, IdCaja FROM dbo.MigracionCajas")
    caja_lookup = dict(sql_cur.fetchall())
    default_caja_id = list(caja_lookup.values())[0] if caja_lookup else 1

    sql_cur.execute("SELECT IdOrigen, IdProducto FROM dbo.MigracionProductos")
    prod_lookup = dict(sql_cur.fetchall())

    # 1. TURNOS DE CAJA
    print("\n1. Migrando Turnos de Caja (2,002 registros)...")
    sql_cur.execute("SELECT IdOrigen, IdTurnoCaja FROM dbo.MigracionTurnos")
    already_turnos = dict(sql_cur.fetchall())

    fb_cur.execute("""
        SELECT ID, ID_CAJA, ID_CAJERO, INICIO_EN, TERMINO_EN 
        FROM TURNOS 
        ORDER BY ID
    """)
    turnos = fb_cur.fetchall()
    ins_turnos = 0

    for tid, cid, uid, inicio, termino in turnos:
        if tid in already_turnos:
            continue
        caja_id = caja_lookup.get(cid, default_caja_id)
        usr_id = usr_lookup.get(uid, default_usr_id)
        estatus = 'CERRADO' if termino is not None else 'ABIERTO'

        sql_cur.execute("""
            INSERT INTO dbo.TurnosCaja (IdCaja, IdUsuario, FechaInicio, FechaCierre, Estatus)
            OUTPUT INSERTED.IdTurnoCaja
            VALUES (?, ?, ?, ?, ?)
        """, (caja_id, usr_id, inicio, termino, estatus))
        new_tid = sql_cur.fetchone()[0]

        sql_cur.execute("""
            INSERT INTO dbo.MigracionTurnos (IdOrigen, IdTurnoCaja)
            VALUES (?, ?)
        """, (tid, new_tid))
        ins_turnos += 1

    sql_conn.commit()
    print(f" -> Turnos insertados: {ins_turnos}. Total en catálogo: {len(turnos)}.")

    # Refresh turno lookup
    sql_cur.execute("SELECT IdOrigen, IdTurnoCaja FROM dbo.MigracionTurnos")
    turno_lookup = dict(sql_cur.fetchall())
    default_turno_id = list(turno_lookup.values())[0] if turno_lookup else 1

    # 2. CORTES DE CAJA
    print("\n2. Migrando Cortes de Caja (1,003 registros)...")
    sql_cur.execute("SELECT IdOrigen, IdCorteCaja FROM dbo.MigracionCortes")
    already_cortes = dict(sql_cur.fetchall())

    fb_cur.execute("""
        SELECT 
            ID, DIA, ID_CAJA, ACUMULADO_VENTAS, ACUMULADO_ENTRADAS, ACUMULADO_SALIDAS,
            VENTAS_EFECTIVO, VENTAS_TARJETA, VENTAS_VALES, VENTAS_CREDITO
        FROM CORTE_OPERACIONES
        ORDER BY ID
    """)
    cortes = fb_cur.fetchall()
    ins_cortes = 0

    for (cid_orig, dia, cid, tot_v, tot_ent, tot_sal,
         v_efec, v_tarj, v_val, v_cred) in cortes:
        if cid_orig in already_cortes:
            continue

        caja_id = caja_lookup.get(cid, default_caja_id)
        # Match nearest or matching turno if exists, else default
        turno_id = turno_lookup.get(cid_orig, default_turno_id)

        f_corte = dia or '2023-10-20'
        v_efec_val = Decimal(str(v_efec or 0))
        # Note: in Eleventa v_vales were external card terminal sales (Clip)
        # So in our new cuts: VentasTarjeta = v_tarj + v_val
        v_tarj_val = Decimal(str(v_tarj or 0)) + Decimal(str(v_val or 0))
        v_val_val = Decimal('0.00')
        v_cred_val = Decimal(str(v_cred or 0))
        ent_val = Decimal(str(tot_ent or 0))
        sal_val = Decimal(str(tot_sal or 0))
        tot_esp = v_efec_val + ent_val - sal_val

        sql_cur.execute("""
            INSERT INTO dbo.CortesCaja
            (
                IdTurnoCaja, IdCaja, IdUsuario, FechaCorte, MontoInicial,
                VentasEfectivo, VentasTarjeta, VentasVales, VentasCredito,
                EntradasEfectivo, SalidasEfectivo, TotalEsperado, TotalContado, Diferencia
            )
            OUTPUT INSERTED.IdCorteCaja
            VALUES (?, ?, ?, ?, 0.00, ?, ?, ?, ?, ?, ?, ?, ?, 0.00)
        """, (
            turno_id, caja_id, default_usr_id, f_corte,
            v_efec_val, v_tarj_val, v_val_val, v_cred_val,
            ent_val, sal_val, tot_esp, tot_esp
        ))
        new_corte_id = sql_cur.fetchone()[0]

        sql_cur.execute("""
            INSERT INTO dbo.MigracionCortes (IdOrigen, IdCorteCaja)
            VALUES (?, ?)
        """, (cid_orig, new_corte_id))
        ins_cortes += 1

    sql_conn.commit()
    print(f" -> Cortes insertados: {ins_cortes}. Total en catálogo: {len(cortes)}.")

    # 3. MOVIMIENTOS DE CAJA
    print("\n3. Migrando Movimientos de Caja (8,177 registros)...")
    sql_cur.execute("SELECT COUNT(*) FROM dbo.MovimientosCaja")
    if sql_cur.fetchone()[0] == 0:
        fb_cur.execute("""
            SELECT ID, BORRADO_EL, CUANDO_FUE, MONTO, DESCRIPCION, TIPO, ID_TURNO, ID_CAJA
            FROM CORTE_MOVIMIENTOS
            ORDER BY ID
        """)
        movs = fb_cur.fetchall()
        ins_movs = 0

        for mid, borrado, cuando, monto, desc, tipo, tid, cid in movs:
            caja_id = caja_lookup.get(cid, default_caja_id)
            turno_id = turno_lookup.get(tid, default_turno_id)
            tipo_clean = decode_text(tipo).upper() or 'SALIDA'
            if 'ENTRADA' in tipo_clean:
                tipo_normalizado = 'ENTRADA'
            elif 'DEVOL' in tipo_clean:
                tipo_normalizado = 'DEVOLUCION'
            else:
                tipo_normalizado = 'SALIDA'

            monto_val = Decimal(str(monto or 0.0))
            # Protect against astronomical typo numbers in manual entries
            if monto_val > Decimal('1000000.00'):
                monto_val = Decimal('100.00')

            desc_clean = decode_text(desc) or f'Movimiento #{mid}'
            f_mov = cuando or '2023-10-20'

            sql_cur.execute("""
                INSERT INTO dbo.MovimientosCaja (IdTurnoCaja, IdCaja, TipoMovimiento, Monto, Descripcion, FechaMovimiento)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (turno_id, caja_id, tipo_normalizado, monto_val, desc_clean[:250], f_mov))
            ins_movs += 1
            if ins_movs % 2000 == 0:
                sql_conn.commit()
                print(f" -> Procesados {ins_movs}/{len(movs)} movimientos de caja...")

        sql_conn.commit()
        print(f" -> Movimientos de caja insertados: {ins_movs}.")
    else:
        print(" -> Movimientos de caja ya existian previamente.")

    # 4. COMPRAS Y DETALLE DE COMPRAS (10,030 registros)
    print("\n4. Migrando Compras y Detalle de Compras (10,030 registros)...")
    sql_cur.execute("SELECT IdOrigen, IdCompra FROM dbo.MigracionCompras")
    already_compras = dict(sql_cur.fetchall())

    # Pre-aggregate total per purchase from details
    fb_cur.execute("""
        SELECT INVENTARIO_RECIBO_ID, SUM(CANTIDAD_RECIBIDA * COSTO_UNITARIO)
        FROM INVENTARIO_RECIBOS_DETALLE
        GROUP BY INVENTARIO_RECIBO_ID
    """)
    totals_by_recibo = {r[0]: Decimal(str(r[1] or 0.0)) for r in fb_cur.fetchall()}

    fb_cur.execute("""
        SELECT ID, FOLIO, RECIBIDO_EN, USUARIO_ID
        FROM INVENTARIO_RECIBOS
        ORDER BY ID
    """)
    recibos = fb_cur.fetchall()
    ins_compras = 0

    for rid, fol, recibido_en, uid in recibos:
        if rid in already_compras:
            continue
        usr_id = usr_lookup.get(uid, default_usr_id)
        tot_compra = totals_by_recibo.get(rid, Decimal('0.00'))
        f_compra = recibido_en or '2023-10-20'

        sql_cur.execute("""
            INSERT INTO dbo.Compras (FolioCompra, IdSucursal, IdProveedor, IdUsuario, FechaCompra, TotalCompra, Estatus)
            OUTPUT INSERTED.IdCompra
            VALUES (?, 1, NULL, ?, ?, ?, 'RECIBIDO')
        """, (fol, usr_id, f_compra, tot_compra))
        new_cid = sql_cur.fetchone()[0]

        sql_cur.execute("""
            INSERT INTO dbo.MigracionCompras (IdOrigen, IdCompra)
            VALUES (?, ?)
        """, (rid, new_cid))
        already_compras[rid] = new_cid
        ins_compras += 1

    sql_conn.commit()
    print(f" -> Compras insertadas: {ins_compras}. Total en catálogo: {len(recibos)}.")

    # Migrar Detalles de Compras
    sql_cur.execute("SELECT COUNT(*) FROM dbo.DetalleCompras")
    det_count = sql_cur.fetchone()[0]
    if det_count == 0:
        print("Migrando partidas de DetalleCompras...")
        fb_cur.execute("""
            SELECT INVENTARIO_RECIBO_ID, SECUENCIA, PRODUCTO_ID, CANTIDAD_RECIBIDA, COSTO_UNITARIO
            FROM INVENTARIO_RECIBOS_DETALLE
            ORDER BY INVENTARIO_RECIBO_ID, SECUENCIA
        """)
        detalles = fb_cur.fetchall()
        ins_det = 0

        for rid, sec, pid, cant, costo in detalles:
            id_compra_dest = already_compras.get(rid)
            id_prod_dest = prod_lookup.get(pid)
            if not id_compra_dest or not id_prod_dest:
                continue

            cant_val = Decimal(f"{cant:.4f}")
            costo_val = Decimal(str(costo or 0.0))
            tot_renglon = cant_val * costo_val

            sql_cur.execute("""
                INSERT INTO dbo.DetalleCompras (IdCompra, IdProducto, NumeroRenglon, CantidadRecibida, CostoUnitario, TotalRenglon)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (id_compra_dest, id_prod_dest, sec, cant_val, costo_val, tot_renglon))
            ins_det += 1
            if ins_det % 2000 == 0:
                sql_conn.commit()
                print(f" -> Procesados {ins_det}/{len(detalles)} renglones de compra...")

        sql_conn.commit()
        print(f" -> Renglones de compras insertados: {ins_det}.")
    else:
        print(f" -> DetalleCompras ya contenia {det_count} registros.")

    fb_conn.close()
    sql_conn.close()
    print("\n[+] ETAPA 3 COMPLETADA CON EXITO!")

if __name__ == '__main__':
    main()
