import type { Producto } from '@/api/tipos';

/** Lógica pura del carrito del POS (probada en carrito.test.ts). */
export interface LineaCarrito {
  producto: Producto;
  cantidad: number;
  /** Máximo permitido: el stock mostrado, o lo que informó el servidor tras PRODUCTO_STOCK_INSUFICIENTE. */
  maximo: number;
}

export const MAX_ITEMS = 50;
export const MAX_CANTIDAD = 999;

export function maximoDe(p: Producto): number {
  return Math.min(MAX_CANTIDAD, p.stock);
}

export function agregar(carrito: LineaCarrito[], p: Producto): LineaCarrito[] {
  const linea = carrito.find((l) => l.producto.id === p.id);
  if (linea) return cambiarCantidad(carrito, p.id, linea.cantidad + 1);
  if (p.stock <= 0 || !p.activo || carrito.length >= MAX_ITEMS) return carrito;
  return [...carrito, { producto: p, cantidad: 1, maximo: maximoDe(p) }];
}

export function cambiarCantidad(carrito: LineaCarrito[], productoId: number, cantidad: number): LineaCarrito[] {
  return carrito.map((l) =>
    l.producto.id === productoId ? { ...l, cantidad: Math.max(1, Math.min(l.maximo, Math.round(cantidad))) } : l,
  );
}

export function quitar(carrito: LineaCarrito[], productoId: number): LineaCarrito[] {
  return carrito.filter((l) => l.producto.id !== productoId);
}

/** Tras PRODUCTO_STOCK_INSUFICIENTE: ajusta el máximo (y la cantidad) al disponible que informó el servidor. */
export function limitarA(carrito: LineaCarrito[], productoId: number, disponible: number): LineaCarrito[] {
  return carrito.map((l) =>
    l.producto.id === productoId ? { ...l, maximo: disponible, cantidad: Math.max(0, Math.min(l.cantidad, disponible)) } : l,
  );
}

/** Total estimado (referencial: el servidor decide el precio final). Redondeo a céntimos. */
export function totalEstimado(carrito: LineaCarrito[]): number {
  const centimos = carrito.reduce((s, l) => s + Math.round(l.producto.precio * 100) * l.cantidad, 0);
  return centimos / 100;
}

export function unidades(carrito: LineaCarrito[]): number {
  return carrito.reduce((s, l) => s + l.cantidad, 0);
}
