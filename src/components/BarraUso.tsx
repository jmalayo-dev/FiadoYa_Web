import { cn } from '@/lib/cn';

/** Barra de uso del crédito: oscura normal, roja desde el 90 %. */
export function BarraUso({ porcentaje, className }: { porcentaje: number; className?: string }) {
  const valor = Math.min(100, Math.max(0, porcentaje));
  return (
    <div
      className={cn('h-2 w-full overflow-hidden rounded-full bg-[#e5e7eb]', className)}
      role="progressbar"
      aria-valuenow={valor}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Uso del crédito"
    >
      <div className={cn('h-full rounded-full', valor >= 90 ? 'bg-deuda' : 'bg-primario')} style={{ width: `${valor}%` }} />
    </div>
  );
}

export function Avatar({ texto, className }: { texto: string; className?: string }) {
  return (
    <div
      className={cn('flex size-12 shrink-0 items-center justify-center rounded-full bg-[#e5e7eb] text-sm font-bold text-tinta', className)}
      aria-hidden
    >
      {texto}
    </div>
  );
}
