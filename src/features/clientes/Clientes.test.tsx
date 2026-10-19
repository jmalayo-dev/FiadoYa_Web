import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp } from '@/test/utils';

describe('S05 · Clientes', () => {
  it('lista con deuda y disponible', async () => {
    renderApp('/clientes', 'BODEGUERO');
    expect(await screen.findByText('María Quispe')).toBeInTheDocument();
    expect(screen.getByText('Rosa Paredes')).toBeInTheDocument();
  });

  it('un pago de S/ 10 baja el saldo y aparece primero en el estado de cuenta', async () => {
    renderApp('/clientes/1', 'BODEGUERO');
    await screen.findByText(/Debe/);
    await userEvent.click(screen.getByRole('button', { name: /registrar pago/i }));
    await userEvent.type(await screen.findByLabelText(/monto a pagar/i), '10');
    const botones = screen.getAllByRole('button', { name: /registrar pago/i });
    await userEvent.click(botones[botones.length - 1]!);
    await waitFor(() => expect(screen.getAllByText('S/ 75.50').length).toBeGreaterThan(0));
    expect(screen.getByText('Pago a cuenta')).toBeInTheDocument();
  });

  it('el pago mayor a la deuda se marca en el campo', async () => {
    renderApp('/clientes/1', 'BODEGUERO');
    await screen.findByText(/Debe/);
    await userEvent.click(screen.getByRole('button', { name: /registrar pago/i }));
    await userEvent.type(await screen.findByLabelText(/monto a pagar/i), '200');
    const botones = screen.getAllByRole('button', { name: /registrar pago/i });
    await userEvent.click(botones[botones.length - 1]!);
    expect(await screen.findByText(/no puede superar la deuda actual/i)).toBeInTheDocument();
  });

  it('no se puede desactivar a un deudor', async () => {
    renderApp('/clientes/1', 'BODEGUERO');
    await screen.findByText(/Debe/);
    await userEvent.click(screen.getByRole('button', { name: /^desactivar$/i }));
    const botones = await screen.findAllByRole('button', { name: /^desactivar$/i });
    await userEvent.click(botones[botones.length - 1]!);
    expect(await screen.findByText(/No puedes desactivar a un cliente con deuda/)).toBeInTheDocument();
  });

  it('alta de cliente con validación', async () => {
    const { router } = renderApp('/clientes/nuevo', 'BODEGUERO');
    await userEvent.type(await screen.findByLabelText(/nombre y apellidos/i), 'Ana Torres');
    await userEvent.type(screen.getByLabelText(/teléfono móvil/i), '123');
    await userEvent.click(screen.getByRole('button', { name: /guardar cliente/i }));
    expect(await screen.findByText('9 dígitos y empieza con 9')).toBeInTheDocument();
    await userEvent.clear(screen.getByLabelText(/teléfono móvil/i));
    await userEvent.type(screen.getByLabelText(/teléfono móvil/i), '934567812');
    await userEvent.click(screen.getByRole('button', { name: /guardar cliente/i }));
    await waitFor(() => expect(router.state.location.pathname).toMatch(/^\/clientes\/\d+$/));
  });
});
