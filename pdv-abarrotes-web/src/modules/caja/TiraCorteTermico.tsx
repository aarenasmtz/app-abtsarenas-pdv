import React from 'react';
import { Printer } from 'lucide-react';
import type { ResumenCorteDto } from './tiposCaja';

interface PropiedadesTiraCorteTermico {
  corte: ResumenCorteDto;
  anchoTicket?: '58mm' | '80mm';
  onCerrar?: () => void;
}

export const TiraCorteTermico: React.FC<PropiedadesTiraCorteTermico> = ({
  corte,
  anchoTicket = '80mm',
  onCerrar
}) => {
  const imprimir = () => {
    window.print();
  };

  const formatearFecha = (fechaStr: string) => {
    try {
      const f = new Date(fechaStr);
      return f.toLocaleString('es-MX', {
        dateStyle: 'short',
        timeStyle: 'medium'
      });
    } catch {
      return fechaStr;
    }
  };

  const estadoDiferencia = () => {
    if (corte.diferencia === 0) return 'CUADRADO (EXACTO)';
    if (corte.diferencia > 0) return `SOBRANTE (+$${corte.diferencia.toFixed(2)})`;
    return `FALTANTE (-$${Math.abs(corte.diferencia).toFixed(2)})`;
  };

  return (
    <div className="flex flex-col items-center">
      {/* Botón de impresión no visible en papel */}
      <div className="no-print mb-4 flex gap-3">
        <button
          type="button"
          onClick={imprimir}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-950/40"
        >
          <Printer className="w-5 h-5" />
          <span>Imprimir Tira Térmica</span>
        </button>
        {onCerrar && (
          <button
            type="button"
            onClick={onCerrar}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl"
          >
            Cerrar Vista
          </button>
        )}
      </div>

      {/* Contenedor de tira térmica */}
      <div
        className={`ticket-impresion bg-white text-black p-4 font-mono text-xs shadow-2xl rounded-sm ${
          anchoTicket === '58mm' ? 'w-[58mm] max-w-[58mm]' : 'w-[80mm] max-w-[80mm]'
        }`}
        style={{
          color: '#000000',
          backgroundColor: '#ffffff',
          fontFamily: 'Courier, monospace',
          lineHeight: '1.25'
        }}
      >
        {/* Encabezado */}
        <div className="text-center font-bold">
          <p className="text-base tracking-wider uppercase">ABARROTES ARENAS</p>
          <p className="text-[10px]">TIENDA DE CONVENIENCIA Y ABARROTES</p>
          <p className="text-[10px]">TUXPAN, VERACRUZ</p>
          <p className="mt-2 text-sm uppercase">
            *** CORTE DE CAJA {corte.tipoCorte} ***
          </p>
          <p className="text-[10px] uppercase text-gray-700">
            {corte.tipoCorte === 'X' ? 'LECTURA PRELIMINAR DE TURNO' : 'CIERRE DEFINITIVO DE TURNO'}
          </p>
        </div>

        <div className="border-b border-dashed border-black my-2" />

        {/* Metadatos */}
        <div className="text-[11px] space-y-0.5">
          <div className="flex justify-between">
            <span>Turno No:</span>
            <span className="font-bold">#{corte.idTurnoCaja}</span>
          </div>
          {corte.idCorteCaja && (
            <div className="flex justify-between">
              <span>Folio Corte:</span>
              <span className="font-bold">Z-{corte.idCorteCaja}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Terminal/Caja:</span>
            <span>{corte.nombreCaja}</span>
          </div>
          <div className="flex justify-between">
            <span>Cajero:</span>
            <span>{corte.nombreUsuario}</span>
          </div>
          <div className="flex justify-between">
            <span>Inicio Turno:</span>
            <span>{formatearFecha(corte.fechaInicio)}</span>
          </div>
          <div className="flex justify-between">
            <span>Fecha Corte:</span>
            <span>{formatearFecha(corte.fechaCorte)}</span>
          </div>
        </div>

        <div className="border-b border-dashed border-black my-2" />

        {/* Balance de Efectivo */}
        <div className="text-[11px] space-y-1">
          <p className="font-bold text-center underline">MOVIMIENTOS DE EFECTIVO</p>
          <div className="flex justify-between">
            <span>Fondo Inicial Caja:</span>
            <span>${corte.montoInicial.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>(+) Ventas Efectivo:</span>
            <span>${corte.ventasEfectivo.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>(+) Entradas Efectivo:</span>
            <span>${corte.entradasEfectivo.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>(-) Salidas Efectivo:</span>
            <span>-${corte.salidasEfectivo.toFixed(2)}</span>
          </div>
          <div className="border-t border-black my-1" />
          <div className="flex justify-between font-bold text-xs">
            <span>TOTAL ESPERADO EN CAJA:</span>
            <span>${corte.totalEsperadoEnCaja.toFixed(2)}</span>
          </div>

          {corte.tipoCorte === 'Z' && (
            <>
              <div className="flex justify-between font-bold">
                <span>Efectivo Contado:</span>
                <span>${corte.totalContado.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Diferencia Arqueo:</span>
                <span>{estadoDiferencia()}</span>
              </div>
            </>
          )}
        </div>

        <div className="border-b border-dashed border-black my-2" />

        {/* Otros métodos de pago */}
        <div className="text-[11px] space-y-0.5">
          <p className="font-bold text-center underline">VENTAS POR MÉTODO DE PAGO</p>
          <div className="flex justify-between">
            <span>Efectivo:</span>
            <span>${corte.ventasEfectivo.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tarjeta (Clip / Bancaria):</span>
            <span>${corte.ventasTarjeta.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Transferencia:</span>
            <span>${corte.ventasTransferencia.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Vales de Despensa:</span>
            <span>${corte.ventasVales.toFixed(2)}</span>
          </div>
          {corte.ventasCredito > 0 && (
            <div className="flex justify-between">
              <span>Crédito Tienda:</span>
              <span>${corte.ventasCredito.toFixed(2)}</span>
            </div>
          )}
          <div className="border-t border-black my-1" />
          <div className="flex justify-between font-bold">
            <span>TOTAL VENTAS TURNO:</span>
            <span>${corte.totalVentas.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tickets Cobrados:</span>
            <span className="font-bold">{corte.totalTransacciones}</span>
          </div>
        </div>

        {corte.observaciones && (
          <>
            <div className="border-b border-dashed border-black my-2" />
            <div className="text-[10px]">
              <p className="font-bold">Observaciones:</p>
              <p className="italic">{corte.observaciones}</p>
            </div>
          </>
        )}

        <div className="border-b border-dashed border-black my-4" />

        {/* Firmas */}
        <div className="pt-4 space-y-6 text-center text-[10px]">
          <div>
            <div className="border-b border-black w-40 mx-auto" />
            <p className="mt-1 font-bold">FIRMA DEL CAJERO</p>
            <p>{corte.nombreUsuario}</p>
          </div>
          <div>
            <div className="border-b border-black w-40 mx-auto" />
            <p className="mt-1 font-bold">FIRMA DEL SUPERVISOR</p>
            <p>AUTORIZÓ</p>
          </div>
        </div>

        <div className="text-center text-[9px] text-gray-600 mt-4">
          *** FIN DE TIRA DE AUDITORÍA ***
        </div>
      </div>
    </div>
  );
};

export default TiraCorteTermico;
