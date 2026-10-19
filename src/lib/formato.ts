/** Formatos es-PE (Especificación frontend §15). Fechas siempre en America/Lima. */
const ZONA = 'America/Lima';

const moneda = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' });
const fechaHora = new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short', timeZone: ZONA });
const soloFecha = new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeZone: ZONA });
const soloHora = new Intl.DateTimeFormat('es-PE', { timeStyle: 'short', timeZone: ZONA });
const diaSemana = new Intl.DateTimeFormat('es-PE', { weekday: 'short', day: 'numeric', month: 'short', timeZone: ZONA });
const fechaLarga = new Intl.DateTimeFormat('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: ZONA });
const isoDia = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: ZONA });

/** "oct." → "oct" y espacios finos → espacio normal (formato de la Especificación §15). */
function limpiar(texto: string): string {
  return texto
    .replace(/[\u00a0\u202f]/g, ' ')
    .replace(/\b(ene|feb|mar|abr|may|jun|jul|ago|sept?|oct|nov|dic|lun|mié|jue|vie|sáb|dom)\./g, '$1');
}

/** "S/ 1,234.50" */
export function formatoMoneda(valor: number | null | undefined): string {
  return moneda.format(valor ?? 0).replace(/[\u00a0\u202f]/g, ' ');
}

/** "19 oct 2026, 3:04 p. m." */
export function formatoFecha(iso: string): string {
  return limpiar(fechaHora.format(new Date(iso)));
}

export function formatoSoloFecha(iso: string): string {
  return limpiar(soloFecha.format(new Date(iso)));
}

export function formatoHora(iso: string): string {
  return limpiar(soloHora.format(new Date(iso)));
}

/** "lun, 19 oct" para fechas yyyy-MM-dd (se interpretan como día de Lima). */
export function formatoDia(yyyyMmDd: string): string {
  return limpiar(diaSemana.format(new Date(`${yyyyMmDd}T12:00:00-05:00`)));
}

export function formatoFechaLarga(fecha: Date = new Date()): string {
  const texto = fechaLarga.format(fecha);
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** Día de hoy en Lima como yyyy-MM-dd. */
export function hoyLima(fecha: Date = new Date()): string {
  return isoDia.format(fecha);
}

export function sumarDias(yyyyMmDd: string, dias: number): string {
  const d = new Date(`${yyyyMmDd}T12:00:00-05:00`);
  d.setUTCDate(d.getUTCDate() + dias);
  return isoDia.format(d);
}

/** Relativo solo para alertas: "hace 5 min". */
export function haceCuanto(iso: string, ahora: Date = new Date()): string {
  const seg = Math.max(0, Math.round((ahora.getTime() - new Date(iso).getTime()) / 1000));
  if (seg < 45) return 'hace un momento';
  const min = Math.round(seg / 60);
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? 'ayer' : `hace ${d} días`;
}

/** "María Quispe" → "MQ" */
export function iniciales(nombre: string): string {
  return nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('');
}

/** Porcentaje entero de uso del crédito (0–100+). */
export function porcentajeUso(saldo: number, limite: number): number {
  if (limite <= 0) return saldo > 0 ? 100 : 0;
  return Math.round((saldo / limite) * 100);
}
