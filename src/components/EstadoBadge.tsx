import { CheckCircle2, CircleAlert, Clock, Banknote, NotebookPen, PackageX, TriangleAlert } from 'lucide-react';
import type { EstadoVenta, TipoPago } from '@/api/tipos';
import { Insignia } from './ui/Insignia';

/** Insignias de estado (Especificación §5.4): nunca solo color, siempre texto e ícono. */
export function EstadoBadge({ estado }: { estado: EstadoVenta }) {
  if (estado === 'CONFIRMADA')
    return (
      <Insignia tono="ok">
        <CheckCircle2 className="size-3.5" aria-hidden /> Confirmada
      </Insignia>
    );
  if (estado === 'RECHAZADA')
    return (
      <Insignia tono="deuda">
        <CircleAlert className="size-3.5" aria-hidden /> Rechazada
      </Insignia>
    );
  return (
    <Insignia tono="alerta">
      <Clock className="size-3.5" aria-hidden /> Pendiente
    </Insignia>
  );
}

export function TipoPagoBadge({ tipo }: { tipo: TipoPago }) {
  return tipo === 'FIADO' ? (
    <Insignia tono="info">
      <NotebookPen className="size-3.5" aria-hidden /> Fiado
    </Insignia>
  ) : (
    <Insignia tono="neutro">
      <Banknote className="size-3.5" aria-hidden /> Contado
    </Insignia>
  );
}

export function StockBadge({ stock, minimo }: { stock: number; minimo: number }) {
  if (stock === 0)
    return (
      <Insignia tono="deuda">
        <PackageX className="size-3.5" aria-hidden /> Agotado
      </Insignia>
    );
  if (stock <= minimo)
    return (
      <Insignia tono="alerta">
        <TriangleAlert className="size-3.5" aria-hidden /> Stock bajo
      </Insignia>
    );
  return null;
}
