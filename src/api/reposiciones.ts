import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { http } from './client';
import type { CatalogoItem, Page, Reposicion, ReposicionInput } from './tipos';

export const reposicionesApi = {
  listar: (page = 0) => http.get<Page<Reposicion>>('/reposiciones', { params: { page } }).then((r) => r.data),
  catalogo: () => http.get<CatalogoItem[]>('/reposiciones/catalogo').then((r) => r.data),
  crear: (body: ReposicionInput) => http.post<Reposicion>('/reposiciones', body).then((r) => r.data),
  recibir: (id: number) => http.post<Reposicion>(`/reposiciones/${id}/recibir`).then((r) => r.data),
};

export function useReposiciones(page = 0) {
  return useQuery({ queryKey: ['reposiciones', page], queryFn: () => reposicionesApi.listar(page) });
}

export function useCatalogo(habilitado = true) {
  return useQuery({ queryKey: ['catalogo'], queryFn: reposicionesApi.catalogo, enabled: habilitado, retry: 0 });
}

export function useMutacionesReposicion() {
  const qc = useQueryClient();
  const invalidar = () => {
    qc.invalidateQueries({ queryKey: ['reposiciones'] });
    qc.invalidateQueries({ queryKey: ['productos'] });
  };
  return {
    crear: useMutation({ mutationFn: reposicionesApi.crear, onSuccess: invalidar }),
    recibir: useMutation({ mutationFn: reposicionesApi.recibir, onSuccess: invalidar }),
  };
}
