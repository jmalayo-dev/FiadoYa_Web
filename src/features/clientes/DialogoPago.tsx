import { zodResolver } from '@hookform/resolvers/zod';
import { Banknote, CheckCircle2, Landmark, QrCode, Wallet, Zap } from 'lucide-react';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useMutacionesCliente } from '@/api/clientes';
import type { Cliente, MetodoPago } from '@/api/tipos';
import { useEnLinea } from '@/components/BannerSinConexion';
import { Moneda } from '@/components/Moneda';
import { Boton } from '@/components/ui/Boton';
import { Campo, Entrada } from '@/components/ui/Campo';
import { Dialogo } from '@/components/ui/Dialogo';
import { cn } from '@/lib/cn';
import { codigoDe, mensajeDeError } from '@/lib/errores';
import { formatoMoneda } from '@/lib/formato';
import { esquemaPago } from './esquemas';

const METODOS: { valor: MetodoPago; etiqueta: string; icono: typeof Banknote }[] = [
  { valor: 'EFECTIVO', etiqueta: 'Efectivo', icono: Banknote },
  { valor: 'YAPE_PLIN', etiqueta: 'Yape / Plin', icono: QrCode },
  { valor: 'TRANSFERENCIA', etiqueta: 'Transferencia', icono: Landmark },
];

/** Registrar pago (HU06): monto hasta el saldo, botón "Pagar todo" y método (v1.2 E2). */
export function DialogoPago({ cliente, alCerrar }: { cliente: Cliente; alCerrar: () => void }) {
  const { pagar } = useMutacionesCliente();
  const qc = useQueryClient();
  const enLinea = useEnLinea();
  const esquema = useMemo(() => esquemaPago(cliente.saldo), [cliente.saldo]);
  const { register, handleSubmit, formState, setValue, setError, watch } = useForm<
    { monto: unknown; metodo: MetodoPago },
    unknown,
    { monto: number; metodo: MetodoPago }
  >({
    resolver: zodResolver(esquema),
    defaultValues: { monto: '', metodo: 'EFECTIVO' },
  });
  const metodo = watch('metodo');

  const enviar = handleSubmit(async (d) => {
    try {
      const pago = await pagar.mutateAsync({ id: cliente.id, body: d });
      qc.invalidateQueries({ queryKey: ['clientes', cliente.id] });
      toast.success(`Pago registrado. Nuevo saldo: ${formatoMoneda(pago.saldoDespues)}.`);
      alCerrar();
    } catch (e) {
      if (codigoDe(e) === 'PAGO_EXCEDE_SALDO') setError('monto', { message: mensajeDeError(e) });
      else toast.error(mensajeDeError(e));
    }
  });

  return (
    <Dialogo
      abierto
      alCambiar={(v) => !v && alCerrar()}
      titulo="Registrar pago"
      descripcion={
        <>
          Cliente: <b>{cliente.nombre}</b> · Deuda actual: <b className="text-deuda">{formatoMoneda(cliente.saldo)}</b>
        </>
      }
      pie={
        <div className="flex flex-col gap-2">
          <Boton type="submit" form="form-pago" tamano="lg" cargando={formState.isSubmitting} disabled={!enLinea}>
            <CheckCircle2 className="size-5" aria-hidden /> Registrar pago
          </Boton>
          <Boton variante="fantasma" onClick={alCerrar}>
            Cancelar
          </Boton>
        </div>
      }
    >
      <form id="form-pago" onSubmit={enviar} noValidate className="flex flex-col gap-4">
        <div className="flex items-center gap-3 rounded-tarjeta border border-[#bfdbfe] bg-info-bg p-4">
          <Wallet className="size-6 text-info" aria-hidden />
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase text-tinta-2">Saldo por liquidar</p>
            <p>Debe actualmente</p>
          </div>
          <Moneda valor={cliente.saldo} className="text-xl text-deuda" />
        </div>
        <Campo etiqueta="Monto a pagar (S/)" obligatorio error={formState.errors.monto?.message}>
          {({ id, describedBy, invalido }) => (
            <Entrada
              id={id}
              aria-describedby={describedBy}
              invalido={invalido}
              inputMode="decimal"
              autoFocus
              placeholder="0.00"
              className="cifras min-h-14 text-2xl font-bold"
              {...register('monto')}
            />
          )}
        </Campo>
        <div className="flex items-center justify-between text-sm">
          <button
            type="button"
            className="flex items-center gap-1 font-semibold text-ok underline"
            onClick={() => setValue('monto', cliente.saldo.toFixed(2), { shouldValidate: true })}
          >
            <Zap className="size-4" aria-hidden /> Pagar todo ({formatoMoneda(cliente.saldo)})
          </button>
          <span className="text-tinta-2">Máx: {formatoMoneda(cliente.saldo)}</span>
        </div>
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">Método de pago</legend>
          <div className="grid grid-cols-3 gap-2">
            {METODOS.map(({ valor, etiqueta, icono: Icono }) => (
              <button
                key={valor}
                type="button"
                aria-pressed={metodo === valor}
                onClick={() => setValue('metodo', valor)}
                className={cn(
                  'flex min-h-16 flex-col items-center justify-center gap-1 rounded-control border text-xs font-semibold',
                  metodo === valor ? 'border-primario bg-primario text-white' : 'border-borde bg-superficie',
                )}
              >
                <Icono className="size-5" aria-hidden /> {etiqueta}
              </button>
            ))}
          </div>
        </fieldset>
      </form>
    </Dialogo>
  );
}
