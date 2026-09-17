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
    print("ETAPA 4: MIGRACION OPTIMIZADA DE VENTAS, DETALLES Y PAGOS")
    print("==================================================================")
    t0 = time.time()

    fb_conn = get_fb()
    fb_cur = fb_conn.cursor()
    sql_conn = get_sql()
    sql_cur = sql_conn.cursor()

    # Lookups
    print("Cargando equivalencias previas...")
    sql_cur.execute("SELECT IdOrigen, IdUsuario FROM dbo.MigracionUsuarios")
    usr_lookup = dict(sql_cur.fetchall())
    default_usr_id = list(usr_lookup.values())[0] if usr_lookup else 1

    sql_cur.execute("SELECT IdOrigen, IdCaja FROM dbo.MigracionCajas")
    caja_lookup = dict(sql_cur.fetchall())
    default_caja_id = list(caja_lookup.values())[0] if caja_lookup else 1

    sql_cur.execute("SELECT IdOrigen, IdTurnoCaja FROM dbo.MigracionTurnos")
    turno_lookup = dict(sql_cur.fetchall())
    default_turno_id = list(turno_lookup.values())[0] if turno_lookup else 1

    sql_cur.execute("SELECT IdOrigen, IdCliente FROM dbo.MigracionClientes")
    cli_lookup = dict(sql_cur.fetchall())
    default_cli_id = list(cli_lookup.values())[0] if cli_lookup else 1

    # 1. MIGRACION DE TICKETS (VENTAS)
    print("\n--- PASO 1: Procesando VENTATICKETS (238,424 tickets) ---")
    sql_cur.execute("SELECT COUNT(*) FROM dbo.Ventas")
    ventas_existentes = sql_cur.fetchone()[0]

    if ventas_existentes == 0:
        # Create StagingVentas
        sql_cur.execute("""
            IF OBJECT_ID('dbo.StagingVentas', 'U') IS NOT NULL DROP TABLE dbo.StagingVentas;
            CREATE TABLE dbo.StagingVentas (
                IdOrigen INT NOT NULL,
                FolioVenta INT NOT NULL,
                IdSucursal INT NOT NULL,
                IdCaja INT NOT NULL,
                IdTurnoCaja INT NULL,
                IdUsuario INT NOT NULL,
                IdCliente INT NOT NULL,
                FechaVenta DATETIME2 NOT NULL,
                Subtotal DECIMAL(18,2) NOT NULL,
                Descuento DECIMAL(18,2) NOT NULL,
                Impuesto DECIMAL(18,2) NOT NULL,
                Total DECIMAL(18,2) NOT NULL,
                Ganancia DECIMAL(18,2) NOT NULL,
                ImporteRecibido DECIMAL(18,2) NOT NULL,
                Cambio DECIMAL(18,2) NOT NULL,
                NumeroArticulos DECIMAL(18,4) NOT NULL,
                Estatus VARCHAR(20) NOT NULL,
                EsCancelada BIT NOT NULL,
                Notas NVARCHAR(250) NULL,
                FormaPago VARCHAR(20) NOT NULL,
                Referencia VARCHAR(100) NULL
            );
        """)
        sql_conn.commit()

        print("Extrayendo tickets desde Eleventa...")
        fb_cur.execute("""
            SELECT 
                ID, FOLIO, CAJA_ID, TURNO_ID, CAJERO_ID, CLIENTESV2_ID,
                COALESCE(VENDIDO_EN, CREADO_EN), SUBTOTAL, TOTAL_AHORRADO,
                IMPUESTOS, TOTAL, GANANCIA, PAGO_CON, NUMERO_ARTICULOS,
                ESTA_CANCELADO, FORMA_PAGO, REFERENCIA, NOTAS
            FROM VENTATICKETS
            ORDER BY ID
        """)

        chunk_size = 20000
        staging_rows = []
        total_tickets = 0

        insert_sql = """
            INSERT INTO dbo.StagingVentas 
            (
                IdOrigen, FolioVenta, IdSucursal, IdCaja, IdTurnoCaja, IdUsuario, IdCliente,
                FechaVenta, Subtotal, Descuento, Impuesto, Total, Ganancia,
                ImporteRecibido, Cambio, NumeroArticulos, Estatus, EsCancelada,
                Notas, FormaPago, Referencia
            )
            VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """

        sql_cur.fast_executemany = True

        while True:
            fb_rows = fb_cur.fetchmany(chunk_size)
            if not fb_rows:
                break

            for r in fb_rows:
                (tid, folio, cid, tid_turno, uid, cli_id, f_venta,
                 subtot, desc, imp, tot, gan, pago_con, num_art,
                 cancelado, forma_p, ref, notas) = r

                caja_id = caja_lookup.get(cid, default_caja_id)
                turno_id = turno_lookup.get(tid_turno, default_turno_id)
                usr_id = usr_lookup.get(uid, default_usr_id)
                cliente_id = cli_lookup.get(cli_id, default_cli_id)
                fecha_v = f_venta or '2023-10-20'

                subtot_v = round(float(subtot or 0), 2)
                desc_v = round(float(desc or 0), 2)
                imp_v = round(float(imp or 0), 2)
                tot_v = round(float(tot or 0), 2)
                gan_v = round(float(gan or 0), 2)
                pago_v = round(float(pago_con or 0), 2)
                cambio_v = round(max(0.0, pago_v - tot_v), 2)
                art_v = round(float(num_art or 0), 4)

                es_canc = 1 if cancelado == 't' else 0
                estatus = 'CANCELADA' if es_canc else 'PAGADA'

                fp_str = decode_text(forma_p).lower()
                # Confirmación: 'v' es Tarjeta Clip
                if fp_str.startswith('v') or fp_str.startswith('t'):
                    metodo = 'TARJETA'
                else:
                    metodo = 'EFECTIVO'

                ref_str = decode_text(ref)[:100]
                notas_str = decode_text(notas)[:250]

                staging_rows.append((
                    tid, folio or tid, caja_id, turno_id, usr_id, cliente_id,
                    fecha_v, subtot_v, desc_v, imp_v, tot_v, gan_v,
                    pago_v, cambio_v, art_v, estatus, es_canc,
                    notas_str, metodo, ref_str
                ))

            sql_cur.executemany(insert_sql, staging_rows)
            sql_conn.commit()
            total_tickets += len(staging_rows)
            print(f" -> Cargados {total_tickets} tickets en staging...")
            staging_rows.clear()

        # Bulk insert from Staging into Ventas + MigracionVentas using MERGE with temp table
        print("\nInsertando en dbo.Ventas y generando equivalencias con IDENTITY...")
        sql_cur.execute("""
            CREATE TABLE #TempOutput (IdVenta INT, IdOrigen INT);

            MERGE INTO dbo.Ventas AS target
            USING dbo.StagingVentas AS source
            ON 1 = 0
            WHEN NOT MATCHED THEN
                INSERT (
                    FolioVenta, IdSucursal, IdCaja, IdTurnoCaja, IdUsuario, IdCliente,
                    FechaVenta, Subtotal, Descuento, Impuesto, Total, Ganancia,
                    ImporteRecibido, Cambio, NumeroArticulos, Estatus, EsCancelada, Notas
                )
                VALUES (
                    source.FolioVenta, source.IdSucursal, source.IdCaja, source.IdTurnoCaja, source.IdUsuario, source.IdCliente,
                    source.FechaVenta, source.Subtotal, source.Descuento, source.Impuesto, source.Total, source.Ganancia,
                    source.ImporteRecibido, source.Cambio, source.NumeroArticulos, source.Estatus, source.EsCancelada, source.Notas
                )
            OUTPUT INSERTED.IdVenta, source.IdOrigen INTO #TempOutput (IdVenta, IdOrigen);

            INSERT INTO dbo.MigracionVentas (IdVenta, IdOrigen)
            SELECT IdVenta, IdOrigen FROM #TempOutput;

            DROP TABLE #TempOutput;
        """)
        sql_conn.commit()
        print(f" -> Ventas migradas exitosamente!")

        # Bulk insert into VentaPagos
        print("Registrando formas de pago en dbo.VentaPagos...")
        sql_cur.execute("""
            INSERT INTO dbo.VentaPagos (IdVenta, IdMetodoPago, Importe, Referencia)
            SELECT 
                m.IdVenta,
                CASE WHEN s.FormaPago = 'TARJETA' THEN 2 ELSE 1 END,
                s.Total,
                s.Referencia
            FROM dbo.StagingVentas s
            JOIN dbo.MigracionVentas m ON s.IdOrigen = m.IdOrigen;
        """)
        sql_conn.commit()
        print(" -> VentaPagos generados exitosamente!")

        # Drop StagingVentas
        sql_cur.execute("DROP TABLE dbo.StagingVentas;")
        sql_conn.commit()
    else:
        print(f" -> Ventas ya migradas previamente ({ventas_existentes} registros).")

    # 2. MIGRACION DE DETALLES DE VENTA
    print("\n--- PASO 2: Procesando VENTATICKETS_ARTICULOS (478,521 partidas) ---")
    sql_cur.execute("SELECT COUNT(*) FROM dbo.DetalleVentas")
    detalles_existentes = sql_cur.fetchone()[0]

    if detalles_existentes == 0:
        sql_cur.execute("""
            IF OBJECT_ID('dbo.StagingDetalleVentas', 'U') IS NOT NULL DROP TABLE dbo.StagingDetalleVentas;
            CREATE TABLE dbo.StagingDetalleVentas (
                TicketIdOrigen INT NOT NULL,
                ProductoCodigo VARCHAR(50) NOT NULL,
                Descripcion NVARCHAR(250) NOT NULL,
                Cantidad DECIMAL(18,4) NOT NULL,
                PrecioCosto DECIMAL(18,2) NOT NULL,
                PrecioUnitario DECIMAL(18,2) NOT NULL,
                Descuento DECIMAL(18,2) NOT NULL,
                Impuesto DECIMAL(18,2) NOT NULL,
                Total DECIMAL(18,2) NOT NULL,
                Ganancia DECIMAL(18,2) NOT NULL,
                EsDevuelto BIT NOT NULL,
                CantidadDevuelta DECIMAL(18,4) NOT NULL
            );
        """)
        sql_conn.commit()

        print("Extrayendo artículos de tickets desde Eleventa...")
        fb_cur.execute("""
            SELECT 
                TICKET_ID, PRODUCTO_CODIGO, PRODUCTO_NOMBRE, CANTIDAD,
                PRECIO_USADO, TOTAL_ARTICULO, GANANCIA, FUE_DEVUELTO, CANTIDAD_DEVUELTA
            FROM VENTATICKETS_ARTICULOS
            ORDER BY ID
        """)

        chunk_size = 25000
        staging_art_rows = []
        total_arts = 0

        insert_det_sql = """
            INSERT INTO dbo.StagingDetalleVentas
            (
                TicketIdOrigen, ProductoCodigo, Descripcion, Cantidad,
                PrecioCosto, PrecioUnitario, Descuento, Impuesto, Total,
                Ganancia, EsDevuelto, CantidadDevuelta
            )
            VALUES (?, ?, ?, ?, ?, ?, 0.00, 0.00, ?, ?, ?, ?)
        """
        sql_cur.fast_executemany = True

        while True:
            fb_rows = fb_cur.fetchmany(chunk_size)
            if not fb_rows:
                break

            for r in fb_rows:
                (t_id, cod, nom, cant, p_usado, tot_art, gan, dev, c_dev) = r

                cod_clean = decode_text(cod)[:50]
                nom_clean = decode_text(nom)[:250] or f'PRODUCTO {cod_clean}'
                cant_v = round(float(cant or 1), 4)
                p_unit_v = round(float(p_usado or 0), 2)
                tot_v = round(float(tot_art or (cant_v * p_unit_v)), 2)
                gan_v = round(float(gan or 0), 2)
                costo_v = round(max(0.0, (tot_v - gan_v) / cant_v), 2) if cant_v > 0 else 0.0

                es_dev = 1 if dev == 't' else 0
                c_dev_v = round(float(c_dev or 0), 4)

                staging_art_rows.append((
                    t_id, cod_clean, nom_clean, cant_v,
                    costo_v, p_unit_v, tot_v, gan_v, es_dev, c_dev_v
                ))

            sql_cur.executemany(insert_det_sql, staging_art_rows)
            sql_conn.commit()
            total_arts += len(staging_art_rows)
            print(f" -> Cargadas {total_arts} partidas en staging...")
            staging_art_rows.clear()

        # Create Index on Staging for ultra-fast join
        print("Indexando staging de detalles para acelerar insercion final...")
        sql_cur.execute("CREATE INDEX IX_Staging_Ticket ON dbo.StagingDetalleVentas(TicketIdOrigen);")
        sql_cur.execute("CREATE INDEX IX_Staging_Cod ON dbo.StagingDetalleVentas(ProductoCodigo);")
        sql_conn.commit()

        print("Insertando partidas en dbo.DetalleVentas...")
        sql_cur.execute("""
            INSERT INTO dbo.DetalleVentas
            (
                IdVenta, IdProducto, CodigoBarras, Descripcion, Cantidad,
                PrecioCosto, PrecioUnitario, Descuento, Impuesto, Subtotal,
                Total, Ganancia, EsDevuelto, CantidadDevuelta
            )
            SELECT 
                m.IdVenta,
                p.IdProducto,
                s.ProductoCodigo,
                s.Descripcion,
                s.Cantidad,
                s.PrecioCosto,
                s.PrecioUnitario,
                s.Descuento,
                s.Impuesto,
                s.Total,
                s.Total,
                s.Ganancia,
                s.EsDevuelto,
                s.CantidadDevuelta
            FROM dbo.StagingDetalleVentas s
            JOIN dbo.MigracionVentas m ON s.TicketIdOrigen = m.IdOrigen
            LEFT JOIN dbo.Productos p ON s.ProductoCodigo = p.CodigoProducto;
        """)
        sql_conn.commit()
        print(" -> DetalleVentas migrado exitosamente!")

        # Drop StagingDetalleVentas
        sql_cur.execute("DROP TABLE dbo.StagingDetalleVentas;")
        sql_conn.commit()
    else:
        print(f" -> DetalleVentas ya migrado previamente ({detalles_existentes} registros).")

    fb_conn.close()
    sql_conn.close()

    t_total = time.time() - t0
    print(f"\n[+] ETAPA 4 COMPLETADA CON EXITO EN {t_total:.2f} SEGUNDOS!")

if __name__ == '__main__':
    main()
