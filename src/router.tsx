import { createBrowserRouter } from 'react-router';
import { RutaProtegida } from '@/auth/RutaProtegida';
import { Shell } from '@/components/Shell';
import { Alertas } from '@/features/alertas/Alertas';
import { DetalleCliente } from '@/features/clientes/DetalleCliente';
import { FormCliente } from '@/features/clientes/FormCliente';
import { ListaClientes } from '@/features/clientes/ListaClientes';
import { MiCuenta } from '@/features/cuenta/MiCuenta';
import { Dashboard } from '@/features/dashboard/Dashboard';
import { NoEncontrado } from '@/features/estados/Estados';
import { Login } from '@/features/login/Login';
import { Productos } from '@/features/productos/Productos';
import { Reportes } from '@/features/reportes/Reportes';
import { Reposiciones } from '@/features/reposiciones/Reposiciones';
import { DetalleVenta } from '@/features/ventas/DetalleVenta';
import { Historial } from '@/features/ventas/Historial';
import { NuevaVenta } from '@/features/ventas/NuevaVenta';

export const rutas = [
  { path: '/login', element: <Login /> },
  {
    path: '/mi-cuenta',
    element: (
      <RutaProtegida roles={['CLIENTE']}>
        <MiCuenta />
      </RutaProtegida>
    ),
  },
  {
    element: (
      <RutaProtegida roles={['BODEGUERO']}>
        <Shell />
      </RutaProtegida>
    ),
    children: [
      { path: '/', element: <Dashboard /> },
      { path: '/ventas/nueva', element: <NuevaVenta /> },
      { path: '/ventas', element: <Historial /> },
      { path: '/ventas/:id', element: <DetalleVenta /> },
      { path: '/clientes', element: <ListaClientes /> },
      { path: '/clientes/nuevo', element: <FormCliente /> },
      { path: '/clientes/:id', element: <DetalleCliente /> },
      { path: '/clientes/:id/editar', element: <FormCliente /> },
      { path: '/productos', element: <Productos /> },
      { path: '/reposiciones', element: <Reposiciones /> },
      { path: '/reportes', element: <Reportes /> },
      { path: '/alertas', element: <Alertas /> },
    ],
  },
  { path: '*', element: <NoEncontrado /> },
];

export const crearRouter = () => createBrowserRouter(rutas);
