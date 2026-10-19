import { CircleCheck, LogOut, Phone, Store } from 'lucide-react';
import { useBodega } from '@/api/auth';
import { useMiCuenta } from '@/api/clientes';
import { useAuth } from '@/auth/useAuth';
import { BarraUso } from '@/components/BarraUso';
import { ErrorBloque } from '@/components/Estados';
import { Logo } from '@/components/Shell';
import { Moneda } from '@/components/Moneda';
import { Boton } from '@/components/ui/Boton';
import { ListaEsqueleto } from '@/components/ui/Esqueleto';
import { Insignia } from '@/components/ui/Insignia';
import { Tarjeta, TituloSeccion } from '@/components/ui/Tarjeta';
import { MovimientosCuenta } from '@/features/clientes/MovimientosCuenta';
import { porcentajeUso } from '@/lib/formato';

/** S10 · Mi cuenta del cliente (HU07/HU12). Sin navegación de bodeguero ni asistente (D4). */
export function MiCuenta() {
  const { logout } = useAuth();
  const { data, isLoading, error, refetch } = useMiCuenta();
  const { data: bodega } = useBodega();

  return (
    <div className="min-h-dvh bg-fondo">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-borde bg-superficie px-4 py-3">
        <Logo className="size-10" />
        <div className="flex-1">
          <p className="text-lg font-bold leading-tight">
            Fiado<span className="text-ok">Ya</span>
          </p>
          <p className="text-xs text-tinta-2">Cliente de confianza</p>
        </div>
        <Boton variante="contorno" tamano="sm" onClick={() => logout()}>
          Salir <LogOut className="size-4" aria-hidden />
        </Boton>
      </header>
      <main className="mx-auto flex max-w-xl flex-col gap-4 px-4 py-5">
        {error ? (
          <ErrorBloque error={error} alReintentar={refetch} />
        ) : isLoading || !data ? (
          <ListaEsqueleto filas={3} />
        ) : (
          <>
            <div>
              <Insignia tono="ok">{data.cliente.activo ? 'Activa' : 'Inactiva'}</Insignia>
              <h1 className="mt-2 text-2xl font-bold">¡Hola, {data.cliente.nombre}!</h1>
              <p className="flex items-center gap-1.5 text-sm text-tinta-2">
                <Store className="size-4" aria-hidden /> <b>{bodega?.nombre ?? 'Tu bodega'}</b> · Tu cuenta al día
              </p>
            </div>
            <Tarjeta className="border-t-4 border-t-deuda p-5">
              <TituloSeccion>{data.cliente.saldo > 0 ? 'Debes actualmente' : 'Tu cuenta'}</TituloSeccion>
              {data.cliente.saldo > 0 ? (
                <p className="mt-1 text-4xl font-bold text-deuda">
                  Debes <Moneda valor={data.cliente.saldo} />
                </p>
              ) : (
                <p className="mt-1 flex items-center gap-2 text-3xl font-bold text-ok">
                  <CircleCheck className="size-8" aria-hidden /> No debes nada
                </p>
              )}
              <div className="mt-4 flex justify-between border-t border-borde pt-3 text-sm">
                <span>Uso de tu crédito ({porcentajeUso(data.cliente.saldo, data.cliente.limiteCredito)}%)</span>
                <span>
                  Límite: <Moneda valor={data.cliente.limiteCredito} />
                </span>
              </div>
              <BarraUso porcentaje={porcentajeUso(data.cliente.saldo, data.cliente.limiteCredito)} className="mt-2" />
              <p className="mt-3 flex justify-between rounded-control border border-[#a7f3d0] bg-ok-bg p-3 font-semibold text-ok">
                <span>Te quedan para fiar:</span>
                <Moneda valor={data.cliente.disponible} />
              </p>
            </Tarjeta>
            <Tarjeta className="p-4">
              <p className="font-bold">¿Cómo realizar tus abonos?</p>
              <p className="mt-1 text-sm text-tinta-2">Para pagar, acércate a la bodega. Todo abono se registra de inmediato.</p>
            </Tarjeta>
            <section className="flex flex-col gap-2">
              <h2 className="text-xl font-bold">Tus movimientos</h2>
              <MovimientosCuenta movimientos={data.movimientos} paraCliente />
            </section>
            {bodega && (
              <Tarjeta className="flex flex-col items-center gap-2 p-5 text-center">
                <p className="font-bold">¿Tienes dudas de tu cuenta?</p>
                <p className="text-sm text-tinta-2">Llama o escribe a {bodega.nombre}:</p>
                <a href={`tel:+51${bodega.telefono}`} className="inline-flex min-h-12 items-center gap-2 rounded-control bg-primario px-5 font-semibold text-white">
                  <Phone className="size-4" aria-hidden /> {bodega.telefono.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3')}
                </a>
              </Tarjeta>
            )}
          </>
        )}
      </main>
    </div>
  );
}
