import { Ban, Calendar, ChevronRight, Clock, Store } from 'lucide-react';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useClientes } from '@/api/clientes';
import type { EstadoVenta } from '@/api/tipos';
import { useVentas } from '@/api/ventas';
import { EstadoBadge, TipoPagoBadge } from '@/components/EstadoBadge';
import { ErrorBloque, Vacio } from '@/components/Estados';
import { Moneda } from '@/components/Moneda';
import { Paginacion } from '@/components/Paginacion';
import { Pagina } from '@/components/Shell';
import { Entrada } from '@/components/ui/Campo';
import { ListaEsqueleto } from '@/components/ui/Esqueleto';
import { Tarjeta } from '@/components/ui/Tarjeta';
import { Chip } from '@/features/alertas/Alertas';
import { cn } from '@/lib/cn';
import { formatoHora, formatoSoloFecha, hoyLima, sumarDias } from '@/lib/formato';

/** S04 · Historial de ventas con filtros por fecha (hoy por defecto), estado y cliente. */
export function Historial() {
  const hoy = hoyLima();
  const [params, setParams] = useSearchParams();
  const desde = params.get('desde') ?? hoy;
  const hasta = params.get('hasta') ?? hoy;
  const estado = (params.get('estado') as EstadoVenta | null) ?? undefined;
  const clienteId = params.get('clienteId') ? Number(params.get('clienteId')) : undefined;
  const [pagina, setPagina] = useState(0);
  const { data, isLoading, error, refetch } = useVentas({ desde, hasta, estado, clienteId, page: pagina, size: 20 });
  const clientes = useClientes({ size: 100, orden: 'nombre' });

  const fijar = (cambios: Record<string, string | undefined>) => {
    const p = new URLSearchParams(params);
    Object.entries(cambios).forEach(([k, v]) => (v ? p.set(k, v) : p.delete(k)));
    setParams(p, { replace: true });
    setPagina(0);
  };
  const rango = (d: string, h: string) => fijar({ desde: d, hasta: h });
  const confirmadas = data?.content.filter((v) => v.estado === 'CONFIRMADA') ?? [];
  const totalPagina = confirmadas.reduce((s, v) => s + v.total, 0);

  return (
    <Pagina titulo="Historial de ventas">
      <Tarjeta className="border-primario bg-primario p-5 text-white">
        <p className="flex items-center gap-2 text-sm text-white/75">
          <Calendar className="size-4" aria-hidden /> {desde === hasta ? formatoSoloFecha(`${desde}T12:00:00-05:00`) : `${desde} al ${hasta}`}
        </p>
        <Moneda valor={totalPagina} className="mt-1 block text-3xl" />
        <p className="text-sm text-white/75">{confirmadas.length} ventas confirmadas en esta página</p>
      </Tarjeta>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="group" aria-label="Rango de fechas">
        <Chip activo={desde === hoy && hasta === hoy} onClick={() => rango(hoy, hoy)}>Hoy</Chip>
        <Chip activo={desde === sumarDias(hoy, -1) && hasta === sumarDias(hoy, -1)} onClick={() => rango(sumarDias(hoy, -1), sumarDias(hoy, -1))}>Ayer</Chip>
        <Chip activo={desde === sumarDias(hoy, -6) && hasta === hoy} onClick={() => rango(sumarDias(hoy, -6), hoy)}>Últimos 7 días</Chip>
        <Chip activo={desde === sumarDias(hoy, -29) && hasta === hoy} onClick={() => rango(sumarDias(hoy, -29), hoy)}>30 días</Chip>
      </div>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <label className="flex flex-col gap-1 text-xs font-semibold text-tinta-2">
          Desde
          <Entrada type="date" value={desde} max={hasta} onChange={(e) => fijar({ desde: e.target.value || hoy })} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-tinta-2">
          Hasta
          <Entrada type="date" value={hasta} min={desde} onChange={(e) => fijar({ hasta: e.target.value || hoy })} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-tinta-2">
          Estado
          <select className="min-h-12 rounded-control border border-borde bg-superficie px-3 text-sm text-tinta" value={estado ?? ''} onChange={(e) => fijar({ estado: e.target.value || undefined })}>
            <option value="">Todos</option>
            <option value="CONFIRMADA">Confirmadas</option>
            <option value="RECHAZADA">Rechazadas</option>
            <option value="PENDIENTE">Pendientes</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-tinta-2">
          Cliente
          <select className="min-h-12 rounded-control border border-borde bg-superficie px-3 text-sm text-tinta" value={clienteId ?? ''} onChange={(e) => fijar({ clienteId: e.target.value || undefined })}>
            <option value="">Todos</option>
            {clientes.data?.content.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error ? (
        <ErrorBloque error={error} alReintentar={refetch} />
      ) : isLoading || !data ? (
        <ListaEsqueleto />
      ) : data.content.length === 0 ? (
        <Vacio mensaje={desde === hoy && hasta === hoy ? 'Aún no hay ventas hoy.' : 'No hay ventas en ese rango.'} />
      ) : (
        <>
          <ul className="flex flex-col gap-3">
            {data.content.map((v) => (
              <li key={v.id}>
                <Link to={`/ventas/${v.id}`} className="block">
                  <Tarjeta className={cn('overflow-hidden p-4 hover:shadow-elevada', v.estado === 'RECHAZADA' && 'border-l-4 border-l-deuda')}>
                    <div className="flex justify-between gap-3">
                      <div>
                        <p className="flex items-center gap-1 text-sm text-tinta-2">
                          <Clock className="size-3.5" aria-hidden /> {desde === hasta ? formatoHora(v.fecha) : `${formatoSoloFecha(v.fecha)} ${formatoHora(v.fecha)}`}
                        </p>
                        <p className="flex items-center gap-1.5 text-lg font-bold">
                          {v.clienteNombre ?? (
                            <>
                              <Store className="size-4" aria-hidden /> Mostrador
                            </>
                          )}
                        </p>
                      </div>
                      <div className="text-right">
                        <Moneda valor={v.total} className={cn('text-lg', v.estado === 'RECHAZADA' && 'text-tinta-3 line-through')} />
                        <p className="text-xs text-tinta-2">N.º {v.id}</p>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <TipoPagoBadge tipo={v.tipoPago} />
                      <EstadoBadge estado={v.estado} />
                    </div>
                    {v.estado === 'RECHAZADA' && v.motivoRechazo ? (
                      <p className="mt-3 flex items-center gap-2 rounded-control bg-deuda-bg p-2 text-sm text-deuda">
                        <Ban className="size-4" aria-hidden /> Motivo: {v.motivoRechazo}
                      </p>
                    ) : (
                      <p className="mt-3 flex items-center justify-between border-t border-borde pt-2 text-sm text-tinta-2">
                        <span className="truncate">
                          {v.items.length} {v.items.length === 1 ? 'producto' : 'productos'} ({v.items.slice(0, 3).map((i) => i.nombre).join(', ')}
                          {v.items.length > 3 ? '…' : ''})
                        </span>
                        <ChevronRight className="size-4 shrink-0" aria-hidden />
                      </p>
                    )}
                  </Tarjeta>
                </Link>
              </li>
            ))}
          </ul>
          <Paginacion pagina={data.page} totalPaginas={data.totalPages} total={data.totalElements} alCambiar={setPagina} />
        </>
      )}
    </Pagina>
  );
}
