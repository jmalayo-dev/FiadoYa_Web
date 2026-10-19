import { zodResolver } from '@hookform/resolvers/zod';
import { Minus, Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useMutacionesProducto } from '@/api/productos';
import type { Producto } from '@/api/tipos';
import { Boton } from '@/components/ui/Boton';
import { Campo, Entrada } from '@/components/ui/Campo';
import { Dialogo } from '@/components/ui/Dialogo';
import { erroresDeCampo, mensajeDeError } from '@/lib/errores';
import { esquemaAjuste, type DatosAjuste } from './esquemas';

/** Ajuste manual de stock (+/−) con motivo obligatorio. Un ajuste que deja stock negativo vuelve como VALIDATION_ERROR. */
export function DialogoAjuste({ producto, alCerrar }: { producto: Producto; alCerrar: () => void }) {
  const { ajustar } = useMutacionesProducto();
  const { register, handleSubmit, formState, setError, setValue, watch } = useForm<DatosAjuste, unknown, { delta: number; motivo: string }>({
    resolver: zodResolver(esquemaAjuste),
    defaultValues: { delta: 0, motivo: '' },
  });
  const delta = Number(watch('delta')) || 0;
  const resultado = producto.stock + delta;

  const enviar = handleSubmit(async (d) => {
    if (producto.stock + d.delta < 0) {
      setError('delta', { message: `Dejaría el stock en negativo (hay ${producto.stock}).` });
      return;
    }
    try {
      await ajustar.mutateAsync({ id: producto.id, body: d });
      toast.success(`Stock de ${producto.nombre}: ${producto.stock + d.delta} u.`);
      alCerrar();
    } catch (err) {
      const campos = erroresDeCampo(err);
      if (campos.delta) setError('delta', { message: campos.delta });
      if (campos.motivo) setError('motivo', { message: campos.motivo });
      if (!campos.delta && !campos.motivo) toast.error(mensajeDeError(err));
    }
  });

  return (
    <Dialogo
      abierto
      alCambiar={(v) => !v && alCerrar()}
      titulo="Ajustar stock"
      descripcion={`${producto.nombre} · stock actual ${producto.stock} u.`}
      pie={
        <Boton type="submit" form="form-ajuste" className="w-full" cargando={formState.isSubmitting}>
          Guardar ajuste
        </Boton>
      }
    >
      <form id="form-ajuste" onSubmit={enviar} noValidate className="flex flex-col gap-4">
        <Campo etiqueta="Cantidad a sumar o restar" obligatorio error={formState.errors.delta?.message}>
          {({ id, describedBy, invalido }) => (
            <div className="flex items-center gap-2">
              <Boton variante="contorno" tamano="icono" aria-label="Restar uno" onClick={() => setValue('delta', delta - 1)}>
                <Minus className="size-5" />
              </Boton>
              <Entrada id={id} aria-describedby={describedBy} invalido={invalido} inputMode="numeric" className="cifras text-center text-xl font-bold" {...register('delta')} />
              <Boton variante="contorno" tamano="icono" aria-label="Sumar uno" onClick={() => setValue('delta', delta + 1)}>
                <Plus className="size-5" />
              </Boton>
            </div>
          )}
        </Campo>
        <p className="rounded-control bg-fondo p-3 text-sm">
          Quedará en <b className={resultado < 0 ? 'text-deuda' : ''}>{resultado} u.</b>
        </p>
        <Campo etiqueta="Motivo" obligatorio error={formState.errors.motivo?.message}>
          {({ id, describedBy, invalido }) => (
            <Entrada id={id} aria-describedby={describedBy} invalido={invalido} placeholder="Ej. merma, conteo, producto vencido" {...register('motivo')} />
          )}
        </Campo>
      </form>
    </Dialogo>
  );
}
