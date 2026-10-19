import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

const variantes = cva(
  'inline-flex items-center justify-center gap-2 rounded-control font-semibold transition-colors select-none disabled:pointer-events-none disabled:bg-[#e5e7eb] disabled:text-[#9ca3af] disabled:border-transparent',
  {
    variants: {
      variante: {
        primario: 'bg-primario text-white hover:bg-primario-hover active:bg-primario-hover',
        acento: 'bg-acento text-tinta hover:bg-acento-hover active:bg-acento-hover',
        contorno: 'bg-superficie border border-borde text-primario hover:bg-[#f9fafb] hover:border-[#9ca3af]',
        peligro: 'bg-deuda text-white hover:bg-[#991b1b]',
        fantasma: 'text-primario hover:bg-[#e5e7eb]',
        enlace: 'text-primario underline-offset-4 hover:underline px-0 min-h-0',
      },
      tamano: {
        md: 'min-h-12 px-4 text-[15px]',
        sm: 'min-h-10 px-3 text-sm',
        lg: 'min-h-14 px-5 text-base',
        icono: 'size-11 p-0',
      },
    },
    defaultVariants: { variante: 'primario', tamano: 'md' },
  },
);

export interface BotonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof variantes> {
  cargando?: boolean;
}

export const Boton = forwardRef<HTMLButtonElement, BotonProps>(
  ({ className, variante, tamano, cargando, disabled, children, type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(variantes({ variante, tamano }), className)}
      disabled={disabled || cargando}
      aria-busy={cargando || undefined}
      {...props}
    >
      {cargando && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  ),
);
Boton.displayName = 'Boton';
