import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  Ban,
  Banknote,
  CircleCheck,
  Eye,
  Minus,
  NotebookPen,
  Plus,
  RotateCw,
  ShoppingBasket,
  Trash2,
  TriangleAlert,
  UserRound,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { clientesApi, useClientes } from '@/api/clientes';
import { useProductos } from '@/api/productos';
import type { ApiError, Cliente, TipoPago, Venta } from '@/api/tipos';
import { ventasApi } from '@/api/ventas';
import { BarraUso, Avatar } from '@/components/BarraUso';
import { Busqueda } from '@/components/Busqueda';
import { useEnLinea } from '@/components/BannerSinConexion';
import { ErrorBloque } from '@/components/Estados';
import { Moneda } from '@/components/Moneda';
import { Pagina } from '@/components/Shell';
import { Boton } from '@/components/ui/Boton';
import { Esqueleto } from '@/components/ui/Esqueleto';
import { Insignia } from '@/components/ui/Insignia';
import { Tarjeta, TituloSeccion } from '@/components/ui/Tarjeta';
import { cn } from '@/lib/cn';
import { comoApiError, mensajeDeError } from '@/lib/errores';
import { formatoMoneda, iniciales, porcentajeUso } from '@/lib/formato';
import { ClaveVenta } from '@/lib/idempotencia';
import { agregar, cambiarCantidad, limitarA, quitar, totalEstimado, unidades, type LineaCarrito } from './carrito';

type Resultado = { tipo: 'exito'; venta: Venta } | { tipo: 'limite'; error: ApiError; cliente: Cliente };

