import { CheckCircle2, Eye, Package, Truck, UserRoundX, Wifi, WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useProductos } from '@/api/productos';
import type { Alerta } from '@/api/tipos';
import { StockBadge } from '@/components/EstadoBadge';
import { Pagina } from '@/components/Shell';
import { Vacio } from '@/components/Estados';
import { Insignia } from '@/components/ui/Insignia';
import { Tarjeta } from '@/components/ui/Tarjeta';
import { cn } from '@/lib/cn';
import { formatoMoneda, haceCuanto, porcentajeUso } from '@/lib/formato';
import { useAlertas } from './useAlertas';

type Filtro = 'todas' | 'STOCK_BAJO' | 'LIMITE_CLIENTE';

/** S09 · Alertas: stock bajo y clientes cerca de su límite ("Cobranzas"). Se marcan leídas al abrir. */
export function Alertas() {
  const { alertas, conectado, marcarLeidas, leidas } = useAlertas();
  const [filtro, setFiltro] = useState<Filtro>('todas');

  useEffect(() => {
    marcarLeidas();
  }, [alertas.length, marcarLeidas]);

  // Estado actual del inventario: incluye productos que ya estaban bajo el mínimo y nunca generaron un evento.
  const porAgotar = useProductos({ soloBajos: true, size: 100 });
  const bajos = porAgotar.data?.content ?? [];
  const visibles = filtro === 'todas' ? alertas : alertas.filter((a) => a.tipo === filtro);
  const contar = (t: Filtro) => (t === 'todas' ? alertas.length : alertas.filter((a) => a.tipo === t).length);

  return (
    <Pagina titulo="Alertas">
      <div className="flex items-center gap-2 text-sm text-tinta-2" role="status">
        {conectado ? <Wifi className="size-4 text-ok" aria-hidden /> : <WifiOff className="size-4 text-alerta" aria-hidden />}
        {conectado ? 'Recibiendo alertas en tiempo real' : 'Reconectando… se revisa cada 15 s'}
      </div>
      {filtro !== 'LIMITE_CLIENTE' && bajos.length > 0 && (
        <section className="flex flex-col gap-2" aria-label="Productos por agotar">
          <h2 className="text-lg font-bold">Por agotar ahora ({bajos.length})</h2>
          <Tarjeta className="divide-y divide-borde overflow-hidden">
            {bajos.map((p) => (
              <div key={p.id} className="flex items-center gap-3 p-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-control bg-alerta-bg text-alerta" aria-hidden>
                  <Package className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 font-semibold">
                    {p.nombre} <StockBadge stock={p.stock} minimo={p.stockMinimo} />
                  </p>
                  <p className="text-sm text-tinta-2">
                    Quedan <b className="text-deuda">{p.stock}</b> · mínimo {p.stockMinimo}
                  </p>
                </div>
                <EnlaceAccion a={`/reposiciones?producto=${p.id}`} icono={<Truck className="size-4" />} texto="Reponer" />
              </div>
            ))}
          </Tarjeta>
        </section>
      )}
      <h2 className="text-lg font-bold">Historial de alertas</h2>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="group" aria-label="Filtrar alertas">
        {(
          [
            ['todas', 'Todas'],
            ['STOCK_BAJO', 'Stock bajo'],
            ['LIMITE_CLIENTE', 'Cobranzas'],
          ] as [Filtro, string][]
        ).map(([v, etiqueta]) => (
          <Chip key={v} activo={filtro === v} onClick={() => setFiltro(v)}>
            {etiqueta} ({contar(v)})
          </Chip>
        ))}
      </div>
      {visibles.length === 0 && bajos.length > 0 ? (
        <Tarjeta className="p-4 text-sm text-tinta-2">Sin alertas nuevas desde que se inició el servicio.</Tarjeta>
      ) : visibles.length === 0 ? (
        <Vacio
          icono={<CheckCircle2 className="size-7" />}
          mensaje="Todo el stock está al día."
          detalle="No hay productos bajo el mínimo ni clientes cerca de su límite."
          accion={
            <Link to="/productos" className="font-semibold underline">
              Ver inventario completo
            </Link>
          }
        />
      ) : (
        <ListaAlertas alertas={visibles} leidas={leidas} />
      )}
    </Pagina>
  );
}

export function Chip({ activo, children, onClick }: { activo: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={activo}
      onClick={onClick}
      className={cn(
        'min-h-10 shrink-0 rounded-full border px-4 text-sm font-semibold whitespace-nowrap',
        activo ? 'border-primario bg-primario text-white' : 'border-borde bg-superficie text-tinta',
      )}
    >
      {children}
    </button>
  );
}

export function ListaAlertas({ alertas, compacta, leidas }: { alertas: Alerta[]; compacta?: boolean; leidas?: Set<string> }) {
  return (
    <Tarjeta className="divide-y divide-borde overflow-hidden">
      {alertas.map((a) => (
        <article key={a.id} className={cn('flex gap-3 p-4', leidas && !leidas.has(a.id) && 'bg-alerta-bg/60')}>
          <span
            className={cn(
              'flex size-10 shrink-0 items-center justify-center rounded-control',
              a.tipo === 'STOCK_BAJO' ? 'bg-fondo text-alerta' : 'bg-deuda-bg text-deuda',
            )}
            aria-hidden
          >
            {a.tipo === 'STOCK_BAJO' ? <Package className="size-5" /> : <UserRoundX className="size-5" />}
          </span>
          <div className="min-w-0 flex-1">
            {a.tipo === 'STOCK_BAJO' ? (
              <>
                <p className="font-semibold">
                  {a.stock === 0 ? 'Agotado' : 'Stock bajo'}: {a.nombre}
                </p>
                <p className="text-sm text-tinta-2">
                  Quedan <b className="text-deuda">{a.stock}</b> · mínimo {a.stockMinimo}
                </p>
              </>
            ) : (
              <>
                <p className="font-semibold">{a.nombre} está cerca de su límite</p>
                <p className="text-sm text-tinta-2">
                  Debe <b className="text-deuda">{formatoMoneda(a.saldo)}</b> de {formatoMoneda(a.limiteCredito)} (
                  {porcentajeUso(a.saldo, a.limiteCredito)} %)
                </p>
              </>
            )}
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Insignia tono={a.tipo === 'STOCK_BAJO' ? 'alerta' : 'deuda'}>{a.tipo === 'STOCK_BAJO' ? 'Stock bajo' : 'Cobranza'}</Insignia>
              <span className="text-xs text-tinta-2">{haceCuanto(a.ocurridoEn)}</span>
            </div>
            {!compacta && (
              <div className="mt-3 flex gap-2">
                {a.tipo === 'STOCK_BAJO' ? (
                  <>
                    <EnlaceAccion a={`/productos?q=${encodeURIComponent(a.nombre)}`} icono={<Eye className="size-4" />} texto="Ir al producto" />
                    <EnlaceAccion a={`/reposiciones?producto=${a.productoId}`} icono={<Truck className="size-4" />} texto="Reponer" />
                  </>
                ) : (
                  <EnlaceAccion a={`/clientes/${a.clienteId}`} icono={<Eye className="size-4" />} texto="Ver cliente" />
                )}
              </div>
            )}
          </div>
        </article>
      ))}
    </Tarjeta>
  );
}

function EnlaceAccion({ a, icono, texto }: { a: string; icono: React.ReactNode; texto: string }) {
  return (
    <Link to={a} className="inline-flex min-h-10 items-center gap-1.5 rounded-control border border-borde px-3 text-sm font-semibold hover:bg-fondo">
      {icono} {texto}
    </Link>
  );
}
