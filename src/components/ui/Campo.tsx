import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

const base =
  'w-full min-h-12 rounded-control border bg-superficie px-3 text-[15px] text-tinta placeholder:text-tinta-3 outline-none transition-shadow focus:border-primario focus:ring-2 focus:ring-primario/15 disabled:bg-fondo';

export const Entrada = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { invalido?: boolean }>(
  ({ className, invalido, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(base, invalido ? 'border-deuda focus:border-deuda focus:ring-deuda/15' : 'border-borde', className)}
      aria-invalid={invalido || undefined}
      {...props}
    />
  ),
);
Entrada.displayName = 'Entrada';

export const AreaTexto = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & { invalido?: boolean }
>(({ className, invalido, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(base, 'py-3', invalido ? 'border-deuda' : 'border-borde', className)}
    aria-invalid={invalido || undefined}
    {...props}
  />
));
AreaTexto.displayName = 'AreaTexto';

interface CampoProps {
  etiqueta: string;
  error?: string;
  ayuda?: string;
  obligatorio?: boolean;
  className?: string;
  children: (ids: { id: string; describedBy?: string; invalido: boolean }) => ReactNode;
}

/** Etiqueta + control + error asociado con aria-describedby (accesibilidad, Especificación §5.1). */
export function Campo({ etiqueta, error, ayuda, obligatorio, className, children }: CampoProps) {
  const id = useId();
  const idAyuda = `${id}-ayuda`;
  const idError = `${id}-error`;
  const describedBy = [error ? idError : null, ayuda ? idAyuda : null].filter(Boolean).join(' ') || undefined;
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-sm font-semibold text-tinta">
        {etiqueta}
        {obligatorio && <span className="text-deuda"> *</span>}
      </label>
      {children({ id, describedBy, invalido: Boolean(error) })}
      {ayuda && !error && (
        <p id={idAyuda} className="text-xs text-tinta-2">
          {ayuda}
        </p>
      )}
      {error && (
        <p id={idError} role="alert" className="text-xs font-semibold text-deuda">
          {error}
        </p>
      )}
    </div>
  );
}
