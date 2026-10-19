import { Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import type { Rol } from '@/api/tipos';
import { SinPermiso } from '@/features/estados/Estados';
import { useAuth } from './useAuth';

/** Sin sesión → /login?volver=ruta; rol incorrecto → página 403 (Especificación §7.1). */
export function RutaProtegida({ roles, children }: { roles: Rol[]; children: ReactNode }) {
  const { usuario, verificando } = useAuth();
  const ubicacion = useLocation();
  if (verificando && !usuario) {
    return (
      <div className="flex min-h-dvh items-center justify-center" role="status" aria-label="Cargando sesión">
        <Loader2 className="size-8 animate-spin text-tinta-2" />
      </div>
    );
  }
  if (!usuario) {
    const volver = encodeURIComponent(ubicacion.pathname + ubicacion.search);
    return <Navigate to={`/login?volver=${volver}`} replace />;
  }
  if (!roles.includes(usuario.rol)) return <SinPermiso />;
  return <>{children}</>;
}
