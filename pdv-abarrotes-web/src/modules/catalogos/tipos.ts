/**
 * Definiciones de tipos para catálogos generales en español.
 */

export interface CategoriaDto {
  idCategoria: number;
  descripcion: string;
  activo: boolean;
  totalProductos: number;
}

export interface MarcaDto {
  idMarca: number;
  descripcion: string;
  activo: boolean;
  totalProductos: number;
}

export interface UnidadMedidaDto {
  idUnidadMedida: number;
  nombre: string;
  abreviatura: string;
  permiteDecimales: boolean;
  factorConversion: number;
  activo: boolean;
}

export interface CrearActualizarCatalogoDto {
  descripcion: string;
  activo: boolean;
}
