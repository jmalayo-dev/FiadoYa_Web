/**
 * Clave Idempotency-Key de la venta en curso (Especificación §S03):
 * se genera una vez por intento, se conserva si se reintenta tras un error de red
 * y se renueva solo al empezar una venta nueva o editar el carrito.
 */
export function nuevaClave(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export class ClaveVenta {
  private clave: string | null = null;

  /** Devuelve la clave del intento actual (la crea si no existe). */
  actual(): string {
    this.clave ??= nuevaClave();
    return this.clave;
  }

  /** El carrito cambió o empezó otra venta: el próximo envío usa una clave nueva. */
  renovar(): void {
    this.clave = null;
  }
}
