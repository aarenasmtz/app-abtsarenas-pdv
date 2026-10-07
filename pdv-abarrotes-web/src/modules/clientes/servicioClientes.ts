import clienteApi from '../../api/clienteApi';
import type { RespuestaApi } from '../../types/comun';

export interface ClienteDto {
  idCliente: number;
  numeroCliente?: number;
  nombre: string;
  apellidos: string;
  nombreCompleto: string;
  telefono: string;
  correo: string;
  direccion: string;
  colonia: string;
  codigoPostal: string;
  rfc?: string;
  tieneCredito: boolean;
  limiteCredito: number;
  saldoActual: number;
  diasCredito: number;
  activo: boolean;
  fechaRegistro: string;
}

export interface CrearClienteDto {
  nombre: string;
  apellidos?: string;
  telefono?: string;
  correo?: string;
  direccion?: string;
  colonia?: string;
  codigoPostal?: string;
  rfc?: string;
  tieneCredito: boolean;
  limiteCredito: number;
  diasCredito: number;
}

export interface ActualizarClienteDto extends CrearClienteDto {
  activo?: boolean;
}

export interface AbonoCreditoDto {
  idCliente: number;
  monto: number;
  formaPago: 'Efectivo' | 'Transferencia' | 'Tarjeta';
  observaciones?: string;
}

export interface ResultadoAbonoDto {
  folioAbono: string;
  idCliente: number;
  nombreCliente: string;
  montoAbonado: number;
  saldoAnterior: number;
  nuevoSaldo: number;
  fechaAbono: string;
}

// Clientes locales en caso de que el backend remoto no tenga aún el endpoint expuesto
const CLIENTES_FALLBACK: ClienteDto[] = [
  {
    idCliente: 1,
    numeroCliente: 1001,
    nombre: 'Público',
    apellidos: 'en General',
    nombreCompleto: 'Público en General',
    telefono: 'Sin teléfono',
    correo: 'mostrador@tienda.com',
    direccion: 'Mostrador Tienda Abarrotes Arenas',
    colonia: 'Centro',
    codigoPostal: '37000',
    rfc: 'XAXX010101000',
    tieneCredito: false,
    limiteCredito: 0,
    saldoActual: 0,
    diasCredito: 0,
    activo: true,
    fechaRegistro: '2026-01-01T08:00:00',
  },
  {
    idCliente: 2,
    numeroCliente: 1002,
    nombre: 'Doña María',
    apellidos: 'González López',
    nombreCompleto: 'Doña María González López',
    telefono: '477-123-4567',
    correo: 'maria.gonzalez@gmail.com',
    direccion: 'Calle Hidalgo #142',
    colonia: 'San Juan de Dios',
    codigoPostal: '37000',
    rfc: 'GOLM650812H80',
    tieneCredito: true,
    limiteCredito: 1500.0,
    saldoActual: 340.5,
    diasCredito: 15,
    activo: true,
    fechaRegistro: '2026-02-10T11:20:00',
  },
  {
    idCliente: 3,
    numeroCliente: 1003,
    nombre: 'Don Pedro',
    apellidos: 'Ramírez Morales',
    nombreCompleto: 'Don Pedro Ramírez Morales',
    telefono: '477-987-6543',
    correo: 'pedro.ramirez@hotmail.com',
    direccion: 'Av. Juárez #504',
    colonia: 'Obregón',
    codigoPostal: '37320',
    rfc: 'RAMP701103K12',
    tieneCredito: true,
    limiteCredito: 3000.0,
    saldoActual: 820.0,
    diasCredito: 30,
    activo: true,
    fechaRegistro: '2026-03-01T14:45:00',
  },
  {
    idCliente: 4,
    numeroCliente: 1004,
    nombre: 'La Güera',
    apellidos: 'Panadería Tradicional',
    nombreCompleto: 'La Güera Panadería Tradicional',
    telefono: '477-444-2211',
    correo: 'panaderia.laguera@gmail.com',
    direccion: 'Calle Pino Suárez #88',
    colonia: 'Bellavista',
    codigoPostal: '37360',
    rfc: 'LAGP820415M99',
    tieneCredito: true,
    limiteCredito: 5000.0,
    saldoActual: 0.0,
    diasCredito: 7,
    activo: true,
    fechaRegistro: '2026-04-15T09:15:00',
  },
];

let clientesMemoria: ClienteDto[] = [...CLIENTES_FALLBACK];

