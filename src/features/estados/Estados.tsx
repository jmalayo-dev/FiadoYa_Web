import { FileQuestion, RotateCw, ShieldX, TriangleAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { useAuth, inicioDe } from '@/auth/useAuth';
import { Boton } from '@/components/ui/Boton';

function Pantalla({ icono, titulo, texto, accion }: { icono: ReactNode; titulo: string; texto: string; accion: ReactNode }) {
  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex size-20 items-center justify-center rounded-full border border-borde bg-superficie">{icono}</div>
      <h1 className="text-2xl font-bold">{titulo}</h1>
      <p className="max-w-sm text-tinta-2">{texto}</p>
      {accion}
    </div>
  );
}

function VolverAlInicio() {
  const { usuario } = useAuth();
  return (
    <Link
      to={usuario ? inicioDe(usuario.rol) : '/login'}
      className="inline-flex min-h-12 items-center rounded-control bg-primario px-5 font-semibold text-white"
    >
      Volver al inicio
    </Link>
  );
}

export function SinPermiso() {
  return (
    <Pantalla
      icono={<ShieldX className="size-10 text-deuda" aria-hidden />}
      titulo="No tienes permiso para ver esta página"
      texto="Tu usuario no tiene acceso a esta sección. Si crees que es un error, consulta con el bodeguero."
      accion={<VolverAlInicio />}
    />
  );
}

export function NoEncontrado() {
  return (
    <Pantalla
      icono={<FileQuestion className="size-10 text-tinta-2" aria-hidden />}
      titulo="No encontramos lo que buscas"
      texto="La página no existe o cambió de lugar."
      accion={<VolverAlInicio />}
    />
  );
}

export function ErrorRender() {
  return (
    <Pantalla
      icono={<TriangleAlert className="size-10 text-alerta" aria-hidden />}
      titulo="Ocurrió un error inesperado"
      texto="Recarga la página para continuar. Tus datos guardados no se perdieron."
      accion={
        <Boton onClick={() => window.location.reload()}>
          <RotateCw className="size-4" aria-hidden /> Recargar
        </Boton>
      }
    />
  );
}
