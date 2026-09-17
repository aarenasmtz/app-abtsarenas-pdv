import pyodbc
import bcrypt

salt = bcrypt.gensalt(10)
hash_admin = bcrypt.hashpw(b'Admin123*', salt).decode('utf-8')
hash_cajero = bcrypt.hashpw(b'Cajero123*', salt).decode('utf-8')

conn_str = 'DRIVER={ODBC Driver 17 for SQL Server};SERVER=AAM;DATABASE=PdvAbarrotesArenas;Trusted_Connection=yes;'
con = pyodbc.connect(conn_str, autocommit=True)
cur = con.cursor()

# 1. Seed Roles if empty
cur.execute('SELECT COUNT(*) FROM Roles')
if cur.fetchone()[0] == 0:
    cur.execute('''
        SET IDENTITY_INSERT Roles ON;
        INSERT INTO Roles (IdRol, Nombre, Descripcion, Activo) VALUES 
        (1, 'Administrador', 'Control total y configuracion del sistema', 1),
        (2, 'Cajero', 'Operacion de cobro en caja y consulta rapida de productos', 1),
        (3, 'Supervisor', 'Cortes de caja, autorizaciones y ajustes de inventario', 1);
        SET IDENTITY_INSERT Roles OFF;
    ''')
    print('Roles insertados con exito.')
else:
    print('Roles ya existian.')

# 2. Update/Insert admin user
cur.execute("SELECT IdUsuario FROM Usuarios WHERE NombreUsuario = 'admin'")
row = cur.fetchone()
if row:
    admin_id = row[0]
    cur.execute("UPDATE Usuarios SET ClaveHash = ?, EsAdministrador = 1, Activo = 1 WHERE IdUsuario = ?", hash_admin, admin_id)
    print(f'Usuario admin (Id: {admin_id}) actualizado con hash BCrypt.')
else:
    cur.execute('''
        INSERT INTO Usuarios (NombreCompleto, NombreUsuario, ClaveHash, Correo, Telefono, EsAdministrador, Activo, FechaRegistro)
        OUTPUT INSERTED.IdUsuario
        VALUES ('Administrador General', 'admin', ?, 'admin@abarrotesarenas.com', '0000000000', 1, 1, GETDATE())
    ''', hash_admin)
    admin_id = cur.fetchone()[0]
    print(f'Usuario admin creado con Id: {admin_id}.')

# 3. Create cajero user if not exists
cur.execute("SELECT IdUsuario FROM Usuarios WHERE NombreUsuario = 'cajero'")
row_caj = cur.fetchone()
if row_caj:
    cajero_id = row_caj[0]
    cur.execute("UPDATE Usuarios SET ClaveHash = ?, Activo = 1 WHERE IdUsuario = ?", hash_cajero, cajero_id)
    print(f'Usuario cajero (Id: {cajero_id}) actualizado con hash BCrypt.')
else:
    cur.execute('''
        INSERT INTO Usuarios (NombreCompleto, NombreUsuario, ClaveHash, Correo, Telefono, EsAdministrador, Activo, FechaRegistro)
        OUTPUT INSERTED.IdUsuario
        VALUES ('Cajero Principal', 'cajero', ?, 'cajero@abarrotesarenas.com', '0000000000', 0, 1, GETDATE())
    ''', hash_cajero)
    cajero_id = cur.fetchone()[0]
    print(f'Usuario cajero creado con Id: {cajero_id}.')

# 4. Ensure UsuarioRoles mappings
cur.execute('DELETE FROM UsuarioRoles WHERE IdUsuario IN (?, ?)', admin_id, cajero_id)
cur.execute('INSERT INTO UsuarioRoles (IdUsuario, IdRol) VALUES (?, 1)', admin_id)
cur.execute('INSERT INTO UsuarioRoles (IdUsuario, IdRol) VALUES (?, 2)', cajero_id)
print(f'Mapeos UsuarioRoles actualizados: admin({admin_id}) -> Administrador, cajero({cajero_id}) -> Cajero.')

con.close()
