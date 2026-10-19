import { useMutation } from '@tanstack/react-query';
import { ChartColumn, Download, FileArchive, FileSpreadsheet, FileText, Gauge, Zap } from 'lucide-react';
import { useState } from 'react';
import { guardarArchivo, reportesApi, useResumenVentas, type Descarga } from '@/api/reportes';
import { ErrorBloque } from '@/components/Estados';
import { Moneda } from '@/components/Moneda';
import { Pagina } from '@/components/Shell';
import { Boton } from '@/components/ui/Boton';
import { Casilla } from '@/components/ui/Casilla';
import { Entrada } from '@/components/ui/Campo';
import { Esqueleto } from '@/components/ui/Esqueleto';
import { Insignia } from '@/components/ui/Insignia';
import { Tarjeta, TituloSeccion } from '@/components/ui/Tarjeta';
import { Chip } from '@/features/alertas/Alertas';
import { mensajeDeError } from '@/lib/errores';
import { formatoDia, hoyLima, sumarDias } from '@/lib/formato';
import { toast } from 'sonner';

/** S08 · Reportes (HU09 y HU10): deudores PDF/Excel, consolidado con tiempos y resumen de ventas. */
export function Reportes() {
  return (
    <Pagina titulo="Reportes" icono={<ChartColumn className="size-6" aria-hidden />}>
      <div>
        <h2 className="text-xl font-bold">Exportar reportes</h2>
        <p className="text-sm text-tinta-2">Descarga los listados de cobranza para tu control.</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <TarjetaDescarga
          titulo="Deudores (PDF)"
          detalle="Clientes con saldo pendiente y teléfonos para la cobranza."
          icono={<FileText className="size-6 text-deuda" aria-hidden />}
          etiqueta="Descargar PDF"
          generar={reportesApi.deudoresPdf}
        />
        <TarjetaDescarga
          titulo="Deudores (Excel)"
          detalle="Mismo listado en .xlsx para ordenar y filtrar."
          icono={<FileSpreadsheet className="size-6 text-ok" aria-hidden />}
          etiqueta="Descargar Excel"
          generar={reportesApi.deudoresExcel}
        />
      </div>
      <Consolidado />
      <ResumenVentas />
    </Pagina>
  );
}

function TarjetaDescarga({ titulo, detalle, icono, etiqueta, generar }: { titulo: string; detalle: string; icono: React.ReactNode; etiqueta: string; generar: () => Promise<Descarga> }) {
  const m = useMutation({ mutationFn: generar, onSuccess: guardarArchivo, onError: (e) => toast.error(mensajeDeError(e)) });
  return (
    <Tarjeta className="flex flex-col gap-3 p-4">
      <div className="flex gap-3">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-control border border-borde">{icono}</span>
        <div>
          <p className="font-bold">{titulo}</p>
          <p className="text-sm text-tinta-2">{detalle}</p>
        </div>
      </div>
      <Boton variante="contorno" cargando={m.isPending} onClick={() => m.mutate()}>
        {!m.isPending && <Download className="size-4" aria-hidden />} {m.isPending ? 'Generando…' : etiqueta}
      </Boton>
    </Tarjeta>
  );
}

function Consolidado() {
  const [comparar, setComparar] = useState(true);
  const m = useMutation({
    mutationFn: () => reportesApi.consolidado(comparar),
    onSuccess: guardarArchivo,
    onError: (e) => toast.error(mensajeDeError(e)),
  });
  const t = m.data;
  const mejora = t?.tiempoParaleloMs !== undefined && t.tiempoSecuencialMs ? Math.round((1 - t.tiempoParaleloMs / t.tiempoSecuencialMs) * 100) : null;
  return (
    <Tarjeta className="flex flex-col gap-3 border-primario p-4">
      <div className="flex gap-3">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-control bg-primario text-white">
          <FileArchive className="size-6" aria-hidden />
        </span>
        <div>
          <p className="font-bold">Paquete completo (ZIP)</p>
          <p className="text-sm text-tinta-2">Deudores en PDF y Excel más el resumen de ventas de 30 días, generados en paralelo.</p>
        </div>
      </div>
      <Casilla marcada={comparar} alCambiar={setComparar}>
        Comparar tiempos de procesamiento
      </Casilla>
      <Boton cargando={m.isPending} onClick={() => m.mutate()}>
        {m.isPending ? 'Generando… (ZIP)' : 'Descargar ZIP'}
      </Boton>
      {t?.tiempoParaleloMs !== undefined && (
        <div className="rounded-control border border-borde p-3" role="status">
          <p className="flex items-center gap-2 text-sm font-bold">
            <Gauge className="size-4" aria-hidden /> Comparativa de rendimiento
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <div className="rounded-control border border-[#a7f3d0] bg-ok-bg p-3">
              <p className="text-xs text-tinta-2">Paralelo</p>
              <p className="cifras text-2xl font-bold">{t.tiempoParaleloMs} ms</p>
              {mejora !== null && mejora > 0 && (
                <Insignia tono="ok">
                  <Zap className="size-3" aria-hidden /> {mejora}% más rápido
                </Insignia>
              )}
            </div>
            <div className="rounded-control border border-borde bg-fondo p-3">
              <p className="text-xs text-tinta-2">Secuencial</p>
              <p className="cifras text-2xl font-bold text-tinta-2">{t.tiempoSecuencialMs ?? '—'} ms</p>
            </div>
          </div>
          <p className="mt-2 text-xs text-tinta-2">
            Paralelo {t.tiempoParaleloMs} ms · Secuencial {t.tiempoSecuencialMs ?? '—'} ms
          </p>
        </div>
      )}
    </Tarjeta>
  );
}

