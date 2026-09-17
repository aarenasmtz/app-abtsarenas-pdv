import deep_analysis
con = deep_analysis.get_connection()
cur = con.cursor()
cur.execute("""
    SELECT TRIM(RDB$RELATION_NAME), TRIM(RDB$FIELD_NAME)
    FROM RDB$RELATION_FIELDS
    WHERE RDB$FIELD_NAME LIKE '%CODIGO%' OR RDB$FIELD_NAME LIKE '%BAR%'
    ORDER BY 1
""")
for r in cur.fetchall():
    print(r)
con.close()
