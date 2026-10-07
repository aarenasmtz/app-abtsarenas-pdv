import type { CompaniaTelefonicaDto } from './tiposServicios';

export interface CompaniaVisual extends CompaniaTelefonicaDto {
  colorPrimario: string;
  colorSecundario: string;
  colorFondo: string;
  colorTexto: string;
  colorBorde: string;
  subtitulo: string;
  iconoTipo: 'telcel' | 'movistar' | 'att' | 'bait' | 'unefon' | 'virgin' | 'pillofon' | 'diri' | 'generico';
}

export const COMPANIAS_PREDETERMINADAS: CompaniaVisual[] = [
  {
    codigo: 'TELCEL',
    nombre: 'Telcel',
    subtitulo: 'Amigo Sin Límite',
    colorPrimario: '#002f6c',
    colorSecundario: '#0066cc',
    colorFondo: '#f0f7ff',
    colorTexto: '#002f6c',
    colorBorde: '#93c5fd',
    iconoTipo: 'telcel',
    montosDisponibles: [10, 20, 30, 50, 80, 100, 150, 200, 300, 500],
  },
  {
    codigo: 'MOVISTAR',
    nombre: 'Movistar',
    subtitulo: 'Prepago Rollover',
    colorPrimario: '#00a9e0',
    colorSecundario: '#5bc500',
    colorFondo: '#f0fdf4',
    colorTexto: '#047857',
    colorBorde: '#86efac',
    iconoTipo: 'movistar',
    montosDisponibles: [10, 20, 30, 50, 60, 100, 120, 150, 200],
  },
  {
    codigo: 'ATT',
    nombre: 'AT&T',
    subtitulo: 'Más Móvil',
    colorPrimario: '#009fdb',
    colorSecundario: '#007ab8',
    colorFondo: '#f0f9ff',
    colorTexto: '#0284c7',
    colorBorde: '#7dd3fc',
    iconoTipo: 'att',
    montosDisponibles: [15, 20, 30, 50, 100, 150, 200, 300],
  },
  {
    codigo: 'BAIT',
    nombre: 'Bait',
    subtitulo: 'Internet y Telefonía',
    colorPrimario: '#ea580c',
    colorSecundario: '#c2410c',
    colorFondo: '#fff7ed',
    colorTexto: '#c2410c',
    colorBorde: '#fdba74',
    iconoTipo: 'bait',
    montosDisponibles: [20, 30, 50, 100, 120, 200, 300],
  },
  {
    codigo: 'UNEFON',
    nombre: 'Unefon',
    subtitulo: 'Ilimitado Prepago',
    colorPrimario: '#d97706',
    colorSecundario: '#b45309',
    colorFondo: '#fffbeb',
    colorTexto: '#b45309',
    colorBorde: '#fde68a',
    iconoTipo: 'unefon',
    montosDisponibles: [20, 30, 50, 70, 100, 150, 200, 300],
  },
  {
    codigo: 'VIRGIN',
    nombre: 'Virgin Mobile',
    subtitulo: 'Sin Contratos',
    colorPrimario: '#dc2626',
    colorSecundario: '#991b1b',
    colorFondo: '#fef2f2',
    colorTexto: '#b91c1c',
    colorBorde: '#fca5a5',
    iconoTipo: 'virgin',
    montosDisponibles: [20, 30, 50, 100, 150, 200],
  },
  {
    codigo: 'PILLOFON',
    nombre: 'Pillofón',
    subtitulo: 'Red Altán 4.5G',
    colorPrimario: '#db2777',
    colorSecundario: '#be185d',
    colorFondo: '#fdf2f8',
    colorTexto: '#be185d',
    colorBorde: '#f9a8d4',
    iconoTipo: 'pillofon',
    montosDisponibles: [30, 50, 100, 150, 200],
  },
  {
    codigo: 'DIRI',
    nombre: 'Diri',
    subtitulo: 'Telefonía Móvil',
    colorPrimario: '#7c3aed',
    colorSecundario: '#6d28d9',
    colorFondo: '#f5f3ff',
    colorTexto: '#6d28d9',
    colorBorde: '#c4b5fd',
    iconoTipo: 'diri',
    montosDisponibles: [50, 100, 150, 200],
  },
];

/**
 * Combina las compañías retornadas por la API o base de datos con los datos visuales predeterminados.
 */
export function enriquecerCompanias(companiasApi?: CompaniaTelefonicaDto[]): CompaniaVisual[] {
  if (!companiasApi || companiasApi.length === 0) {
    return COMPANIAS_PREDETERMINADAS;
  }

  return companiasApi.map((c) => {
    const codNorm = c.codigo.toUpperCase().replace(/\s+/g, '');
    const pre = COMPANIAS_PREDETERMINADAS.find(
      (p) => p.codigo.toUpperCase() === codNorm || codNorm.includes(p.codigo) || p.codigo.includes(codNorm)
    );

    if (pre) {
      return {
        ...pre,
        codigo: c.codigo,
        nombre: c.nombre || pre.nombre,
        montosDisponibles: c.montosDisponibles?.length ? c.montosDisponibles : pre.montosDisponibles,
      };
    }

    return {
      codigo: c.codigo,
      nombre: c.nombre,
      subtitulo: 'Telefonía Móvil',
      colorPrimario: '#0284c7',
      colorSecundario: '#0369a1',
      colorFondo: '#f0f9ff',
      colorTexto: '#0369a1',
      colorBorde: '#bae6fd',
      iconoTipo: 'generico',
      montosDisponibles: c.montosDisponibles?.length ? c.montosDisponibles : [20, 30, 50, 100, 200, 500],
    };
  });
}
