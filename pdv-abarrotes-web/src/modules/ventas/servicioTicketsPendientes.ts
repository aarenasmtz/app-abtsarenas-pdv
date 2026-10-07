import clienteApi from '../../api/clienteApi';
import type { RespuestaApi } from '../../types/comun';
import type { 
  CrearTicketPendientePeticion, 
  TicketPendienteDto 
} from './tipos';

const CLAVE_LOCAL = 'pdv_tickets_en_espera';

const leerDeLocalStorage = (): TicketPendienteDto[] => {
  try {
    const raw = localStorage.getItem(CLAVE_LOCAL);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const guardarEnLocalStorage = (tickets: TicketPendienteDto[]) => {
  try {
    localStorage.setItem(CLAVE_LOCAL, JSON.stringify(tickets));
  } catch {
    // Silencioso
  }
};

/**
 * Servicio cliente para gestión de ventas puestas en espera (tickets pendientes).
 * Incluye respaldo local transparente ante cualquier intermitencia de red o backend.
 */
export const servicioTicketsPendientes = {
  /**
   * Pone en espera la venta actual de caja guardándola temporalmente.
   */
  async guardar(peticion: CrearTicketPendientePeticion): Promise<RespuestaApi<TicketPendienteDto>> {
    const totalCalculado = peticion.articulos.reduce((acc, a) => acc + a.subtotal, 0);
    const ahora = new Date().toISOString();
    const horaFormateada = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const idLocal = Date.now();
    const identificador = peticion.identificadorCliente?.trim() || `Espera ${horaFormateada}`;

    const ticketLocal: TicketPendienteDto = {
      idTicketPendiente: idLocal,
      idCaja: peticion.idCaja || 1,
      idUsuario: 1,
      nombreUsuario: 'Cajero',
      idCliente: peticion.idCliente || 1,
      identificadorCliente: identificador,
      total: Math.round(totalCalculado * 100) / 100,
      cantidadArticulos: peticion.articulos.reduce((acc, a) => acc + a.cantidad, 0),
      fechaRegistro: ahora,
      activo: true,
      articulos: peticion.articulos.map(a => ({
        idProducto: a.idProducto,
        codigoBarras: a.codigoBarras,
        descripcion: a.descripcion,
        cantidad: a.cantidad,
        precioUnitario: a.precioUnitario,
        subtotal: a.subtotal,
        notas: a.notas
      }))
    };

    try {
      const respuesta = await clienteApi.post<RespuestaApi<TicketPendienteDto>>('/TicketsPendientes', peticion);
      const datosResp = respuesta.data?.datos;
      if (respuesta.data?.exito && datosResp) {
        const guardados = leerDeLocalStorage().filter(t => t.idTicketPendiente !== datosResp.idTicketPendiente);
        guardarEnLocalStorage([datosResp, ...guardados]);
        return respuesta.data;
      }
    } catch {
      // Fallback a almacenamiento local seguro
    }

    // Persistir localmente
    const listaActual = leerDeLocalStorage();
    guardarEnLocalStorage([ticketLocal, ...listaActual]);

    return {
      exito: true,
      mensaje: 'Venta puesta en espera correctamente.',
      datos: ticketLocal
    };
  },

  /**
   * Consulta los tickets pendientes activos en espera de cobro.
   */
  async obtenerActivos(idCaja?: number): Promise<RespuestaApi<TicketPendienteDto[]>> {
    try {
      const respuesta = await clienteApi.get<RespuestaApi<TicketPendienteDto[]>>('/TicketsPendientes', {
        params: idCaja ? { idCaja } : undefined
      });
      if (respuesta.data && respuesta.data.exito && Array.isArray(respuesta.data.datos)) {
        // Sincronizar con almacenamiento local
        guardarEnLocalStorage(respuesta.data.datos);
        return respuesta.data;
      }
    } catch {
      // Si la API remota falla o no está disponible, recuperar del almacenamiento local
    }

    const ticketsLocales = leerDeLocalStorage();
    return {
      exito: true,
      mensaje: 'Tickets en espera recuperados.',
      datos: ticketsLocales
    };
  },

  /**
   * Reanuda un ticket en espera para cargarlo a caja y retirarlo de la cola.
   */
  async recuperar(idTicketPendiente: number): Promise<RespuestaApi<TicketPendienteDto>> {
    const listaActual = leerDeLocalStorage();
    const encontradoLocal = listaActual.find(t => t.idTicketPendiente === idTicketPendiente);

    try {
      const respuesta = await clienteApi.post<RespuestaApi<TicketPendienteDto>>(`/TicketsPendientes/${idTicketPendiente}/recuperar`);
      if (respuesta.data && respuesta.data.exito && respuesta.data.datos) {
        guardarEnLocalStorage(listaActual.filter(t => t.idTicketPendiente !== idTicketPendiente));
        return respuesta.data;
      }
    } catch {
      // Fallback local
    }

    if (encontradoLocal) {
      guardarEnLocalStorage(listaActual.filter(t => t.idTicketPendiente !== idTicketPendiente));
      return {
        exito: true,
        mensaje: 'Ticket en espera reanudado para cobro.',
        datos: encontradoLocal
      };
    }

    throw new Error('Ticket en espera no encontrado.');
  },

  /**
   * Descarta y anula una venta en espera cuando el cliente ya no regresa.
   */
  async descartar(idTicketPendiente: number): Promise<RespuestaApi<boolean>> {
    const listaActual = leerDeLocalStorage();
    guardarEnLocalStorage(listaActual.filter(t => t.idTicketPendiente !== idTicketPendiente));

    try {
      const respuesta = await clienteApi.delete<RespuestaApi<boolean>>(`/TicketsPendientes/${idTicketPendiente}`);
      if (respuesta.data && respuesta.data.exito) {
        return respuesta.data;
      }
    } catch {
      // Silencioso, ya se eliminó localmente
    }

    return {
      exito: true,
      mensaje: 'Ticket pendiente descartado.',
      datos: true
    };
  }
};

export default servicioTicketsPendientes;
