import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { http } from './client';
import { limpiar } from './productos';
import type { Cliente, ClienteInput, ClienteResumen, EstadoCuenta, Page, Pago, PagoInput } from './tipos';

export interface FiltroClientes {
  q?: string;
  conDeuda?: boolean;
  orden?: 'reciente' | 'deuda' | 'nombre';
  page?: number;
  size?: number;
}

export const clientesApi = {
  listar: (f: FiltroClientes) => http.get<Page<Cliente>>('/clientes', { params: limpiar(f) }).then((r) => r.data),
  resumen: () => http.get<ClienteResumen>('/clientes/resumen').then((r) => r.data),
  obtener: (id: number) => http.get<Cliente>(`/clientes/${id}`).then((r) => r.data),
  crear: (body: ClienteInput) => http.post<Cliente>('/clientes', body).then((r) => r.data),
  actualizar: (id: number, body: ClienteInput) => http.put<Cliente>(`/clientes/${id}`, body).then((r) => r.data),
  desactivar: (id: number) => http.delete(`/clientes/${id}`).then(() => undefined),
  pagar: (id: number, body: PagoInput) => http.post<Pago>(`/clientes/${id}/pagos`, body).then((r) => r.data),
  estadoCuenta: (id: number) => http.get<EstadoCuenta>(`/clientes/${id}/estado-cuenta`).then((r) => r.data),
  miCuenta: () => http.get<EstadoCuenta>('/clientes/mi-cuenta').then((r) => r.data),
};

export function useClientes(f: FiltroClientes, habilitado = true) {
  return useQuery({
    queryKey: ['clientes', f],
    queryFn: () => clientesApi.listar(f),
    placeholderData: keepPreviousData,
    enabled: habilitado,
  });
}

export function useResumenClientes() {
  return useQuery({ queryKey: ['clientes', 'resumen'], queryFn: clientesApi.resumen });
}

export function useEstadoCuenta(id: number) {
  return useQuery({ queryKey: ['clientes', id, 'estado-cuenta'], queryFn: () => clientesApi.estadoCuenta(id) });
}

export function useMiCuenta() {
  return useQuery({ queryKey: ['mi-cuenta'], queryFn: clientesApi.miCuenta });
}

export function useMutacionesCliente() {
  const qc = useQueryClient();
  const invalidar = () => qc.invalidateQueries({ queryKey: ['clientes'] });
  return {
    crear: useMutation({ mutationFn: clientesApi.crear, onSuccess: invalidar }),
    actualizar: useMutation({
      mutationFn: ({ id, body }: { id: number; body: ClienteInput }) => clientesApi.actualizar(id, body),
      onSuccess: invalidar,
    }),
    desactivar: useMutation({ mutationFn: clientesApi.desactivar, onSuccess: invalidar }),
    pagar: useMutation({
      mutationFn: ({ id, body }: { id: number; body: PagoInput }) => clientesApi.pagar(id, body),
      onSuccess: invalidar,
    }),
  };
}
