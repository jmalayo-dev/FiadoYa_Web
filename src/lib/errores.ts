import type { ApiError } from '@/api/tipos';
import { formatoMoneda } from './formato';

/** Mensajes al usuario por code (Especificación §7.3). Las llaves {x} salen de extra. */
const MENSAJES: Record<string, string> = {
  AUTH_INVALID_CREDENTIALS: 'Credenciales incorrectas. Revisa tu usuario y contraseña.',
  AUTH_TOKEN_EXPIRED: 'Tu sesión venció. Ingresa de nuevo.',
  AUTH_FORBIDDEN: 'No tienes permiso para ver esta página.',
  VALIDATION_ERROR: 'Revisa los campos marcados.',
  NOT_FOUND: 'No encontramos lo que buscas.',
  PRODUCTO_STOCK_INSUFICIENTE: 'No hay stock suficiente de {nombre}. Disponible: {disponible}.',
  PRODUCTO_INACTIVO: '{nombre} ya no está disponible.',
  CLIENTE_LIMITE_EXCEDIDO: 'Supera el límite de crédito. Disponible: S/ {disponible}.',
  CLIENTE_SIN_CONSENTIMIENTO: 'El cliente aún no autorizó el uso de sus datos.',
  CLIENTE_INACTIVO: 'El cliente está desactivado.',
  CLIENTE_CON_SALDO: 'No puedes desactivar a un cliente con deuda.',
  PAGO_EXCEDE_SALDO: 'El pago supera la deuda actual (S/ {saldo}).',
  USERNAME_DUPLICADO: 'Ese usuario ya existe. Prueba con otro.',
  DNI_DUPLICADO: 'Ya existe un cliente con ese DNI.',
  CODIGO_DUPLICADO: 'Ya existe un producto con ese código de barras.',
  IDEMPOTENCY_CONFLICT: 'Esta venta ya fue enviada con otros datos. Reinicia la venta.',
  SERVICIO_NO_DISPONIBLE: 'Servicio temporalmente no disponible. Intenta en unos segundos.',
};

const SIN_RED = 'No pudimos conectar. Revisa tu internet e intenta otra vez.';
const INESPERADO = 'Ocurrió un error inesperado.';

const MONTOS = new Set(['disponible', 'saldo', 'limite', 'monto']);

function valorExtra(code: string, clave: string, valor: unknown): string {
  if (typeof valor === 'number' && MONTOS.has(clave) && code !== 'PRODUCTO_STOCK_INSUFICIENTE') {
    return formatoMoneda(valor).replace('S/ ', '');
  }
  return valor === undefined || valor === null ? '' : String(valor);
}

/** Convierte un ApiError en el texto que ve el usuario. Nunca muestra trazas ni detail crudo. */
export function mensajeDeError(error: unknown): string {
  const e = comoApiError(error);
  const plantilla = MENSAJES[e.code];
  if (!plantilla) {
    if (e.code === 'RED' || e.code === 'DESCONOCIDO') return SIN_RED;
    return e.status >= 500 ? INESPERADO : SIN_RED;
  }
  return plantilla.replace(/\{(\w+)\}/g, (_, clave: string) => valorExtra(e.code, clave, e.extra?.[clave]));
}

/** Errores por campo para marcar el formulario (VALIDATION_ERROR). */
export function erroresDeCampo(error: unknown): Record<string, string> {
  const e = comoApiError(error);
  const resultado: Record<string, string> = {};
  for (const item of e.errors ?? []) resultado[item.campo] = item.mensaje;
  return resultado;
}

export function esApiError(x: unknown): x is ApiError {
  return typeof x === 'object' && x !== null && 'code' in x && 'status' in x;
}

export function comoApiError(error: unknown): ApiError {
  if (esApiError(error)) return error;
  return { type: 'about:blank', title: 'Error', status: 0, detail: '', code: 'DESCONOCIDO' };
}

export function codigoDe(error: unknown): string {
  return comoApiError(error).code;
}
