import type { LoginResponse } from '@/api/tipos';

/**
 * Sesión en sessionStorage (Especificación §7.1): se pierde al cerrar la pestaña.
 * "Recordar en este equipo" (vista de login) la guarda en localStorage.
 */
const CLAVE = 'fiadoya.sesion';

export type SesionGuardada = Pick<LoginResponse, 'token' | 'expiraEn' | 'usuario'>;

export function leerSesion(): SesionGuardada | null {
  try {
    const crudo = sessionStorage.getItem(CLAVE) ?? localStorage.getItem(CLAVE);
    return crudo ? (JSON.parse(crudo) as SesionGuardada) : null;
  } catch {
    return null;
  }
}

export function guardarSesion(sesion: SesionGuardada, recordar: boolean): void {
  try {
    borrarSesion();
    (recordar ? localStorage : sessionStorage).setItem(CLAVE, JSON.stringify(sesion));
  } catch {
    /* almacenamiento no disponible: la sesión vive solo en memoria */
  }
}

export function borrarSesion(): void {
  try {
    sessionStorage.removeItem(CLAVE);
    localStorage.removeItem(CLAVE);
  } catch {
    /* sin almacenamiento */
  }
}

export function sesionVencida(s: SesionGuardada, ahora = Date.now()): boolean {
  return new Date(s.expiraEn).getTime() <= ahora;
}
