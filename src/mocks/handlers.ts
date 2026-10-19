import { delay, http, HttpResponse } from 'msw';
import type { Alerta, ApiError, Cliente, ClienteInput, Page, PagoInput, ProductoInput, Venta, VentaInput } from '@/api/tipos';
import { db } from './datos';

/**
 * Handlers MSW para todas las rutas del contrato (Especificación §6.1 y §10.1). Disparadores deterministas:
 * contraseña ≠ Demo12345 → 401; producto 99 → stock insuficiente; FIADO sobre el disponible → límite;
 * cliente 77 → 503; misma Idempotency-Key → misma venta; pago mayor al saldo → 409;
 * localStorage.mockSoapCaido=1 → catálogo 503; el stream SSE envía una alerta a los 10 s.
 */
const API = '*/api';

const problema = (status: number, code: string, detail = '', extra?: Record<string, unknown>, errors?: ApiError['errors']) =>
  HttpResponse.json<ApiError>(
    { type: `https://fiadoya.local/errors/${code.toLowerCase()}`, title: code, status, detail, code, extra, errors },
    { status, headers: { 'Content-Type': 'application/problem+json' } },
  );

function pagina<T>(lista: T[], url: URL): Page<T> {
  const page = Number(url.searchParams.get('page') ?? 0);
  const size = Math.min(100, Number(url.searchParams.get('size') ?? 20));
  return {
    content: lista.slice(page * size, page * size + size),
    page,
    size,
    totalElements: lista.length,
    totalPages: Math.max(1, Math.ceil(lista.length / size)),
  };
}

const redondear = (n: number) => Math.round(n * 100) / 100;
const conDisponible = (c: Cliente): Cliente => ({ ...c, disponible: Math.max(0, redondear(c.limiteCredito - c.saldo)) });
const usuarioDe = (req: Request) => {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  return token ? db.usuarios.find((u) => `mock.${u.id}` === token) : undefined;
};

function exigir(req: Request, rol?: 'BODEGUERO' | 'CLIENTE') {
  const u = usuarioDe(req);
  if (!u) return problema(401, 'AUTH_TOKEN_EXPIRED', 'Token ausente');
  if (rol && u.rol !== rol) return problema(403, 'AUTH_FORBIDDEN');
  return null;
}

