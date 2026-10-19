import type { ApiError } from '@/api/tipos';
import { erroresDeCampo, mensajeDeError } from './errores';

const error = (code: string, extra?: Record<string, unknown>, status = 409): ApiError => ({ type: '', title: '', status, detail: 'crudo', code, extra });

describe('mensajes de error por code (Especificación §7.3)', () => {
  it.each([
    ['AUTH_INVALID_CREDENTIALS', undefined, 'Credenciales incorrectas. Revisa tu usuario y contraseña.'],
    ['AUTH_TOKEN_EXPIRED', undefined, 'Tu sesión venció. Ingresa de nuevo.'],
    ['AUTH_FORBIDDEN', undefined, 'No tienes permiso para ver esta página.'],
    ['VALIDATION_ERROR', undefined, 'Revisa los campos marcados.'],
    ['NOT_FOUND', undefined, 'No encontramos lo que buscas.'],
    ['PRODUCTO_STOCK_INSUFICIENTE', { nombre: 'Aceite', disponible: 2 }, 'No hay stock suficiente de Aceite. Disponible: 2.'],
    ['PRODUCTO_INACTIVO', { nombre: 'Pan' }, 'Pan ya no está disponible.'],
    ['CLIENTE_LIMITE_EXCEDIDO', { disponible: 20 }, 'Supera el límite de crédito. Disponible: S/ 20.00.'],
    ['CLIENTE_SIN_CONSENTIMIENTO', undefined, 'El cliente aún no autorizó el uso de sus datos.'],
    ['CLIENTE_INACTIVO', undefined, 'El cliente está desactivado.'],
    ['CLIENTE_CON_SALDO', undefined, 'No puedes desactivar a un cliente con deuda.'],
    ['PAGO_EXCEDE_SALDO', { saldo: 85.5 }, 'El pago supera la deuda actual (S/ 85.50).'],
    ['USERNAME_DUPLICADO', undefined, 'Ese usuario ya existe. Prueba con otro.'],
    ['DNI_DUPLICADO', undefined, 'Ya existe un cliente con ese DNI.'],
    ['CODIGO_DUPLICADO', undefined, 'Ya existe un producto con ese código de barras.'],
    ['IDEMPOTENCY_CONFLICT', undefined, 'Esta venta ya fue enviada con otros datos. Reinicia la venta.'],
    ['SERVICIO_NO_DISPONIBLE', undefined, 'Servicio temporalmente no disponible. Intenta en unos segundos.'],
  ])('%s', (code, extra, esperado) => {
    expect(mensajeDeError(error(code, extra))).toBe(esperado);
  });

  it('sin red o código desconocido', () => {
    expect(mensajeDeError(error('RED', undefined, 0))).toBe('No pudimos conectar. Revisa tu internet e intenta otra vez.');
    expect(mensajeDeError(new Error('x'))).toBe('No pudimos conectar. Revisa tu internet e intenta otra vez.');
    expect(mensajeDeError(error('OTRO', undefined, 500))).toBe('Ocurrió un error inesperado.');
  });

  it('nunca muestra el detail crudo', () => {
    expect(mensajeDeError(error('CLIENTE_INACTIVO'))).not.toContain('crudo');
  });

  it('errores por campo', () => {
    expect(erroresDeCampo({ ...error('VALIDATION_ERROR'), errors: [{ campo: 'telefono', mensaje: 'inválido' }] })).toEqual({ telefono: 'inválido' });
  });
});
