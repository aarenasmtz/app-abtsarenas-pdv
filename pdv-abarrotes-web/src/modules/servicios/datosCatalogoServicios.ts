import type { CatalogoServicioDto } from './tiposServicios';

export interface ServicioVisual extends CatalogoServicioDto {
  categoriaId:
    | 'todos'
    | 'telefonia'
    | 'luz'
    | 'agua'
    | 'internet_tv'
    | 'gas'
    | 'peaje'
    | 'catalogo'
    | 'gobierno'
    | 'entretenimiento';
  colorPrimario: string;
  colorFondo: string;
  colorBorde: string;
  colorTexto: string;
  iconoTipo:
    | 'cfe'
    | 'telmex'
    | 'agua'
    | 'naturgy'
    | 'izzi'
    | 'sky'
    | 'totalplay'
    | 'megacable'
    | 'dish'
    | 'gas'
    | 'peaje'
    | 'avon'
    | 'jafra'
    | 'marykay'
    | 'netflix'
    | 'spotify'
    | 'playstation'
    | 'xbox'
    | 'gobierno'
    | 'telefonia'
    | 'generico';
  esRecarga?: boolean;
}

export interface CategoriaCatalogo {
  id: ServicioVisual['categoriaId'];
  nombre: string;
  icono: string;
  descripcion: string;
}

export const CATEGORIAS_CATALOGO: CategoriaCatalogo[] = [
  { id: 'todos', nombre: 'Todos', icono: '🌟', descripcion: 'Catálogo completo' },
  { id: 'telefonia', nombre: 'Telefonía Móvil', icono: '📱', descripcion: 'Tiempo aire y paquetes' },
  { id: 'luz', nombre: 'Luz (CFE)', icono: '⚡', descripcion: 'Comisión Federal de Electricidad' },
  { id: 'agua', nombre: 'Agua Potable', icono: '💧', descripcion: 'Organismos operadores de agua' },
  { id: 'internet_tv', nombre: 'Internet & TV', icono: '🌐', descripcion: 'Telmex, Izzi, Sky, Totalplay' },
  { id: 'gas', nombre: 'Gas Natural', icono: '🔥', descripcion: 'Naturgy, Engie, EcoGas' },
  { id: 'peaje', nombre: 'TAG & Peaje', icono: '🚗', descripcion: 'PASE, TeleVía, Viapass' },
  { id: 'catalogo', nombre: 'Venta Catálogo', icono: '💄', descripcion: 'Avon, Jafra, Betterware' },
  { id: 'entretenimiento', nombre: 'Entretenimiento', icono: '🎮', descripcion: 'Pines digitales y streaming' },
  { id: 'gobierno', nombre: 'Gobierno / Impuestos', icono: '🏛️', descripcion: 'Predial, multas y licencias' },
];

/**
 * Catálogo completo y enriquecido de servicios públicos y privados en México.
 * Se utiliza para visualización inmediata en mosaico y fallback garantizado.
 */
