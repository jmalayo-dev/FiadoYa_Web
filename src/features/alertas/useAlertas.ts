import { createContext, useContext } from 'react';
import type { Alerta } from '@/api/tipos';

export interface AlertasValor {
  alertas: Alerta[];
  noLeidas: number;
  conectado: boolean;
  leidas: Set<string>;
  marcarLeidas: () => void;
}

export const AlertasContext = createContext<AlertasValor>({
  alertas: [],
  noLeidas: 0,
  conectado: false,
  leidas: new Set(),
  marcarLeidas: () => {},
});

export function useAlertas() {
  return useContext(AlertasContext);
}
