/**
 * Contrato de la API: copia de los esquemas del Anexo de Backend §6.3 más las extensiones v1.2 (E1–E6).
 * No agregar ni renombrar campos sin cambiar también el backend.
 */
export type Rol = 'BODEGUERO' | 'CLIENTE';

export interface LoginRequest {
  username: string;
  password: string;
}
export interface UsuarioSesion {
  id: number;
  username: string;
  rol: Rol;
}
export interface LoginResponse {
  token: string;
  tipo: 'Bearer';
  expiraEn: string; // ISO-8601 UTC
  usuario: UsuarioSesion;
}
export interface UsuarioInput {
  username: string; // minúsculas, único
  password: string; // >=8, letra y dígito
  rol: Rol;
}
export interface Page<T> {
  content: T[];
  page: number; // base 0
  size: number;
  totalElements: number;
  totalPages: number;
}
export type Categoria = 'ABARROTES' | 'LACTEOS' | 'BEBIDAS' | 'LIMPIEZA' | 'OTROS';
export interface Producto {
  id: number;
  nombre: string;
  precio: number;
  costo: number | null; // v1.2 E3
  stock: number;
  stockMinimo: number;
  categoria: Categoria; // v1.2 E3
  codigoBarras: string | null; // v1.2 E3
  activo: boolean;
}
export interface ProductoInput {
  nombre: string; // 2-80
  precio: number; // >0, 2 decimales
  costo?: number | null;
  stock: number; // >=0 (solo alta)
  stockMinimo: number; // >=0
  categoria?: Categoria;
  codigoBarras?: string | null; // 8-14 dígitos
}
export interface AjusteStock {
  delta: number; // entero, no 0
  motivo: string; // 3-120
}
export interface Cliente {
  id: number;
  usuarioId: number | null;
  dni: string | null; // v1.2 E1
  nombre: string;
  telefono: string;
  direccion: string | null; // v1.2 E1
  limiteCredito: number;
  saldo: number;
  disponible: number; // limite - saldo
  consentimiento: boolean;
  fechaConsentimiento: string | null;
  activo: boolean;
}
export interface ClienteInput {
  nombre: string; // 2-80
  telefono: string; // 9 dígitos, empieza en 9
  limiteCredito: number; // >=0
  consentimiento: boolean;
  usuarioId?: number | null;
  dni?: string | null;
  direccion?: string | null;
}
export interface ClienteResumen {
  totalClientes: number;
  clientesConDeuda: number;
  deudaTotal: number;
}
export type MetodoPago = 'EFECTIVO' | 'YAPE_PLIN' | 'TRANSFERENCIA';
export interface PagoInput {
  monto: number; // >0 y <= saldo
  metodo: MetodoPago; // v1.2 E2
}
export interface Pago {
  id: number;
  clienteId: number;
  monto: number;
  metodo: MetodoPago;
  fecha: string;
  saldoDespues: number;
}
export interface Movimiento {
  tipo: 'CARGO' | 'PAGO' | 'ANULACION';
  fecha: string;
  monto: number;
  ventaId: number | null;
  saldoDespues: number;
  descripcion: string | null; // v1.2 E6
  cantidadItems: number | null; // v1.2 E6
  metodoPago: MetodoPago | null; // v1.2 E2
}
export interface EstadoCuenta {
  cliente: Cliente;
  movimientos: Movimiento[]; // más reciente primero
}
export interface ItemInput {
  productoId: number;
  cantidad: number; // 1-999
}
export type TipoPago = 'CONTADO' | 'FIADO';
export type EstadoVenta = 'PENDIENTE' | 'CONFIRMADA' | 'RECHAZADA';
export interface VentaInput {
  clienteId: number | null; // null si CONTADO
  tipoPago: TipoPago;
  items: ItemInput[]; // 1-50
}
export interface DetalleVenta {
  productoId: number;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}
export interface Venta {
  id: number;
  clienteId: number | null;
  clienteNombre: string | null;
  tipoPago: TipoPago;
  estado: EstadoVenta;
  total: number;
  motivoRechazo: string | null;
  fecha: string;
  items: DetalleVenta[];
}
/** v1.2 E4: unión por tipo. */
export type Alerta =
  | {
      id: string; // eventId
      tipo: 'STOCK_BAJO';
      nombre: string;
      ocurridoEn: string;
      productoId: number;
      stock: number;
      stockMinimo: number;
    }
  | {
      id: string;
      tipo: 'LIMITE_CLIENTE';
      nombre: string;
      ocurridoEn: string;
      clienteId: number;
      saldo: number;
      limiteCredito: number;
    };
export interface ReposicionInput {
  productoId: number;
  cantidad: number; // 1-9999
}
export interface Reposicion {
  id: number;
  productoId: number;
  productoNombre: string;
  cantidad: number;
  nroPedido: string;
  fechaEstimada: string;
  recibida: boolean;
}
export interface CatalogoItem {
  codigo: string; // "P" + id con 4 dígitos
  nombre: string;
  precio: number;
  disponible: number;
}
export interface ResumenVentas {
  desde: string; // yyyy-MM-dd
  hasta: string;
  totalVentas: number;
  montoTotal: number;
  porDia: { fecha: string; cantidad: number; monto: number }[];
  topProductos: { productoId: number; nombre: string; cantidad: number; monto: number }[];
}
/** v1.2 E5 */
export interface Bodega {
  nombre: string;
  telefono: string;
  direccion: string;
}
export interface ApiError {
  type: string;
  title: string;
  status: number;
  detail: string;
  code: string;
  errors?: { campo: string; mensaje: string }[];
  extra?: Record<string, unknown>; // saldo, limite, disponible, productoId, nombre...
}