export const SERVICIOS_PREDETERMINADOS: ServicioVisual[] = [
  // 1. LUZ Y ELECTRICIDAD
  {
    codigo: 'CFE',
    nombre: 'CFE - Comisión Federal de Electricidad',
    categoria: 'Electricidad',
    categoriaId: 'luz',
    comisionRecomendada: 12,
    permiteVencidos: false,
    formatoReferencia: '30 dígitos del código de barras del recibo o número de servicio',
    colorPrimario: '#00843d',
    colorFondo: '#f0fdf4',
    colorBorde: '#86efac',
    colorTexto: '#166534',
    iconoTipo: 'cfe',
  },
  {
    codigo: 'CFE_TEIT',
    nombre: 'CFE Internet y Telefonía para Todos',
    categoria: 'Electricidad',
    categoriaId: 'luz',
    comisionRecomendada: 10,
    permiteVencidos: true,
    formatoReferencia: 'Número de SIM o referencia de paquete',
    colorPrimario: '#00843d',
    colorFondo: '#f0fdf4',
    colorBorde: '#86efac',
    colorTexto: '#166534',
    iconoTipo: 'cfe',
  },

  // 2. AGUA POTABLE
  {
    codigo: 'AGUA_SAPAL',
    nombre: 'SAPAL - Sistema de Agua Potable y Alcantarillado León',
    categoria: 'Agua Potable',
    categoriaId: 'agua',
    comisionRecomendada: 12,
    permiteVencidos: true,
    formatoReferencia: 'Número de cuenta de 8 a 10 dígitos',
    colorPrimario: '#0284c7',
    colorFondo: '#f0f9ff',
    colorBorde: '#7dd3fc',
    colorTexto: '#0369a1',
    iconoTipo: 'agua',
  },
  {
    codigo: 'AGUA_SACMEX',
    nombre: 'SACMEX - Sistema de Aguas de la Ciudad de México',
    categoria: 'Agua Potable',
    categoriaId: 'agua',
    comisionRecomendada: 12,
    permiteVencidos: true,
    formatoReferencia: 'Línea de captura de 16 dígitos',
    colorPrimario: '#0369a1',
    colorFondo: '#f0f9ff',
    colorBorde: '#bae6fd',
    colorTexto: '#075985',
    iconoTipo: 'agua',
  },
  {
    codigo: 'AGUA_SIAPA',
    nombre: 'SIAPA - Intermunicipal de Agua y Alcantarillado Guadalajara',
    categoria: 'Agua Potable',
    categoriaId: 'agua',
    comisionRecomendada: 12,
    permiteVencidos: false,
    formatoReferencia: 'Número de cuenta y clave catastral',
    colorPrimario: '#0284c7',
    colorFondo: '#f0f9ff',
    colorBorde: '#7dd3fc',
    colorTexto: '#0369a1',
    iconoTipo: 'agua',
  },
  {
    codigo: 'AGUA_SADM',
    nombre: 'Agua y Drenaje de Monterrey (SADM)',
    categoria: 'Agua Potable',
    categoriaId: 'agua',
    comisionRecomendada: 12,
    permiteVencidos: true,
    formatoReferencia: 'Número de contrato del recibo',
    colorPrimario: '#0ea5e9',
    colorFondo: '#f0f9ff',
    colorBorde: '#bae6fd',
    colorTexto: '#0369a1',
    iconoTipo: 'agua',
  },
  {
    codigo: 'AGUA_SIMAPAG',
    nombre: 'SIMAPAG Guanajuato Capital',
    categoria: 'Agua Potable',
    categoriaId: 'agua',
    comisionRecomendada: 12,
    permiteVencidos: true,
    formatoReferencia: 'Número de contrato o toma de agua',
    colorPrimario: '#0284c7',
    colorFondo: '#f0f9ff',
    colorBorde: '#7dd3fc',
    colorTexto: '#0369a1',
    iconoTipo: 'agua',
  },
  {
    codigo: 'AGUA_PUEBLA',
    nombre: 'Agua de Puebla para Todos',
    categoria: 'Agua Potable',
    categoriaId: 'agua',
    comisionRecomendada: 12,
    permiteVencidos: false,
    formatoReferencia: 'Número de NIS o código de barras',
    colorPrimario: '#0369a1',
    colorFondo: '#f0f9ff',
    colorBorde: '#bae6fd',
    colorTexto: '#075985',
    iconoTipo: 'agua',
  },

  // 3. INTERNET, TELEFONÍA FIJA Y TELEVISIÓN
  {
    codigo: 'TELMEX',
    nombre: 'Telmex - Telefonía e Internet Infinitum',
    categoria: 'Telecomunicaciones',
    categoriaId: 'internet_tv',
    comisionRecomendada: 12,
    permiteVencidos: true,
    formatoReferencia: 'Número de teléfono a 10 dígitos o código de barras',
    colorPrimario: '#005ba4',
    colorFondo: '#f0f7ff',
    colorBorde: '#93c5fd',
    colorTexto: '#1e40af',
    iconoTipo: 'telmex',
  },
  {
    codigo: 'IZZI',
    nombre: 'Izzi Telecom - Cable, Internet y Telefonía',
    categoria: 'Televisión e Internet',
    categoriaId: 'internet_tv',
    comisionRecomendada: 12,
    permiteVencidos: true,
    formatoReferencia: 'Referencia única de suscriptor a 8 o 10 dígitos',
    colorPrimario: '#e11d48',
    colorFondo: '#fff1f2',
    colorBorde: '#fecdd3',
    colorTexto: '#9f1239',
    iconoTipo: 'izzi',
  },
  {
    codigo: 'SKY',
    nombre: 'Sky México / VeTV Satelital',
    categoria: 'Televisión Satelital',
    categoriaId: 'internet_tv',
    comisionRecomendada: 12,
    permiteVencidos: true,
    formatoReferencia: 'Número de cuenta inteligente de 12 dígitos',
    colorPrimario: '#1e3a8a',
    colorFondo: '#eff6ff',
    colorBorde: '#bfdbfe',
    colorTexto: '#1e3a8a',
    iconoTipo: 'sky',
  },
  {
    codigo: 'TOTALPLAY',
    nombre: 'Totalplay Telecomunicaciones Fibra Óptica',
    categoria: 'Televisión e Internet',
    categoriaId: 'internet_tv',
    comisionRecomendada: 12,
    permiteVencidos: false,
    formatoReferencia: 'Número de cuenta Totalplay a 10 dígitos',
    colorPrimario: '#4f46e5',
    colorFondo: '#eef2ff',
    colorBorde: '#c7d2fe',
    colorTexto: '#3730a3',
    iconoTipo: 'totalplay',
  },
  {
    codigo: 'MEGACABLE',
    nombre: 'Megacable Comunicaciones',
    categoria: 'Televisión e Internet',
    categoriaId: 'internet_tv',
    comisionRecomendada: 12,
    permiteVencidos: true,
    formatoReferencia: 'Número de suscriptor de 10 dígitos',
    colorPrimario: '#0284c7',
    colorFondo: '#f0f9ff',
    colorBorde: '#7dd3fc',
    colorTexto: '#0369a1',
    iconoTipo: 'megacable',
  },
  {
    codigo: 'DISH',
    nombre: 'Dish México Televisión Satelital',
    categoria: 'Televisión Satelital',
    categoriaId: 'internet_tv',
    comisionRecomendada: 12,
    permiteVencidos: true,
    formatoReferencia: 'Número de cliente de 10 a 14 dígitos',
    colorPrimario: '#dc2626',
    colorFondo: '#fef2f2',
    colorBorde: '#fca5a5',
    colorTexto: '#991b1b',
    iconoTipo: 'dish',
  },

  // 4. GAS NATURAL
  {
    codigo: 'NATURGY',
    nombre: 'Naturgy México - Gas Natural',
    categoria: 'Gas Natural',
    categoriaId: 'gas',
    comisionRecomendada: 14,
    permiteVencidos: false,
    formatoReferencia: 'Referencia bancaria o código de barras del recibo',
    colorPrimario: '#d97706',
    colorFondo: '#fffbeb',
    colorBorde: '#fde68a',
    colorTexto: '#92400e',
    iconoTipo: 'naturgy',
  },
  {
    codigo: 'ENGIE',
    nombre: 'Engie MaxiGas Natural',
    categoria: 'Gas Natural',
    categoriaId: 'gas',
    comisionRecomendada: 14,
    permiteVencidos: false,
    formatoReferencia: 'Referencia de pago del estado de cuenta',
    colorPrimario: '#0284c7',
    colorFondo: '#f0f9ff',
    colorBorde: '#7dd3fc',
    colorTexto: '#0369a1',
    iconoTipo: 'gas',
  },

  // 5. PEAJE Y TAGS
  {
    codigo: 'TAG_PASE',
    nombre: 'PASE Urbano - Recarga de TAG Telepeaje',
    categoria: 'Peaje y Autopistas',
    categoriaId: 'peaje',
    comisionRecomendada: 10,
    permiteVencidos: true,
    formatoReferencia: 'Número de TAG a 12 dígitos (IMEX / PASE)',
    colorPrimario: '#2563eb',
    colorFondo: '#eff6ff',
    colorBorde: '#bfdbfe',
    colorTexto: '#1d4ed8',
    iconoTipo: 'peaje',
  },
  {
    codigo: 'TAG_TELEVIA',
    nombre: 'TeleVía - Tag Telepeaje Carretero',
    categoria: 'Peaje y Autopistas',
    categoriaId: 'peaje',
    comisionRecomendada: 10,
    permiteVencidos: true,
    formatoReferencia: 'Código alfanumérico del TAG',
    colorPrimario: '#059669',
    colorFondo: '#ecfdf5',
    colorBorde: '#a7f3d0',
    colorTexto: '#065f46',
    iconoTipo: 'peaje',
  },

  // 6. VENTAS POR CATÁLOGO
  {
    codigo: 'AVON',
    nombre: 'Avon Cosméticos México',
    categoria: 'Venta por Catálogo',
    categoriaId: 'catalogo',
    comisionRecomendada: 12,
    permiteVencidos: true,
    formatoReferencia: 'Registro de consejera / orden de compra',
    colorPrimario: '#db2777',
    colorFondo: '#fdf2f8',
    colorBorde: '#fbcfe8',
    colorTexto: '#9d174d',
    iconoTipo: 'avon',
  },
  {
    codigo: 'JAFRA',
    nombre: 'Jafra Cosmetics',
    categoria: 'Venta por Catálogo',
    categoriaId: 'catalogo',
    comisionRecomendada: 12,
    permiteVencidos: true,
    formatoReferencia: 'Número de consultora y dígito verificador',
    colorPrimario: '#9333ea',
    colorFondo: '#faf5ff',
    colorBorde: '#e9d5ff',
    colorTexto: '#6b21a8',
    iconoTipo: 'jafra',
  },
  {
    codigo: 'MARY_KAY',
    nombre: 'Mary Kay México',
    categoria: 'Venta por Catálogo',
    categoriaId: 'catalogo',
    comisionRecomendada: 12,
    permiteVencidos: true,
    formatoReferencia: 'Número de consultora de belleza',
    colorPrimario: '#ec4899',
    colorFondo: '#fdf2f8',
    colorBorde: '#fbcfe8',
    colorTexto: '#9d174d',
    iconoTipo: 'marykay',
  },
  {
    codigo: 'BETTERWARE',
    nombre: 'Betterware México',
    categoria: 'Venta por Catálogo',
    categoriaId: 'catalogo',
    comisionRecomendada: 12,
    permiteVencidos: true,
    formatoReferencia: 'Código de asociada o distribuidora',
    colorPrimario: '#0284c7',
    colorFondo: '#f0f9ff',
    colorBorde: '#7dd3fc',
    colorTexto: '#0369a1',
    iconoTipo: 'generico',
  },

  // 7. PINES Y ENTRETENIMIENTO DIGITAL
  {
    codigo: 'NETFLIX',
    nombre: 'Netflix Tarjeta de Regalo Digital',
    categoria: 'Entretenimiento',
    categoriaId: 'entretenimiento',
    comisionRecomendada: 10,
    permiteVencidos: true,
    formatoReferencia: 'Monto fijo prepagado',
    colorPrimario: '#e50914',
    colorFondo: '#fef2f2',
    colorBorde: '#fca5a5',
    colorTexto: '#b91c1c',
    iconoTipo: 'netflix',
  },
  {
    codigo: 'SPOTIFY',
    nombre: 'Spotify Premium México',
    categoria: 'Entretenimiento',
    categoriaId: 'entretenimiento',
    comisionRecomendada: 10,
    permiteVencidos: true,
    formatoReferencia: 'Suscripción prepago mensual o trimestral',
    colorPrimario: '#1db954',
    colorFondo: '#f0fdf4',
    colorBorde: '#86efac',
    colorTexto: '#15803d',
    iconoTipo: 'spotify',
  },
  {
    codigo: 'PLAYSTATION',
    nombre: 'PlayStation Network Store Pin',
    categoria: 'Entretenimiento',
    categoriaId: 'entretenimiento',
    comisionRecomendada: 15,
    permiteVencidos: true,
    formatoReferencia: 'Pin digital de descarga directa',
    colorPrimario: '#003791',
    colorFondo: '#eff6ff',
    colorBorde: '#93c5fd',
    colorTexto: '#1e40af',
    iconoTipo: 'playstation',
  },
  {
    codigo: 'XBOX',
    nombre: 'Xbox Game Pass / Microsoft Store',
    categoria: 'Entretenimiento',
    categoriaId: 'entretenimiento',
    comisionRecomendada: 15,
    permiteVencidos: true,
    formatoReferencia: 'Código digital de canje',
    colorPrimario: '#107c10',
    colorFondo: '#f0fdf4',
    colorBorde: '#86efac',
    colorTexto: '#15803d',
    iconoTipo: 'xbox',
  },

  // 8. GOBIERNO Y CONTRIBUCIONES
  {
    codigo: 'GOB_CDMX',
    nombre: 'Secretaría de Finanzas CDMX (Predial / Tenencia / Licencias)',
    categoria: 'Gobierno',
    categoriaId: 'gobierno',
    comisionRecomendada: 15,
    permiteVencidos: false,
    formatoReferencia: 'Línea de captura de 20 dígitos',
    colorPrimario: '#047857',
    colorFondo: '#ecfdf5',
    colorBorde: '#a7f3d0',
    colorTexto: '#065f46',
    iconoTipo: 'gobierno',
  },
  {
    codigo: 'INFONAVIT',
    nombre: 'Infonavit - Aportaciones y Crédito',
    categoria: 'Gobierno',
    categoriaId: 'gobierno',
    comisionRecomendada: 15,
    permiteVencidos: false,
    formatoReferencia: 'Número de crédito a 10 dígitos',
    colorPrimario: '#b91c1c',
    colorFondo: '#fef2f2',
    colorBorde: '#fca5a5',
    colorTexto: '#991b1b',
    iconoTipo: 'gobierno',
  },
];

