import clienteApi from '../../api/clienteApi';
import type { RespuestaApi, ResultadoPaginado, FiltroPaginacion } from '../../types/comun';

export interface RegistroAuditoria {
  idAuditoria: number;
  tabla: string;
  idRegistro: number;
  accion: string;
  valorAnterior?: string;
  valorNuevo?: string;
  usuario: string;
  fechaHora: string;
  direccionIp?: string;
  [key: string]: unknown;
}

export interface FiltroAuditoria extends FiltroPaginacion {
  tabla?: string;
  accion?: string;
  usuario?: string;
}

export const servicioAuditoria = {
  consultarBitacora: async (filtro: FiltroAuditoria): Promise<ResultadoPaginado<RegistroAuditoria>> => {
    const respuesta = await clienteApi.get<RespuestaApi<ResultadoPaginado<RegistroAuditoria>>>('/auditoria', {
      params: {
        pagina: filtro.pagina,
        registrosPorPagina: filtro.registrosPorPagina,
        busqueda: filtro.busqueda,
        tabla: filtro.tabla,
        accion: filtro.accion,
        usuario: filtro.usuario,
      },
    });

    if (!respuesta.data.exito || !respuesta.data.datos) {
      throw new Error(respuesta.data.mensaje || 'Error al consultar la bitácora de auditoría');
    }

    return respuesta.data.datos;
  },
};
