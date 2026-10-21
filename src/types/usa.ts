// Tipos del Módulo USA. Todo en USD y completamente separado de los tipos
// de ventas/inventario de Colombia (types/venta.ts, types/inventario.ts).

export interface UsaEstado {
  password_configurada: boolean
  acceso_valido: boolean
  metodos_pago: string[]
  listas_precios: string[]
}

// ---- Listas de precios de los productos USA ----
// Misma idea que los tipos de precio de Colombia (Particular, Mayorista, Estilista,
// Beauty Boss), pero cada lista es una columna del producto USA. Particular es el
// precio al público y la lista por defecto del punto de venta.

export type UsaListaPrecio = 'Particular' | 'Mayorista' | 'Estilista' | 'Beauty Boss'

export type UsaCampoPrecio = 'precio_venta' | 'precio_mayorista' | 'precio_estilista' | 'precio_beauty_boss'

export const USA_LISTAS_PRECIOS: { nombre: UsaListaPrecio; campo: UsaCampoPrecio; corto: string }[] = [
  { nombre: 'Particular', campo: 'precio_venta', corto: 'Part.' },
  { nombre: 'Mayorista', campo: 'precio_mayorista', corto: 'May.' },
  { nombre: 'Estilista', campo: 'precio_estilista', corto: 'Est.' },
  { nombre: 'Beauty Boss', campo: 'precio_beauty_boss', corto: 'B. Boss' },
]

export const USA_LISTA_DEFAULT: UsaListaPrecio = 'Particular'

/** Precio del producto en una lista, o null si esa lista no tiene precio definido. */
export function usaPrecioEnLista(p: UsaProducto, lista: UsaListaPrecio): number | null {
  const def = USA_LISTAS_PRECIOS.find((l) => l.nombre === lista)
  if (!def) return null
  const valor = p[def.campo]
  return typeof valor === 'number' && Number.isFinite(valor) ? valor : null
}

export interface UsaAcceso {
  usa_token: string
  expira_en: string
}

export interface UsaProducto {
  id: number
  nombre: string
  precio_venta: number // lista Particular (precio al público)
  precio_mayorista: number | null
  precio_estilista: number | null
  precio_beauty_boss: number | null
  costo: number
  activo: boolean
  cantidad: number
}

export interface UsaProductoPayload {
  nombre: string
  precio_venta: number
  precio_mayorista?: number | null
  precio_estilista?: number | null
  precio_beauty_boss?: number | null
  costo: number
  cantidad_inicial?: number
}

export interface UsaProductoUpdate {
  nombre?: string
  precio_venta?: number
  // null vacía la lista; undefined la deja como está
  precio_mayorista?: number | null
  precio_estilista?: number | null
  precio_beauty_boss?: number | null
  costo?: number
  activo?: boolean
}

export interface UsaServicio {
  id: number
  categoria: string
  nombre: string
  precio: number
  activo: boolean
}

export interface UsaServicioPayload {
  categoria: string
  nombre: string
  precio: number
}

export interface UsaServicioUpdate {
  categoria?: string
  nombre?: string
  precio?: number
  activo?: boolean
}

export type UsaTipoMovimiento = 'entrada' | 'ajuste' | 'venta' | 'devolucion' | 'consumo'

export interface UsaMovimiento {
  id: number
  producto_id: number
  producto_nombre: string
  tipo: UsaTipoMovimiento
  cantidad: number
  cantidad_resultante: number
  fecha: string
  observaciones: string | null
  venta_id: number | null
  usuario_nombre: string | null
}

export interface UsaStockPayload {
  producto_id: number
  cantidad: number
  observaciones?: string | null
}

export type UsaTipoItem = 'producto' | 'servicio'

export interface UsaVentaItem {
  id: number
  tipo: UsaTipoItem
  producto_id: number | null
  servicio_id: number | null
  descripcion: string
  cantidad: number
  precio_unitario: number
  costo_unitario: number
  subtotal: number
  lista_precio: string | null // Particular | Mayorista | Estilista | Beauty Boss (solo productos)
}

export interface UsaAbono {
  id: number
  monto: number
  metodo_pago: string
  fecha: string
  notas: string | null
  usuario_nombre: string | null
  es_pago_inicial: boolean // recibido con la venta (pago mixto) vs cobro posterior
}

