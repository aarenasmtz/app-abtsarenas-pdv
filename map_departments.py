import os
import fdb
import re
import json

def get_mapping():
    # Brand keywords
    brands = {
        'SABRITAS': ['sabritas', 'sabriyas', 'botanas sabritas'],
        'BARCEL': ['barcel'],
        'GAMESA': ['gamesa', 'galleta gamesa', 'gamesa gamesa'],
        'COCA COLA': ['coca cola', 'coca cola refresco', 'coca'],
        'TIA ROSA': ['tia rosa', 'pan tia rosa', 'bimbo tia rosa'],
        'BIMBO': ['bimbo'],
        'MARINELA': ['marinela', 'pastelitomarinela', 'marimela'],
        'PENAFIEL': ['penafiel', 'peafiel'],
        'PEPSI': ['pepsi'],
        'LEON': ['leon', 'lacteos leon'],
        'FUD': ['fud'],
        'SIGMA': ['sigma'],
        '19 HERMANOS': ['19 hermanos'],
        'CHARRAS': ['charras'],
        'SIDRAL AGA': ['sidral aga', 'sidral'],
        'KIUBO': ['kiubo', 'botanas kiubo'],
        'LEO': ['leo'],
        'COYOTE': ['coyote', 'coyotes'],
        'DURAN': ['duran'],
        'CITY ABASTOS': ['city abastos', 'city abarrotes', 'citry', 'cityu', 'vcity', 'vciy'],
        'REXAL': ['rexal'],
        'BOMBONCITO': ['dulcerias bomboncito'],
        'ELECTROLIT': ['electrolit'],
        'NESTLE': ['nestle']
    }

    # Standard Categories
    # 1. ABARROTES GENERAL
    # 2. BEBIDAS Y REFRESCOS
    # 3. BOTANAS Y FRITURAS
    # 4. GALLETAS Y PAN
    # 5. LACTEOS Y QUESOS
    # 6. CARNES FRIAS Y EMBUTIDOS
    # 7. CUIDADO PERSONAL Y FARMACIA
    # 8. LIMPIEZA Y HOGAR
    # 9. DULCERIA
    # 10. TORTILLAS Y TOSTADAS
    # 11. VINOS Y LICORES
    # 12. OTROS / SIN CATEGORIA
    
    return brands

