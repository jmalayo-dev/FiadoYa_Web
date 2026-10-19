import { ArrowDown, CheckCheck, ReceiptText, Undo2 } from 'lucide-react';
import type { Movimiento } from '@/api/tipos';
import { Moneda } from '@/components/Moneda';
import { Insignia } from '@/components/ui/Insignia';
import { Tarjeta } from '@/components/ui/Tarjeta';
import { formatoFecha } from '@/lib/formato';

const METODOS = { EFECTIVO: 'En efectivo', YAPE_PLIN: 'Yape / Plin', TRANSFERENCIA: 'Transferencia' } as const;

/** Lista de movimientos del estado de cuenta en lenguaje simple (+ fiado en rojo, − pagos en verde). */
export function MovimientosCuenta({ movimientos, paraCliente }: { movimientos: Movimiento[]; paraCliente?: boolean }) {
  if (movimientos.length === 0) {
    return <Tarjeta className="p-6 text-center text-sm text-tinta-2">Todavía no hay movimientos.</Tarjeta>;
  }
  return (
    <Tarjeta className="divide-y divide-borde overflow-hidden">
      {movimientos.map((m, i) => {
        const esPago = m.tipo === 'PAGO';
        const esAnulacion = m.tipo === 'ANULACION';
        const titulo = esPago
          ? m.saldoDespues === 0
            ? 'Pago total de la deuda'
            : 'Pago a cuenta'
          : esAnulacion
            ? `Compra anulada${m.ventaId ? ` N.º ${m.ventaId}` : ''}`
            : m.ventaId
              ? `${paraCliente ? 'Compra a crédito' : 'Compra fiada'} N.º ${m.ventaId}`
              : m.descripcion ?? 'Cargo';
        return (
          <article key={`${m.fecha}-${i}`} className={`flex gap-3 p-4 ${esPago ? 'bg-ok-bg/40' : ''}`}>
            <span
              className={`flex size-10 shrink-0 items-center justify-center rounded-full border ${
                esPago || esAnulacion ? 'border-[#a7f3d0] bg-ok-bg text-ok' : 'border-[#fecaca] bg-deuda-bg text-deuda'
              }`}
              aria-hidden
            >
              {esPago ? m.saldoDespues === 0 ? <CheckCheck className="size-5" /> : <ArrowDown className="size-5" /> : esAnulacion ? <Undo2 className="size-5" /> : <ReceiptText className="size-5" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{titulo}</p>
              <p className="text-sm text-tinta-2">{formatoFecha(m.fecha)}</p>
              {m.ventaId && m.descripcion && <p className="truncate text-sm text-tinta-2">{m.descripcion}</p>}
              <p className="text-xs text-tinta-2">
                Saldo: <b className="cifras">S/ {m.saldoDespues.toFixed(2)}</b>
                {m.metodoPago && <> · {METODOS[m.metodoPago]}</>}
                {m.cantidadItems ? <> · {m.cantidadItems} productos</> : null}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Moneda valor={m.monto} signo={esPago || esAnulacion ? '-' : '+'} className={`text-lg ${esPago || esAnulacion ? 'text-ok' : 'text-deuda'}`} />
              <Insignia tono={esPago || esAnulacion ? 'ok' : 'deuda'}>{esPago ? (m.saldoDespues === 0 ? 'Cancelado' : 'Abono') : esAnulacion ? 'Anulado' : 'Fiado'}</Insignia>
            </div>
          </article>
        );
      })}
    </Tarjeta>
  );
}
