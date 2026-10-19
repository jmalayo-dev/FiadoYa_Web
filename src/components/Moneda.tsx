import { formatoMoneda } from '@/lib/formato';
import { cn } from '@/lib/cn';

/** Monto en soles con cifras tabulares. signo: muestra +/− explícito (cargos y pagos). */
export function Moneda({ valor, className, signo }: { valor: number; className?: string; signo?: '+' | '-' }) {
  return (
    <span className={cn('cifras font-bold whitespace-nowrap', className)}>
      {signo === '+' ? '+' : signo === '-' ? '−' : ''}
      {formatoMoneda(valor)}
    </span>
  );
}
