import { render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { QueryClient } from '@tanstack/react-query';
import { Proveedores } from '@/App';
import { guardarSesion } from '@/auth/sesion';
import { rutas } from '@/router';

/** Renderiza la app completa en una ruta, con o sin sesión iniciada (los mocks MSW responden). */
export function renderApp(ruta: string, sesion?: 'BODEGUERO' | 'CLIENTE') {
  if (sesion) {
    const id = sesion === 'BODEGUERO' ? 1 : 2;
    guardarSesion(
      {
        token: `mock.${id}`,
        expiraEn: new Date(Date.now() + 3600_000).toISOString(),
        usuario: { id, username: sesion === 'BODEGUERO' ? 'bodeguero' : 'cliente1', rol: sesion },
      },
      false,
    );
  }
  const router = createMemoryRouter(rutas, { initialEntries: [ruta] });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: 0 } } });
  return { router, ...render(<Proveedores client={client}><RouterProvider router={router} /></Proveedores>) };
}
