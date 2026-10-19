import { ClaveVenta } from './idempotencia';

describe('Idempotency-Key de la venta', () => {
  it('se conserva entre reintentos y cambia al renovar', () => {
    const c = new ClaveVenta();
    const primera = c.actual();
    expect(primera).toMatch(/^[0-9a-f-]{36}$/);
    expect(c.actual()).toBe(primera);
    c.renovar();
    expect(c.actual()).not.toBe(primera);
  });
});
