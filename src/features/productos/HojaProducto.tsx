import { zodResolver } from '@hookform/resolvers/zod';
import { Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useMutacionesProducto } from '@/api/productos';
import type { Producto, ProductoInput } from '@/api/tipos';
import { Boton } from '@/components/ui/Boton';
import { Campo, Entrada } from '@/components/ui/Campo';
import { Dialogo } from '@/components/ui/Dialogo';
import { erroresDeCampo, mensajeDeError } from '@/lib/errores';
import { CATEGORIAS, esquemaProducto, type DatosProducto, type ProductoValidado } from './esquemas';

/** Alta y edición en hoja lateral. El stock inicial solo se pide al crear. */
export function HojaProducto({ producto, alCerrar }: { producto: Producto | null; alCerrar: () => void }) {
  const { crear, actualizar } = useMutacionesProducto();
  const { register, handleSubmit, formState, setError, watch } = useForm<DatosProducto, unknown, ProductoValidado>({
    resolver: zodResolver(esquemaProducto),
    defaultValues: producto
      ? {
          nombre: producto.nombre,
          precio: producto.precio,
          costo: producto.costo ?? '',
          stock: producto.stock,
          stockMinimo: producto.stockMinimo,
          categoria: producto.categoria,
          codigoBarras: producto.codigoBarras ?? '',
        }
      : { nombre: '', precio: '' as unknown as number, costo: '', stock: 0, stockMinimo: 5, categoria: 'ABARROTES', codigoBarras: '' },
  });
  const e = formState.errors;
  const minimo = watch('stockMinimo');

  const enviar = handleSubmit(async (d) => {
    const body: ProductoInput = {
      nombre: d.nombre,
      precio: d.precio,
      costo: d.costo === '' || d.costo === undefined ? null : d.costo,
      stock: d.stock,
      stockMinimo: d.stockMinimo,
      categoria: d.categoria,
      codigoBarras: d.codigoBarras || null,
    };
    try {
      if (producto) await actualizar.mutateAsync({ id: producto.id, body });
      else await crear.mutateAsync(body);
      toast.success(producto ? 'Producto actualizado.' : 'Producto creado.');
      alCerrar();
    } catch (err) {
      const campos = erroresDeCampo(err);
      Object.entries(campos).forEach(([c, m]) => setError(c as keyof DatosProducto, { message: m }));
      if ((err as { code?: string }).code === 'CODIGO_DUPLICADO') setError('codigoBarras', { message: mensajeDeError(err) });
      else if (Object.keys(campos).length === 0) toast.error(mensajeDeError(err));
    }
  });

  return (
    <Dialogo
      abierto
      forma="hoja"
      alCambiar={(v) => !v && alCerrar()}
      titulo={producto ? 'Editar producto' : 'Nuevo producto'}
      descripcion="Para venta en mostrador o al fiado"
      pie={
        <div className="flex gap-2">
          <Boton variante="contorno" className="flex-1" onClick={alCerrar}>
            Cancelar
          </Boton>
          <Boton type="submit" form="form-producto" className="flex-1" cargando={formState.isSubmitting}>
            <Save className="size-4" aria-hidden /> Guardar
          </Boton>
        </div>
      }
    >
      <form id="form-producto" onSubmit={enviar} noValidate className="flex flex-col gap-4">
        <Campo etiqueta="Nombre del producto" obligatorio error={e.nombre?.message}>
          {({ id, describedBy, invalido }) => <Entrada id={id} aria-describedby={describedBy} invalido={invalido} {...register('nombre')} />}
        </Campo>
        <div className="grid grid-cols-2 gap-3">
          <Campo etiqueta="Precio venta (S/)" obligatorio error={e.precio?.message}>
            {({ id, describedBy, invalido }) => (
              <Entrada id={id} aria-describedby={describedBy} invalido={invalido} inputMode="decimal" {...register('precio')} />
            )}
          </Campo>
          <Campo etiqueta="Costo ref. (S/)" error={e.costo?.message}>
            {({ id, describedBy, invalido }) => (
              <Entrada id={id} aria-describedby={describedBy} invalido={invalido} inputMode="decimal" placeholder="Opcional" {...register('costo')} />
            )}
          </Campo>
          {!producto && (
            <Campo etiqueta="Stock inicial" obligatorio error={e.stock?.message}>
              {({ id, describedBy, invalido }) => (
                <Entrada id={id} aria-describedby={describedBy} invalido={invalido} inputMode="numeric" {...register('stock')} />
              )}
            </Campo>
          )}
          <Campo etiqueta="Stock mínimo" obligatorio error={e.stockMinimo?.message} ayuda={`Avisará cuando queden ${minimo || 0} o menos.`}>
            {({ id, describedBy, invalido }) => (
              <Entrada id={id} aria-describedby={describedBy} invalido={invalido} inputMode="numeric" {...register('stockMinimo')} />
            )}
          </Campo>
        </div>
        <Campo etiqueta="Categoría" error={e.categoria?.message}>
          {({ id }) => (
            <select id={id} className="min-h-12 rounded-control border border-borde bg-superficie px-3" {...register('categoria')}>
              {CATEGORIAS.map((c) => (
                <option key={c.valor} value={c.valor}>
                  {c.etiqueta}
                </option>
              ))}
            </select>
          )}
        </Campo>
        <Campo etiqueta="Código de barras" error={e.codigoBarras?.message} ayuda="Opcional. De 8 a 14 dígitos.">
          {({ id, describedBy, invalido }) => (
            <Entrada id={id} aria-describedby={describedBy} invalido={invalido} inputMode="numeric" {...register('codigoBarras')} />
          )}
        </Campo>
      </form>
    </Dialogo>
  );
}
