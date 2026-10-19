import { formatoMoneda, haceCuanto, hoyLima, iniciales, porcentajeUso, sumarDias, formatoFecha } from './formato';

describe('formato', () => {
  it('moneda en soles con separador de miles', () => {
    expect(formatoMoneda(1234.5)).toBe('S/ 1,234.50');
    expect(formatoMoneda(0)).toBe('S/ 0.00');
    expect(formatoMoneda(null)).toBe('S/ 0.00');
  });

  it('fecha en hora de Lima', () => {
    // 20:04 UTC = 15:04 en Lima
    expect(formatoFecha('2026-10-19T20:04:00Z')).toMatch(/19 oct 2026.*3:04/);
  });

  it('día de hoy en Lima aunque en UTC ya sea mañana', () => {
    expect(hoyLima(new Date('2026-10-20T03:00:00Z'))).toBe('2026-10-19');
    expect(sumarDias('2026-10-31', 1)).toBe('2026-11-01');
  });

  it('relativo para alertas', () => {
    const ahora = new Date('2026-10-19T15:00:00Z');
    expect(haceCuanto('2026-10-19T14:55:00Z', ahora)).toBe('hace 5 min');
    expect(haceCuanto('2026-10-19T12:00:00Z', ahora)).toBe('hace 3 h');
    expect(haceCuanto('2026-10-19T14:59:50Z', ahora)).toBe('hace un momento');
    expect(haceCuanto('2026-10-18T15:00:00Z', ahora)).toBe('ayer');
  });

  it('iniciales y porcentaje de uso', () => {
    expect(iniciales('María Quispe Rojas')).toBe('MQ');
    expect(porcentajeUso(85.5, 150)).toBe(57);
    expect(porcentajeUso(10, 0)).toBe(100);
  });
});
