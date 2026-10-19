import * as RC from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';
import { useId, type ReactNode } from 'react';

export function Casilla({
  marcada,
  alCambiar,
  children,
  deshabilitada,
}: {
  marcada: boolean;
  alCambiar: (v: boolean) => void;
  children: ReactNode;
  deshabilitada?: boolean;
}) {
  const id = useId();
  return (
    <div className="flex items-start gap-3">
      <RC.Root
        id={id}
        checked={marcada}
        onCheckedChange={(v) => alCambiar(v === true)}
        disabled={deshabilitada}
        className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md border border-borde bg-superficie data-[state=checked]:border-primario data-[state=checked]:bg-primario"
      >
        <RC.Indicator>
          <Check className="size-4 text-white" strokeWidth={3} />
        </RC.Indicator>
      </RC.Root>
      <label htmlFor={id} className="text-sm leading-6 text-tinta">
        {children}
      </label>
    </div>
  );
}
