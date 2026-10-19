import axios, { AxiosError } from 'axios';
import type { ApiError } from './tipos';
import { config } from '@/lib/config';
import { leerSesion } from '@/auth/sesion';

/** Cliente HTTP único (Especificación §7.2): base /api, Bearer automático y errores como ApiError. */
export const http = axios.create({ baseURL: config.apiBase, timeout: 20_000 });

type AlCerrarSesion = (motivo: 'vencida') => void;
let alCerrarSesion: AlCerrarSesion = () => {};

/** El AuthProvider registra aquí cómo cerrar sesión cuando el token ya no sirve. */
export function registrarCierreDeSesion(fn: AlCerrarSesion) {
  alCerrarSesion = fn;
}

http.interceptors.request.use((req) => {
  const sesion = leerSesion();
  if (sesion?.token) req.headers.set('Authorization', `Bearer ${sesion.token}`);
  return req;
});

http.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const apiError = await aApiError(error);
    const esLogin = error.config?.url?.includes('/auth/login');
    if (apiError.status === 401 && !esLogin && apiError.code !== 'AUTH_INVALID_CREDENTIALS') {
      alCerrarSesion('vencida');
    }
    return Promise.reject(apiError);
  },
);

async function aApiError(error: AxiosError): Promise<ApiError> {
  if (!error.response) {
    return { type: 'about:blank', title: 'Sin conexión', status: 0, detail: error.message, code: 'RED' };
  }
  let data: unknown = error.response.data;
  if (data instanceof Blob) {
    // Descargas (responseType: blob): el error también llega como Blob.
    try {
      data = JSON.parse(await data.text());
    } catch {
      data = null;
    }
  }
  if (data && typeof data === 'object' && 'code' in data) return data as ApiError;
  return {
    type: 'about:blank',
    title: 'Error',
    status: error.response.status,
    detail: '',
    code: codigoPorEstado(error.response.status),
  };
}

function codigoPorEstado(status: number): string {
  if (status === 401) return 'AUTH_TOKEN_EXPIRED';
  if (status === 403) return 'AUTH_FORBIDDEN';
  if (status === 404) return 'NOT_FOUND';
  if (status === 503) return 'SERVICIO_NO_DISPONIBLE';
  return 'DESCONOCIDO';
}
