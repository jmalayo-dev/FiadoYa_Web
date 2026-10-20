import { ChevronRight, HandCoins, ShoppingBasket, TriangleAlert, Truck, Wallet } from 'lucide-react';
import { Link } from 'react-router';
import { useResumenClientes } from '@/api/clientes';
import { useProductos } from '@/api/productos';
import { useResumenVentas } from '@/api/reportes';
import { useVentas } from '@/api/ventas';
import { useAuth } from '@/auth/useAuth';
import { Pagina } from '@/components/Shell';
import { ErrorBloque } from '@/components/Estados';
import { Moneda } from '@/components/Moneda';
import { Esqueleto } from '@/components/ui/Esqueleto';
import { Tarjeta, TituloSeccion } from '@/components/ui/Tarjeta';
import { ListaAlertas } from '@/features/alertas/Alertas';
import { useAlertas } from '@/features/alertas/useAlertas';
import { formatoDia, formatoFechaLarga, formatoMoneda, hoyLima, sumarDias } from '@/lib/formato';

/** S02 · Inicio del bodeguero. Cada bloque carga por separado: si uno falla, los demás siguen. */
export function Dashboard() {
  const { usuario } = useAuth();
  const hoy = hoyLima();
  const hora = Number(new Intl.DateTimeFormat('es-PE', { hour: 'numeric', hour12: false, timeZone: 'America/Lima' }).format(new Date()));
  const saludo = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <Pagina titulo="Inicio">
      <div>
        <p className="text-xl font-bold">
          {saludo}, {usuario?.username}
        </p>
        <p className="text-sm text-tinta-2">{formatoFechaLarga()}</p>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <VentasHoy hoy={hoy} />
        <DeudaTotal />
      </div>
      <StockBajo />
      <div className="grid grid-cols-3 gap-3">
        <Atajo a="/ventas/nueva" etiqueta="Nueva venta" icono={<ShoppingBasket className="size-6" />} principal />
        <Atajo a="/clientes?conDeuda=1" etiqueta="Registrar pago" icono={<HandCoins className="size-6" />} />
        <Atajo a="/reposiciones" etiqueta="Reponer" icono={<Truck className="size-6" />} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <UltimasAlertas />
        <Grafico desde={sumarDias(hoy, -6)} hasta={hoy} />
      </div>
    </Pagina>
  );
}

function VentasHoy({ hoy }: { hoy: string }) {
  const { data, isLoading, error, refetch } = useVentas({ desde: hoy, hasta: hoy, estado: 'CONFIRMADA', size: 100 });
  if (error) return <ErrorBloque error={error} alReintentar={refetch} compacto />;
  // Suma de las ventas confirmadas de hoy (hasta 100; una bodega rara vez pasa de eso por día).
  const total = data?.content.reduce((s, v) => s + v.total, 0) ?? 0;
  return (
    <Link to="/ventas" className="block">
      <Tarjeta className="h-full p-4 hover:shadow-elevada">
        <p className="text-sm text-tinta-2">Ventas de hoy</p>
        {isLoading ? <Esqueleto className="mt-2 h-8 w-28" /> : <Moneda valor={total} className="mt-1 block text-2xl md:text-3xl" />}
        <p className="mt-2 text-xs font-semibold text-ok">{data?.totalElements ?? 0} ventas registradas</p>
      </Tarjeta>
    </Link>
  );
}

function DeudaTotal() {
  const { data, isLoading, error, refetch } = useResumenClientes();
  if (error) return <ErrorBloque error={error} alReintentar={refetch} compacto />;
  return (
    <Link to="/clientes?conDeuda=1" className="block">
      <Tarjeta className="h-full p-4 hover:shadow-elevada">
        <p className="text-sm text-tinta-2">Deuda total</p>
        {isLoading ? <Esqueleto className="mt-2 h-8 w-28" /> : <Moneda valor={data?.deudaTotal ?? 0} className="mt-1 block text-2xl text-deuda md:text-3xl" />}
        <p className="mt-2 text-xs font-semibold text-deuda">{data?.clientesConDeuda ?? 0} clientes con deuda</p>
      </Tarjeta>
    </Link>
  );
}

