import os
import fdb
import pyodbc
from decimal import Decimal
import time

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
    print("ETAPA 5: MIGRACION DE AJUSTES, DEVOLUCIONES Y KARDEX DE INVENTARIO")
    print("==================================================================")
    t0 = time.time()

    fb_conn = get_fb()
    fb_cur = fb_conn.cursor()
    sql_conn = get_sql()
    sql_cur = sql_conn.cursor()

    # Lookups
    print("Cargando equivalencias...")
    sql_cur.execute("SELECT IdOrigen, IdProducto FROM dbo.MigracionProductos")
    prod_lookup = dict(sql_cur.fetchall())

    sql_cur.execute("SELECT IdOrigen, IdUsuario FROM dbo.MigracionUsuarios")
    usr_lookup = dict(sql_cur.fetchall())
    default_usr_id = list(usr_lookup.values())[0] if usr_lookup else 1

    sql_cur.execute("SELECT IdOrigen, IdCaja FROM dbo.MigracionCajas")
    caja_lookup = dict(sql_cur.fetchall())
    default_caja_id = list(caja_lookup.values())[0] if caja_lookup else 1

    sql_cur.execute("SELECT IdOrigen, IdTurnoCaja FROM dbo.MigracionTurnos")
    turno_lookup = dict(sql_cur.fetchall())
    default_turno_id = list(turno_lookup.values())[0] if turno_lookup else 1

    sql_cur.execute("SELECT IdOrigen, IdVenta FROM dbo.MigracionVentas")
    venta_lookup = dict(sql_cur.fetchall())

    # 1. AJUSTES DE INVENTARIO (1,553 registros)
    print("\n1. Migrando Ajustes de Inventario (1,553 registros)...")
    sql_cur.execute("SELECT COUNT(*) FROM dbo.AjustesInventario")
    if sql_cur.fetchone()[0] == 0:
        fb_cur.execute("""
            SELECT ID, FOLIO, CUANDO_FUE, PRODUCTO_ID, CANTIDAD, COSTO_UNITARIO, DESCRIPCION, MOTIVO, USUARIO_ID
            FROM INVENTARIO_AJUSTES
            ORDER BY ID
        """)
        ajustes = fb_cur.fetchall()
        ins_aj = 0

        for aid, fol, cuando, pid, cant, costo, desc, motivo, uid in ajustes:
            p_dest = prod_lookup.get(pid)
            if not p_dest:
                continue

            usr_id = usr_lookup.get(uid, default_usr_id)
            f_aj = cuando or '2023-10-20'
            mot_clean = decode_text(motivo) or 'Ajuste de inventario'
            obs_clean = decode_text(desc)[:500]

            sql_cur.execute("""
                INSERT INTO dbo.AjustesInventario (FolioAjuste, IdSucursal, IdUsuario, FechaAjuste, Motivo, Observaciones)
                OUTPUT INSERTED.IdAjusteInventario
                VALUES (?, 1, ?, ?, ?, ?)
            """, (fol or aid, usr_id, f_aj, mot_clean[:250], obs_clean))
            new_aid = sql_cur.fetchone()[0]

            sql_cur.execute("""
                INSERT INTO dbo.MigracionAjustesInventario (IdOrigen, IdAjusteInventario)
                VALUES (?, ?)
            """, (aid, new_aid))

            cant_val = Decimal(f"{cant or 0:.4f}")
            costo_val = Decimal(str(costo or 0))

            sql_cur.execute("""
                INSERT INTO dbo.DetalleAjustesInventario (IdAjusteInventario, IdProducto, Cantidad, PrecioCosto)
                VALUES (?, ?, ?, ?)
            """, (new_aid, p_dest, cant_val, costo_val))

            ins_aj += 1

        sql_conn.commit()
        print(f" -> Ajustes de inventario insertados: {ins_aj}.")
    else:
        print(" -> Ajustes de inventario ya existian previamente.")

    # 2. DEVOLUCIONES (435 registros)
    print("\n2. Migrando Devoluciones (435 registros)...")
    sql_cur.execute("SELECT COUNT(*) FROM dbo.Devoluciones")
    if sql_cur.fetchone()[0] == 0:
        fb_cur.execute("""
            SELECT ID, TURNO_ID, TICKET_ID, TIPO_DEVOLUCION, DEVUELTO_EN, TOTAL_DEVUELTO
            FROM DEVOLUCIONES
            ORDER BY ID
        """)
        devs = fb_cur.fetchall()
        ins_dev = 0

        dev_mapping = {}

        for did, tid_turno, t_id, tipo, f_dev, tot in devs:
            v_dest = venta_lookup.get(t_id)
            if not v_dest:
                continue

            t_dest = turno_lookup.get(tid_turno, default_turno_id)
            f_dev_val = f_dev or '2023-10-20'
            tot_val = Decimal(str(tot or 0))
            motivo_clean = decode_text(tipo) or 'Devolucion de mostrador'

            sql_cur.execute("""
                INSERT INTO dbo.Devoluciones (IdVenta, IdCaja, IdUsuario, IdTurnoCaja, FechaDevolucion, TotalDevuelto, Motivo)
                OUTPUT INSERTED.IdDevolucion
                VALUES (?, 1, ?, ?, ?, ?, ?)
            """, (v_dest, default_usr_id, t_dest, f_dev_val, tot_val, motivo_clean[:250]))
            new_did = sql_cur.fetchone()[0]
            dev_mapping[did] = new_did
            ins_dev += 1

        sql_conn.commit()
        print(f" -> Devoluciones insertadas: {ins_dev}.")

        # Detalle de Devoluciones
        print("Migrando partidas de DetalleDevoluciones...")
        fb_cur.execute("""
            SELECT DEVOLUCION_ID, CODIGO_PRODUCTO, CANTIDAD_DEVUELTA, DINERO_DEVUELTO
            FROM DEVOLUCIONES_ARTICULOS
            ORDER BY ID
        """)
        det_devs = fb_cur.fetchall()
        ins_det_dev = 0

        for did, cod, cant, din in det_devs:
            id_dev_dest = dev_mapping.get(did)
            if not id_dev_dest:
                continue

            cod_clean = decode_text(cod)
            sql_cur.execute("SELECT IdProducto FROM dbo.Productos WHERE CodigoProducto = ?", (cod_clean,))
            p_row = sql_cur.fetchone()
            p_id = p_row[0] if p_row else None

            cant_val = Decimal(f"{cant or 1:.4f}")
            tot_val = Decimal(str(din or 0))
            p_unit = tot_val / cant_val if cant_val > 0 else tot_val

            sql_cur.execute("""
                INSERT INTO dbo.DetalleDevoluciones (IdDevolucion, IdDetalleVenta, IdProducto, Cantidad, PrecioUnitario, TotalDevuelto)
                VALUES (?, NULL, ?, ?, ?, ?)
            """, (id_dev_dest, p_id, cant_val, p_unit, tot_val))
            ins_det_dev += 1

        sql_conn.commit()
        print(f" -> Renglones de devoluciones insertados: {ins_det_dev}.")
    else:
        print(" -> Devoluciones ya existian previamente.")

    # 3. KARDEX HISTORICO DE INVENTARIO (486,950 registros)
    print("\n3. Migrando Kardex de Inventario (INVENTARIO_HISTORIAL, 486,950 registros)...")
    sql_cur.execute("SELECT COUNT(*) FROM dbo.MovimientosInventario")
    movs_existentes = sql_cur.fetchone()[0]

    if movs_existentes == 0:
        sql_cur.execute("""
            IF OBJECT_ID('dbo.StagingHistorial', 'U') IS NOT NULL DROP TABLE dbo.StagingHistorial;
            CREATE TABLE dbo.StagingHistorial (
                ProductoIdOrigen INT NOT NULL,
                FechaMovimiento DATETIME2 NOT NULL,
                CantidadAnterior DECIMAL(18,4) NOT NULL,
                CantidadMovimiento DECIMAL(18,4) NOT NULL,
                CantidadNueva DECIMAL(18,4) NOT NULL,
                PrecioCosto DECIMAL(18,2) NOT NULL,
                ReferenciaModulo VARCHAR(50) NULL,
                IdReferenciaOrigen INT NULL,
                Motivo NVARCHAR(250) NULL,
                UsuarioIdOrigen INT NULL
            );
        """)
        sql_conn.commit()

        print("Extrayendo kardex desde Eleventa...")
        fb_cur.execute("""
            SELECT 
                PRODUCTO_ID, CUANDO_FUE, CANTIDAD_ANTERIOR, CANTIDAD,
                COSTO_UNITARIO, DESCRIPCION, AJUSTE_ID, RECIBO_INVENTARIO_ID,
                VENTA_ID, USUARIO_ID
            FROM INVENTARIO_HISTORIAL
            ORDER BY ID
        """)

        chunk_size = 25000
        staging_hist = []
        total_hist = 0

        insert_staging_sql = """
            INSERT INTO dbo.StagingHistorial
            (
                ProductoIdOrigen, FechaMovimiento, CantidadAnterior, CantidadMovimiento,
                CantidadNueva, PrecioCosto, ReferenciaModulo, IdReferenciaOrigen,
                Motivo, UsuarioIdOrigen
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """
        sql_cur.fast_executemany = True

        while True:
            fb_rows = fb_cur.fetchmany(chunk_size)
            if not fb_rows:
                break

            for r in fb_rows:
                (pid, cuando, cant_ant, cant, costo, desc, aj_id, rec_id, v_id, uid) = r

                f_mov = cuando or '2023-10-20'
                c_ant_raw = float(cant_ant or 0)
                c_mov_raw = float(cant or 0)

                # Regla de existencias atípicas: si c_ant > 10,000 normalizar a 1000
                c_ant = 1000.0 if c_ant_raw > 10000.0 else c_ant_raw
                c_mov = 1000.0 if c_mov_raw > 10000.0 else c_mov_raw
                c_nueva = c_ant + c_mov

                costo_val = round(float(costo or 0), 2)
                mot_clean = decode_text(desc)[:250] or 'Movimiento de kardex'

                if rec_id is not None:
                    ref_mod = 'COMPRA'
                    ref_id = rec_id
                elif v_id is not None:
                    ref_mod = 'VENTA'
                    ref_id = v_id
                elif aj_id is not None:
                    ref_mod = 'AJUSTE'
                    ref_id = aj_id
                else:
                    ref_mod = 'INICIAL' if 'inicial' in mot_clean.lower() else 'AJUSTE'
                    ref_id = None

                staging_hist.append((
                    pid, f_mov, round(c_ant, 4), round(c_mov, 4),
                    round(c_nueva, 4), costo_val, ref_mod, ref_id,
                    mot_clean, uid
                ))

            sql_cur.executemany(insert_staging_sql, staging_hist)
            sql_conn.commit()
            total_hist += len(staging_hist)
            print(f" -> Cargados {total_hist} movimientos de kardex en staging...")
            staging_hist.clear()

        # Create Index on Staging
        print("Indexando staging de historial...")
        sql_cur.execute("CREATE INDEX IX_StagingHist_Prod ON dbo.StagingHistorial(ProductoIdOrigen);")
        sql_conn.commit()

        print("Insertando movimientos en dbo.MovimientosInventario...")
        sql_cur.execute("""
            INSERT INTO dbo.MovimientosInventario
            (
                IdSucursal, IdProducto, IdTipoMovimiento, CantidadAnterior,
                CantidadMovimiento, CantidadNueva, PrecioCosto, ReferenciaModulo,
                IdReferencia, Motivo, IdUsuario, FechaMovimiento
            )
            SELECT 
                1,
                mp.IdProducto,
                CASE 
                    WHEN s.ReferenciaModulo = 'COMPRA' THEN 1
                    WHEN s.ReferenciaModulo = 'VENTA' THEN 2
                    WHEN s.ReferenciaModulo = 'INICIAL' THEN 7
                    WHEN s.CantidadMovimiento >= 0 THEN 5
                    ELSE 6
                END,
                s.CantidadAnterior,
                s.CantidadMovimiento,
                s.CantidadNueva,
                s.PrecioCosto,
                s.ReferenciaModulo,
                CASE 
                    WHEN s.ReferenciaModulo = 'VENTA' THEN mv.IdVenta
                    WHEN s.ReferenciaModulo = 'COMPRA' THEN mc.IdCompra
                    WHEN s.ReferenciaModulo = 'AJUSTE' THEN ma.IdAjusteInventario
                    ELSE NULL
                END,
                s.Motivo,
                COALESCE(mu.IdUsuario, 1),
                s.FechaMovimiento
            FROM dbo.StagingHistorial s
            JOIN dbo.MigracionProductos mp ON s.ProductoIdOrigen = mp.IdOrigen
            LEFT JOIN dbo.MigracionVentas mv ON s.ReferenciaModulo = 'VENTA' AND s.IdReferenciaOrigen = mv.IdOrigen
            LEFT JOIN dbo.MigracionCompras mc ON s.ReferenciaModulo = 'COMPRA' AND s.IdReferenciaOrigen = mc.IdOrigen
            LEFT JOIN dbo.MigracionAjustesInventario ma ON s.ReferenciaModulo = 'AJUSTE' AND s.IdReferenciaOrigen = ma.IdOrigen
            LEFT JOIN dbo.MigracionUsuarios mu ON s.UsuarioIdOrigen = mu.IdOrigen;
        """)
        sql_conn.commit()
        print(" -> MovimientosInventario migrado exitosamente!")

        # Drop StagingHistorial
        sql_cur.execute("DROP TABLE dbo.StagingHistorial;")
        sql_conn.commit()
    else:
        print(f" -> MovimientosInventario ya contenia {movs_existentes} registros.")

    fb_conn.close()
    sql_conn.close()

    t_total = time.time() - t0
    print(f"\n[+] ETAPA 5 COMPLETADA CON EXITO EN {t_total:.2f} SEGUNDOS!")

if __name__ == '__main__':
    main()
