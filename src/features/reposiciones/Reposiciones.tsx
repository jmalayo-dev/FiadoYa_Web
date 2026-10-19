import { CalendarClock, CheckCircle2, PackageCheck, Plus, Truck } from 'lucide-react';
import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { useProductos } from '@/api/productos';
import { useCatalogo, useMutacionesReposicion, useReposiciones } from '@/api/reposiciones';
import { ErrorBloque, Vacio } from '@/components/Estados';
import { Moneda } from '@/components/Moneda';
import { Paginacion } from '@/components/Paginacion';
import { Pagina } from '@/components/Shell';
import { Boton } from '@/components/ui/Boton';
import { Campo, Entrada } from '@/components/ui/Campo';
import { Dialogo } from '@/components/ui/Dialogo';
import { ListaEsqueleto } from '@/components/ui/Esqueleto';
import { Insignia } from '@/components/ui/Insignia';
import { Pestanas } from '@/components/ui/Pestanas';
import { Tarjeta } from '@/components/ui/Tarjeta';
import { config } from '@/lib/config';
import { codigoDe, mensajeDeError } from '@/lib/errores';
import { formatoSoloFecha } from '@/lib/formato';

/** S07 · Reposiciones (HU11): catálogo del distribuidor (SOAP) y pedidos. */
export function Reposiciones() {
  const [params] = useSearchParams();
  const [nuevo, setNuevo] = useState<number | 'elegir' | null>(params.get('producto') ? Number(params.get('producto')) : null);
  return (
    <Pagina
      titulo="Reposiciones"
      icono={<Truck className="size-6" aria-hidden />}
      acciones={
        <Boton tamano="sm" onClick={() => setNuevo('elegir')} className="hidden md:inline-flex">
          <Plus className="size-4" aria-hidden /> Nuevo pedido
        </Boton>
      }
    >
      <Boton className="md:hidden" onClick={() => setNuevo('elegir')}>
        <Plus className="size-4" aria-hidden /> Nuevo pedido
      </Boton>
      <Pestanas
        pestanas={[
          { valor: 'pedidos', etiqueta: 'Pedidos', contenido: <Pedidos /> },
          { valor: 'catalogo', etiqueta: 'Catálogo del distribuidor', contenido: <Catalogo /> },
        ]}
      />
      {nuevo !== null && <NuevoPedido productoInicial={nuevo === 'elegir' ? null : nuevo} alCerrar={() => setNuevo(null)} />}
    </Pagina>
  );
}

