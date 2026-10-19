import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, CircleAlert, Eye, EyeOff, IdCard, Lock, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Navigate, useNavigate, useSearchParams } from 'react-router';
import { inicioDe, useAuth } from '@/auth/useAuth';
import { Logo } from '@/components/Shell';
import { Boton } from '@/components/ui/Boton';
import { Campo, Entrada } from '@/components/ui/Campo';
import { Casilla } from '@/components/ui/Casilla';
import { config } from '@/lib/config';
import { codigoDe, mensajeDeError } from '@/lib/errores';
import { esquemaLogin, type DatosLogin } from './esquemas';

/** S01 · Login (vistas inicio_de_sesi_n_*). */
export function Login() {
  const { usuario, login } = useAuth();
  const navegar = useNavigate();
  const [params] = useSearchParams();
  const [verClave, setVerClave] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState<{ texto: string; credenciales: boolean } | null>(null);
  const { register, handleSubmit, formState, setValue, watch } = useForm<DatosLogin>({
    resolver: zodResolver(esquemaLogin),
    defaultValues: { username: '', password: '', recordar: false },
  });

  if (usuario) return <Navigate to={inicioDe(usuario.rol)} replace />;

  const enviar = handleSubmit(async (d) => {
    setErrorGeneral(null);
    try {
      const u = await login(d.username, d.password, d.recordar);
      const volver = params.get('volver');
      navegar(volver && volver.startsWith('/') && !volver.startsWith('//') ? volver : inicioDe(u.rol), { replace: true });
    } catch (e) {
      setErrorGeneral({ texto: mensajeDeError(e), credenciales: codigoDe(e) === 'AUTH_INVALID_CREDENTIALS' });
    }
  });

  return (
    <div className="flex min-h-dvh items-center justify-center bg-fondo px-4 py-10">
      <div className="grid w-full max-w-6xl items-center gap-12 md:grid-cols-[1.1fr_1fr]">
        <section className="hidden md:block" aria-hidden>
          <span className="inline-flex items-center gap-2 rounded-full border border-borde bg-superficie px-4 py-1.5 text-sm font-semibold">
            <span className="size-2.5 rounded-full bg-acento" /> Plataforma para bodegas del Perú
          </span>
          <h2 className="mt-6 text-5xl font-bold leading-tight">
            El cuaderno de fiados de siempre, <span className="text-ok underline decoration-ok/40">ahora digital</span> y seguro.
          </h2>
          <p className="mt-5 max-w-xl text-lg text-tinta-2">
            Lleva las cuentas claras al instante, gestiona cobranzas de tus clientes vecinos y mantén el control del mostrador.
          </p>
          <ul className="mt-8 flex flex-col gap-3 text-[15px]">
            {['Cuentas claras con tus clientes de confianza', 'Control de stock al instante para saber qué reponer', 'Alertas cuando un cliente llega a su límite'].map((t) => (
              <li key={t} className="flex items-center gap-3">
                <span className="flex size-7 items-center justify-center rounded-full bg-ok-bg text-ok">✓</span> {t}
              </li>
            ))}
          </ul>
        </section>

        <section className="mx-auto w-full max-w-md">
          <div className="mb-6 flex flex-col items-center gap-2 md:hidden">
            <Logo className="size-14" />
            <p className="text-3xl font-bold">
              Fiado<span className="text-ok">Ya</span>
            </p>
            <p className="text-sm text-tinta-2">Tu fiado, claro y al día</p>
          </div>
          <form
            onSubmit={enviar}
            noValidate
            className="flex flex-col gap-5 rounded-tarjeta border border-borde bg-superficie p-6 shadow-elevada md:p-8"
          >
            <div className="hidden items-center gap-3 md:flex">
              <Logo />
              <div>
                <p className="text-xl font-bold">
                  Fiado<span className="text-ok">Ya</span>
                </p>
                <p className="text-sm text-tinta-2">Tu fiado, claro y al día</p>
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold">Iniciar sesión en FiadoYa</h1>
              <p className="mt-1 text-sm text-tinta-2">Ingresa tus datos para gestionar las ventas y cuentas por cobrar.</p>
            </div>

            {errorGeneral && (
              <div role="alert" className="flex items-start gap-2 rounded-control border border-[#fecaca] bg-deuda-bg p-3 text-sm font-semibold text-deuda">
                <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden /> {errorGeneral.texto}
              </div>
            )}

            <Campo etiqueta="Usuario o DNI" obligatorio error={formState.errors.username?.message}>
              {({ id, describedBy, invalido }) => (
                <div className="relative">
                  <IdCard className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-tinta-2" aria-hidden />
                  <Entrada
                    id={id}
                    aria-describedby={describedBy}
                    invalido={invalido || errorGeneral?.credenciales}
                    autoComplete="username"
                    autoCapitalize="none"
                    placeholder="Ej. bodeguero o 40000001"
                    className="pl-10"
                    {...register('username')}
                  />
                </div>
              )}
            </Campo>
            <Campo etiqueta="Contraseña" obligatorio error={formState.errors.password?.message}>
              {({ id, describedBy, invalido }) => (
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-tinta-2" aria-hidden />
                  <Entrada
                    id={id}
                    aria-describedby={describedBy}
                    invalido={invalido}
                    type={verClave ? 'text' : 'password'}
                    autoComplete="current-password"
                    className="px-10"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setVerClave((v) => !v)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 rounded-control p-2 text-tinta-2 hover:bg-fondo"
                    aria-label={verClave ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {verClave ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                  </button>
                </div>
              )}
            </Campo>
            <Casilla marcada={watch('recordar')} alCambiar={(v) => setValue('recordar', v)}>
              Recordar en este equipo
            </Casilla>

            <Boton type="submit" tamano="lg" cargando={formState.isSubmitting}>
              Ingresar <ArrowRight className="size-5" aria-hidden />
            </Boton>

            <div className="border-t border-borde pt-4 text-center text-sm text-tinta-2">
              <p>¿Problemas para entrar? Consulta con el bodeguero.</p>
              <p className="mt-1">¿Olvidaste tu contraseña? Solicita restablecerla en la bodega.</p>
              {import.meta.env.DEV && (
                <p className="mt-3 rounded-control bg-info-bg p-2 text-info">
                  {config.usarMocks ? (
                    <>
                      Demo (mocks): <b>bodeguero / Demo12345</b> · <b>cliente1 / Demo12345</b>
                    </>
                  ) : (
                    <>
                      Demo: <b>bodeguero</b> con ADMIN_PASSWORD del .env · <b>cliente1</b> con DEMO_CLIENTE_PASSWORD
                    </>
                  )}
                </p>
              )}
            </div>
          </form>
          <p className="mt-4 flex items-center justify-center gap-2 text-xs text-tinta-2">
            <ShieldCheck className="size-4 text-ok" aria-hidden /> Conexión segura para tu bodega
          </p>
        </section>
      </div>
    </div>
  );
}