export interface UsaTip {
  id: number
  venta_id: number | null
  cliente_nombre: string | null
  monto: number
  metodo_pago: string
  para: string | null
  fecha: string
  notas: string | null
  usuario_nombre: string | null
}

export interface UsaTipPayload {
  venta_id?: number | null
  monto: number
  metodo_pago: string
  para?: string | null
  fecha?: string
  notas?: string | null
}

// Edición de una propina: solo se envían (y cambian) los campos definidos.
export interface UsaTipUpdatePayload {
  venta_id?: number | null
  monto?: number
  metodo_pago?: string
  para?: string | null
  fecha?: string
  notas?: string | null
}

export interface UsaConsumo {
  id: number
  producto_id: number
  producto_nombre: string
  cantidad: number
  motivo: string
  costo_unitario: number
  costo_total: number
  fecha: string
  notas: string | null
  usuario_nombre: string | null
}

export interface UsaConsumoPayload {
  producto_id: number
  cantidad: number
  motivo: string
  fecha?: string
  notas?: string | null
}

export interface UsaPagoPayload {
  metodo_pago: string
  monto: number
}

export interface UsaVenta {
  id: number
  fecha: string
  cliente_nombre: string | null
  metodo_pago: string // "Crédito" en ventas a crédito
  total: number
  notas: string | null
  usuario_nombre: string | null
  anulada: boolean
  fecha_anulacion: string | null
  motivo_anulacion: string | null
  items: UsaVentaItem[]
  // Crédito / cuentas por cobrar
  a_credito: boolean
  saldo_pendiente: number
  abonado: number
  fecha_vencimiento: string | null // YYYY-MM-DD
  fecha_pago_total: string | null
  dias_vencida: number
  abonos: UsaAbono[]
  tips: UsaTip[]
  tips_total: number
}

export interface UsaVentaUpdatePayload {
  cliente_nombre?: string | null
  fecha?: string
  notas?: string | null
  fecha_vencimiento?: string | null
}

export interface UsaAbonoPayload {
  monto: number
  metodo_pago: string
  fecha?: string
  notas?: string | null
}

export interface UsaVentaItemPayload {
  tipo: UsaTipoItem
  producto_id?: number
  servicio_id?: number
  cantidad: number
  precio_unitario: number
  lista_precio?: UsaListaPrecio // solo productos
}

export interface UsaVentaPayload {
  fecha?: string
  cliente_nombre?: string | null
  notas?: string | null
  items: UsaVentaItemPayload[]
  // Pagos mixtos: si la suma es menor al total, el resto queda a crédito.
  pagos: UsaPagoPayload[]
  fecha_vencimiento?: string | null
  tips?: Omit<UsaTipPayload, 'venta_id' | 'fecha'>[]
}

export interface UsaResumen {
  numero_ventas: number
  ingresos: number
  ingresos_productos: number
  ingresos_servicios: number
  costo_productos: number
  ganancia_bruta: number
  unidades_vendidas: number
  servicios_prestados: number
  ventas_credito: number
  por_cobrar: number
  cobrado_credito: number
  por_metodo_pago: { metodo_pago: string; ventas: number; monto: number }[]
  tips_total: number
  tips_cantidad: number
  tips_por_metodo: { metodo_pago: string; cantidad: number; monto: number }[]
  tips_por_persona: { para: string; cantidad: number; monto: number }[]
  insumos_costo: number
  insumos_unidades: number
  ganancia_neta: number
  top_productos: { nombre: string; cantidad: number; monto: number }[]
  top_servicios: { nombre: string; cantidad: number; monto: number }[]
}

// ---- Carrito del punto de venta USA (estado local) ----

export interface UsaCartItem {
  uid: string
  tipo: UsaTipoItem
  producto?: UsaProducto
  servicio?: UsaServicio
  descripcion: string
  cantidad: number
  precioUnitario: number
  listaPrecio?: UsaListaPrecio // solo productos
}

export function usaCartItemSubtotal(item: UsaCartItem): number {
  return Math.round(item.precioUnitario * item.cantidad * 100) / 100
}
