import { esquemaAcceso, esquemaCliente, esquemaPago } from './clientes/esquemas';
import { esquemaAjuste, esquemaProducto } from './productos/esquemas';
import { esquemaLogin } from './login/esquemas';

describe('esquemas Zod espejo del backend', () => {
  it('cliente: teléfono de 9 dígitos que empieza en 9, DNI de 8 y límite >= 0', () => {
    const ok = esquemaCliente.safeParse({ nombre: 'Ana', telefono: '987654321', limiteCredito: '100', consentimiento: true, dni: '' });
    expect(ok.success).toBe(true);
    const mal = esquemaCliente.safeParse({ nombre: 'A', telefono: '123', limiteCredito: -1, consentimiento: true, dni: '12' });
    expect(mal.success).toBe(false);
    expect(mal.error?.issues.map((i) => i.path[0])).toEqual(expect.arrayContaining(['nombre', 'telefono', 'limiteCredito', 'dni']));
  });

  it('pago: mayor que 0 y no más que el saldo', () => {
    const e = esquemaPago(85.5);
    expect(e.safeParse({ monto: '10', metodo: 'EFECTIVO' }).success).toBe(true);
    expect(e.safeParse({ monto: '85.50', metodo: 'YAPE_PLIN' }).success).toBe(true);
    expect(e.safeParse({ monto: '90', metodo: 'EFECTIVO' }).success).toBe(false);
    expect(e.safeParse({ monto: '0', metodo: 'EFECTIVO' }).success).toBe(false);
    expect(e.safeParse({ monto: '1.234', metodo: 'EFECTIVO' }).success).toBe(false);
  });

  it('acceso: usuario en minúsculas y contraseña con letra y dígito', () => {
    expect(esquemaAcceso.safeParse({ username: 'Maria', password: 'Clave1234' }).data?.username).toBe('maria');
    expect(esquemaAcceso.safeParse({ username: 'maría q', password: 'clave' }).success).toBe(false);
    expect(esquemaAcceso.safeParse({ username: 'maria', password: 'solotexto' }).success).toBe(false);
  });

  it('producto y ajuste', () => {
    expect(esquemaProducto.safeParse({ nombre: 'Arroz', precio: '4.50', costo: '', stock: '10', stockMinimo: '2', categoria: 'ABARROTES', codigoBarras: '' }).success).toBe(true);
    expect(esquemaProducto.safeParse({ nombre: 'Arroz', precio: '0', stock: '-1', stockMinimo: '2', categoria: 'ABARROTES', codigoBarras: '12' }).success).toBe(false);
    expect(esquemaAjuste.safeParse({ delta: '0', motivo: 'conteo' }).success).toBe(false);
    expect(esquemaAjuste.safeParse({ delta: '-3', motivo: 'merma' }).success).toBe(true);
  });

  it('login', () => {
    expect(esquemaLogin.safeParse({ username: ' ', password: 'x', recordar: false }).success).toBe(false);
  });
});
