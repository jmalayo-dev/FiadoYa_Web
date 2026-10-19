import { ChevronRight, CircleCheck, Phone, TriangleAlert, UserPlus, Users } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { useClientes, useResumenClientes, type FiltroClientes } from '@/api/clientes';
import { BarraUso, Avatar } from '@/components/BarraUso';
import { Busqueda } from '@/components/Busqueda';
import { ErrorBloque, Vacio } from '@/components/Estados';
import { Moneda } from '@/components/Moneda';
import { Paginacion } from '@/components/Paginacion';
import { Pagina } from '@/components/Shell';
import { Boton } from '@/components/ui/Boton';
import { ListaEsqueleto } from '@/components/ui/Esqueleto';
import { Insignia } from '@/components/ui/Insignia';
import { Tarjeta } from '@/components/ui/Tarjeta';
import { Chip } from '@/features/alertas/Alertas';
import { iniciales, porcentajeUso } from '@/lib/formato';

/** S05 · Clientes (HU02). */
export function ListaClientes() {
  const [params, setParams] = useSearchParams();
  const navegar = useNavigate();
  const q = params.get('q') ?? '';
  const conDeuda = params.get('conDeuda') === '1';
  const orden = (params.get('orden') as FiltroClientes['orden']) ?? (conDeuda ? 'deuda' : 'reciente');
  const [pagina, setPagina] = useState(0);
  const { data, isLoading, error, refetch } = useClientes({ q, conDeuda, orden, page: pagina, size: 20 });
  const resumen = useResumenClientes();

  const cambiar = (cambios: Record<string, string | null>) => {
    const p = new URLSearchParams(params);
    Object.entries(cambios).forEach(([k, v]) => (v ? p.set(k, v) : p.delete(k)));
    setParams(p, { replace: true });
    setPagina(0);
  };

  return (
    <Pagina titulo="Clientes" icono={<Users className="size-6" aria-hidden />}>
      <Tarjeta className="border-primario bg-primario p-5 text-white">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/70">Total fiado en cartera</p>
        <Moneda valor={resumen.data?.deudaTotal ?? 0} className="mt-1 block text-3xl" />
        <div className="mt-3 flex justify-between border-t border-white/15 pt-3 text-sm">
          <span className="flex items-center gap-1.5">
            <TriangleAlert className="size-4 text-[#fca5a5]" aria-hidden /> {resumen.data?.clientesConDeuda ?? 0} clientes con deuda
          </span>
          <span className="text-acento">{resumen.data?.totalClientes ?? 0} registrados</span>
        </div>
      </Tarjeta>

      <Busqueda valor={q} alCambiar={(v) => cambiar({ q: v || null })} etiqueta="Buscar cliente" placeholder="Buscar por nombre, teléfono o DNI…" />
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="group" aria-label="Filtros">
        <Chip activo={conDeuda} onClick={() => cambiar({ conDeuda: conDeuda ? null : '1' })}>
          Solo con deuda
        </Chip>
        <Chip activo={orden === 'deuda'} onClick={() => cambiar({ orden: 'deuda' })}>
          Mayor deuda
        </Chip>
        <Chip activo={orden === 'reciente'} onClick={() => cambiar({ orden: 'reciente' })}>
          Recientes
        </Chip>
        <Chip activo={orden === 'nombre'} onClick={() => cambiar({ orden: 'nombre' })}>
          A–Z
        </Chip>
      </div>

      {error ? (
        <ErrorBloque error={error} alReintentar={refetch} />
      ) : isLoading || !data ? (
        <ListaEsqueleto />
      ) : data.content.length === 0 ? (
        <Vacio
          mensaje={conDeuda ? 'Sin clientes con deuda.' : 'Aún no hay clientes registrados.'}
          accion={<Boton onClick={() => navegar('/clientes/nuevo')}>Nuevo cliente</Boton>}
        />
      ) : (
        <>
          <ul className="flex flex-col gap-3">
            {data.content.map((c) => {
              const uso = porcentajeUso(c.saldo, c.limiteCredito);
              return (
                <li key={c.id}>
                  <Link to={`/clientes/${c.id}`} className="block">
                    <Tarjeta className="p-4 hover:shadow-elevada">
                      <div className="flex items-center gap-3">
                        <Avatar texto={iniciales(c.nombre)} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-bold">{c.nombre}</p>
                          <p className="flex items-center gap-1 text-sm text-tinta-2">
                            <Phone className="size-3.5" aria-hidden /> {c.telefono.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3')}
                          </p>
                        </div>
                        <div className="text-right">
                          {c.saldo > 0 ? (
                            <p className="flex items-center justify-end gap-1.5">
                              <Insignia tono="deuda">Debe</Insignia>
                              <Moneda valor={c.saldo} className="text-lg text-deuda" />
                            </p>
                          ) : (
                            <Insignia tono="ok">
                              <CircleCheck className="size-3.5" aria-hidden /> Al día
                            </Insignia>
                          )}
                          <p className={`mt-1 text-xs font-semibold ${uso >= 90 ? 'text-alerta' : 'text-ok'}`}>
                            Disponible <Moneda valor={c.disponible} className="font-semibold" />
                          </p>
                        </div>
                        <ChevronRight className="size-5 text-tinta-3" aria-hidden />
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs text-tinta-2">
                        <span>
                          Límite <Moneda valor={c.limiteCredito} className="font-semibold" />
                        </span>
                        {uso >= 90 ? (
                          <Insignia tono="alerta">
                            <TriangleAlert className="size-3" aria-hidden /> Cerca del límite ({uso}%)
                          </Insignia>
                        ) : (
                          <span>{uso}% usado</span>
                        )}
                      </div>
                      <BarraUso porcentaje={uso} className="mt-2" />
                      {!c.consentimiento && <p className="mt-2 text-xs font-semibold text-alerta">Sin consentimiento: no se le puede fiar.</p>}
                    </Tarjeta>
                  </Link>
                </li>
              );
            })}
          </ul>
          <Paginacion pagina={data.page} totalPaginas={data.totalPages} total={data.totalElements} alCambiar={setPagina} />
        </>
      )}
      <Boton onClick={() => navegar('/clientes/nuevo')} tamano="lg" className="fixed bottom-24 right-4 z-20 rounded-full shadow-hoja md:bottom-8 md:right-8">
        <UserPlus className="size-5" aria-hidden /> Nuevo cliente
      </Boton>
    </Pagina>
  );
}
