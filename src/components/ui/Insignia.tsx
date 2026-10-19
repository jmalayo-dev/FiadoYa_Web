import type { HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

const tonos = cva('inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap', {
  variants: {
    tono: {
      neutro: 'bg-[#f3f4f6] border-borde text-tinta-2',
      ok: 'bg-ok-bg border-[#a7f3d0] text-ok',
      deuda: 'bg-deuda-bg border-[#fecaca] text-deuda',
      alerta: 'bg-alerta-bg border-[#fde68a] text-alerta',
      info: 'bg-info-bg border-[#bfdbfe] text-info',
      oscuro: 'bg-primario border-primario text-white',
    },
  },
  defaultVariants: { tono: 'neutro' },
});

export type Tono = NonNullable<VariantProps<typeof tonos>['tono']>;

export function Insignia({ className, tono, ...props }: HTMLAttributes<HTMLSpanElement> & VariantProps<typeof tonos>) {
  return <span className={cn(tonos({ tono }), className)} {...props} />;
}
