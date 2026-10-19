import type { Producto } from '@/api/tipos';
import { agregar, cambiarCantidad, limitarA, quitar, totalEstimado, unidades } from './carrito';

const prod = (id: number, precio: number, stock: number): Producto => ({
  id, nombre: `P${id}`, precio, costo: null, stock, stockMinimo: 1, categoria: 'OTROS', codigoBarras: null, activo: true,
});

describe('carrito del POS', () => {
  it('agrega, suma al repetir y respeta el stock', () => {
    let c = agregar([], prod(1, 4.5, 2));
    c = agregar(c, prod(1, 4.5, 2));
    c = agregar(c, prod(1, 4.5, 2));
    expect(c).toHaveLength(1);
    expect(c[0]!.cantidad).toBe(2);
  });

  it('no agrega productos agotados', () => {
    expect(agregar([], prod(1, 1, 0))).toHaveLength(0);
  });

  it('cantidad entre 1 y el máximo', () => {
    const c = agregar([], prod(1, 1, 10));
    expect(cambiarCantidad(c, 1, 0)[0]!.cantidad).toBe(1);
    expect(cambiarCantidad(c, 1, 50)[0]!.cantidad).toBe(10);
  });

  it('total en céntimos sin errores de coma flotante', () => {
    let c = agregar([], prod(1, 0.1, 10));
    c = cambiarCantidad(c, 1, 3);
    c = agregar(c, prod(2, 9.8, 10));
    expect(totalEstimado(c)).toBe(10.1);
    expect(unidades(c)).toBe(4);
  });

  it('ajusta al disponible tras PRODUCTO_STOCK_INSUFICIENTE y permite quitar', () => {
    let c = cambiarCantidad(agregar([], prod(1, 1, 10)), 1, 5);
    c = limitarA(c, 1, 2);
    expect(c[0]).toMatchObject({ cantidad: 2, maximo: 2 });
    expect(quitar(c, 1)).toHaveLength(0);
  });
});
