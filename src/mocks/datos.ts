import type { Alerta, Cliente, Movimiento, Producto, Reposicion, Venta } from '@/api/tipos';

/** Datos ficticios para trabajar sin backend (Especificación §10). Ningún dato real de personas. */
export const CLAVE_DEMO = 'Demo12345';

const p = (id: number, nombre: string, precio: number, stock: number, stockMinimo: number, categoria: Producto['categoria'], costo: number | null = null): Producto => ({
  id, nombre, precio, costo, stock, stockMinimo, categoria, codigoBarras: `77500010000${String(id).padStart(2, '0')}`, activo: true,
});

const c = (id: number, nombre: string, telefono: string, limiteCredito: number, saldo: number, consentimiento = true, usuarioId: number | null = null): Cliente => ({
  id, usuarioId, dni: `4000000${id}`, nombre, telefono, direccion: null, limiteCredito, saldo,
  disponible: Math.max(0, Math.round((limiteCredito - saldo) * 100) / 100), consentimiento,
  fechaConsentimiento: consentimiento ? '2026-10-01T15:00:00Z' : null, activo: true,
});

export function datosIniciales() {
  return {
    productos: [
      p(1, 'Arroz extra 1 kg', 4.5, 40, 8, 'ABARROTES', 3.8),
      p(2, 'Aceite vegetal 1 L', 9.8, 7, 6, 'ABARROTES', 8.9),
      p(3, 'Azúcar rubia 1 kg', 4.2, 24, 6, 'ABARROTES'),
      p(4, 'Fideos spaghetti 500 g', 2.8, 30, 6, 'ABARROTES'),
      p(5, 'Leche evaporada 400 g', 4.0, 5, 5, 'LACTEOS'),
      p(6, 'Atún en lata 170 g', 6.5, 18, 4, 'ABARROTES'),
      p(7, 'Galletas de soda 6 pack', 2.0, 25, 5, 'ABARROTES'),
      p(8, 'Gaseosa 1.5 L', 6.5, 15, 4, 'BEBIDAS'),
      p(9, 'Huevos x 15', 10.5, 10, 3, 'ABARROTES'),
      p(10, 'Pan de molde 600 g', 8.2, 9, 3, 'ABARROTES'),
      p(11, 'Detergente 900 g', 12.0, 12, 3, 'LIMPIEZA'),
      p(12, 'Papel higiénico x 4', 7.5, 20, 4, 'LIMPIEZA'),
      p(99, 'Agotado demo', 1.0, 0, 1, 'OTROS'),
    ],
    clientes: [
      c(1, 'María Quispe', '987654321', 150, 85.5, true, 2),
      c(2, 'Jorge Huamán', '912345678', 150, 142),
      c(3, 'Luis Condori', '954112890', 150, 38.2),
      c(4, 'Rosa Paredes', '945882103', 150, 0),
      c(5, 'Carmen Rojas', '966123450', 200, 60),
      c(6, 'Pedro Salazar', '978456123', 100, 25),
      c(7, 'Julio Mendoza', '923456781', 100, 0, false),
      c(77, 'Cliente Caído Demo', '911111111', 500, 0),
    ],
    movimientos: new Map<number, Movimiento[]>([
      [1, [{ tipo: 'CARGO', fecha: '2026-10-16T20:00:00Z', monto: 85.5, ventaId: null, saldoDespues: 85.5, descripcion: 'Saldo anterior (cuaderno)', cantidadItems: null, metodoPago: null }]],
      [2, [{ tipo: 'CARGO', fecha: '2026-10-14T20:00:00Z', monto: 142, ventaId: null, saldoDespues: 142, descripcion: 'Saldo anterior (cuaderno)', cantidadItems: null, metodoPago: null }]],
    ]),
    ventas: [] as Venta[],
    ventasPorClave: new Map<string, { hash: string; venta: Venta }>(),
    reposiciones: [] as Reposicion[],
    alertas: [] as Alerta[],
    usuarios: [
      { id: 1, username: 'bodeguero', rol: 'BODEGUERO' as const, password: CLAVE_DEMO },
      { id: 2, username: 'cliente1', rol: 'CLIENTE' as const, password: CLAVE_DEMO },
    ],
    siguienteVenta: 100,
  };
}

export let db = datosIniciales();

/** Para pruebas: vuelve al estado inicial. */
export function reiniciarDatos() {
  db = datosIniciales();
}
