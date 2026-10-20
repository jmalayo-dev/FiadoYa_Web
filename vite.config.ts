/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Desarrollo: /api se envía al gateway por proxy (mismo origen, sin CORS).
// Modo "mocks" (npm run dev:mocks): MSW responde en el navegador y no hace falta backend.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const destino = env.VITE_API_PROXY || 'http://localhost:8080';
  return {
    plugins: [react(), tailwindcss()],
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: destino,
          changeOrigin: true,
          // El proxy hace que todo sea del mismo origen: sin Origin, el gateway no aplica CORS.
          // Así funciona igual desde localhost o desde la IP de la red (npm run dev:lan).
          configure: (proxy) => proxy.on('proxyReq', (req) => req.removeHeader('origin')),
        },
      },
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/*.test.{ts,tsx}'],
      coverage: {
        provider: 'v8',
        include: ['src/lib/**', 'src/features/**/esquemas.ts'],
        reporter: ['text', 'html'],
      },
    },
  };
});
