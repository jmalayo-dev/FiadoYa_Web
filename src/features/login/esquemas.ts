import { z } from 'zod';

export const esquemaLogin = z.object({
  username: z.string().trim().min(1, 'Ingresa tu usuario o DNI'),
  password: z.string().min(1, 'Ingresa tu contraseña'),
  recordar: z.boolean(),
});

export type DatosLogin = z.infer<typeof esquemaLogin>;
