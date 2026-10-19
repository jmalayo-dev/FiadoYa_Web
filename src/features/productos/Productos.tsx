import * as RDM from '@radix-ui/react-dropdown-menu';
import { Archive, MoreVertical, Package, PackagePlus, Pencil, Plus, SlidersHorizontal, Trash2, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { useMutacionesProducto, useProductos } from '@/api/productos';
import type { Producto } from '@/api/tipos';
import { Busqueda } from '@/components/Busqueda';
import { StockBadge } from '@/components/EstadoBadge';
import { ErrorBloque, Vacio } from '@/components/Estados';
import { Moneda } from '@/components/Moneda';
import { Paginacion } from '@/components/Paginacion';
import { Pagina } from '@/components/Shell';
import { Boton } from '@/components/ui/Boton';
import { Dialogo } from '@/components/ui/Dialogo';
import { ListaEsqueleto } from '@/components/ui/Esqueleto';
import { Tarjeta } from '@/components/ui/Tarjeta';
import { Chip } from '@/features/alertas/Alertas';
import { mensajeDeError } from '@/lib/errores';
import { DialogoAjuste } from './DialogoAjuste';
import { HojaProducto } from './HojaProducto';
import { CATEGORIAS } from './esquemas';

/** S06 · Productos (HU03). */
export function Productos() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const soloBajos = params.get('soloBajos') === '1';
  const [pagina, setPagina] = useState(0);
  const { data, isLoading, error, refetch } = useProductos({ q, soloBajos, page: pagina, size: 20 });
  const bajos = useProductos({ soloBajos: true, size: 1 });
  const [editando, setEditando] = useState<Producto | 'nuevo' | null>(null);
  const [ajustando, setAjustando] = useState<Producto | null>(null);
  const [baja, setBaja] = useState<Producto | null>(null);

  const cambiar = (clave: string, valor: string | null) => {
    const p = new URLSearchParams(params);
    if (valor) p.set(clave, valor);
    else p.delete(clave);
    setParams(p, { replace: true });
    setPagina(0);
  };

  return (
    <Pagina titulo="Productos" icono={<Package className="size-6" aria-hidden />}>
      <div className="grid grid-cols-2 gap-3">
        <Tarjeta className="p-4">
          <p className="text-sm text-tinta-2">Activos</p>
          <p className="cifras text-2xl font-bold">{data?.totalElements ?? '—'}</p>
        </Tarjeta>
        <button type="button" onClick={() => cambiar('soloBajos', soloBajos ? null : '1')} className="text-left">
          <Tarjeta className="h-full border-[#fde68a] bg-alerta-bg p-4">
            <p className="flex items-center gap-1 text-sm font-semibold text-alerta">
              <TriangleAlert className="size-4" aria-hidden /> Por agotar
            </p>
            <p className="cifras text-2xl font-bold text-alerta">{bajos.data?.totalElements ?? '—'}</p>
          </Tarjeta>
        </button>
      </div>
      <Busqueda valor={q} alCambiar={(v) => cambiar('q', v || null)} etiqueta="Buscar producto" placeholder="Buscar por nombre o código…" />
      <div className="flex gap-2">
        <Chip activo={!soloBajos} onClick={() => cambiar('soloBajos', null)}>
          Todos
        </Chip>
        <Chip activo={soloBajos} onClick={() => cambiar('soloBajos', '1')}>
          Stock bajo
        </Chip>
      </div>

      {error ? (
        <ErrorBloque error={error} alReintentar={refetch} />
      ) : isLoading || !data ? (
        <ListaEsqueleto />
      ) : data.content.length === 0 ? (
        <Vacio
          mensaje={soloBajos ? 'Todo el stock está al día.' : 'No hay productos que coincidan.'}
          accion={
            <Boton onClick={() => setEditando('nuevo')}>
              <Plus className="size-4" aria-hidden /> Nuevo producto
            </Boton>
          }
        />
      ) : (
        <>
          <ul className="flex flex-col gap-3">
            {data.content.map((p) => (
              <li key={p.id}>
                <Tarjeta className="flex items-center gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold">{p.nombre}</p>
                      <StockBadge stock={p.stock} minimo={p.stockMinimo} />
                    </div>
                    <div className="mt-1 flex flex-wrap items-baseline gap-x-3">
                      <Moneda valor={p.precio} className="text-xl" />
                      <span className="text-sm text-tinta-2">
                        {CATEGORIAS.find((c) => c.valor === p.categoria)?.etiqueta}
                        {p.costo !== null && <> · Costo: {p.costo.toFixed(2)}</>}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`cifras text-xl font-bold ${p.stock === 0 ? 'text-deuda' : p.stock <= p.stockMinimo ? 'text-alerta' : ''}`}>
                      {p.stock} u.
                    </p>
                    <p className="text-xs text-tinta-2">mín. {p.stockMinimo}</p>
                  </div>
                  <RDM.Root>
                    <RDM.Trigger className="rounded-control p-2 hover:bg-fondo" aria-label={`Acciones de ${p.nombre}`}>
                      <MoreVertical className="size-5" />
                    </RDM.Trigger>
                    <RDM.Portal>
                      <RDM.Content align="end" className="z-50 min-w-48 rounded-tarjeta border border-borde bg-superficie p-1 shadow-hoja">
                        <ItemMenu onSelect={() => setEditando(p)} icono={<Pencil className="size-4" />}>
                          Editar
                        </ItemMenu>
                        <ItemMenu onSelect={() => setAjustando(p)} icono={<SlidersHorizontal className="size-4" />}>
                          Ajustar stock
                        </ItemMenu>
                        <ItemMenu onSelect={() => setBaja(p)} icono={<Trash2 className="size-4" />} peligro>
                          Dar de baja
                        </ItemMenu>
                      </RDM.Content>
                    </RDM.Portal>
                  </RDM.Root>
                </Tarjeta>
              </li>
            ))}
          </ul>
          <Paginacion pagina={data.page} totalPaginas={data.totalPages} total={data.totalElements} alCambiar={setPagina} />
        </>
      )}

      <Boton
        onClick={() => setEditando('nuevo')}
        className="fixed bottom-24 right-4 z-20 rounded-full shadow-hoja md:bottom-8 md:right-8"
        tamano="lg"
      >
        <PackagePlus className="size-5" aria-hidden /> Nuevo producto
      </Boton>

      {editando && <HojaProducto producto={editando === 'nuevo' ? null : editando} alCerrar={() => setEditando(null)} />}
      {ajustando && <DialogoAjuste producto={ajustando} alCerrar={() => setAjustando(null)} />}
      {baja && <ConfirmarBaja producto={baja} alCerrar={() => setBaja(null)} />}
    </Pagina>
  );
}

