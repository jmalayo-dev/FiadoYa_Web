import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export function Tarjeta({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-tarjeta border border-borde bg-superficie', className)} {...props} />;
}

export function TituloSeccion({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn('text-xs font-semibold uppercase tracking-wide text-tinta-2', className)}
      {...props}
    />
  );
}
