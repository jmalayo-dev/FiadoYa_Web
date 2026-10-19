import { fetchEventSource } from '@microsoft/fetch-event-source';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { alertasApi } from '@/api/alertas';
import type { Alerta } from '@/api/tipos';
import { leerSesion } from '@/auth/sesion';
import { useAuth } from '@/auth/useAuth';
import { config } from '@/lib/config';
import { formatoMoneda } from '@/lib/formato';
import { AlertasContext } from './useAlertas';

const CLAVE_LEIDAS = 'fiadoya.alertas.leidas';

function leerLeidas(): Set<string> {
  try {
    return new Set(JSON.parse(sessionStorage.getItem(CLAVE_LEIDAS) ?? '[]') as string[]);
  } catch {
    return new Set();
  }
}

export function textoAlerta(a: Alerta): string {
  return a.tipo === 'STOCK_BAJO'
    ? `Stock bajo: ${a.nombre} — quedan ${a.stock}`
    : `${a.nombre} llegó al ${Math.round((a.saldo / a.limiteCredito) * 100)} % de su límite (${formatoMoneda(a.saldo)})`;
}

/**
 * Alertas en tiempo real (Especificación §9): historial al iniciar, stream SSE con el header Authorization
 * (fetch-event-source), deduplicación por id, toast y campana. Si el stream se cae reintenta 1, 2, 4… 30 s
 * y mientras tanto consulta el historial cada 15 s.
 */
export function AlertasProvider({ children }: { children: ReactNode }) {
  const { usuario } = useAuth();
  const esBodeguero = usuario?.rol === 'BODEGUERO';
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [leidas, setLeidas] = useState<Set<string>>(leerLeidas);
  const [conectado, setConectado] = useState(false);
  const vistos = useRef(new Set<string>());

  const agregar = useCallback((nuevas: Alerta[], avisar: boolean) => {
    const frescas = nuevas.filter((a) => !vistos.current.has(a.id));
    if (frescas.length === 0) return;
    frescas.forEach((a) => vistos.current.add(a.id));
    setAlertas((prev) =>
      [...frescas, ...prev].sort((a, b) => b.ocurridoEn.localeCompare(a.ocurridoEn)).slice(0, 100),
    );
    if (avisar) frescas.forEach((a) => toast.warning(textoAlerta(a), { id: a.id }));
  }, []);

  useEffect(() => {
    if (!esBodeguero) {
      vistos.current.clear();
      setAlertas([]);
      return;
    }
    const abortar = new AbortController();
    let espera = 1000;
    let sondeo: ReturnType<typeof setInterval> | undefined;
    const iniciarSondeo = () => {
      sondeo ??= setInterval(() => alertasApi.historial(50).then((h) => agregar(h, true)).catch(() => {}), 15_000);
    };
    const detenerSondeo = () => {
      clearInterval(sondeo);
      sondeo = undefined;
    };

    alertasApi
      .historial(50)
      .then((h) => agregar(h, false))
      .catch(() => {});

    if (import.meta.env.MODE !== 'test') {
      fetchEventSource(`${config.apiBase}/alertas/stream`, {
        signal: abortar.signal,
        headers: { Authorization: `Bearer ${leerSesion()?.token ?? ''}` },
        openWhenHidden: true,
        async onopen(r) {
          if (!r.ok) throw new Error(`SSE ${r.status}`);
          setConectado(true);
          espera = 1000;
          detenerSondeo();
        },
        onmessage(ev) {
          if (ev.event === 'alerta' && ev.data) agregar([JSON.parse(ev.data) as Alerta], true);
        },
        onclose() {
          setConectado(false);
          iniciarSondeo();
          throw new Error('stream cerrado');
        },
        onerror() {
          setConectado(false);
          iniciarSondeo();
          const actual = espera;
          espera = Math.min(espera * 2, 30_000);
          return actual; // reintento con espera creciente
        },
      }).catch(() => {});
    }
    return () => {
      abortar.abort();
      detenerSondeo();
    };
  }, [esBodeguero, agregar]);

  const noLeidas = alertas.filter((a) => !leidas.has(a.id)).length;
  const marcarLeidas = useCallback(() => {
    setLeidas((prev) => {
      const s = new Set(prev);
      alertas.forEach((a) => s.add(a.id));
      try {
        sessionStorage.setItem(CLAVE_LEIDAS, JSON.stringify([...s].slice(-500)));
      } catch {
        /* sin almacenamiento */
      }
      return s;
    });
  }, [alertas]);

  const valor = useMemo(() => ({ alertas, noLeidas, conectado, marcarLeidas, leidas }), [alertas, noLeidas, conectado, marcarLeidas, leidas]);
  return <AlertasContext.Provider value={valor}>{children}</AlertasContext.Provider>;
}
