import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { http } from './client';
import { limpiar } from './productos';
import type { EstadoVenta, Page, Venta, VentaInput } from './tipos';

export interface FiltroVentas {
  desde?: string;
  hasta?: string;
  estado?: EstadoVenta;
  clienteId?: number;
  page?: number;
  size?: number;
}

export const ventasApi = {
  registrar: (body: VentaInput, clave: string) =>
    http.post<Venta>('/ventas', body, { headers: { 'Idempotency-Key': clave } }).then((r) => r.data),
  listar: (f: FiltroVentas) => http.get<Page<Venta>>('/ventas', { params: limpiar(f) }).then((r) => r.data),
  obtener: (id: number) => http.get<Venta>(`/ventas/${id}`).then((r) => r.data),
};

export function useVentas(f: FiltroVentas) {
  return useQuery({ queryKey: ['ventas', f], queryFn: () => ventasApi.listar(f), placeholderData: keepPreviousData });
}

export function useVenta(id: number) {
  return useQuery({ queryKey: ['ventas', id], queryFn: () => ventasApi.obtener(id) });
}
