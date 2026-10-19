import { cn } from '@/lib/cn';

export function Esqueleto({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-control bg-[#e5e7eb]', className)} aria-hidden />;
}

export function ListaEsqueleto({ filas = 4 }: { filas?: number }) {
  return (
    <div className="flex flex-col gap-3" role="status" aria-label="Cargando">
      {Array.from({ length: filas }, (_, i) => (
        <Esqueleto key={i} className="h-20 rounded-tarjeta" />
      ))}
    </div>
  );
}
