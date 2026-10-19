import { http } from './client';
import type { Alerta } from './tipos';

export const alertasApi = {
  historial: (limite = 50) => http.get<Alerta[]>('/alertas', { params: { limite } }).then((r) => r.data),
};
