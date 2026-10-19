import { MutationCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { RouterProvider } from 'react-router';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/auth/AuthProvider';
import { BannerSinConexion } from '@/components/BannerSinConexion';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AlertasProvider } from '@/features/alertas/AlertasProvider';
import { crearRouter } from './router';

function esErrorDeCliente(error: unknown): boolean {
  const status = (error as { status?: unknown } | null)?.status;
  return typeof status === 'number' && status >= 400 && status < 500;
}

/** Reintentos (Especificación §7.2): 1 para GET, 0 para mutaciones. Sin reintentar 4xx. */
export function crearQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: (n, error) => n < 1 && !esErrorDeCliente(error),
        refetchOnWindowFocus: false,
        staleTime: 15_000,
      },
      mutations: { retry: 0 },
    },
    mutationCache: new MutationCache(),
  });
}

export function Proveedores({ children, client }: { children: ReactNode; client?: QueryClient }) {
  const [qc] = useState(() => client ?? crearQueryClient());
  return (
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <AlertasProvider>
          {children}
          <Toaster position="top-center" richColors closeButton toastOptions={{ duration: 5000 }} />
        </AlertasProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export function App() {
  const [router] = useState(crearRouter);
  return (
    <ErrorBoundary>
      <BannerSinConexion />
      <Proveedores>
        <RouterProvider router={router} />
      </Proveedores>
    </ErrorBoundary>
  );
}
