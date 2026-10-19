import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { authApi } from '@/api/auth';
import { registrarCierreDeSesion } from '@/api/client';
import type { UsuarioSesion } from '@/api/tipos';
import { borrarSesion, guardarSesion, leerSesion, sesionVencida } from './sesion';
import { AuthContext } from './useAuth';

/**
 * Sesión del usuario (Especificación §7.1). Al cargar valida el token con /auth/me;
 * si el token vence, cierra sesión con el aviso "Tu sesión venció".
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [usuario, setUsuario] = useState<UsuarioSesion | null>(() => {
    const s = leerSesion();
    return s && !sesionVencida(s) ? s.usuario : null;
  });
  const [verificando, setVerificando] = useState(() => leerSesion() !== null);

  const logout = useCallback(
    (motivo?: 'vencida') => {
      borrarSesion();
      setUsuario(null);
      qc.clear();
      if (motivo === 'vencida') toast.warning('Tu sesión venció. Ingresa de nuevo.', { id: 'sesion-vencida' });
    },
    [qc],
  );

  useEffect(() => registrarCierreDeSesion(logout), [logout]);

  // Al abrir la app: si hay token, se confirma con el servidor.
  useEffect(() => {
    const s = leerSesion();
    if (!s) return;
    if (sesionVencida(s)) {
      logout('vencida');
      setVerificando(false);
      return;
    }
    authApi
      .me()
      .then((u) => setUsuario(u))
      .catch(() => logout())
      .finally(() => setVerificando(false));
  }, [logout]);

  // Cierre automático justo cuando expira el token.
  useEffect(() => {
    const s = leerSesion();
    if (!usuario || !s) return;
    const restante = new Date(s.expiraEn).getTime() - Date.now();
    const t = setTimeout(() => logout('vencida'), Math.max(0, Math.min(restante, 2 ** 31 - 1)));
    return () => clearTimeout(t);
  }, [usuario, logout]);

  const login = useCallback(async (username: string, password: string, recordar: boolean) => {
    const r = await authApi.login({ username: username.trim().toLowerCase(), password });
    guardarSesion({ token: r.token, expiraEn: r.expiraEn, usuario: r.usuario }, recordar);
    setUsuario(r.usuario);
    return r.usuario;
  }, []);

  const valor = useMemo(() => ({ usuario, verificando, login, logout }), [usuario, verificando, login, logout]);
  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}
