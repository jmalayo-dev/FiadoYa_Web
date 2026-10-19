import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { http } from './client';
import type { AjusteStock, Categoria, Page, Producto, ProductoInput } from './tipos';

export interface FiltroProductos {
  q?: string;
  soloBajos?: boolean;
  categoria?: Categoria;
  codigo?: string;
  page?: number;
  size?: number;
}

export const productosApi = {
  listar: (f: FiltroProductos) => http.get<Page<Producto>>('/productos', { params: limpiar(f) }).then((r) => r.data),
  obtener: (id: number) => http.get<Producto>(`/productos/${id}`).then((r) => r.data),
  crear: (body: ProductoInput) => http.post<Producto>('/productos', body).then((r) => r.data),
  actualizar: (id: number, body: ProductoInput) => http.put<Producto>(`/productos/${id}`, body).then((r) => r.data),
  darDeBaja: (id: number) => http.delete(`/productos/${id}`).then(() => undefined),
  ajustar: (id: number, body: AjusteStock) => http.post<Producto>(`/productos/${id}/ajuste`, body).then((r) => r.data),
};

export function useProductos(f: FiltroProductos, habilitado = true) {
  return useQuery({
    queryKey: ['productos', f],
    queryFn: () => productosApi.listar(f),
    placeholderData: keepPreviousData,
    enabled: habilitado,
  });
}

export function useMutacionesProducto() {
  const qc = useQueryClient();
  const invalidar = () => qc.invalidateQueries({ queryKey: ['productos'] });
  return {
    crear: useMutation({ mutationFn: productosApi.crear, onSuccess: invalidar }),
    actualizar: useMutation({
      mutationFn: ({ id, body }: { id: number; body: ProductoInput }) => productosApi.actualizar(id, body),
      onSuccess: invalidar,
    }),
    darDeBaja: useMutation({ mutationFn: productosApi.darDeBaja, onSuccess: invalidar }),
    ajustar: useMutation({
      mutationFn: ({ id, body }: { id: number; body: AjusteStock }) => productosApi.ajustar(id, body),
      onSuccess: invalidar,
    }),
  };
}

export function limpiar<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== '' && v !== null && v !== false),
  ) as Partial<T>;
}
