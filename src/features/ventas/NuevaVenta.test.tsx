import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { db } from '@/mocks/datos';
import { renderApp } from '@/test/utils';

async function agregar(nombre: RegExp, veces = 1) {
  const boton = await screen.findByRole('button', { name: nombre });
  for (let i = 0; i < veces; i++) await userEvent.click(boton);
}

describe('S03 · Nueva venta', () => {
  it('venta al contado de 2 productos: confirma y baja el stock', async () => {
    renderApp('/ventas/nueva', 'BODEGUERO');
    await agregar(/agregar arroz extra/i, 2);
    await agregar(/agregar aceite vegetal/i);
    const carrito = screen.getByRole('region', { name: 'Carrito' });
    expect(within(carrito).getByText('S/ 9.00')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /confirmar venta/i }));
    expect(await screen.findByText('Venta registrada')).toBeInTheDocument();
    expect(screen.getByText(/Venta N\.º 100 registrada por/)).toBeInTheDocument();
    expect(db.productos.find((p) => p.id === 1)!.stock).toBe(38);
  });

  it('FIADO que excede el límite muestra los montos y permite cambiar a contado', async () => {
    renderApp('/ventas/nueva?cliente=2', 'BODEGUERO');
    await screen.findByText('Jorge Huamán');
    await userEvent.type(screen.getByLabelText('Buscar producto'), 'huevos');
    await agregar(/agregar huevos/i);
    await userEvent.click(screen.getByRole('button', { name: /confirmar venta fiada/i }));
    expect(await screen.findByText('No se pudo fiar')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Supera el límite de crédito. Disponible: S/ 8.00.');
    await userEvent.click(screen.getByRole('button', { name: /cambiar a contado/i }));
    await userEvent.click(await screen.findByRole('button', { name: /^confirmar venta$/i }));
    expect(await screen.findByText('Venta registrada')).toBeInTheDocument();
  });

  it('reintento tras error de red usa la misma Idempotency-Key y no duplica la venta', async () => {
    const claves: string[] = [];
    let primera = true;
    server.use(
      http.post('*/api/ventas', async ({ request }) => {
        claves.push(request.headers.get('Idempotency-Key') ?? '');
        if (primera) {
          primera = false;
          return HttpResponse.error();
        }
        return undefined; // pasa al handler normal
      }),
    );
    renderApp('/ventas/nueva', 'BODEGUERO');
    await agregar(/agregar galletas/i);
    await userEvent.click(screen.getByRole('button', { name: /confirmar venta/i }));
    await userEvent.click(await screen.findByRole('button', { name: /reintentar/i }));
    expect(await screen.findByText('Venta registrada')).toBeInTheDocument();
    expect(claves).toHaveLength(2);
    expect(claves[0]).toBe(claves[1]);
    expect(db.ventas.filter((v) => v.estado === 'CONFIRMADA')).toHaveLength(1);
  });

  it('el botón se deshabilita mientras se envía (doble clic)', async () => {
    renderApp('/ventas/nueva', 'BODEGUERO');
    await agregar(/agregar atún/i);
    const boton = screen.getByRole('button', { name: /confirmar venta/i });
    await userEvent.click(boton);
    expect(boton).toBeDisabled();
    await screen.findByText('Venta registrada');
    expect(db.ventas).toHaveLength(1);
  });

  it('productos agotados no se pueden agregar', async () => {
    renderApp('/ventas/nueva', 'BODEGUERO');
    await userEvent.type(await screen.findByLabelText('Buscar producto'), 'agotado');
    await waitFor(() => expect(screen.getByRole('button', { name: /agotado demo, agotado/i })).toBeDisabled());
  });
});
