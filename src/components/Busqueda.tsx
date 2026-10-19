import { Search, ScanBarcode } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Entrada } from './ui/Campo';
import { Boton } from './ui/Boton';
import { Escaner } from './Escaner';

/** Buscador con debounce de 300 ms y botón de escáner (v1.2 E3). */
export function Busqueda({
  valor,
  alCambiar,
  placeholder,
  etiqueta,
  conEscaner = true,
}: {
  valor: string;
  alCambiar: (v: string) => void;
  placeholder: string;
  etiqueta: string;
  conEscaner?: boolean;
}) {
  const [texto, setTexto] = useState(valor);
  const [escaneando, setEscaneando] = useState(false);

  useEffect(() => setTexto(valor), [valor]);
  useEffect(() => {
    const t = setTimeout(() => {
      if (texto !== valor) alCambiar(texto);
    }, 300);
    return () => clearTimeout(t);
  }, [texto, valor, alCambiar]);

  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-tinta-2" aria-hidden />
        <Entrada
          type="search"
          aria-label={etiqueta}
          placeholder={placeholder}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          className="pl-10"
        />
      </div>
      {conEscaner && (
        <Boton variante="contorno" tamano="icono" className="size-12" aria-label="Escanear código" onClick={() => setEscaneando(true)}>
          <ScanBarcode className="size-6" aria-hidden />
        </Boton>
      )}
      {escaneando && (
        <Escaner
          alLeer={(codigo) => {
            setEscaneando(false);
            setTexto(codigo);
            alCambiar(codigo);
          }}
          alCerrar={() => setEscaneando(false)}
        />
      )}
    </div>
  );
}
