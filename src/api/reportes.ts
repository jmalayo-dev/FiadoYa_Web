import { useQuery } from '@tanstack/react-query';
import { http } from './client';
import type { ResumenVentas } from './tipos';

export interface Descarga {
  nombre: string;
  blob: Blob;
  tiempoParaleloMs?: number;
  tiempoSecuencialMs?: number;
}

/** Descarga con responseType blob y nombre desde Content-Disposition (Especificación §S08). */
async function descargar(url: string, porDefecto: string): Promise<Descarga> {
  const r = await http.get<Blob>(url, { responseType: 'blob' });
  const disposicion = String(r.headers['content-disposition'] ?? '');
  const nombre = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposicion)?.[1] ?? porDefecto;
  const num = (h: unknown) => (h === undefined || h === null || h === '' ? undefined : Number(h));
  return {
    nombre: decodeURIComponent(nombre),
    blob: r.data,
    tiempoParaleloMs: num(r.headers['x-tiempo-paralelo-ms']),
    tiempoSecuencialMs: num(r.headers['x-tiempo-secuencial-ms']),
  };
}

export const reportesApi = {
  deudoresPdf: () => descargar('/reportes/deudores.pdf', 'deudores.pdf'),
  deudoresExcel: () => descargar('/reportes/deudores.xlsx', 'deudores.xlsx'),
  consolidado: (comparar: boolean) => descargar(`/reportes/consolidado?comparar=${comparar}`, 'reportes.zip'),
  resumen: (desde: string, hasta: string) =>
    http.get<ResumenVentas>('/reportes/ventas/resumen', { params: { desde, hasta } }).then((r) => r.data),
};

export function useResumenVentas(desde: string, hasta: string) {
  return useQuery({ queryKey: ['resumen-ventas', desde, hasta], queryFn: () => reportesApi.resumen(desde, hasta) });
}

/** Guarda el archivo en el equipo del usuario. */
export function guardarArchivo(d: Descarga) {
  const url = URL.createObjectURL(d.blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = d.nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