function Pedidos() {
  const [pagina, setPagina] = useState(0);
  const { data, isLoading, error, refetch } = useReposiciones(pagina);
  const { recibir } = useMutacionesReposicion();
  if (error) return <ErrorBloque error={error} alReintentar={refetch} />;
  if (isLoading || !data) return <ListaEsqueleto />;
  if (data.content.length === 0) return <Vacio mensaje="Aún no hay pedidos a la distribuidora." />;
  return (
    <>
      <ul className="flex flex-col gap-3">
        {data.content.map((r) => (
          <li key={r.id}>
            <Tarjeta className="flex items-center gap-3 p-4">
              <span className={`flex size-11 items-center justify-center rounded-control ${r.recibida ? 'bg-ok-bg text-ok' : 'bg-info-bg text-info'}`} aria-hidden>
                {r.recibida ? <PackageCheck className="size-5" /> : <Truck className="size-5" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-bold">{r.productoNombre}</p>
                <p className="text-sm text-tinta-2">
                  {r.cantidad} u. · Pedido <span className="font-mono">{r.nroPedido}</span>
                </p>
                <p className="flex items-center gap-1 text-xs text-tinta-2">
                  <CalendarClock className="size-3.5" aria-hidden /> Llega el {formatoSoloFecha(`${r.fechaEstimada}T12:00:00-05:00`)}
                </p>
              </div>
              {r.recibida ? (
                <Insignia tono="ok">
                  <CheckCircle2 className="size-3.5" aria-hidden /> Recibido
                </Insignia>
              ) : config.recibirReposiciones ? (
                <Boton
                  tamano="sm"
                  variante="contorno"
                  cargando={recibir.isPending && recibir.variables === r.id}
                  onClick={() =>
                    recibir.mutate(r.id, {
                      onSuccess: () => toast.success(`Se sumaron ${r.cantidad} u. de ${r.productoNombre}.`),
                      onError: (e) => toast.error(mensajeDeError(e)),
                    })
                  }
                >
                  Recibir
                </Boton>
              ) : (
                <Insignia tono="info">En camino</Insignia>
              )}
            </Tarjeta>
          </li>
        ))}
      </ul>
      <Paginacion pagina={data.page} totalPaginas={data.totalPages} total={data.totalElements} alCambiar={setPagina} />
    </>
  );
}

function Catalogo() {
  const { data, isLoading, error, refetch } = useCatalogo();
  if (error)
    return (
      <ErrorBloque
        error={error}
        alReintentar={refetch}
        mensaje={codigoDe(error) === 'SERVICIO_NO_DISPONIBLE' ? 'El distribuidor no responde. Intenta más tarde.' : undefined}
      />
    );
  if (isLoading || !data) return <ListaEsqueleto />;
  return (
    <Tarjeta className="divide-y divide-borde">
      {data.map((i) => (
        <div key={i.codigo} className="flex items-center gap-3 px-4 py-3">
          <span className="font-mono text-xs text-tinta-2">{i.codigo}</span>
          <span className="flex-1 font-semibold">{i.nombre}</span>
          <span className="text-right text-sm">
            <Moneda valor={i.precio} />
            <span className="block text-xs text-tinta-2">{i.disponible} disp.</span>
          </span>
        </div>
      ))}
    </Tarjeta>
  );
}

function NuevoPedido({ productoInicial, alCerrar }: { productoInicial: number | null; alCerrar: () => void }) {
  const productos = useProductos({ size: 100 });
  const { crear } = useMutacionesReposicion();
  const [productoId, setProductoId] = useState<number | ''>(productoInicial ?? '');
  const [cantidad, setCantidad] = useState('12');
  const [error, setError] = useState<string | null>(null);
  const n = Number(cantidad);
  const valida = Number.isInteger(n) && n >= 1 && n <= 9999;

  const enviar = () => {
    setError(null);
    if (!productoId || !valida) return;
    crear.mutate(
      { productoId, cantidad: n },
      {
        onSuccess: (r) => {
          toast.success(`Pedido ${r.nroPedido} registrado. Llega el ${formatoSoloFecha(`${r.fechaEstimada}T12:00:00-05:00`)}.`);
          alCerrar();
        },
        onError: (e) => setError(codigoDe(e) === 'SERVICIO_NO_DISPONIBLE' ? 'El distribuidor no responde. Intenta más tarde.' : mensajeDeError(e)),
      },
    );
  };

  return (
    <Dialogo
      abierto
      alCambiar={(v) => !v && alCerrar()}
      titulo="Nuevo pedido de reposición"
      descripcion="Se registra en el sistema del distribuidor."
      pie={
        <Boton className="w-full" cargando={crear.isPending} disabled={!productoId || !valida} onClick={enviar}>
          Registrar pedido
        </Boton>
      }
    >
      <div className="flex flex-col gap-4">
        <Campo etiqueta="Producto" obligatorio>
          {({ id }) => (
            <select id={id} className="min-h-12 rounded-control border border-borde bg-superficie px-3" value={productoId} onChange={(e) => setProductoId(e.target.value ? Number(e.target.value) : '')}>
              <option value="">Elige un producto</option>
              {productos.data?.content.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} (stock {p.stock})
                </option>
              ))}
            </select>
          )}
        </Campo>
        <Campo etiqueta="Cantidad" obligatorio error={valida ? undefined : 'Entre 1 y 9999'}>
          {({ id, describedBy, invalido }) => (
            <Entrada id={id} aria-describedby={describedBy} invalido={invalido} inputMode="numeric" value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
          )}
        </Campo>
        {error && (
          <p role="alert" className="rounded-control border border-[#fecaca] bg-deuda-bg p-3 text-sm font-semibold text-deuda">
            {error}
          </p>
        )}
      </div>
    </Dialogo>
  );
}