function StockBajo() {
  const { data, error, refetch } = useProductos({ soloBajos: true, size: 1 });
  if (error) return <ErrorBloque error={error} alReintentar={refetch} compacto />;
  const n = data?.totalElements ?? 0;
  if (!data || n === 0) return null;
  return (
    <Link
      to="/productos?soloBajos=1"
      className="flex items-center gap-3 rounded-tarjeta border border-[#fde68a] bg-alerta-bg p-4 font-semibold text-tinta hover:shadow-elevada"
    >
      <span className="flex size-10 items-center justify-center rounded-control bg-[#fef3c7] text-alerta">
        <TriangleAlert className="size-5" aria-hidden />
      </span>
      <span className="flex-1">
        {n} {n === 1 ? 'producto' : 'productos'} con stock bajo
      </span>
      <span className="flex items-center text-sm">
        Ver productos <ChevronRight className="size-4" aria-hidden />
      </span>
    </Link>
  );
}

function Atajo({ a, etiqueta, icono, principal }: { a: string; etiqueta: string; icono: React.ReactNode; principal?: boolean }) {
  return (
    <Link
      to={a}
      className={`flex min-h-24 flex-col items-center justify-center gap-2 rounded-tarjeta border p-3 text-center text-sm font-semibold ${
        principal ? 'border-primario bg-primario text-white' : 'border-borde bg-superficie text-tinta hover:shadow-elevada'
      }`}
    >
      <span className={`flex size-11 items-center justify-center rounded-full ${principal ? 'bg-white/15' : 'bg-fondo'}`} aria-hidden>
        {icono}
      </span>
      {etiqueta}
    </Link>
  );
}

function UltimasAlertas() {
  const { alertas } = useAlertas();
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Últimas alertas</h2>
        <Link to="/alertas" className="text-sm font-semibold">
          Ver todas
        </Link>
      </div>
      {alertas.length === 0 ? (
        <Tarjeta className="flex items-center gap-3 p-4 text-sm text-tinta-2">
          <Wallet className="size-5 text-ok" aria-hidden /> Sin alertas nuevas.
        </Tarjeta>
      ) : (
        <ListaAlertas alertas={alertas.slice(0, 5)} compacta />
      )}
    </section>
  );
}

/** HU10: ventas de los últimos 7 días y top 5. Si falla, se oculta solo este bloque. */
function Grafico({ desde, hasta }: { desde: string; hasta: string }) {
  const { data, isLoading, error } = useResumenVentas(desde, hasta);
  if (error) return null;
  const maximo = Math.max(1, ...(data?.porDia.map((d) => d.monto) ?? [1]));
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-bold">Ventas de los últimos 7 días</h2>
      <Tarjeta className="p-4">
        {isLoading || !data ? (
          <Esqueleto className="h-40" />
        ) : (
          <>
            <div className="flex h-40 items-end gap-2" role="img" aria-label={`Ventas por día: total ${formatoMoneda(data.montoTotal)}`}>
              {data.porDia.map((d) => (
                <div key={d.fecha} className="flex flex-1 flex-col items-center gap-1">
                  <span className="cifras text-[10px] font-semibold text-tinta-2">{d.monto > 0 ? Math.round(d.monto) : ''}</span>
                  <div
                    className={`w-full rounded-t-md ${d.fecha === hasta ? 'bg-acento' : 'bg-primario'}`}
                    style={{ height: `${Math.max(4, (d.monto / maximo) * 110)}px` }}
                    title={`${formatoDia(d.fecha)}: ${formatoMoneda(d.monto)}`}
                  />
                  <span className="text-[11px] text-tinta-2">{formatoDia(d.fecha).split(',')[0]}</span>
                </div>
              ))}
            </div>
            {data.topProductos.length > 0 && (
              <div className="mt-4 border-t border-borde pt-3">
                <TituloSeccion>Más vendidos</TituloSeccion>
                <ol className="mt-2 flex flex-col gap-1.5 text-sm">
                  {data.topProductos.map((p, i) => (
                    <li key={p.productoId} className="flex justify-between gap-2">
                      <span>
                        {i + 1}. {p.nombre} <span className="text-tinta-2">({p.cantidad} u.)</span>
                      </span>
                      <Moneda valor={p.monto} />
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </>
        )}
      </Tarjeta>
    </section>
  );
}