/** S03 · Nueva venta (HU04 y HU05). */
export function NuevaVenta() {
  const [params] = useSearchParams();
  const qc = useQueryClient();
  const enLinea = useEnLinea();
  const clave = useRef(new ClaveVenta());
  const [q, setQ] = useState('');
  const [carrito, setCarrito] = useState<LineaCarrito[]>([]);
  const [tipo, setTipo] = useState<TipoPago>(params.get('cliente') ? 'FIADO' : 'CONTADO');
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [lineaConError, setLineaConError] = useState<number | null>(null);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [errorRed, setErrorRed] = useState<ApiError | null>(null);

  const catalogo = useProductos({ q, size: q ? 20 : 8 });
  const clienteInicial = useQuery({
    queryKey: ['clientes', Number(params.get('cliente'))],
    queryFn: () => clientesApi.obtener(Number(params.get('cliente'))),
    enabled: Boolean(params.get('cliente')),
  });
  useEffect(() => {
    if (clienteInicial.data) setCliente(clienteInicial.data);
  }, [clienteInicial.data]);

  /** Cualquier cambio en lo que se va a enviar renueva la Idempotency-Key. */
  const editar = (fn: () => void) => {
    clave.current.renovar();
    setErrorRed(null);
    fn();
  };

  const total = totalEstimado(carrito);
  const confirmar = useMutation({
    mutationFn: () =>
      ventasApi.registrar(
        {
          tipoPago: tipo,
          clienteId: tipo === 'FIADO' ? (cliente?.id ?? null) : null,
          items: carrito.filter((l) => l.cantidad > 0).map((l) => ({ productoId: l.producto.id, cantidad: l.cantidad })),
        },
        clave.current.actual(),
      ),
    onSuccess: (venta) => {
      qc.invalidateQueries({ queryKey: ['productos'] });
      qc.invalidateQueries({ queryKey: ['ventas'] });
      qc.invalidateQueries({ queryKey: ['clientes'] });
      setResultado({ tipo: 'exito', venta });
      setCarrito([]);
      setErrorRed(null);
      clave.current.renovar();
    },
    onError: (e) => {
      const err = comoApiError(e);
      if (err.code === 'RED' || err.code === 'SERVICIO_NO_DISPONIBLE') {
        setErrorRed(err); // se reintenta con la MISMA clave
        return;
      }
      clave.current.renovar();
      if (err.code === 'PRODUCTO_STOCK_INSUFICIENTE') {
        const id = Number(err.extra?.productoId);
        setCarrito((c) => limitarA(c, id, Number(err.extra?.disponible ?? 0)));
        setLineaConError(id);
        toast.error(mensajeDeError(err));
      } else if (err.code === 'CLIENTE_LIMITE_EXCEDIDO' && cliente) {
        setResultado({ tipo: 'limite', error: err, cliente });
      } else {
        toast.error(mensajeDeError(err));
      }
    },
  });

  const nuevaVenta = () => {
    clave.current.renovar();
    setResultado(null);
    setCarrito([]);
    setCliente(null);
    setTipo('CONTADO');
    setLineaConError(null);
  };

  if (resultado?.tipo === 'exito') return <VentaRegistrada venta={resultado.venta} alNueva={nuevaVenta} />;
  if (resultado?.tipo === 'limite')
    return (
      <LimiteExcedido
        resultado={resultado}
        total={total}
        alCambiarAContado={() => {
          editar(() => {
            setTipo('CONTADO');
            setResultado(null);
          });
        }}
        alVolver={() => setResultado(null)}
      />
    );

  const sinConsentimiento = cliente && (!cliente.consentimiento || !cliente.activo);
  const puedeConfirmar =
    carrito.some((l) => l.cantidad > 0) && (tipo === 'CONTADO' || (cliente && !sinConsentimiento)) && enLinea;

  return (
    <Pagina titulo="Nueva venta" icono={<ShoppingBasket className="size-6" aria-hidden />}>
      <div className="grid gap-4 lg:grid-cols-[1fr_380px] lg:items-start">
        <section className="flex flex-col gap-3" aria-label="Productos">
          <Busqueda valor={q} alCambiar={setQ} etiqueta="Buscar producto" placeholder="Buscar producto…" />
          <TituloSeccion>{q ? 'Resultados' : 'Catálogo rápido'}</TituloSeccion>
          {catalogo.error ? (
            <ErrorBloque error={catalogo.error} alReintentar={catalogo.refetch} compacto />
          ) : catalogo.isLoading ? (
            <Esqueleto className="h-40" />
          ) : (
            <ul className="flex flex-col gap-2">
              {catalogo.data?.content.map((p) => {
                const agotado = p.stock === 0;
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      disabled={agotado}
                      onClick={() => editar(() => setCarrito((c) => agregar(c, p)))}
                      className={cn(
                        'flex min-h-16 w-full items-center gap-3 rounded-tarjeta border border-borde bg-superficie px-4 py-3 text-left hover:shadow-elevada',
                        agotado && 'opacity-60',
                      )}
                      aria-label={agotado ? `${p.nombre}, agotado` : `Agregar ${p.nombre}`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className={cn('font-semibold', agotado && 'line-through')}>
                          {p.nombre} {agotado && <Insignia tono="deuda">Agotado</Insignia>}
                        </p>
                        <p className="text-sm text-tinta-2">
                          Stock: <b>{p.stock}</b>
                        </p>
                      </div>
                      <Moneda valor={p.precio} className={cn('text-lg', agotado && 'line-through')} />
                      <span className={cn('flex size-10 items-center justify-center rounded-control', agotado ? 'bg-fondo' : 'bg-info-bg text-tinta')}>
                        {agotado ? <Ban className="size-5 text-tinta-3" aria-hidden /> : <Plus className="size-5" aria-hidden />}
                      </span>
                    </button>
                  </li>
                );
              })}
              {catalogo.data?.content.length === 0 && <p className="py-4 text-center text-sm text-tinta-2">No hay productos con ese nombre.</p>}
            </ul>
          )}
        </section>

        <section className="flex flex-col gap-3 lg:sticky lg:top-20" aria-label="Carrito">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              Carrito <Insignia tono="info">{unidades(carrito)}</Insignia>
            </h2>
            {carrito.length > 0 && (
              <button type="button" className="flex items-center gap-1 text-sm font-semibold text-deuda" onClick={() => editar(() => setCarrito([]))}>
                <Trash2 className="size-4" aria-hidden /> Vaciar
              </button>
            )}
          </div>
          {carrito.length === 0 ? (
            <Tarjeta className="p-6 text-center text-sm text-tinta-2">Toca un producto para agregarlo.</Tarjeta>
          ) : (
            <ul className="flex flex-col gap-2">
              {carrito.map((l) => (
                <li key={l.producto.id}>
                  <Tarjeta className={cn('p-3', lineaConError === l.producto.id && 'border-deuda bg-deuda-bg')}>
                    <div className="flex justify-between gap-2">
                      <div>
                        <p className="font-semibold">{l.producto.nombre}</p>
                        <p className="text-xs text-tinta-2">Unit: {formatoMoneda(l.producto.precio)}</p>
                        {lineaConError === l.producto.id && (
                          <p className="mt-1 text-xs font-semibold text-deuda">Solo hay {l.maximo} disponibles.</p>
                        )}
                      </div>
                      <Moneda valor={(Math.round(l.producto.precio * 100) * l.cantidad) / 100} />
                    </div>
                    <div className="mt-2 flex items-center justify-between border-t border-borde pt-2">
                      <button
                        type="button"
                        className="rounded-control p-2 text-tinta-2 hover:bg-fondo"
                        aria-label={`Quitar ${l.producto.nombre}`}
                        onClick={() => editar(() => setCarrito((c) => quitar(c, l.producto.id)))}
                      >
                        <Trash2 className="size-5" />
                      </button>
                      <div className="flex items-center rounded-control border border-borde">
                        <button
                          type="button"
                          className="flex size-11 items-center justify-center disabled:text-tinta-3"
                          aria-label={`Restar ${l.producto.nombre}`}
                          disabled={l.cantidad <= 1}
                          onClick={() => editar(() => setCarrito((c) => cambiarCantidad(c, l.producto.id, l.cantidad - 1)))}
                        >
                          <Minus className="size-5" />
                        </button>
                        <span className="cifras w-10 text-center text-lg font-bold" aria-live="polite">
                          {l.cantidad}
                        </span>
                        <button
                          type="button"
                          className="flex size-11 items-center justify-center rounded-r-control bg-primario text-white disabled:bg-[#e5e7eb] disabled:text-tinta-3"
                          aria-label={`Sumar ${l.producto.nombre}`}
                          disabled={l.cantidad >= l.maximo}
                          onClick={() => editar(() => setCarrito((c) => cambiarCantidad(c, l.producto.id, l.cantidad + 1)))}
                        >
                          <Plus className="size-5" />
                        </button>
                      </div>
                    </div>
                  </Tarjeta>
                </li>
              ))}
            </ul>
          )}

          <div className="grid grid-cols-2 gap-1 rounded-tarjeta bg-[#e5e7eb] p-1" role="radiogroup" aria-label="Tipo de pago">
            {(['CONTADO', 'FIADO'] as TipoPago[]).map((t) => (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={tipo === t}
                onClick={() => editar(() => setTipo(t))}
                className={cn(
                  'flex min-h-12 items-center justify-center gap-2 rounded-control font-semibold',
                  tipo === t ? 'bg-superficie shadow-elevada' : 'text-tinta-2',
                )}
              >
                {t === 'CONTADO' ? <Banknote className="size-5" aria-hidden /> : <NotebookPen className="size-5" aria-hidden />}
                {t === 'CONTADO' ? 'Contado' : 'Fiado'}
              </button>
            ))}
          </div>
          {tipo === 'FIADO' && <SelectorCliente cliente={cliente} total={total} alElegir={(c) => editar(() => setCliente(c))} />}

          {errorRed && (
            <div role="alert" className="flex items-center justify-between gap-3 rounded-tarjeta border border-[#fecaca] bg-deuda-bg p-3">
              <p className="text-sm font-semibold text-deuda">{mensajeDeError(errorRed)}</p>
              <Boton variante="contorno" tamano="sm" cargando={confirmar.isPending} onClick={() => confirmar.mutate()}>
                <RotateCw className="size-4" aria-hidden /> Reintentar
              </Boton>
            </div>
          )}
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-16 z-20 border-t border-borde bg-superficie px-4 py-3 md:bottom-0 md:left-64">
        <div className="mx-auto flex max-w-5xl items-center gap-4">
          <div>
            <p className="text-xs font-semibold uppercase text-tinta-2">Total {tipo === 'FIADO' ? 'fiado' : ''}</p>
            <Moneda valor={total} className="text-2xl" />
          </div>
          <Boton
            tamano="lg"
            className="flex-1"
            disabled={!puedeConfirmar}
            cargando={confirmar.isPending}
            onClick={() => {
              setLineaConError(null);
              confirmar.mutate();
            }}
          >
            {tipo === 'FIADO' ? 'Confirmar venta fiada' : 'Confirmar venta'} <ArrowRight className="size-5" aria-hidden />
          </Boton>
        </div>
      </div>
      <div className="h-20" aria-hidden />
    </Pagina>
  );

}

