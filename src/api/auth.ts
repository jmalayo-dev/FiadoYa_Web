import { useQuery } from '@tanstack/react-query';
import { http } from './client';
import type { Bodega, LoginRequest, LoginResponse, UsuarioInput, UsuarioSesion } from './tipos';

export const authApi = {
  login: (body: LoginRequest) => http.post<LoginResponse>('/auth/login', body).then((r) => r.data),
  me: () => http.get<UsuarioSesion>('/auth/me').then((r) => r.data),
  crearUsuario: (body: UsuarioInput) => http.post<UsuarioSesion>('/auth/usuarios', body).then((r) => r.data),
  bodega: () => http.get<Bodega>('/bodega').then((r) => r.data),
};

export function useBodega(habilitado = true) {
  return useQuery({ queryKey: ['bodega'], queryFn: authApi.bodega, staleTime: Infinity, enabled: habilitado });
}
