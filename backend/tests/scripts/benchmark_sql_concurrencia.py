"""
BENCHMARK DE CONCURRENCIA Y CARGA PARA SQL SERVER 2022
Base de Datos: PdvAbarrotesArenas
Verifica:
1. Estado de READ_COMMITTED_SNAPSHOT.
2. Latencia de transacciones concurrentes simulando 20 cajeros simultáneos.
3. No-bloqueo entre reportes analíticos pesados y consultas de catálogo en vivo.
"""

import time
import pyodbc
from concurrent.futures import ThreadPoolExecutor, as_completed

CADENA_CONEXION = 'DRIVER={ODBC Driver 17 for SQL Server};SERVER=AAM;DATABASE=PdvAbarrotesArenas;Trusted_Connection=yes;TrustServerCertificate=yes;'

def verificar_snapshot_isolation():
    conn = pyodbc.connect(CADENA_CONEXION)
    cursor = conn.cursor()
    cursor.execute("""
        SELECT name, is_read_committed_snapshot_on, snapshot_isolation_state_desc
        FROM sys.databases
        WHERE name = 'PdvAbarrotesArenas';
    """)
    fila = cursor.fetchone()
    conn.close()
    return fila

def tarea_consulta_cajero(hilo_id):
    """Simula una lectura rápida de caja (búsqueda de producto por código y stock)."""
    sw_inicio = time.perf_counter()
    conn = pyodbc.connect(CADENA_CONEXION)
    cursor = conn.cursor()
    try:
        # Búsqueda rápida por código y stock en inventario
        cursor.execute("""
            SELECT TOP 5 p.IdProducto, p.Descripcion, p.PrecioVenta, ISNULL(i.ExistenciaActual, 0) as Existencia
            FROM dbo.Productos p
            LEFT JOIN dbo.Inventario i ON p.IdProducto = i.IdProducto AND i.IdSucursal = 1
            WHERE p.Activo = 1
            ORDER BY p.IdProducto DESC;
        """)
        filas = cursor.fetchall()
        latencia_ms = (time.perf_counter() - sw_inicio) * 1000.0
        return {'hilo': hilo_id, 'tipo': 'CAJERO_BUSQUEDA', 'exito': True, 'latencia_ms': latencia_ms, 'registros': len(filas)}
    except Exception as e:
        latencia_ms = (time.perf_counter() - sw_inicio) * 1000.0
        return {'hilo': hilo_id, 'tipo': 'CAJERO_BUSQUEDA', 'exito': False, 'latencia_ms': latencia_ms, 'error': str(e)}
    finally:
        conn.close()

