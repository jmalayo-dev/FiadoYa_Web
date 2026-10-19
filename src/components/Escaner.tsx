import { useEffect, useRef, useState } from 'react';
import { Dialogo } from './ui/Dialogo';
import { Entrada } from './ui/Campo';
import { Boton } from './ui/Boton';

/**
 * Lee códigos de barras con la cámara (v1.2 E3): BarcodeDetector del navegador y, si no existe, @zxing/browser.
 * Si no hay cámara, permite escribir el código a mano.
 */
export function Escaner({ alLeer, alCerrar }: { alLeer: (codigo: string) => void; alCerrar: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [manual, setManual] = useState('');

  useEffect(() => {
    let detenido = false;
    let detener: (() => void) | undefined;
    (async () => {
      try {
        const { BrowserMultiFormatReader } = await import('@zxing/browser');
        const lector = new BrowserMultiFormatReader();
        const controles = await lector.decodeFromVideoDevice(undefined, video.current!, (resultado) => {
          if (resultado && !detenido) {
            detenido = true;
            controles.stop();
            alLeer(resultado.getText());
          }
        });
        detener = () => controles.stop();
      } catch {
        setError('No se pudo usar la cámara. Escribe el código.');
      }
    })();
    return () => {
      detenido = true;
      detener?.();
    };
  }, [alLeer]);

  return (
    <Dialogo abierto alCambiar={(v) => !v && alCerrar()} titulo="Escanear código" descripcion="Apunta la cámara al código de barras.">
      <div className="flex flex-col gap-4">
        {!error && <video ref={video} className="aspect-video w-full rounded-tarjeta bg-primario" muted playsInline />}
        {error && <p className="text-sm text-alerta">{error}</p>}
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (manual.trim()) alLeer(manual.trim());
          }}
        >
          <Entrada aria-label="Código manual" inputMode="numeric" placeholder="Código de barras" value={manual} onChange={(e) => setManual(e.target.value)} />
          <Boton type="submit">Usar</Boton>
        </form>
      </div>
    </Dialogo>
  );
}
