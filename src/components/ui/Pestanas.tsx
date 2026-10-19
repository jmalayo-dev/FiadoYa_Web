import * as RT from '@radix-ui/react-tabs';
import type { ReactNode } from 'react';

interface Pestana {
  valor: string;
  etiqueta: string;
  contenido: ReactNode;
}

/** Pestañas segmentadas como en "Estado de cuenta / Datos del cliente". */
export function Pestanas({ pestanas, porDefecto }: { pestanas: Pestana[]; porDefecto?: string }) {
  return (
    <RT.Root defaultValue={porDefecto ?? pestanas[0]?.valor}>
      <RT.List className="grid grid-flow-col gap-1 rounded-tarjeta bg-[#e5e7eb] p-1" aria-label="Secciones">
        {pestanas.map((p) => (
          <RT.Trigger
            key={p.valor}
            value={p.valor}
            className="min-h-11 rounded-control text-sm font-semibold text-tinta-2 data-[state=active]:bg-superficie data-[state=active]:text-tinta data-[state=active]:shadow-elevada"
          >
            {p.etiqueta}
          </RT.Trigger>
        ))}
      </RT.List>
      {pestanas.map((p) => (
        <RT.Content key={p.valor} value={p.valor} className="mt-4 outline-none">
          {p.contenido}
        </RT.Content>
      ))}
    </RT.Root>
  );
}
