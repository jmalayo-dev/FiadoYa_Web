import { zodResolver } from '@hookform/resolvers/zod';
import { Copy, Eye, EyeOff, KeyRound, RotateCw } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { authApi } from '@/api/auth';
import { useMutacionesCliente } from '@/api/clientes';
import type { Cliente, UsuarioSesion } from '@/api/tipos';
import { Boton } from '@/components/ui/Boton';
import { Campo, Entrada } from '@/components/ui/Campo';
import { Dialogo } from '@/components/ui/Dialogo';
import { codigoDe, mensajeDeError } from '@/lib/errores';
import { esquemaAcceso, type DatosAcceso } from './esquemas';

/**
 * Dar acceso al cliente (Especificación §S05): 1) POST /auth/usuarios con rol CLIENTE,
 * 2) PUT /clientes/{id} con usuarioId. Si el paso 2 falla, se puede reintentar solo ese paso.
 * La contraseña se muestra una única vez para entregarla al cliente.
 */
export function DialogoAcceso({ cliente, alCerrar }: { cliente: Cliente; alCerrar: () => void }) {
  const { actualizar } = useMutacionesCliente();
  const [creado, setCreado] = useState<{ usuario: UsuarioSesion; password: string } | null>(null);
  const [vinculado, setVinculado] = useState(false);
  const [errorVinculo, setErrorVinculo] = useState<string | null>(null);
  const [ver, setVer] = useState(false);
  const { register, handleSubmit, formState, setError } = useForm<DatosAcceso>({
    resolver: zodResolver(esquemaAcceso),
    defaultValues: { username: cliente.dni ?? '', password: '' },
  });

  const vincular = async (usuario: UsuarioSesion) => {
    setErrorVinculo(null);
    try {
      await actualizar.mutateAsync({
        id: cliente.id,
        body: {
          nombre: cliente.nombre,
          telefono: cliente.telefono,
          limiteCredito: cliente.limiteCredito,
          consentimiento: cliente.consentimiento,
          dni: cliente.dni,
          direccion: cliente.direccion,
          usuarioId: usuario.id,
        },
      });
      setVinculado(true);
    } catch (e) {
      setErrorVinculo(`Se creó el usuario, pero no se pudo vincular al cliente: ${mensajeDeError(e)}`);
    }
  };

  const crear = handleSubmit(async (d) => {
    try {
      const usuario = await authApi.crearUsuario({ username: d.username.toLowerCase(), password: d.password, rol: 'CLIENTE' });
      setCreado({ usuario, password: d.password });
      await vincular(usuario);
    } catch (e) {
      if (codigoDe(e) === 'USERNAME_DUPLICADO') setError('username', { message: mensajeDeError(e) });
      else toast.error(mensajeDeError(e));
    }
  });

  return (
    <Dialogo abierto alCambiar={(v) => !v && alCerrar()} titulo="Dar acceso al cliente" descripcion={`${cliente.nombre} podrá ver su deuda desde su celular.`}>
      {!creado ? (
        <form onSubmit={crear} noValidate className="flex flex-col gap-4">
          <Campo etiqueta="Usuario" obligatorio error={formState.errors.username?.message} ayuda="Puede ser su DNI. Solo minúsculas y números.">
            {({ id, describedBy, invalido }) => <Entrada id={id} aria-describedby={describedBy} invalido={invalido} autoCapitalize="none" {...register('username')} />}
          </Campo>
          <Campo etiqueta="Contraseña" obligatorio error={formState.errors.password?.message} ayuda="Mínimo 8 caracteres, con letras y números.">
            {({ id, describedBy, invalido }) => (
              <div className="relative">
                <Entrada id={id} aria-describedby={describedBy} invalido={invalido} type={ver ? 'text' : 'password'} className="pr-12" {...register('password')} />
                <button type="button" onClick={() => setVer((v) => !v)} className="absolute right-1 top-1/2 -translate-y-1/2 p-2 text-tinta-2" aria-label={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                  {ver ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
              </div>
            )}
          </Campo>
          <Boton type="submit" cargando={formState.isSubmitting}>
            <KeyRound className="size-4" aria-hidden /> Crear acceso
          </Boton>
        </form>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="rounded-tarjeta border border-[#a7f3d0] bg-ok-bg p-4">
            <p className="font-bold text-ok">{vinculado ? 'Acceso creado' : 'Usuario creado'}</p>
            <p className="mt-2 text-sm">Entrega estos datos al cliente. La contraseña no se volverá a mostrar.</p>
            <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
              <dt className="text-tinta-2">Usuario</dt>
              <dd className="font-mono font-bold">{creado.usuario.username}</dd>
              <dt className="text-tinta-2">Contraseña</dt>
              <dd className="font-mono font-bold">{creado.password}</dd>
            </dl>
            <Boton
              variante="contorno"
              tamano="sm"
              className="mt-3"
              onClick={() => navigator.clipboard?.writeText(`Usuario: ${creado.usuario.username}\nContraseña: ${creado.password}`).then(() => toast.success('Copiado'))}
            >
              <Copy className="size-4" aria-hidden /> Copiar
            </Boton>
          </div>
          {errorVinculo && (
            <div role="alert" className="flex flex-col gap-2 rounded-control border border-[#fecaca] bg-deuda-bg p-3 text-sm text-deuda">
              <p className="font-semibold">{errorVinculo}</p>
              <Boton variante="contorno" tamano="sm" cargando={actualizar.isPending} onClick={() => vincular(creado.usuario)}>
                <RotateCw className="size-4" aria-hidden /> Reintentar vínculo
              </Boton>
            </div>
          )}
          <Boton onClick={alCerrar} disabled={!vinculado && !errorVinculo}>
            Listo
          </Boton>
        </div>
      )}
    </Dialogo>
  );
}
