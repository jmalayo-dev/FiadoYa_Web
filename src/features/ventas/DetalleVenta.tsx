import { Ban, Printer, Share2 } from 'lucide-react';
import { useParams } from 'react-router';
import { useBodega } from '@/api/auth';
import { useQuery } from '@tanstack/react-query';
import { clientesApi } from '@/api/clientes';
import { useVenta } from '@/api/ventas';
import { EstadoBadge, TipoPagoBadge } from '@/components/EstadoBadge';
import { ErrorBloque } from '@/components/Estados';
import { Moneda } from '@/components/Moneda';
import { Pagina } from '@/components/Shell';
import { Boton } from '@/components/ui/Boton';
import { ListaEsqueleto } from '@/components/ui/Esqueleto';
import { Tarjeta, TituloSeccion } from '@/components/ui/Tarjeta';
import { formatoFecha, formatoMoneda } from '@/lib/formato';
import { enlaceWhatsApp } from '@/lib/whatsapp';

/** Detalle de una venta: ítems con precio congelado, total, estado y motivo de rechazo. */
export function DetalleVenta() {
  const id = Number(useParams().id);
  const { data: v, isLoading, error, refetch } = useVenta(id);
  const { data: bodega } = useBodega();
  const cliente = useQuery({
    queryKey: ['clientes', v?.clienteId],
    queryFn: () => clientesApi.obtener(v!.clienteId!),
    enabled: Boolean(v?.clienteId),
  });

  if (error) return <Pagina titulo={`Venta N.º ${id}`} volver="/ventas"><ErrorBloque error={error} alReintentar={refetch} /></Pagina>;
  if (isLoading || !v) return <Pagina titulo={`Venta N.º ${id}`} volver="/ventas"><ListaEsqueleto filas={2} /></Pagina>;

  const comprobante =
    `${bodega?.nombre ?? 'Bodega'} · Venta N.º ${v.id} (${formatoFecha(v.fecha)})\n` +
    v.items.map((i) => `${i.cantidad} × ${i.nombre}: ${formatoMoneda(i.subtotal)}`).join('\n') +
    `\nTotal: ${formatoMoneda(v.total)} (${v.tipoPago === 'FIADO' ? 'fiado' : 'contado'})`;

  return (
    <Pagina titulo={`Venta N.º ${v.id}`} volver="/ventas">
      <Tarjeta className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-lg font-bold">{v.clienteNombre ?? 'Mostrador'}</p>
            <p className="text-sm text-tinta-2">{formatoFecha(v.fecha)}</p>
          </div>
          <div className="flex gap-2">
            <TipoPagoBadge tipo={v.tipoPago} />
            <EstadoBadge estado={v.estado} />
          </div>
        </div>
        {v.estado === 'RECHAZADA' && (
          <div role="note" className="mt-3 flex items-start gap-2 rounded-control border border-[#fecaca] bg-deuda-bg p-3 text-sm text-deuda">
            <Ban className="mt-0.5 size-4 shrink-0" aria-hidden />
            <div>
              <p className="font-bold">Venta no completada</p>
              <p>Motivo: {v.motivoRechazo ?? 'sin detalle'}</p>
              <p className="mt-1 text-xs">El stock se devolvió y no se cargó deuda al cliente.</p>
            </div>
          </div>
        )}
      </Tarjeta>
      <Tarjeta className="overflow-hidden">
        <div className="px-4 pt-4">
          <TituloSeccion>Productos ({v.items.length})</TituloSeccion>
        </div>
        <ul className="divide-y divide-borde px-4">
          {v.items.map((i) => (
            <li key={i.productoId} className="flex justify-between gap-3 py-3">
              <span>
                <b>{i.nombre}</b>
                <span className="block text-sm text-tinta-2">
                  {i.cantidad} × {formatoMoneda(i.precioUnitario)}
                </span>
              </span>
              <Moneda valor={i.subtotal} />
            </li>
          ))}
          {v.items.length === 0 && <li className="py-3 text-sm text-tinta-2">Sin productos (la venta no llegó a descontar stock).</li>}
        </ul>
        <div className="flex justify-between border-t border-borde bg-fondo px-4 py-4">
          <span className="font-bold">Total</span>
          <Moneda valor={v.total} className="text-2xl" />
        </div>
      </Tarjeta>
      {v.estado === 'CONFIRMADA' && (
        <div className="grid grid-cols-2 gap-3 print:hidden">
          <Boton variante="contorno" onClick={() => window.print()}>
            <Printer className="size-4" aria-hidden /> Imprimir
          </Boton>
          {cliente.data ? (
            <a
              href={enlaceWhatsApp(cliente.data.telefono, comprobante)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control bg-acento font-semibold text-tinta"
            >
              <Share2 className="size-4" aria-hidden /> WhatsApp
            </a>
          ) : (
            <span />
          )}
        </div>
      )}
    </Pagina>
  );
}