function ResumenVentas() {
  const hoy = hoyLima();
  const [desde, setDesde] = useState(sumarDias(hoy, -6));
  const [hasta, setHasta] = useState(hoy);
  const { data, isLoading, error, refetch } = useResumenVentas(desde, hasta);
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xl font-bold">Resumen de ventas</h2>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4">
        <Chip activo={desde === sumarDias(hoy, -6) && hasta === hoy} onClick={() => (setDesde(sumarDias(hoy, -6)), setHasta(hoy))}>Últimos 7 días</Chip>
        <Chip activo={desde === sumarDias(hoy, -29) && hasta === hoy} onClick={() => (setDesde(sumarDias(hoy, -29)), setHasta(hoy))}>30 días</Chip>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1 text-xs font-semibold text-tinta-2">
          Desde
          <Entrada type="date" value={desde} max={hasta} onChange={(e) => e.target.value && setDesde(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-tinta-2">
          Hasta
          <Entrada type="date" value={hasta} min={desde} onChange={(e) => e.target.value && setHasta(e.target.value)} />
        </label>
      </div>
      {error ? (
        <ErrorBloque error={error} alReintentar={refetch} />
      ) : isLoading || !data ? (
        <Esqueleto className="h-48" />
      ) : (
        <>
          <Tarjeta className="border-primario bg-primario p-5 text-white">
            <p className="text-sm text-white/75">Ventas confirmadas</p>
            <Moneda valor={data.montoTotal} className="text-3xl" />
            <p className="text-sm text-white/75">{data.totalVentas} ventas</p>
          </Tarjeta>
          <Tarjeta className="overflow-hidden">
            <div className="px-4 pt-4">
              <TituloSeccion>Desglose diario</TituloSeccion>
            </div>
            <table className="mt-2 w-full text-sm">
              <thead className="sr-only">
                <tr>
                  <th>Día</th>
                  <th>Ventas</th>
                  <th>Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borde">
                {[...data.porDia].reverse().map((d) => (
                  <tr key={d.fecha}>
                    <td className="px-4 py-3">
                      <b className="capitalize">{formatoDia(d.fecha)}</b>
                      <span className="block text-xs text-tinta-2">{d.cantidad} ventas</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Moneda valor={d.monto} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Tarjeta>
          <Tarjeta className="overflow-hidden">
            <div className="px-4 pt-4">
              <TituloSeccion>Más vendidos (top 5)</TituloSeccion>
            </div>
            {data.topProductos.length === 0 ? (
              <p className="p-4 text-sm text-tinta-2">Aún no hay ventas en este rango.</p>
            ) : (
              <ol className="divide-y divide-borde">
                {data.topProductos.map((p, i) => (
                  <li key={p.productoId} className="flex items-center gap-3 px-4 py-3">
                    <span className={`flex size-7 items-center justify-center rounded-full text-xs font-bold ${i < 3 ? 'bg-primario text-white' : 'bg-fondo'}`}>{i + 1}</span>
                    <span className="flex-1">
                      <b>{p.nombre}</b>
                      <span className="block text-xs text-tinta-2">{p.cantidad} uds. vendidas</span>
                    </span>
                    <Moneda valor={p.monto} />
                  </li>
                ))}
              </ol>
            )}
          </Tarjeta>
        </>
      )}
    </section>
  );
}
