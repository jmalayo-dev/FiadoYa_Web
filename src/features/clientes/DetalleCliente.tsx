import { HandCoins, KeyRound, Pencil, Phone, Share2, ShoppingCart, TriangleAlert, UserX } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';
import { useEstadoCuenta, useMutacionesCliente } from '@/api/clientes';
import { useBodega } from '@/api/auth';
import type { Cliente } from '@/api/tipos';
import { Avatar, BarraUso } from '@/components/BarraUso';
import { ErrorBloque } from '@/components/Estados';
import { Moneda } from '@/components/Moneda';
import { Pagina } from '@/components/Shell';
import { Boton } from '@/components/ui/Boton';
import { Dialogo } from '@/components/ui/Dialogo';
import { ListaEsqueleto } from '@/components/ui/Esqueleto';
import { Insignia } from '@/components/ui/Insignia';
import { Pestanas } from '@/components/ui/Pestanas';
import { Tarjeta, TituloSeccion } from '@/components/ui/Tarjeta';
import { codigoDe, mensajeDeError } from '@/lib/errores';
import { formatoMoneda, iniciales, porcentajeUso } from '@/lib/formato';
import { enlaceWhatsApp } from '@/lib/whatsapp';
import { DialogoAcceso } from './DialogoAcceso';
import { DialogoPago } from './DialogoPago';
import { MovimientosCuenta } from './MovimientosCuenta';

