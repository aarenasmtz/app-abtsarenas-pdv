import pyodbc
import json

conn_str = 'DRIVER={ODBC Driver 17 for SQL Server};SERVER=AAM;DATABASE=PdvAbarrotesArenas;Trusted_Connection=yes;'
con = pyodbc.connect(conn_str)
cur = con.cursor()

# 1. Tables and row counts
cur.execute("""
    SELECT 
        t.name AS TableName,
        p.rows AS RowCounts
    FROM sys.tables t
    INNER JOIN sys.partitions p ON t.object_id = p.object_id
    WHERE p.index_id IN (0, 1)
    ORDER BY t.name
""")
tables = {row[0]: row[1] for row in cur.fetchall()}

# 2. Identities
cur.execute("""
    SELECT 
        t.name AS TableName,
        c.name AS ColumnName,
        CAST(ic.seed_value AS BIGINT) AS seed_value,
        CAST(ic.increment_value AS BIGINT) AS increment_value,
        CAST(ic.last_value AS BIGINT) AS last_value
    FROM sys.identity_columns ic
    JOIN sys.tables t ON ic.object_id = t.object_id
    JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
    ORDER BY t.name
""")
identities = [{
    'table': r[0], 'col': r[1], 'seed': r[2], 'inc': r[3], 'last': r[4]
} for r in cur.fetchall()]

# 3. PKs
cur.execute("""
    SELECT 
        t.name AS TableName,
        kc.name AS PKName,
        c.name AS ColumnName
    FROM sys.key_constraints kc
    JOIN sys.tables t ON kc.parent_object_id = t.object_id
    JOIN sys.index_columns ic ON kc.parent_object_id = ic.object_id AND kc.unique_index_id = ic.index_id
    JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
    WHERE kc.type = 'PK'
    ORDER BY t.name
""")
pks = [{ 'table': r[0], 'pk': r[1], 'col': r[2] } for r in cur.fetchall()]

# 4. FKs
cur.execute("""
    SELECT 
        fk.name AS FKName,
        tp.name AS ParentTable,
        cp.name AS ParentCol,
        tr.name AS RefTable,
        cr.name AS RefCol
    FROM sys.foreign_keys fk
    JOIN sys.tables tp ON fk.parent_object_id = tp.object_id
    JOIN sys.tables tr ON fk.referenced_object_id = tr.object_id
    JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
    JOIN sys.columns cp ON fkc.parent_object_id = cp.object_id AND fkc.parent_column_id = cp.column_id
    JOIN sys.columns cr ON fkc.referenced_object_id = cr.object_id AND fkc.referenced_column_id = cr.column_id
    ORDER BY tp.name, fk.name
""")
fks = [{
    'fk': r[0], 'table': r[1], 'col': r[2], 'ref_table': r[3], 'ref_col': r[4]
} for r in cur.fetchall()]

# 5. Indexes
cur.execute("""
    SELECT 
        t.name AS TableName,
        i.name AS IndexName,
        i.type_desc AS IndexType,
        c.name AS ColumnName,
        ic.is_included_column
    FROM sys.indexes i
    JOIN sys.tables t ON i.object_id = t.object_id
    JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
    JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
    WHERE i.is_primary_key = 0 AND i.is_unique_constraint = 0
    ORDER BY t.name, i.name, ic.key_ordinal
""")
indexes = [{
    'table': r[0], 'idx': r[1], 'type': r[2], 'col': r[3], 'is_inc': r[4]
} for r in cur.fetchall()]

out = {
    'total_tables': len(tables),
    'tables': tables,
    'identities_count': len(identities),
    'identities': identities,
    'pks_count': len(pks),
    'pks': pks,
    'fks_count': len(fks),
    'fks': fks,
    'indexes_count': len(indexes),
    'indexes': indexes
}

with open('sql_schema_audit.json', 'w', encoding='utf-8') as f:
    json.dump(out, f, indent=2, ensure_ascii=False)

print(f"Total tables: {len(tables)}")
print(f"Total identities: {len(identities)}")
print(f"Total PKs: {len(pks)}")
print(f"Total FKs: {len(fks)}")
print(f"Total custom non-PK indexes: {len(indexes)}")
con.close()
