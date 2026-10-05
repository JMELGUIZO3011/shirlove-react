// Tipos del Módulo USA. Todo en USD y completamente separado de los tipos
// de ventas/inventario de Colombia (types/venta.ts, types/inventario.ts).

export interface UsaEstado {
  password_configurada: boolean
  acceso_valido: boolean
  metodos_pago: string[]
}

export interface UsaAcceso {
  usa_token: string
  expira_en: string
}

export interface UsaProducto {
  id: number
  nombre: string
  precio_venta: number
  costo: number
  activo: boolean
  cantidad: number
}

export interface UsaProductoPayload {
  nombre: string
  precio_venta: number
  costo: number
  cantidad_inicial?: number
}

export interface UsaProductoUpdate {
  nombre?: string
  precio_venta?: number
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

export type UsaTipoMovimiento = 'entrada' | 'ajuste' | 'venta' | 'devolucion'

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
}

export interface UsaAbono {
  id: number
  monto: number
  metodo_pago: string
  fecha: string
  notas: string | null
  usuario_nombre: string | null
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
}

export interface UsaVentaPayload {
  fecha?: string
  cliente_nombre?: string | null
  metodo_pago?: string // no aplica en ventas a crédito
  notas?: string | null
  items: UsaVentaItemPayload[]
  a_credito?: boolean
  fecha_vencimiento?: string | null
  abono_inicial?: number | null
  metodo_abono_inicial?: string | null
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
}

export function usaCartItemSubtotal(item: UsaCartItem): number {
  return Math.round(item.precioUnitario * item.cantidad * 100) / 100
}
