import { z } from 'zod';

export const TEXTO_CONSENTIMIENTO = 'El cliente autoriza el registro de su nombre y su deuda para el servicio de fiado.';

/** Validación espejo de ClienteInput (Anexo §6.3 + v1.2 E1). */
export const esquemaCliente = z.object({
  nombre: z.string().trim().min(2, 'Entre 2 y 80 caracteres').max(80, 'Entre 2 y 80 caracteres'),
  telefono: z.string().trim().regex(/^9\d{8}$/, '9 dígitos y empieza con 9'),
  limiteCredito: z.coerce
    .number({ error: 'Ingresa un monto' })
    .min(0, 'Debe ser 0 o más')
    .refine((v) => Math.round(v * 100) === v * 100, 'Máximo 2 decimales'),
  consentimiento: z.boolean(),
  dni: z.union([z.literal(''), z.string().regex(/^\d{8}$/, 'El DNI tiene 8 dígitos')]).optional(),
  direccion: z.string().trim().max(120, 'Máximo 120 caracteres').optional(),
});
export type DatosCliente = z.input<typeof esquemaCliente>;
export type ClienteValidado = z.output<typeof esquemaCliente>;

export function esquemaPago(saldo: number) {
  return z.object({
    monto: z.coerce
      .number({ error: 'Ingresa un monto' })
      .refine((v) => v > 0, 'Debe ser mayor que 0')
      .refine((v) => Math.round(v * 100) === v * 100, 'Máximo 2 decimales')
      .refine((v) => v <= saldo, `El pago no puede superar la deuda actual (S/ ${saldo.toFixed(2)})`),
    metodo: z.enum(['EFECTIVO', 'YAPE_PLIN', 'TRANSFERENCIA']),
  });
}

export const esquemaAcceso = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, 'Mínimo 3 caracteres')
    .max(40, 'Máximo 40 caracteres')
    .regex(/^[a-z0-9._-]+$/, 'Solo minúsculas, números, punto o guion'),
  password: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Za-z]/, 'Debe tener al menos una letra')
    .regex(/\d/, 'Debe tener al menos un número'),
});
export type DatosAcceso = z.input<typeof esquemaAcceso>;