/** Detalle del cliente con estado de cuenta (HU07), pago (HU06), acceso (HU12) y desactivación (B7). */
export function DetalleCliente() {
  const id = Number(useParams().id);
  const { data, isLoading, error, refetch } = useEstadoCuenta(id);
  const navegar = useNavigate();
  const [pagando, setPagando] = useState(false);
  const [dandoAcceso, setDandoAcceso] = useState(false);
  const [desactivando, setDesactivando] = useState(false);
  const { data: bodega } = useBodega();

  if (error) return <Pagina titulo="Cliente" volver="/clientes"><ErrorBloque error={error} alReintentar={refetch} /></Pagina>;
  if (isLoading || !data) return <Pagina titulo="Cliente" volver="/clientes"><ListaEsqueleto filas={3} /></Pagina>;

  const c = data.cliente;
  const uso = porcentajeUso(c.saldo, c.limiteCredito);
  const textoWhatsApp =
    `Hola ${c.nombre.split(' ')[0]}, te saluda ${bodega?.nombre ?? 'tu bodega'}. ` +
    `Tu saldo de fiado es ${formatoMoneda(c.saldo)} (límite ${formatoMoneda(c.limiteCredito)}).` +
    (data.movimientos[0] ? ` Último movimiento: ${data.movimientos[0].tipo === 'PAGO' ? 'pago' : 'compra'} de ${formatoMoneda(data.movimientos[0].monto)}.` : '');

  return (
    <Pagina titulo={c.nombre} volver="/clientes">
      <Tarjeta className="flex items-center gap-4 p-4">
        <Avatar texto={iniciales(c.nombre)} className="size-14 bg-primario text-lg text-white" />
        <div className="min-w-0 flex-1">
          <p className="text-lg font-bold">{c.nombre}</p>
          <a href={`tel:+51${c.telefono}`} className="flex items-center gap-1.5 text-tinta-2">
            <Phone className="size-4" aria-hidden /> {c.telefono.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3')}
          </a>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {!c.consentimiento && <Insignia tono="alerta">Sin consentimiento</Insignia>}
            {c.usuarioId ? <Insignia tono="info">Con acceso a su cuenta</Insignia> : null}
            {!c.activo && <Insignia tono="deuda">Desactivado</Insignia>}
          </div>
        </div>
      </Tarjeta>

      <Tarjeta className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <TituloSeccion>Deuda pendiente acumulada</TituloSeccion>
            <p className={`mt-1 text-3xl font-bold ${c.saldo > 0 ? 'text-deuda' : 'text-ok'}`}>
              {c.saldo > 0 ? <>Debe <Moneda valor={c.saldo} /></> : 'Al día'}
            </p>
          </div>
          {uso >= 90 && (
            <span className="flex size-11 items-center justify-center rounded-control border border-[#fecaca] bg-deuda-bg text-deuda" title="Cerca del límite">
              <TriangleAlert className="size-5" aria-hidden />
            </span>
          )}
        </div>
        <div className="mt-3 flex justify-between border-t border-borde pt-3 text-sm">
          <span>
            Límite de fiado: <Moneda valor={c.limiteCredito} />
          </span>
          <span className="font-semibold text-ok">
            Disponible: <Moneda valor={c.disponible} />
          </span>
        </div>
        <BarraUso porcentaje={uso} className="mt-2" />
        <p className="mt-1 text-xs text-tinta-2">Uso de línea de crédito ({uso}%)</p>
      </Tarjeta>

      <div className="grid grid-cols-2 gap-3">
        <Boton tamano="lg" onClick={() => setPagando(true)} disabled={c.saldo <= 0 || !c.activo}>
          <HandCoins className="size-5" aria-hidden /> Registrar pago
        </Boton>
        <Boton tamano="lg" variante="contorno" onClick={() => navegar(`/ventas/nueva?cliente=${c.id}`)} disabled={!c.consentimiento || !c.activo}>
          <ShoppingCart className="size-5" aria-hidden /> Nueva venta fiada
        </Boton>
      </div>

      <Pestanas
        pestanas={[
          { valor: 'cuenta', etiqueta: 'Estado de cuenta', contenido: <MovimientosCuenta movimientos={data.movimientos} /> },
          { valor: 'datos', etiqueta: 'Datos del cliente', contenido: <Datos cliente={c} /> },
        ]}
      />

      <Tarjeta className="flex items-center gap-3 p-4">
        <Share2 className="size-5 text-tinta-2" aria-hidden />
        <span className="flex-1 text-sm">Enviar estado de cuenta por WhatsApp</span>
        <a
          href={enlaceWhatsApp(c.telefono, textoWhatsApp)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-10 items-center rounded-control bg-acento px-4 text-sm font-semibold text-tinta"
        >
          Compartir
        </a>
      </Tarjeta>

      <div className="grid gap-3 md:grid-cols-3">
        <Boton variante="contorno" onClick={() => navegar(`/clientes/${c.id}/editar`)}>
          <Pencil className="size-4" aria-hidden /> Editar datos
        </Boton>
        {!c.usuarioId && (
          <Boton variante="contorno" onClick={() => setDandoAcceso(true)}>
            <KeyRound className="size-4" aria-hidden /> Dar acceso al cliente
          </Boton>
        )}
        {c.activo && (
          <Boton variante="contorno" className="text-deuda" onClick={() => setDesactivando(true)}>
            <UserX className="size-4" aria-hidden /> Desactivar
          </Boton>
        )}
      </div>

      {pagando && <DialogoPago cliente={c} alCerrar={() => setPagando(false)} />}
      {dandoAcceso && <DialogoAcceso cliente={c} alCerrar={() => setDandoAcceso(false)} />}
      {desactivando && <ConfirmarDesactivar cliente={c} alCerrar={() => setDesactivando(false)} />}
    </Pagina>
  );
}

function Datos({ cliente: c }: { cliente: Cliente }) {
  const filas: [string, string][] = [
    ['Nombre', c.nombre],
    ['Teléfono', c.telefono],
    ['DNI', c.dni ?? '—'],
    ['Dirección', c.direccion ?? '—'],
    ['Límite de fiado', formatoMoneda(c.limiteCredito)],
    ['Consentimiento', c.consentimiento ? `Sí${c.fechaConsentimiento ? `, desde el ${new Date(c.fechaConsentimiento).toLocaleDateString('es-PE')}` : ''}` : 'No'],
    ['Acceso a su cuenta', c.usuarioId ? 'Sí' : 'No'],
  ];
  return (
    <Tarjeta className="divide-y divide-borde">
      {filas.map(([k, v]) => (
        <div key={k} className="flex justify-between gap-4 px-4 py-3 text-sm">
          <span className="text-tinta-2">{k}</span>
          <span className="text-right font-semibold">{v}</span>
        </div>
      ))}
    </Tarjeta>
  );
}

function ConfirmarDesactivar({ cliente, alCerrar }: { cliente: Cliente; alCerrar: () => void }) {
  const { desactivar } = useMutacionesCliente();
  const navegar = useNavigate();
  const [error, setError] = useState<string | null>(null);
  return (
    <Dialogo
      abierto
      alCambiar={(v) => !v && alCerrar()}
      titulo="Desactivar cliente"
      descripcion={cliente.nombre}
      pie={
        <div className="flex gap-2">
          <Boton variante="contorno" className="flex-1" onClick={alCerrar}>
            Cancelar
          </Boton>
          <Boton
            variante="peligro"
            className="flex-1"
            cargando={desactivar.isPending}
            onClick={() =>
              desactivar.mutate(cliente.id, {
                onSuccess: () => {
                  toast.success(`${cliente.nombre} fue desactivado.`);
                  navegar('/clientes');
                },
                onError: (e) =>
                  setError(
                    codigoDe(e) === 'CLIENTE_CON_SALDO'
                      ? `No puedes desactivar a un cliente con deuda. Todavía debe ${formatoMoneda(cliente.saldo)}.`
                      : mensajeDeError(e),
                  ),
              })
            }
          >
            Desactivar
          </Boton>
        </div>
      }
    >
      <p className="text-sm text-tinta-2">Ya no aparecerá en la lista ni se le podrá fiar.</p>
      {error && (
        <p role="alert" className="mt-3 rounded-control border border-[#fecaca] bg-deuda-bg p-3 text-sm font-semibold text-deuda">
          {error}
        </p>
      )}
    </Dialogo>
  );
}
