import { screen } from '@testing-library/react';
import { renderApp } from '@/test/utils';

describe('S10 · Mi cuenta', () => {
  it('el cliente ve solo su deuda, límite y movimientos', async () => {
    renderApp('/mi-cuenta', 'CLIENTE');
    expect(await screen.findByText('¡Hola, María Quispe!')).toBeInTheDocument();
    expect(screen.getAllByText('S/ 85.50').length).toBeGreaterThan(0);
    expect(screen.getByText('Para pagar, acércate a la bodega. Todo abono se registra de inmediato.')).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: /navegación principal/i })).not.toBeInTheDocument();
  });
});
