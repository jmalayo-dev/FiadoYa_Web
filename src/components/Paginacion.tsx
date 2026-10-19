import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Boton } from './ui/Boton';

export function Paginacion({
  pagina,
  totalPaginas,
  total,
  alCambiar,
}: {
  pagina: number;
  totalPaginas: number;
  total: number;
  alCambiar: (p: number) => void;
}) {
  if (totalPaginas <= 1) return <p className="py-3 text-center text-sm text-tinta-2">{total} en total</p>;
  return (
    <nav className="flex items-center justify-between py-3" aria-label="Paginación">
      <Boton variante="contorno" tamano="sm" disabled={pagina === 0} onClick={() => alCambiar(pagina - 1)}>
        <ChevronLeft className="size-4" aria-hidden /> Anterior
      </Boton>
      <span className="text-sm text-tinta-2">
        Página {pagina + 1} de {totalPaginas}
      </span>
      <Boton variante="contorno" tamano="sm" disabled={pagina + 1 >= totalPaginas} onClick={() => alCambiar(pagina + 1)}>
        Siguiente <ChevronRight className="size-4" aria-hidden />
      </Boton>
    </nav>
  );
}
