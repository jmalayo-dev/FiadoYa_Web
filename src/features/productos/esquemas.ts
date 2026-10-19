import { z } from 'zod';

/** Validación espejo de ProductoInput (Anexo §6.3 + v1.2 E3). */
const decimal2 = (msg: string) =>
  z.coerce
    .number({ error: 'Ingresa un número' })
    .refine((v) => Number.isFinite(v) && Math.round(v * 100) === v * 100, 'Máximo 2 decimales')
    .refine((v) => v > 0, msg);

export const CATEGORIAS = [
  { valor: 'ABARROTES', etiqueta: 'Abarrotes' },
  { valor: 'LACTEOS', etiqueta: 'Lácteos' },
  { valor: 'BEBIDAS', etiqueta: 'Bebidas' },
  { valor: 'LIMPIEZA', etiqueta: 'Limpieza' },
  { valor: 'OTROS', etiqueta: 'Otros' },
] as const;

export const esquemaProducto = z.object({
  nombre: z.string().trim().min(2, 'Entre 2 y 80 caracteres').max(80, 'Entre 2 y 80 caracteres'),
  precio: decimal2('Debe ser mayor que 0'),
  costo: z.union([z.literal(''), decimal2('Debe ser mayor que 0')]).optional(),
  stock: z.coerce.number().int('Debe ser entero').min(0, 'Debe ser 0 o más'),
  stockMinimo: z.coerce.number().int('Debe ser entero').min(0, 'Debe ser 0 o más'),
  categoria: z.enum(['ABARROTES', 'LACTEOS', 'BEBIDAS', 'LIMPIEZA', 'OTROS']),
  codigoBarras: z.union([z.literal(''), z.string().regex(/^\d{8,14}$/, 'De 8 a 14 dígitos')]).optional(),
});
export type DatosProducto = z.input<typeof esquemaProducto>;
export type ProductoValidado = z.output<typeof esquemaProducto>;

export const esquemaAjuste = z.object({
  delta: z.coerce.number({ error: 'Ingresa un número' }).int('Debe ser entero').refine((v) => v !== 0, 'No puede ser 0'),
  motivo: z.string().trim().min(3, 'Entre 3 y 120 caracteres').max(120, 'Entre 3 y 120 caracteres'),
});
export type DatosAjuste = z.input<typeof esquemaAjuste>;
