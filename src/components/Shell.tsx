import * as RDM from '@radix-ui/react-dropdown-menu';
import {
  Bell,
  BookOpenCheck,
  ChartColumn,
  History,
  House,
  LogOut,
  MoreHorizontal,
  Package,
  ShoppingBasket,
  Truck,
  Users,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router';
import { useBodega } from '@/api/auth';
import { useAuth } from '@/auth/useAuth';
import { useAlertas } from '@/features/alertas/useAlertas';
import { cn } from '@/lib/cn';
import { iniciales } from '@/lib/formato';
import { Dialogo } from './ui/Dialogo';

const PRINCIPALES = [
  { a: '/', etiqueta: 'Inicio', icono: House, fin: true },
  { a: '/ventas/nueva', etiqueta: 'Vender', icono: ShoppingBasket },
  { a: '/clientes', etiqueta: 'Clientes', icono: Users },
  { a: '/productos', etiqueta: 'Productos', icono: Package },
];
const SECUNDARIAS = [
  { a: '/ventas', etiqueta: 'Historial', icono: History, fin: true },
  { a: '/reposiciones', etiqueta: 'Reposiciones', icono: Truck },
  { a: '/reportes', etiqueta: 'Reportes', icono: ChartColumn },
  { a: '/alertas', etiqueta: 'Alertas', icono: Bell },
];

/** Estructura del bodeguero: barra inferior en móvil y barra lateral en escritorio (Especificación §5.3). */
export function Shell() {
  const [mas, setMas] = useState(false);
  const { logout } = useAuth();
  const navegar = useNavigate();
  return (
    <div className="min-h-dvh md:pl-64">
      <BarraLateral />
      <main className="mx-auto w-full max-w-5xl pb-28 md:pb-10">
        <Outlet />
      </main>
      <nav
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-borde bg-superficie pb-[env(safe-area-inset-bottom)] md:hidden"
        aria-label="Navegación principal"
      >
        {PRINCIPALES.map((i) => (
          <ItemInferior key={i.a} {...i} />
        ))}
        <button
          type="button"
          onClick={() => setMas(true)}
          className="flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-semibold text-tinta-2"
        >
          <MoreHorizontal className="size-6" aria-hidden />
          Más
        </button>
      </nav>
      <Dialogo abierto={mas} alCambiar={setMas} titulo="Más opciones">
        <ul className="flex flex-col gap-1">
          {SECUNDARIAS.map(({ a, etiqueta, icono: Icono }) => (
            <li key={a}>
              <button
                type="button"
                className="flex min-h-12 w-full items-center gap-3 rounded-control px-3 text-left font-semibold hover:bg-fondo"
                onClick={() => {
                  setMas(false);
                  navegar(a);
                }}
              >
                <Icono className="size-5 text-tinta-2" aria-hidden /> {etiqueta}
              </button>
            </li>
          ))}
          <li>
            <button
              type="button"
              className="flex min-h-12 w-full items-center gap-3 rounded-control px-3 text-left font-semibold text-deuda hover:bg-deuda-bg"
              onClick={() => logout()}
            >
              <LogOut className="size-5" aria-hidden /> Salir
            </button>
          </li>
        </ul>
      </Dialogo>
    </div>
  );
}

function ItemInferior({ a, etiqueta, icono: Icono, fin }: { a: string; etiqueta: string; icono: typeof House; fin?: boolean }) {
  return (
    <NavLink
      to={a}
      end={fin}
      className={({ isActive }) =>
        cn('flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-semibold', isActive ? 'text-tinta' : 'text-tinta-2')
      }
    >
      {({ isActive }) => (
        <>
          <span className={cn('flex h-8 w-14 items-center justify-center rounded-full', isActive && 'bg-[#e5e7eb]')}>
            <Icono className="size-6" aria-hidden strokeWidth={isActive ? 2.5 : 2} />
          </span>
          {etiqueta}
        </>
      )}
    </NavLink>
  );
}

function BarraLateral() {
  const { usuario, logout } = useAuth();
  const { data: bodega } = useBodega();
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-primario text-white md:flex">
      <Link to="/" className="flex items-center gap-3 px-5 py-6">
        <Logo />
        <div>
          <p className="text-lg font-bold leading-tight">
            Fiado<span className="text-acento">Ya</span>
          </p>
          <p className="text-xs text-white/70">{bodega?.nombre ?? 'Bodega'}</p>
        </div>
      </Link>
      <nav className="flex flex-1 flex-col gap-1 px-3" aria-label="Navegación principal">
        {[...PRINCIPALES, ...SECUNDARIAS].map(({ a, etiqueta, icono: Icono, fin }) => (
          <NavLink
            key={a}
            to={a}
            end={fin}
            className={({ isActive }) =>
              cn(
                'flex min-h-11 items-center gap-3 rounded-control px-3 text-[15px] font-semibold',
                isActive ? 'bg-white/15 text-white' : 'text-white/75 hover:bg-white/10 hover:text-white',
              )
            }
          >
            <Icono className="size-5" aria-hidden /> {etiqueta}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-white/10 p-3">
        <p className="px-3 pb-2 text-sm text-white/70">{usuario?.username}</p>
        <button
          type="button"
          onClick={() => logout()}
          className="flex min-h-11 w-full items-center gap-3 rounded-control px-3 text-[15px] font-semibold text-white/80 hover:bg-white/10"
        >
          <LogOut className="size-5" aria-hidden /> Salir
        </button>
      </div>
    </aside>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('relative flex size-11 items-center justify-center rounded-control bg-primario ring-1 ring-white/20', className)}>
      <BookOpenCheck className="size-6 text-white" aria-hidden />
      <span className="absolute -bottom-1 -right-1 size-4 rounded-full border-2 border-white bg-acento" aria-hidden />
    </span>
  );
}

/** Encabezado de cada pantalla: título, acciones, campana de alertas y menú del usuario. */
export function Pagina({
  titulo,
  icono,
  volver,
  acciones,
  children,
}: {
  titulo: string;
  icono?: ReactNode;
  volver?: string;
  acciones?: ReactNode;
  children: ReactNode;
}) {
  const navegar = useNavigate();
  return (
    <>
      <header className="sticky top-0 z-20 flex min-h-16 items-center gap-3 border-b border-borde bg-superficie/95 px-4 backdrop-blur md:px-8">
        {volver && (
          <button type="button" onClick={() => navegar(volver)} className="-ml-2 rounded-control p-2 hover:bg-fondo" aria-label="Volver">
            <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        {icono}
        <h1 className="flex-1 truncate text-2xl font-bold">{titulo}</h1>
        {acciones}
        <CampanaAlertas />
        <MenuUsuario />
      </header>
      <div className="flex flex-col gap-4 px-4 py-4 md:px-8 md:py-6">{children}</div>
    </>
  );
}

export function CampanaAlertas() {
  const { noLeidas } = useAlertas();
  return (
    <Link
      to="/alertas"
      className="relative rounded-control p-2 hover:bg-fondo"
      aria-label={noLeidas > 0 ? `Alertas: ${noLeidas} sin leer` : 'Alertas'}
    >
      <Bell className="size-6" aria-hidden />
      {noLeidas > 0 && (
        <span className="absolute right-0.5 top-0.5 flex min-w-5 items-center justify-center rounded-full bg-deuda px-1 text-[11px] font-bold text-white">
          {noLeidas > 99 ? '99+' : noLeidas}
        </span>
      )}
    </Link>
  );
}

function MenuUsuario() {
  const { usuario, logout } = useAuth();
  if (!usuario) return null;
  return (
    <RDM.Root>
      <RDM.Trigger
        className="flex size-10 items-center justify-center rounded-full bg-primario text-sm font-bold text-white md:hidden"
        aria-label="Menú de usuario"
      >
        {iniciales(usuario.username)}
      </RDM.Trigger>
      <RDM.Portal>
        <RDM.Content align="end" sideOffset={8} className="z-50 min-w-48 rounded-tarjeta border border-borde bg-superficie p-1 shadow-hoja">
          <RDM.Label className="px-3 py-2 text-sm text-tinta-2">{usuario.username}</RDM.Label>
          <RDM.Item
            onSelect={() => logout()}
            className="flex min-h-11 cursor-pointer items-center gap-2 rounded-control px-3 font-semibold text-deuda outline-none data-[highlighted]:bg-deuda-bg"
          >
            <LogOut className="size-4" aria-hidden /> Salir
          </RDM.Item>
        </RDM.Content>
      </RDM.Portal>
    </RDM.Root>
  );
}
