import { CloudOff, Inbox, RotateCw } from 'lucide-react';
import type { ReactNode } from 'react';
import { mensajeDeError } from '@/lib/errores';
import { Boton } from './ui/Boton';
import { Tarjeta } from './ui/Tarjeta';

/** Estado vacío: mensaje + acción (Especificación §5.1). */
export function Vacio({ mensaje, detalle, accion, icono }: { mensaje: string; detalle?: string; accion?: ReactNode; icono?: ReactNode }) {
  return (
    <Tarjeta className="flex flex-col items-center gap-3 px-6 py-10 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-ok-bg text-ok">{icono ?? <Inbox className="size-7" />}</div>
      <p className="text-base font-bold">{mensaje}</p>
      {detalle && <p className="max-w-sm text-sm text-tinta-2">{detalle}</p>}
      {accion}
    </Tarjeta>
  );
}

/** Estado de error: mensaje + reintentar. */
export function ErrorBloque({ error, alReintentar, compacto, mensaje }: { error: unknown; alReintentar?: () => void; compacto?: boolean; mensaje?: string }) {
  return (
    <div
      role="alert"
      className={`flex ${compacto ? 'flex-row items-center justify-between' : 'flex-col items-center text-center'} gap-3 rounded-tarjeta border border-[#fecaca] bg-deuda-bg px-4 py-5`}
    >
      <div className={`flex items-center gap-2 text-deuda ${compacto ? '' : 'flex-col'}`}>
        <CloudOff className={compacto ? 'size-5' : 'size-8'} aria-hidden />
        <p className="text-sm font-semibold">{mensaje ?? mensajeDeError(error)}</p>
      </div>
      {alReintentar && (
        <Boton variante="contorno" tamano="sm" onClick={alReintentar}>
          <RotateCw className="size-4" aria-hidden /> Reintentar
        </Boton>
      )}
    </div>
  );
}
