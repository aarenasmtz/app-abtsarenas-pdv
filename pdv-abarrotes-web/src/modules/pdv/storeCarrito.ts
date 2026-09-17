import { create } from 'zustand';
import type { ItemCarrito } from '../../types/modelos';

interface EstadoCarritoPdv {
  articulos: ItemCarrito[];
  idClienteSeleccionado: number;
  nombreCliente: string;
  identificadorEnEspera?: string;
  
  // Acciones
  agregarArticulo: (articulo: Omit<ItemCarrito, 'subtotal'>) => void;
  eliminarArticulo: (idProducto: number) => void;
  actualizarCantidad: (idProducto: number, nuevaCantidad: number) => void;
  limpiarCarrito: () => void;
  establecerCliente: (idCliente: number, nombreCliente: string) => void;
  cargarTicketEnEspera: (articulos: ItemCarrito[], identificador: string) => void;

  // Totales calculados
  obtenerTotal: () => number;
  obtenerCantidadArticulos: () => number;
}

export const useStoreCarritoPdv = create<EstadoCarritoPdv>((set, get) => ({
  articulos: [],
  idClienteSeleccionado: 1, // 1 = "Público en General / Mostrador" (Regla innegociable)
  nombreCliente: 'Público en General (Mostrador)',
  identificadorEnEspera: undefined,

  agregarArticulo: (nuevoArticulo) => {
    set((estado) => {
      const indiceExistente = estado.articulos.findIndex(
        (a) => a.idProducto === nuevoArticulo.idProducto
      );

      if (indiceExistente >= 0) {
        // Incrementar cantidad
        const articulosActualizados = [...estado.articulos];
        const actual = articulosActualizados[indiceExistente];
        const cantidadFinal = actual.cantidad + (nuevoArticulo.cantidad || 1);
        
        articulosActualizados[indiceExistente] = {
          ...actual,
          cantidad: cantidadFinal,
          subtotal: Math.round(cantidadFinal * actual.precioUnitario * 100) / 100,
        };

        return { articulos: articulosActualizados };
      } else {
        // Agregar nueva partida al inicio de la lista
        const cantidad = nuevoArticulo.cantidad || 1;
        const partida: ItemCarrito = {
          ...nuevoArticulo,
          cantidad,
          subtotal: Math.round(cantidad * nuevoArticulo.precioUnitario * 100) / 100,
        };

        return { articulos: [partida, ...estado.articulos] };
      }
    });
  },

  eliminarArticulo: (idProducto) => {
    set((estado) => ({
      articulos: estado.articulos.filter((a) => a.idProducto !== idProducto),
    }));
  },

  actualizarCantidad: (idProducto, nuevaCantidad) => {
    if (nuevaCantidad <= 0) {
      get().eliminarArticulo(idProducto);
      return;
    }

    set((estado) => ({
      articulos: estado.articulos.map((a) => {
        if (a.idProducto === idProducto) {
          return {
            ...a,
            cantidad: nuevaCantidad,
            subtotal: Math.round(nuevaCantidad * a.precioUnitario * 100) / 100,
          };
        }
        return a;
      }),
    }));
  },

  limpiarCarrito: () => {
    set({
      articulos: [],
      idClienteSeleccionado: 1,
      nombreCliente: 'Público en General (Mostrador)',
      identificadorEnEspera: undefined,
    });
  },

  establecerCliente: (idCliente, nombreCliente) => {
    set({ idClienteSeleccionado: idCliente, nombreCliente });
  },

  cargarTicketEnEspera: (articulos, identificador) => {
    set({
      articulos,
      identificadorEnEspera: identificador,
    });
  },

  obtenerTotal: () => {
    const articulos = get().articulos;
    const total = articulos.reduce((acumulado, item) => acumulado + item.subtotal, 0);
    return Math.round(total * 100) / 100;
  },

  obtenerCantidadArticulos: () => {
    const articulos = get().articulos;
    return articulos.reduce((acumulado, item) => acumulado + item.cantidad, 0);
  },
}));