function SelectorCliente({ cliente: c, total: t, alElegir }: { cliente: Cliente | null; total: number; alElegir: (c: Cliente | null) => void }) {
  const [texto, setTexto] = useState('');
  const lista = useClientes({ q: texto, size: 6, orden: 'nombre' }, !c);
  if (c) {
    const uso = porcentajeUso(c.saldo, c.limiteCredito);
    const bloqueado = !c.consentimiento || !c.activo;
    return (
      <Tarjeta className="p-4">
        <div className="flex items-center gap-3">
          <Avatar texto={iniciales(c.nombre)} className="size-10" />
          <p className="flex-1 font-bold">{c.nombre}</p>
          <button type="button" className="rounded-control p-2 hover:bg-fondo" aria-label="Cambiar cliente" onClick={() => alElegir(null)}>
            <X className="size-5" />
          </button>
        </div>
        <dl className="mt-3 grid grid-cols-3 gap-2 text-sm">
          <div>
            <dt className="text-tinta-2">Deuda</dt>
            <dd className="cifras font-bold text-deuda">{formatoMoneda(c.saldo)}</dd>
          </div>
          <div>
            <dt className="text-tinta-2">Límite</dt>
            <dd className="cifras font-bold">{formatoMoneda(c.limiteCredito)}</dd>
          </div>
          <div>
            <dt className="text-tinta-2">Disponible</dt>
            <dd className="cifras font-bold text-ok">{formatoMoneda(c.disponible)}</dd>
          </div>
        </dl>
        <BarraUso porcentaje={uso} className="mt-2" />
        {bloqueado && (
          <p className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-deuda">
            <Ban className="size-4" aria-hidden /> {!c.activo ? 'El cliente está desactivado.' : 'El cliente aún no autorizó el uso de sus datos.'}
          </p>
        )}
        {!bloqueado && c.disponible < t && (
          <p className="mt-3 flex items-start gap-1.5 rounded-control bg-alerta-bg p-2 text-sm text-alerta">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden /> El total supera lo disponible ({formatoMoneda(c.disponible)}). El sistema podría rechazar la venta.
          </p>
        )}
      </Tarjeta>
    );
  }
  return (
    <Tarjeta className="flex flex-col gap-2 p-3">
      <Busqueda valor={texto} alCambiar={setTexto} etiqueta="Buscar cliente" placeholder="Buscar cliente por nombre o DNI…" conEscaner={false} />
      <ul className="flex flex-col">
        {lista.data?.content.map((x) => {
          const bloqueado = !x.consentimiento || !x.activo;
          return (
            <li key={x.id}>
              <button
                type="button"
                onClick={() => alElegir(x)}
                disabled={bloqueado}
                className="flex min-h-12 w-full items-center gap-3 rounded-control px-2 text-left hover:bg-fondo disabled:opacity-60"
              >
                <UserRound className="size-5 text-tinta-2" aria-hidden />
                <span className="flex-1">
                  <span className="font-semibold">{x.nombre}</span>
                  {bloqueado && <span className="block text-xs text-deuda">{x.activo ? 'Sin consentimiento' : 'Desactivado'}</span>}
                </span>
                <span className="cifras text-sm text-tinta-2">Disp. {formatoMoneda(x.disponible)}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </Tarjeta>
  );
}


function VentaRegistrada({ venta, alNueva }: { venta: Venta; alNueva: () => void }) {
  return (
    <Pagina titulo="Nueva venta">
      <Tarjeta className="mx-auto w-full max-w-lg overflow-hidden">
        <div className="flex flex-col items-center gap-2 p-6 text-center">
          <span className="flex size-16 items-center justify-center rounded-full border border-[#a7f3d0] bg-ok-bg text-ok">
            <CircleCheck className="size-9" aria-hidden />
          </span>
          <h2 className="text-2xl font-bold">Venta registrada</h2>
          <p role="status" className="text-tinta-2">
            Venta N.º {venta.id} registrada por <b className="text-tinta">{formatoMoneda(venta.total)}</b>.
          </p>
          <Insignia tono={venta.tipoPago === 'FIADO' ? 'info' : 'neutro'}>
            {venta.tipoPago === 'FIADO' ? `Fiado · ${venta.clienteNombre}` : 'Contado'}
          </Insignia>
        </div>
        <div className="border-t border-borde px-6 py-4">
          <TituloSeccion>Productos despachados ({venta.items.length})</TituloSeccion>
          <ul className="mt-2 divide-y divide-borde">
            {venta.items.map((i) => (
              <li key={i.productoId} className="flex justify-between py-2 text-sm">
                <span>
                  <b>{i.nombre}</b>
                  <span className="block text-tinta-2">
                    {i.cantidad} × {formatoMoneda(i.precioUnitario)}
                  </span>
                </span>
                <Moneda valor={i.subtotal} />
              </li>
            ))}
          </ul>
        </div>
        <div className="flex items-center justify-between border-t border-borde bg-fondo px-6 py-4">
          <span className="font-bold">Total {venta.tipoPago === 'FIADO' ? 'fiado' : 'cobrado'}</span>
          <Moneda valor={venta.total} className="text-2xl" />
        </div>
      </Tarjeta>
      <div className="mx-auto flex w-full max-w-lg flex-col gap-3">
        <Boton tamano="lg" onClick={alNueva} autoFocus>
          <Plus className="size-5" aria-hidden /> Nueva venta
        </Boton>
        <Link to={`/ventas/${venta.id}`} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control border border-borde bg-superficie font-semibold">
          <Eye className="size-5" aria-hidden /> Ver detalle
        </Link>
      </div>
    </Pagina>
  );
}

function LimiteExcedido({
  resultado,
  total,
  alCambiarAContado,
  alVolver,
}: {
  resultado: Extract<Resultado, { tipo: 'limite' }>;
  total: number;
  alCambiarAContado: () => void;
  alVolver: () => void;
}) {
  const { error, cliente } = resultado;
  const saldo = Number(error.extra?.saldo ?? cliente.saldo);
  const limite = Number(error.extra?.limite ?? cliente.limiteCredito);
  const disponible = Number(error.extra?.disponible ?? cliente.disponible);
  const uso = porcentajeUso(saldo, limite);
  return (
    <Pagina titulo="Nueva venta">
      <Tarjeta className="mx-auto flex w-full max-w-lg flex-col gap-4 p-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="flex size-16 items-center justify-center rounded-full border border-[#fecaca] bg-deuda-bg text-deuda">
            <TriangleAlert className="size-8" aria-hidden />
          </span>
          <h2 className="text-2xl font-bold">No se pudo fiar</h2>
          <p role="alert" className="text-tinta-2">
            {mensajeDeError(error)}
          </p>
        </div>
        <div className="flex justify-between rounded-control bg-fondo p-3 text-sm">
          <span>Venta en caja</span>
          <Moneda valor={total} />
        </div>
        <Tarjeta className="p-4">
          <p className="font-bold">{cliente.nombre}</p>
          <div className="mt-2 flex justify-between text-sm">
            <span>
              Deuda acumulada <Moneda valor={saldo} className="block text-deuda" />
            </span>
            <span className="text-right">
              Límite de fiado <Moneda valor={limite} className="block" />
            </span>
          </div>
          <BarraUso porcentaje={uso} className="mt-2" />
          <p className="mt-1 text-xs text-tinta-2">
            {uso}% utilizado · Margen restante <b>{formatoMoneda(disponible)}</b>
          </p>
          {total > disponible && (
            <p className="mt-3 rounded-control border border-[#fde68a] bg-alerta-bg p-2 text-sm text-alerta">
              Para fiar {formatoMoneda(total)}, el cliente debe pagar al menos <b>{formatoMoneda(total - disponible)}</b> de su deuda.
            </p>
          )}
        </Tarjeta>
        <Boton tamano="lg" onClick={alCambiarAContado}>
          <Banknote className="size-5" aria-hidden /> Cambiar a contado
        </Boton>
        <Boton tamano="lg" variante="contorno" onClick={alVolver}>
          <ArrowLeft className="size-5" aria-hidden /> Volver al carrito
        </Boton>
      </Tarjeta>
    </Pagina>
  );
}
