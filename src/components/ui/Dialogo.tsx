import * as RD from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface DialogoProps {
  abierto: boolean;
  alCambiar: (abierto: boolean) => void;
  titulo: string;
  descripcion?: ReactNode;
  children: ReactNode;
  pie?: ReactNode;
  /** hoja: abajo en móvil y lateral en escritorio (alta y edición de productos). */
  forma?: 'modal' | 'hoja';
}

/**
 * Diálogo accesible (Radix): en móvil sube como hoja desde abajo, como en las vistas;
 * en escritorio es un modal centrado o una hoja lateral.
 */
export function Dialogo({ abierto, alCambiar, titulo, descripcion, children, pie, forma = 'modal' }: DialogoProps) {
  return (
    <RD.Root open={abierto} onOpenChange={alCambiar}>
      <RD.Portal>
        <RD.Overlay className="fixed inset-0 z-40 bg-primario/60 data-[state=open]:animate-in" />
        <RD.Content
          className={cn(
            'fixed z-50 flex max-h-[92dvh] flex-col bg-superficie shadow-hoja outline-none',
            'inset-x-0 bottom-0 rounded-t-2xl',
            forma === 'modal'
              ? 'md:inset-auto md:left-1/2 md:top-1/2 md:w-full md:max-w-lg md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-tarjeta'
              : 'md:inset-y-0 md:right-0 md:left-auto md:bottom-auto md:h-dvh md:max-h-dvh md:w-[440px] md:rounded-none',
          )}
        >
          <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-borde md:hidden" aria-hidden />
          <div className="flex items-start justify-between gap-3 border-b border-borde px-4 py-3 md:px-6">
            <div>
              <RD.Title className="text-lg font-bold">{titulo}</RD.Title>
              {descripcion ? (
                <RD.Description className="text-sm text-tinta-2">{descripcion}</RD.Description>
              ) : (
                <RD.Description className="sr-only">{titulo}</RD.Description>
              )}
            </div>
            <RD.Close className="rounded-control p-2 text-tinta-2 hover:bg-fondo" aria-label="Cerrar">
              <X className="size-5" />
            </RD.Close>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6">{children}</div>
          {pie && <div className="border-t border-borde px-4 py-3 md:px-6">{pie}</div>}
        </RD.Content>
      </RD.Portal>
    </RD.Root>
  );
}
