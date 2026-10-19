import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, Save, UserPlus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { clientesApi, useMutacionesCliente } from '@/api/clientes';
import type { Cliente, ClienteInput } from '@/api/tipos';
import { ErrorBloque } from '@/components/Estados';
import { Pagina } from '@/components/Shell';
import { Boton } from '@/components/ui/Boton';
import { Campo, Entrada } from '@/components/ui/Campo';
import { Casilla } from '@/components/ui/Casilla';
import { ListaEsqueleto } from '@/components/ui/Esqueleto';
import { Tarjeta } from '@/components/ui/Tarjeta';
import { codigoDe, erroresDeCampo, mensajeDeError } from '@/lib/errores';
import { esquemaCliente, TEXTO_CONSENTIMIENTO, type ClienteValidado, type DatosCliente } from './esquemas';

/** Alta (/clientes/nuevo) y edición (/clientes/:id/editar). */
export function FormCliente() {
  const { id } = useParams();
  const editar = id !== undefined;
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['clientes', Number(id)],
    queryFn: () => clientesApi.obtener(Number(id)),
    enabled: editar,
  });
  if (editar && error) return <Pagina titulo="Editar cliente" volver="/clientes"><ErrorBloque error={error} alReintentar={refetch} /></Pagina>;
  if (editar && (isLoading || !data)) return <Pagina titulo="Editar cliente" volver="/clientes"><ListaEsqueleto filas={3} /></Pagina>;
  return <Formulario cliente={data ?? null} />;
}

function Formulario({ cliente }: { cliente: Cliente | null }) {
  const navegar = useNavigate();
  const { crear, actualizar } = useMutacionesCliente();
  const { register, handleSubmit, formState, setError, setValue, watch } = useForm<DatosCliente, unknown, ClienteValidado>({
    resolver: zodResolver(esquemaCliente),
    defaultValues: {
      nombre: cliente?.nombre ?? '',
      telefono: cliente?.telefono ?? '',
      limiteCredito: cliente?.limiteCredito ?? 100,
      consentimiento: cliente?.consentimiento ?? false,
      dni: cliente?.dni ?? '',
      direccion: cliente?.direccion ?? '',
    },
  });
  const e = formState.errors;
  const consentimiento = watch('consentimiento');

  const enviar = handleSubmit(async (d) => {
    const body: ClienteInput = {
      nombre: d.nombre,
      telefono: d.telefono,
      limiteCredito: d.limiteCredito,
      consentimiento: d.consentimiento,
      dni: d.dni || null,
      direccion: d.direccion || null,
      usuarioId: cliente?.usuarioId ?? null,
    };
    try {
      const guardado = cliente ? await actualizar.mutateAsync({ id: cliente.id, body }) : await crear.mutateAsync(body);
      toast.success(cliente ? 'Cliente actualizado.' : 'Cliente registrado.');
      navegar(`/clientes/${guardado.id}`, { replace: true });
    } catch (err) {
      const campos = erroresDeCampo(err);
      Object.entries(campos).forEach(([c, m]) => setError(c as keyof DatosCliente, { message: m }));
      if (codigoDe(err) === 'DNI_DUPLICADO') setError('dni', { message: mensajeDeError(err) });
      else if (Object.keys(campos).length === 0) toast.error(mensajeDeError(err));
    }
  });

  return (
    <Pagina titulo={cliente ? 'Editar cliente' : 'Nuevo cliente'} volver={cliente ? `/clientes/${cliente.id}` : '/clientes'}>
      <form onSubmit={enviar} noValidate className="mx-auto flex w-full max-w-xl flex-col gap-4">
        {!cliente && (
          <div className="flex items-center gap-3">
            <span className="flex size-12 items-center justify-center rounded-control bg-info-bg text-info">
              <UserPlus className="size-6" aria-hidden />
            </span>
            <div>
              <p className="font-bold">Datos del cliente para ventas a crédito</p>
              <p className="text-sm text-tinta-2">Registra vecinos con respaldo y límite claro.</p>
            </div>
          </div>
        )}
        {Object.keys(e).length > 0 && (
          <p role="alert" className="rounded-control border border-[#fecaca] bg-deuda-bg p-3 text-sm font-semibold text-deuda">
            Revisa los campos marcados.
          </p>
        )}
        <Tarjeta className="flex flex-col gap-4 p-4">
          <Campo etiqueta="Nombre y apellidos" obligatorio error={e.nombre?.message}>
            {({ id, describedBy, invalido }) => <Entrada id={id} aria-describedby={describedBy} invalido={invalido} autoComplete="off" {...register('nombre')} />}
          </Campo>
          <Campo etiqueta="Teléfono móvil" obligatorio error={e.telefono?.message} ayuda="9 dígitos, empieza con 9">
            {({ id, describedBy, invalido }) => (
              <div className="flex">
                <span className="flex items-center rounded-l-control border border-r-0 border-borde bg-fondo px-3 text-sm font-semibold">+51</span>
                <Entrada id={id} aria-describedby={describedBy} invalido={invalido} inputMode="tel" maxLength={9} className="rounded-l-none" {...register('telefono')} />
              </div>
            )}
          </Campo>
          <div className="grid grid-cols-2 gap-3">
            <Campo etiqueta="DNI" error={e.dni?.message} ayuda="Opcional">
              {({ id, describedBy, invalido }) => <Entrada id={id} aria-describedby={describedBy} invalido={invalido} inputMode="numeric" maxLength={8} {...register('dni')} />}
            </Campo>
            <Campo etiqueta="Límite de fiado (S/)" obligatorio error={e.limiteCredito?.message}>
              {({ id, describedBy, invalido }) => <Entrada id={id} aria-describedby={describedBy} invalido={invalido} inputMode="decimal" {...register('limiteCredito')} />}
            </Campo>
          </div>
          <Campo etiqueta="Dirección" error={e.direccion?.message} ayuda="Opcional">
            {({ id, describedBy, invalido }) => <Entrada id={id} aria-describedby={describedBy} invalido={invalido} {...register('direccion')} />}
          </Campo>
        </Tarjeta>
        <Tarjeta className={`p-4 ${consentimiento ? '' : 'border-[#fde68a] bg-alerta-bg'}`}>
          <Casilla marcada={consentimiento} alCambiar={(v) => setValue('consentimiento', v, { shouldDirty: true })}>
            {TEXTO_CONSENTIMIENTO}
          </Casilla>
          {!consentimiento && (
            <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-alerta">
              <Lock className="size-3.5" aria-hidden /> Sin consentimiento no se puede fiar.
            </p>
          )}
          {cliente?.fechaConsentimiento && (
            <p className="mt-2 text-xs text-tinta-2">Autorizado el {new Date(cliente.fechaConsentimiento).toLocaleDateString('es-PE')}</p>
          )}
        </Tarjeta>
        <Boton type="submit" tamano="lg" cargando={formState.isSubmitting}>
          <Save className="size-5" aria-hidden /> Guardar cliente
        </Boton>
        <Boton variante="contorno" onClick={() => navegar(-1)}>
          Cancelar
        </Boton>
      </form>
    </Pagina>
  );
}