function ItemMenu({ children, icono, onSelect, peligro }: { children: React.ReactNode; icono: React.ReactNode; onSelect: () => void; peligro?: boolean }) {
  return (
    <RDM.Item
      onSelect={onSelect}
      className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-control px-3 font-semibold outline-none ${
        peligro ? 'text-deuda data-[highlighted]:bg-deuda-bg' : 'data-[highlighted]:bg-fondo'
      }`}
    >
      {icono} {children}
    </RDM.Item>
  );
}

function ConfirmarBaja({ producto, alCerrar }: { producto: Producto; alCerrar: () => void }) {
  const { darDeBaja } = useMutacionesProducto();
  return (
    <Dialogo
      abierto
      alCambiar={(v) => !v && alCerrar()}
      titulo="Dar de baja"
      descripcion={producto.nombre}
      pie={
        <div className="flex gap-2">
          <Boton variante="contorno" className="flex-1" onClick={alCerrar}>
            Cancelar
          </Boton>
          <Boton
            variante="peligro"
            className="flex-1"
            cargando={darDeBaja.isPending}
            onClick={() =>
              darDeBaja.mutate(producto.id, {
                onSuccess: () => {
                  toast.success(`${producto.nombre} se dio de baja.`);
                  alCerrar();
                },
                onError: (e) => toast.error(mensajeDeError(e)),
              })
            }
          >
            <Archive className="size-4" aria-hidden /> Dar de baja
          </Boton>
        </div>
      }
    >
      <p className="text-sm text-tinta-2">
        El producto ya no se podrá vender ni reponer, pero se mantiene en las ventas anteriores.
      </p>
    </Dialogo>
  );
}
