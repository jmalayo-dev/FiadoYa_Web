import { WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';

/** Banner fijo "Sin conexión" (Especificación §7.4). */
export function useEnLinea() {
  const [enLinea, setEnLinea] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  useEffect(() => {
    const on = () => setEnLinea(true);
    const off = () => setEnLinea(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  return enLinea;
}

export function BannerSinConexion() {
  const enLinea = useEnLinea();
  if (enLinea) return null;
  return (
    <div role="status" className="sticky top-0 z-50 flex items-center justify-center gap-2 bg-alerta px-4 py-2 text-sm font-semibold text-white">
      <WifiOff className="size-4" aria-hidden /> Sin conexión. Las ventas y pagos están en pausa hasta que vuelva la red.
    </div>
  );
}