export const handlers = [
  // ---------- auth ----------
  http.post(`${API}/auth/login`, async ({ request }) => {
    await delay(200);
    const { username, password } = (await request.json()) as { username: string; password: string };
    const u = db.usuarios.find((x) => x.username === username.toLowerCase());
    if (!u || password !== u.password) return problema(401, 'AUTH_INVALID_CREDENTIALS');
    return HttpResponse.json({
      token: `mock.${u.id}`,
      tipo: 'Bearer',
      expiraEn: new Date(Date.now() + 8 * 3600_000).toISOString(),
      usuario: { id: u.id, username: u.username, rol: u.rol },
    });
  }),
  http.get(`${API}/auth/me`, ({ request }) => {
    const u = usuarioDe(request);
    return u ? HttpResponse.json({ id: u.id, username: u.username, rol: u.rol }) : problema(401, 'AUTH_TOKEN_EXPIRED');
  }),
  http.post(`${API}/auth/usuarios`, async ({ request }) => {
    const e = exigir(request, 'BODEGUERO');
    if (e) return e;
    const b = (await request.json()) as { username: string; password: string; rol: 'CLIENTE' | 'BODEGUERO' };
    if (db.usuarios.some((u) => u.username === b.username)) return problema(409, 'USERNAME_DUPLICADO');
    const nuevo = { id: db.usuarios.length + 10, username: b.username, rol: b.rol, password: b.password };
    db.usuarios.push(nuevo);
    return HttpResponse.json({ id: nuevo.id, username: nuevo.username, rol: nuevo.rol }, { status: 201 });
  }),
  http.get(`${API}/bodega`, ({ request }) => exigir(request) ?? HttpResponse.json({ nombre: 'Bodega Don Carlos', telefono: '987112233', direccion: 'Jr. Áncash 412' })),

  // ---------- productos ----------
  http.get(`${API}/productos`, ({ request }) => {
    const e = exigir(request, 'BODEGUERO');
    if (e) return e;
    const url = new URL(request.url);
    const q = url.searchParams.get('q')?.toLowerCase();
    const bajos = url.searchParams.get('soloBajos') === 'true';
    let lista = db.productos.filter((p) => p.activo);
    if (q) lista = lista.filter((p) => p.nombre.toLowerCase().includes(q) || p.codigoBarras?.includes(q));
    if (bajos) lista = lista.filter((p) => p.stock <= p.stockMinimo);
    lista = [...lista].sort((a, b) => a.nombre.localeCompare(b.nombre));
    return HttpResponse.json(pagina(lista, url));
  }),
  http.get(`${API}/productos/:id`, ({ request, params }) => {
    const e = exigir(request, 'BODEGUERO');
    if (e) return e;
    const p = db.productos.find((x) => x.id === Number(params.id));
    return p ? HttpResponse.json(p) : problema(404, 'NOT_FOUND');
  }),
  http.post(`${API}/productos`, async ({ request }) => {
    const e = exigir(request, 'BODEGUERO');
    if (e) return e;
    const b = (await request.json()) as ProductoInput;
    const nuevo = { id: Math.max(...db.productos.map((p) => p.id)) + 1, nombre: b.nombre, precio: b.precio, costo: b.costo ?? null, stock: b.stock, stockMinimo: b.stockMinimo, categoria: b.categoria ?? 'OTROS', codigoBarras: b.codigoBarras ?? null, activo: true };
    db.productos.push(nuevo);
    return HttpResponse.json(nuevo, { status: 201 });
  }),
  http.put(`${API}/productos/:id`, async ({ request, params }) => {
    const e = exigir(request, 'BODEGUERO');
    if (e) return e;
    const b = (await request.json()) as ProductoInput;
    const p = db.productos.find((x) => x.id === Number(params.id));
    if (!p) return problema(404, 'NOT_FOUND');
    Object.assign(p, { nombre: b.nombre, precio: b.precio, costo: b.costo ?? null, stockMinimo: b.stockMinimo, categoria: b.categoria ?? p.categoria, codigoBarras: b.codigoBarras ?? null });
    return HttpResponse.json(p);
  }),
  http.delete(`${API}/productos/:id`, ({ request, params }) => {
    const e = exigir(request, 'BODEGUERO');
    if (e) return e;
    const p = db.productos.find((x) => x.id === Number(params.id));
    if (p) p.activo = false;
    return new HttpResponse(null, { status: 204 });
  }),
  http.post(`${API}/productos/:id/ajuste`, async ({ request, params }) => {
    const e = exigir(request, 'BODEGUERO');
    if (e) return e;
    const b = (await request.json()) as { delta: number; motivo: string };
    const p = db.productos.find((x) => x.id === Number(params.id));
    if (!p) return problema(404, 'NOT_FOUND');
    if (p.stock + b.delta < 0) return problema(400, 'VALIDATION_ERROR', '', undefined, [{ campo: 'delta', mensaje: `dejaría el stock en negativo (stock actual ${p.stock})` }]);
    p.stock += b.delta;
    return HttpResponse.json(p);
  }),

  // ---------- clientes ----------
  http.get(`${API}/clientes`, ({ request }) => {
    const e = exigir(request, 'BODEGUERO');
    if (e) return e;
    const url = new URL(request.url);
    const q = url.searchParams.get('q')?.toLowerCase();
    const orden = url.searchParams.get('orden');
    let lista = db.clientes.filter((c) => c.activo);
    if (q) lista = lista.filter((c) => c.nombre.toLowerCase().includes(q) || c.telefono.includes(q) || c.dni?.includes(q));
    if (url.searchParams.get('conDeuda') === 'true') lista = lista.filter((c) => c.saldo > 0);
    lista = [...lista].sort((a, b) => (orden === 'deuda' ? b.saldo - a.saldo : orden === 'nombre' ? a.nombre.localeCompare(b.nombre) : b.id - a.id));
    return HttpResponse.json(pagina(lista.map(conDisponible), url));
  }),
  http.get(`${API}/clientes/resumen`, ({ request }) => {
    const e = exigir(request, 'BODEGUERO');
    if (e) return e;
    const activos = db.clientes.filter((c) => c.activo);
    return HttpResponse.json({
      totalClientes: activos.length,
      clientesConDeuda: activos.filter((c) => c.saldo > 0).length,
      deudaTotal: redondear(activos.reduce((s, c) => s + c.saldo, 0)),
    });
  }),
  http.get(`${API}/clientes/mi-cuenta`, ({ request }) => {
    const e = exigir(request, 'CLIENTE');
    if (e) return e;
    const u = usuarioDe(request)!;
    const c = db.clientes.find((x) => x.usuarioId === u.id);
    if (!c) return problema(404, 'NOT_FOUND');
    return HttpResponse.json({ cliente: conDisponible(c), movimientos: db.movimientos.get(c.id) ?? [] });
  }),
  http.get(`${API}/clientes/:id`, ({ request, params }) => {
    const e = exigir(request, 'BODEGUERO');
    if (e) return e;
    const c = db.clientes.find((x) => x.id === Number(params.id));
    return c ? HttpResponse.json(conDisponible(c)) : problema(404, 'NOT_FOUND');
  }),
  http.get(`${API}/clientes/:id/estado-cuenta`, ({ request, params }) => {
    const e = exigir(request, 'BODEGUERO');
    if (e) return e;
    const c = db.clientes.find((x) => x.id === Number(params.id));
    if (!c) return problema(404, 'NOT_FOUND');
    return HttpResponse.json({ cliente: conDisponible(c), movimientos: db.movimientos.get(c.id) ?? [] });
  }),
  http.post(`${API}/clientes`, async ({ request }) => {
    const e = exigir(request, 'BODEGUERO');
    if (e) return e;
    const b = (await request.json()) as ClienteInput;
    if (b.dni && db.clientes.some((c) => c.dni === b.dni)) return problema(409, 'DNI_DUPLICADO');
    const nuevo: Cliente = {
      id: Math.max(...db.clientes.filter((c) => c.id < 77).map((c) => c.id)) + 1,
      usuarioId: b.usuarioId ?? null, dni: b.dni ?? null, nombre: b.nombre, telefono: b.telefono, direccion: b.direccion ?? null,
      limiteCredito: b.limiteCredito, saldo: 0, disponible: b.limiteCredito, consentimiento: b.consentimiento,
      fechaConsentimiento: b.consentimiento ? new Date().toISOString() : null, activo: true,
    };
    db.clientes.push(nuevo);
    return HttpResponse.json(nuevo, { status: 201 });
  }),
  http.put(`${API}/clientes/:id`, async ({ request, params }) => {
    const e = exigir(request, 'BODEGUERO');
    if (e) return e;
    const b = (await request.json()) as ClienteInput;
    const c = db.clientes.find((x) => x.id === Number(params.id));
    if (!c) return problema(404, 'NOT_FOUND');
    Object.assign(c, {
      nombre: b.nombre, telefono: b.telefono, limiteCredito: b.limiteCredito, dni: b.dni ?? null, direccion: b.direccion ?? null,
      usuarioId: b.usuarioId ?? null,
      fechaConsentimiento: b.consentimiento ? (c.fechaConsentimiento ?? new Date().toISOString()) : null,
      consentimiento: b.consentimiento,
    });
    return HttpResponse.json(conDisponible(c));
  }),
  http.delete(`${API}/clientes/:id`, ({ request, params }) => {
    const e = exigir(request, 'BODEGUERO');
    if (e) return e;
    const c = db.clientes.find((x) => x.id === Number(params.id));
    if (!c) return problema(404, 'NOT_FOUND');
    if (c.saldo > 0) return problema(409, 'CLIENTE_CON_SALDO', '', { saldo: c.saldo });
    c.activo = false;
    return new HttpResponse(null, { status: 204 });
  }),
  http.post(`${API}/clientes/:id/pagos`, async ({ request, params }) => {
    const e = exigir(request, 'BODEGUERO');
    if (e) return e;
    const b = (await request.json()) as PagoInput;
    const c = db.clientes.find((x) => x.id === Number(params.id));
    if (!c) return problema(404, 'NOT_FOUND');
    if (b.monto > c.saldo) return problema(409, 'PAGO_EXCEDE_SALDO', '', { saldo: c.saldo, monto: b.monto });
    c.saldo = redondear(c.saldo - b.monto);
    const fecha = new Date().toISOString();
    db.movimientos.set(c.id, [{ tipo: 'PAGO', fecha, monto: b.monto, ventaId: null, saldoDespues: c.saldo, descripcion: null, cantidadItems: null, metodoPago: b.metodo }, ...(db.movimientos.get(c.id) ?? [])]);
    return HttpResponse.json({ id: Date.now(), clienteId: c.id, monto: b.monto, metodo: b.metodo, fecha, saldoDespues: c.saldo }, { status: 201 });
  }),

  // ---------- ventas ----------
  http.post(`${API}/ventas`, async ({ request }) => {
    const e = exigir(request, 'BODEGUERO');
    if (e) return e;
    await delay(300);
    const clave = request.headers.get('Idempotency-Key') ?? '';
    const b = (await request.json()) as VentaInput;
    const hash = JSON.stringify(b);
    const previa = db.ventasPorClave.get(clave);
    if (previa) return previa.hash === hash ? HttpResponse.json(previa.venta, { status: 201 }) : problema(409, 'IDEMPOTENCY_CONFLICT');
    if (b.clienteId === 77) return problema(503, 'SERVICIO_NO_DISPONIBLE', '', { servicio: 'clientes' });
    for (const i of b.items) {
      const p = db.productos.find((x) => x.id === i.productoId)!;
      if (p.stock < i.cantidad) return problema(409, 'PRODUCTO_STOCK_INSUFICIENTE', '', { productoId: p.id, nombre: p.nombre, disponible: p.stock, solicitado: i.cantidad });
    }
    const items = b.items.map((i) => {
      const p = db.productos.find((x) => x.id === i.productoId)!;
      return { productoId: p.id, nombre: p.nombre, cantidad: i.cantidad, precioUnitario: p.precio, subtotal: redondear(p.precio * i.cantidad) };
    });
    const total = redondear(items.reduce((s, i) => s + i.subtotal, 0));
    const cliente = b.clienteId ? db.clientes.find((c) => c.id === b.clienteId) : undefined;
    const id = db.siguienteVenta++;
    if (b.tipoPago === 'FIADO' && cliente) {
      if (!cliente.consentimiento) return problema(409, 'CLIENTE_SIN_CONSENTIMIENTO');
      if (cliente.saldo + total > cliente.limiteCredito) {
        const rechazada: Venta = { id, clienteId: cliente.id, clienteNombre: cliente.nombre, tipoPago: 'FIADO', estado: 'RECHAZADA', total, motivoRechazo: `Supera el límite de crédito. Disponible: S/ ${(cliente.limiteCredito - cliente.saldo).toFixed(2)}`, fecha: new Date().toISOString(), items };
        db.ventas.unshift(rechazada);
        return problema(409, 'CLIENTE_LIMITE_EXCEDIDO', 'El cliente supera su límite.', { saldo: cliente.saldo, limite: cliente.limiteCredito, monto: total, disponible: redondear(cliente.limiteCredito - cliente.saldo), ventaId: id });
      }
    }
    const alertas: Alerta[] = [];
    b.items.forEach((i) => {
      const p = db.productos.find((x) => x.id === i.productoId)!;
      const antes = p.stock;
      p.stock -= i.cantidad;
      if (antes > p.stockMinimo && p.stock <= p.stockMinimo) alertas.push({ id: crypto.randomUUID(), tipo: 'STOCK_BAJO', nombre: p.nombre, ocurridoEn: new Date().toISOString(), productoId: p.id, stock: p.stock, stockMinimo: p.stockMinimo });
    });
    db.alertas.unshift(...alertas);
    if (b.tipoPago === 'FIADO' && cliente) {
      cliente.saldo = redondear(cliente.saldo + total);
      db.movimientos.set(cliente.id, [{ tipo: 'CARGO', fecha: new Date().toISOString(), monto: total, ventaId: id, saldoDespues: cliente.saldo, descripcion: items.slice(0, 3).map((i) => i.nombre).join(', '), cantidadItems: items.length, metodoPago: null }, ...(db.movimientos.get(cliente.id) ?? [])]);
    }
    const venta: Venta = { id, clienteId: cliente?.id ?? null, clienteNombre: cliente?.nombre ?? null, tipoPago: b.tipoPago, estado: 'CONFIRMADA', total, motivoRechazo: null, fecha: new Date().toISOString(), items };
    db.ventas.unshift(venta);
    db.ventasPorClave.set(clave, { hash, venta });
    return HttpResponse.json(venta, { status: 201 });
  }),
  http.get(`${API}/ventas`, ({ request }) => {
    const e = exigir(request, 'BODEGUERO');
    if (e) return e;
    const url = new URL(request.url);
    const estado = url.searchParams.get('estado');
    const cliente = url.searchParams.get('clienteId');
    let lista = db.ventas;
    if (estado) lista = lista.filter((v) => v.estado === estado);
    if (cliente) lista = lista.filter((v) => v.clienteId === Number(cliente));
    return HttpResponse.json(pagina(lista, url));
  }),
  http.get(`${API}/ventas/:id`, ({ request, params }) => {
    const e = exigir(request, 'BODEGUERO');
    if (e) return e;
    const v = db.ventas.find((x) => x.id === Number(params.id));
    return v ? HttpResponse.json(v) : problema(404, 'NOT_FOUND');
  }),

  // ---------- alertas ----------
  http.get(`${API}/alertas`, ({ request }) => exigir(request, 'BODEGUERO') ?? HttpResponse.json(db.alertas.slice(0, 50))),
  http.get(`${API}/alertas/stream`, ({ request }) => {
    const e = exigir(request, 'BODEGUERO');
    if (e) return e;
    const cod = new TextEncoder();
    let temporizador: ReturnType<typeof setTimeout>;
    const stream = new ReadableStream({
      start(ctrl) {
        ctrl.enqueue(cod.encode(': conectado\n\n'));
        temporizador = setTimeout(() => {
          const alerta: Alerta = { id: crypto.randomUUID(), tipo: 'STOCK_BAJO', nombre: 'Leche evaporada 400 g', ocurridoEn: new Date().toISOString(), productoId: 5, stock: 3, stockMinimo: 5 };
          db.alertas.unshift(alerta);
          ctrl.enqueue(cod.encode(`event: alerta\nid: ${alerta.id}\ndata: ${JSON.stringify(alerta)}\n\n`));
        }, 10_000);
      },
      cancel() {
        clearTimeout(temporizador);
      },
    });
    return new HttpResponse(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } });
  }),

  // ---------- reposiciones ----------
  http.get(`${API}/reposiciones`, ({ request }) => exigir(request, 'BODEGUERO') ?? HttpResponse.json(pagina(db.reposiciones, new URL(request.url)))),
  http.get(`${API}/reposiciones/catalogo`, ({ request }) => {
    const e = exigir(request, 'BODEGUERO');
    if (e) return e;
    if (typeof localStorage !== 'undefined' && localStorage.getItem('mockSoapCaido') === '1') return problema(503, 'SERVICIO_NO_DISPONIBLE', '', { servicio: 'distribuidora' });
    return HttpResponse.json(db.productos.filter((p) => p.id < 99).map((p) => ({ codigo: `P${String(p.id).padStart(4, '0')}`, nombre: p.nombre, precio: p.costo ?? redondear(p.precio * 0.85), disponible: 200 })));
  }),
  http.post(`${API}/reposiciones`, async ({ request }) => {
    const e = exigir(request, 'BODEGUERO');
    if (e) return e;
    if (typeof localStorage !== 'undefined' && localStorage.getItem('mockSoapCaido') === '1') return problema(503, 'SERVICIO_NO_DISPONIBLE');
    const b = (await request.json()) as { productoId: number; cantidad: number };
    const p = db.productos.find((x) => x.id === b.productoId)!;
    const fecha = new Date(Date.now() + 2 * 86_400_000).toISOString().slice(0, 10);
    const r = { id: db.reposiciones.length + 1, productoId: p.id, productoNombre: p.nombre, cantidad: b.cantidad, nroPedido: `PD-2026-${String(db.reposiciones.length + 1).padStart(5, '0')}`, fechaEstimada: fecha, recibida: false };
    db.reposiciones.unshift(r);
    return HttpResponse.json(r, { status: 201 });
  }),
  http.post(`${API}/reposiciones/:id/recibir`, ({ request, params }) => {
    const e = exigir(request, 'BODEGUERO');
    if (e) return e;
    const r = db.reposiciones.find((x) => x.id === Number(params.id));
    if (!r) return problema(404, 'NOT_FOUND');
    if (!r.recibida) {
      r.recibida = true;
      db.productos.find((p) => p.id === r.productoId)!.stock += r.cantidad;
    }
    return HttpResponse.json(r);
  }),

  // ---------- reportes ----------
  http.get(`${API}/reportes/deudores.pdf`, ({ request }) =>
    exigir(request, 'BODEGUERO') ??
    new HttpResponse(new Blob(['%PDF-1.4 demo'], { type: 'application/pdf' }), { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="deudores-demo.pdf"' } }),
  ),
  http.get(`${API}/reportes/deudores.xlsx`, ({ request }) =>
    exigir(request, 'BODEGUERO') ??
    new HttpResponse(new Blob(['xlsx demo']), { headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': 'attachment; filename="deudores-demo.xlsx"' } }),
  ),
  http.get(`${API}/reportes/consolidado`, ({ request }) => {
    const e = exigir(request, 'BODEGUERO');
    if (e) return e;
    const comparar = new URL(request.url).searchParams.get('comparar') === 'true';
    const headers: Record<string, string> = { 'Content-Type': 'application/zip', 'Content-Disposition': 'attachment; filename="reportes-demo.zip"', 'X-Tiempo-Paralelo-Ms': '420' };
    if (comparar) headers['X-Tiempo-Secuencial-Ms'] = '1180';
    return new HttpResponse(new Blob(['zip demo']), { headers });
  }),
  http.get(`${API}/reportes/ventas/resumen`, ({ request }) => {
    const e = exigir(request, 'BODEGUERO');
    if (e) return e;
    const url = new URL(request.url);
    const desde = url.searchParams.get('desde')!;
    const hasta = url.searchParams.get('hasta')!;
    const dias: { fecha: string; cantidad: number; monto: number }[] = [];
    for (let d = new Date(`${desde}T12:00:00Z`); d <= new Date(`${hasta}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + 1)) {
      const n = (d.getUTCDate() * 7) % 13;
      dias.push({ fecha: d.toISOString().slice(0, 10), cantidad: n + 5, monto: redondear((n + 5) * 17.3) });
    }
    return HttpResponse.json({
      desde, hasta,
      totalVentas: dias.reduce((s, d) => s + d.cantidad, 0),
      montoTotal: redondear(dias.reduce((s, d) => s + d.monto, 0)),
      porDia: dias,
      topProductos: db.productos.slice(0, 5).map((p, i) => ({ productoId: p.id, nombre: p.nombre, cantidad: 40 - i * 5, monto: redondear((40 - i * 5) * p.precio) })),
    });
  }),
];