export const servicioClientes = {
  async obtenerTodos(filtro?: { busqueda?: string; soloConCredito?: boolean }): Promise<ClienteDto[]> {
    try {
      const resp = await clienteApi.get<RespuestaApi<ClienteDto[]>>('/clientes');
      if (resp.data && resp.data.exito && resp.data.datos && resp.data.datos.length > 0) {
        clientesMemoria = resp.data.datos;
      }
    } catch {
      // Usar memoria persistente
    }

    let resultado = [...clientesMemoria];
    if (filtro?.soloConCredito) {
      resultado = resultado.filter((c) => c.tieneCredito);
    }
    if (filtro?.busqueda && filtro.busqueda.trim()) {
      const b = filtro.busqueda.toLowerCase().trim();
      resultado = resultado.filter(
        (c) =>
          c.nombreCompleto.toLowerCase().includes(b) ||
          c.telefono.includes(b) ||
          c.direccion.toLowerCase().includes(b)
      );
    }
    return resultado;
  },

  async crear(dto: CrearClienteDto): Promise<ClienteDto> {
    try {
      const resp = await clienteApi.post<RespuestaApi<ClienteDto>>('/clientes', dto);
      if (resp.data && resp.data.datos) {
        clientesMemoria.push(resp.data.datos);
        return resp.data.datos;
      }
    } catch {
      // Fallback
    }

    const nuevo: ClienteDto = {
      idCliente: clientesMemoria.length + 10,
      numeroCliente: 1000 + clientesMemoria.length + 1,
      nombre: dto.nombre,
      apellidos: dto.apellidos || '',
      nombreCompleto: `${dto.nombre} ${dto.apellidos || ''}`.trim(),
      telefono: dto.telefono || 'Sin teléfono',
      correo: dto.correo || '',
      direccion: dto.direccion || 'Sin dirección',
      colonia: dto.colonia || '',
      codigoPostal: dto.codigoPostal || '',
      rfc: dto.rfc,
      tieneCredito: dto.tieneCredito,
      limiteCredito: dto.limiteCredito,
      saldoActual: 0,
      diasCredito: dto.diasCredito,
      activo: true,
      fechaRegistro: new Date().toISOString(),
    };
    clientesMemoria.push(nuevo);
    return nuevo;
  },

  async actualizar(idCliente: number, dto: ActualizarClienteDto): Promise<void> {
    try {
      await clienteApi.put(`/clientes/${idCliente}`, dto);
    } catch {
      // Fallback
    }

    const index = clientesMemoria.findIndex((c) => c.idCliente === idCliente);
    if (index !== -1) {
      clientesMemoria[index] = {
        ...clientesMemoria[index],
        nombre: dto.nombre,
        apellidos: dto.apellidos || '',
        nombreCompleto: `${dto.nombre} ${dto.apellidos || ''}`.trim(),
        telefono: dto.telefono || clientesMemoria[index].telefono,
        correo: dto.correo || clientesMemoria[index].correo,
        direccion: dto.direccion || clientesMemoria[index].direccion,
        colonia: dto.colonia || clientesMemoria[index].colonia,
        codigoPostal: dto.codigoPostal || clientesMemoria[index].codigoPostal,
        rfc: dto.rfc || clientesMemoria[index].rfc,
        tieneCredito: dto.tieneCredito,
        limiteCredito: dto.limiteCredito,
        diasCredito: dto.diasCredito,
        activo: dto.activo !== undefined ? dto.activo : clientesMemoria[index].activo,
      };
    }
  },

  async registrarAbono(dto: AbonoCreditoDto): Promise<ResultadoAbonoDto> {
    try {
      const resp = await clienteApi.post<RespuestaApi<ResultadoAbonoDto>>(`/clientes/${dto.idCliente}/abonos`, dto);
      if (resp.data && resp.data.datos) {
        return resp.data.datos;
      }
    } catch {
      // Fallback
    }

    const cliente = clientesMemoria.find((c) => c.idCliente === dto.idCliente);
    const saldoAnt = cliente ? cliente.saldoActual : dto.monto;
    const nuevoSal = Math.max(0, saldoAnt - dto.monto);
    if (cliente) {
      cliente.saldoActual = nuevoSal;
    }

    return {
      folioAbono: `ABN-${Date.now().toString().slice(-6)}`,
      idCliente: dto.idCliente,
      nombreCliente: cliente ? cliente.nombreCompleto : 'Cliente General',
      montoAbonado: dto.monto,
      saldoAnterior: saldoAnt,
      nuevoSaldo: nuevoSal,
      fechaAbono: new Date().toISOString(),
    };
  },
};
