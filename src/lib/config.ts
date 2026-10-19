/** Configuración en tiempo de ejecución (config.js, generado por el contenedor) con valores por defecto. */
declare global {
  interface Window {
    __CONFIG__?: { API_BASE?: string; FEATURE_RECIBIR?: string };
  }
}

const runtime = typeof window !== 'undefined' ? (window.__CONFIG__ ?? {}) : {};

export const config = {
  apiBase: runtime.API_BASE || '/api',
  usarMocks: import.meta.env.VITE_USE_MOCKS === 'true',
  recibirReposiciones:
    (runtime.FEATURE_RECIBIR || import.meta.env.VITE_FEATURE_RECIBIR || 'true').toString() !== 'false',
};