/**
 * Combina el catálogo retornado por la base de datos o el API con la colección visual ampliada.
 */
export function combinarCatalogosServicios(catalogoApi?: CatalogoServicioDto[]): ServicioVisual[] {
  if (!catalogoApi || catalogoApi.length === 0) {
    return SERVICIOS_PREDETERMINADOS;
  }

  const mapaExistentes = new Map<string, ServicioVisual>();

  // Cargar base predeterminada
  SERVICIOS_PREDETERMINADOS.forEach((s) => {
    mapaExistentes.set(s.codigo.toUpperCase(), s);
  });

  // Reemplazar o agregar los retornados por la API
  catalogoApi.forEach((apiItem) => {
    const codUpper = apiItem.codigo.toUpperCase();
    const previo = mapaExistentes.get(codUpper);

    if (previo) {
      mapaExistentes.set(codUpper, {
        ...previo,
        nombre: apiItem.nombre || previo.nombre,
        categoria: apiItem.categoria || previo.categoria,
        comisionRecomendada: apiItem.comisionRecomendada ?? previo.comisionRecomendada,
        permiteVencidos: apiItem.permiteVencidos ?? previo.permiteVencidos,
        formatoReferencia: apiItem.formatoReferencia || previo.formatoReferencia,
      });
    } else {
      // Determinar categoría adecuada
      let categoriaId: ServicioVisual['categoriaId'] = 'internet_tv';
      const catNorm = (apiItem.categoria || '').toLowerCase();
      if (catNorm.includes('elect') || catNorm.includes('luz')) categoriaId = 'luz';
      else if (catNorm.includes('agua')) categoriaId = 'agua';
      else if (catNorm.includes('gas')) categoriaId = 'gas';
      else if (catNorm.includes('peaje') || catNorm.includes('tag')) categoriaId = 'peaje';
      else if (catNorm.includes('catalogo') || catNorm.includes('cosm')) categoriaId = 'catalogo';
      else if (catNorm.includes('gob') || catNorm.includes('impuest')) categoriaId = 'gobierno';
      else if (catNorm.includes('tel') || catNorm.includes('movil')) categoriaId = 'telefonia';

      mapaExistentes.set(codUpper, {
        codigo: apiItem.codigo,
        nombre: apiItem.nombre,
        categoria: apiItem.categoria,
        categoriaId,
        comisionRecomendada: apiItem.comisionRecomendada || 12,
        permiteVencidos: apiItem.permiteVencidos ?? true,
        formatoReferencia: apiItem.formatoReferencia || 'Referencia de recibo',
        colorPrimario: '#0284c7',
        colorFondo: '#f0f9ff',
        colorBorde: '#bae6fd',
        colorTexto: '#0369a1',
        iconoTipo: 'generico',
      });
    }
  });

  return Array.from(mapaExistentes.values());
}
