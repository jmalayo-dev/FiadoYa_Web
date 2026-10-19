import { createContext, useContext } from 'react';
import type { UsuarioSesion } from '@/api/tipos';

export interface AuthValor {
  usuario: UsuarioSesion | null;
  verificando: boolean;
  login: (username: string, password: string, recordar: boolean) => Promise<UsuarioSesion>;
  logout: (motivo?: 'vencida') => void;
}

export const AuthContext = createContext<AuthValor | null>(null);

export function useAuth(): AuthValor {
  const v = useContext(AuthContext);
  if (!v) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return v;
}

/** Ruta de inicio según el rol (Especificación §7.1). */
export function inicioDe(rol: UsuarioSesion['rol']) {
  return rol === 'CLIENTE' ? '/mi-cuenta' : '/';
}
