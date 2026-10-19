import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp } from '@/test/utils';

describe('S01 · Login', () => {
  it('credenciales válidas del bodeguero llevan al inicio', async () => {
    const { router } = renderApp('/login');
    await userEvent.type(screen.getByLabelText(/usuario o dni/i), 'bodeguero');
    await userEvent.type(screen.getByLabelText(/^contraseña/i), 'Demo12345');
    await userEvent.click(screen.getByRole('button', { name: /ingresar/i }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/'));
  });

  it('el cliente va a /mi-cuenta', async () => {
    const { router } = renderApp('/login');
    await userEvent.type(screen.getByLabelText(/usuario o dni/i), 'cliente1');
    await userEvent.type(screen.getByLabelText(/^contraseña/i), 'Demo12345');
    await userEvent.click(screen.getByRole('button', { name: /ingresar/i }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/mi-cuenta'));
  });

  it('muestra el error de credenciales sin redirigir', async () => {
    const { router } = renderApp('/login');
    await userEvent.type(screen.getByLabelText(/usuario o dni/i), 'bodeguero');
    await userEvent.type(screen.getByLabelText(/^contraseña/i), 'otra');
    await userEvent.click(screen.getByRole('button', { name: /ingresar/i }));
    expect(await screen.findByText('Credenciales incorrectas. Revisa tu usuario y contraseña.')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/login');
  });

  it('campos vacíos se marcan', async () => {
    renderApp('/login');
    await userEvent.click(screen.getByRole('button', { name: /ingresar/i }));
    expect(await screen.findByText('Ingresa tu usuario o DNI')).toBeInTheDocument();
  });
});

describe('Rutas protegidas', () => {
  it('sin sesión redirige al login con ?volver', async () => {
    const { router } = renderApp('/clientes');
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
    expect(router.state.location.search).toContain('volver=%2Fclientes');
  });

  it('un CLIENTE en una ruta de bodeguero ve 403', async () => {
    renderApp('/clientes', 'CLIENTE');
    expect(await screen.findByText('No tienes permiso para ver esta página')).toBeInTheDocument();
  });

  it('ruta inexistente muestra 404', async () => {
    renderApp('/no-existe');
    expect(await screen.findByText('No encontramos lo que buscas')).toBeInTheDocument();
  });
});