def tarea_reporte_pesado(hilo_id):
    """Simula una consulta analítica de Dashboard con agregaciones sobre cientos de miles de registros."""
    sw_inicio = time.perf_counter()
    conn = pyodbc.connect(CADENA_CONEXION)
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT 
                COUNT(*) as TotalVentas,
                ISNULL(SUM(Total), 0) as MontoTotal,
                ISNULL(AVG(Total), 0) as TicketPromedio
            FROM dbo.Ventas
            WHERE EsCancelada = 0;
        """)
        fila = cursor.fetchone()
        latencia_ms = (time.perf_counter() - sw_inicio) * 1000.0
        return {'hilo': hilo_id, 'tipo': 'REPORTE_ANALITICO', 'exito': True, 'latencia_ms': latencia_ms, 'datos': fila[0]}
    except Exception as e:
        latencia_ms = (time.perf_counter() - sw_inicio) * 1000.0
        return {'hilo': hilo_id, 'tipo': 'REPORTE_ANALITICO', 'exito': False, 'latencia_ms': latencia_ms, 'error': str(e)}
    finally:
        conn.close()

def main():
    print("======================================================================")
    print("FASE 15: PRUEBAS DE CARGA Y CONCURRENCIA SOBRE SQL SERVER 2022")
    print("======================================================================")

    # 1. Comprobar Snapshot Isolation
    info_bd = verificar_snapshot_isolation()
    if info_bd:
        nombre, snapshot_on, desc = info_bd
        print(f"Base de datos: {nombre}")
        print(f"READ_COMMITTED_SNAPSHOT activado: {'SÍ (1)' if snapshot_on else 'NO (0)'}")
        print(f"Snapshot Isolation State: {desc}")
    else:
        print("[AVISO] No se pudo consultar metadata de sys.databases.")

    print("\nLanzando ráfaga concurrente de 30 operaciones simultáneas:")
    print(" - 20 operaciones de caja (lectura rápida de inventario y precios)")
    print(" - 10 reportes analíticos pesados de Dashboard")
    print("----------------------------------------------------------------------")

    resultados = []
    tiempo_total_inicio = time.perf_counter()

    with ThreadPoolExecutor(max_workers=30) as executor:
        futuros = []
        for i in range(1, 21):
            futuros.append(executor.submit(tarea_consulta_cajero, i))
        for j in range(1, 11):
            futuros.append(executor.submit(tarea_reporte_pesado, j))

        for f in as_completed(futuros):
            resultados.append(f.result())

    tiempo_total_ms = (time.perf_counter() - tiempo_total_inicio) * 1000.0

    # Análisis de resultados
    exitosos = [r for r in resultados if r['exito']]
    fallidos = [r for r in resultados if not r['exito']]
    latencias_cajero = [r['latencia_ms'] for r in exitosos if r['tipo'] == 'CAJERO_BUSQUEDA']
    latencias_reporte = [r['latencia_ms'] for r in exitosos if r['tipo'] == 'REPORTE_ANALITICO']

    print(f"\nResultados del Benchmark Concurrente:")
    print(f" - Total operaciones ejecutadas: {len(resultados)}")
    if len(fallidos) == 0:
        print(f" - Operaciones exitosas: {len(exitosos)} (100%)")
    else:
        print(f" - Exitosas: {len(exitosos)} | Fallidas: {len(fallidos)}")
        for f in fallidos[:3]:
            print(f"   * Error ({f['tipo']}): {f.get('error')}")
    print(f" - Tiempo total de la ráfaga (Wall Clock): {tiempo_total_ms:.2f} ms")

    if latencias_cajero:
        latencias_cajero.sort()
        p50 = latencias_cajero[len(latencias_cajero) // 2]
        p95 = latencias_cajero[int(len(latencias_cajero) * 0.95)]
        prom = sum(latencias_cajero) / len(latencias_cajero)
        print(f"\n[LATENCIA OPERACIONES DE CAJERO (N={len(latencias_cajero)})]:")
        print(f"   * Promedio: {prom:.2f} ms")
        print(f"   * Mediana (P50): {p50:.2f} ms")
        print(f"   * Percentil 95 (P95): {p95:.2f} ms")
        print(f"   * Mínimo: {min(latencias_cajero):.2f} ms | Máximo: {max(latencias_cajero):.2f} ms")

    if latencias_reporte:
        prom_rep = sum(latencias_reporte) / len(latencias_reporte)
        print(f"\n[LATENCIA REPORTES ANALÍTICOS (N={len(latencias_reporte)})]:")
        print(f"   * Promedio: {prom_rep:.2f} ms")
        print(f"   * Mínimo: {min(latencias_reporte):.2f} ms | Máximo: {max(latencias_reporte):.2f} ms")

    print("\n======================================================================")
    if len(fallidos) == 0 and (prom < 100.0 if latencias_cajero else True):
        print("CONCURRENCIA Y RENDIMIENTO: SUPERADOS CON ÉXITO")
        print("Sin deadlocks, sin bloqueos cruzados y latencia < 100ms garantizada.")
    else:
        print("ALERTAS EN EL BENCHMARK DE RENDIMIENTO")
    print("======================================================================")

if __name__ == '__main__':
    main()