def main():
    dll_path = os.path.abspath(r'firebird25_embed\fbembed.dll')
    fdb.load_api(dll_path)
    con = fdb.connect(database=os.path.abspath('PDVDATA.FDB'), user='SYSDBA', password='masterkey', charset='NONE')
    cur = con.cursor()

    cur.execute("""
        SELECT d.ID, TRIM(d.NOMBRE), d.ACTIVO, COUNT(p.ID)
        FROM DEPARTAMENTOS d
        LEFT JOIN PRODUCTOS p ON d.ID = p.DEPT
        GROUP BY d.ID, d.NOMBRE, d.ACTIVO
        ORDER BY d.ID
    """)
    rows = cur.fetchall()

    dept_mapping = {}
    
    for d_id, raw_name, act, p_count in rows:
        name = raw_name
        is_elim = "Eliminado" in name or act == '0'
        clean_name = re.sub(r'\s*Eliminado.*', '', name, flags=re.IGNORECASE).strip().upper()
        
        # Determine category and brand
        brand = None
        cat = "ABARROTES GENERAL"

        # Brand detection
        if any(w in clean_name for w in ['SABRITA', 'SABRIYA']):
            brand = 'SABRITAS'
            cat = 'BOTANAS Y FRITURAS'
        elif 'BARCEL' in clean_name:
            brand = 'BARCEL'
            cat = 'BOTANAS Y FRITURAS'
        elif any(w in clean_name for w in ['GAMESA']):
            brand = 'GAMESA'
            cat = 'GALLETAS Y PAN'
        elif 'COCA COLA' in clean_name:
            brand = 'COCA COLA'
            cat = 'BEBIDAS Y REFRESCOS'
        elif 'TIA ROSA' in clean_name:
            brand = 'TIA ROSA'
            cat = 'GALLETAS Y PAN'
        elif 'BIMBO' in clean_name:
            brand = 'BIMBO'
            cat = 'GALLETAS Y PAN'
        elif 'MARINELA' in clean_name or 'MARIMELA' in clean_name:
            brand = 'MARINELA'
            cat = 'GALLETAS Y PAN'
        elif 'PEPSI' in clean_name:
            brand = 'PEPSI'
            cat = 'BEBIDAS Y REFRESCOS'
        elif 'PENAFIEL' in clean_name or 'PEÑAFIEL' in clean_name:
            brand = 'PENAFIEL'
            cat = 'BEBIDAS Y REFRESCOS'
        elif 'SIDRAL' in clean_name:
            brand = 'SIDRAL AGA'
            cat = 'BEBIDAS Y REFRESCOS'
        elif 'CHARRAS' in clean_name:
            brand = 'CHARRAS'
            cat = 'TORTILLAS Y TOSTADAS'
        elif 'FUD' in clean_name:
            brand = 'FUD'
            cat = 'CARNES FRIAS Y EMBUTIDOS'
        elif 'SIGMA' in clean_name:
            brand = 'SIGMA'
            cat = 'CARNES FRIAS Y EMBUTIDOS'
        elif 'LEON' in clean_name:
            brand = 'LEON'
            cat = 'LACTEOS Y DERIVADOS'
        elif '19 HERMANOS' in clean_name:
            brand = '19 HERMANOS'
            cat = 'LACTEOS Y DERIVADOS'
        elif 'ELECTROLIT' in clean_name:
            brand = 'ELECTROLIT'
            cat = 'BEBIDAS Y REFRESCOS'
        elif 'NESTLE' in clean_name:
            brand = 'NESTLE'
            cat = 'ABARROTES GENERAL'
        elif 'KIUBO' in clean_name:
            brand = 'KIUBO'
            cat = 'BOTANAS Y FRITURAS'
        elif 'COYOTE' in clean_name:
            brand = 'COYOTE'
            cat = 'TORTILLAS Y TOSTADAS'
        elif any(w in clean_name for w in ['CITY', 'CITRY', 'CITYU', 'VCITY', 'VCIY']):
            brand = 'CITY ABASTOS'
            cat = 'ABARROTES GENERAL'
        # Category detection
        elif any(w in clean_name for w in ['BEBID', 'REFRESC', 'JUGO', 'AGUA', 'BREFRESCO', 'VREFRESCO']):
            cat = 'BEBIDAS Y REFRESCOS'
        elif any(w in clean_name for w in ['BOTANA', 'FRITURA', 'PAPA', 'BOYANA', 'BOYTANA', 'NBOTANA', 'SBOTANA']):
            cat = 'BOTANAS Y FRITURAS'
        elif any(w in clean_name for w in ['GALLETA', 'PAN', 'PASTEL', 'CEREAL']):
            cat = 'GALLETAS Y PAN'
        elif any(w in clean_name for w in ['LACTEO', 'LECHE', 'QUESO', 'CREMA']):
            cat = 'LACTEOS Y DERIVADOS'
        elif any(w in clean_name for w in ['CARNE', 'JAMON', 'SALCHICHA', 'EMBUTIDO']):
            cat = 'CARNES FRIAS Y EMBUTIDOS'
        elif any(w in clean_name for w in ['PERFUMERIA', 'P0ERFUMERIA', 'HIGIENE', 'SHAMPOO', 'JABON BARRA', 'PAPEL HIGIENICO']):
            cat = 'CUIDADO PERSONAL'
        elif any(w in clean_name for w in ['FARMACIA', 'MEDICAMENTO']):
            cat = 'FARMACIA'
        elif any(w in clean_name for w in ['DETERGENTE', 'LIMPIEZA', 'DESINFECTANTE', 'QUITA MANCHAS', 'AROMATIZANTE', 'CLORO', 'JABON ROPA', 'JABON POLVO']):
            cat = 'LIMPIEZA Y HOGAR'
        elif any(w in clean_name for w in ['DULCE', 'BOMBON']):
            cat = 'DULCERIA'
        elif any(w in clean_name for w in ['TORTILLA', 'TOSTADA']):
            cat = 'TORTILLAS Y TOSTADAS'
        elif any(w in clean_name for w in ['CERVEZA', 'VINO', 'LICOR', 'ALCHOOL']):
            cat = 'VINOS Y LICORES'
        elif any(w in clean_name for w in ['SEMILLA', 'CEMILLA']):
            cat = 'SEMILLAS Y GRANOS'
        elif any(w in clean_name for w in ['ACCESORIO', 'ELECTRICIDAD', 'PERIODICO', 'PILAS', 'VELADORAS', 'ENCENDORES', 'ALUMINIOS']):
            cat = 'ARTICULOS DEL HOGAR'
        elif any(w in clean_name for w in ['ENLATADO', 'ACEITE', 'VINAGRE', 'SAZONADOR', 'CONDIMENTO', 'PURE', 'SOPA', 'FRIJOL', 'CAFE', 'HARINA']):
            cat = 'ABARROTES GENERAL'
        elif any(w in clean_name for w in ['ABARROTE', 'ABAROTE']):
            cat = 'ABARROTES GENERAL'
        elif 'SIN DEPARTAMENTO' in clean_name or 'PRODUCTOS COMUNES' in clean_name:
            cat = 'GENERAL'
        else:
            cat = 'ABARROTES GENERAL'

        dept_mapping[d_id] = {
            'origen_id': d_id,
            'nombre_origen': name,
            'nombre_limpio': clean_name,
            'categoria_normalizada': cat,
            'marca_extraida': brand,
            'es_eliminado': is_elim,
            'productos_asociados': p_count
        }

    with open('mapeo_departamentos.json', 'w', encoding='utf-8') as f:
        json.dump(dept_mapping, f, indent=2, ensure_ascii=False)

    print("Mapeo generado exitosamente en 'mapeo_departamentos.json'")
    
    # Resumen de categorías resultantes
    cat_counts = {}
    brand_counts = {}
    for item in dept_mapping.values():
        c = item['categoria_normalizada']
        b = item['marca_extraida']
        cat_counts[c] = cat_counts.get(c, 0) + item['productos_asociados']
        if b:
            brand_counts[b] = brand_counts.get(b, 0) + item['productos_asociados']

    print("\n--- RESUMEN CATEGORÍAS RESULTANTES (PRODUCTOS ASOCIADOS) ---")
    for c, cnt in sorted(cat_counts.items(), key=lambda x: -x[1]):
        print(f"  {c:<30}: {cnt:>5} productos")

    print("\n--- RESUMEN MARCAS EXTRAÍDAS (PRODUCTOS ASOCIADOS) ---")
    for b, cnt in sorted(brand_counts.items(), key=lambda x: -x[1]):
        print(f"  {b:<30}: {cnt:>5} productos")

    con.close()

if __name__ == '__main__':
    main()
