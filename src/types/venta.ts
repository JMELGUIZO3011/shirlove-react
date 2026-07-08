// Catálogos y tipos del punto de venta (equivalente a venta_model.dart,
// inventario_model.dart y combo_model.dart).

export interface TipoPrecio {
  id: number
  nombre: string
}

export interface Pais {
  id: number
  nombre: string
}

export interface Precio {
  id: number
  producto_id: number
  tipo_precio_id: number
  pais_id: number
  precio: number
  tipo_precio: TipoPrecio
  pais: Pais
}

export interface Producto {
  id: number
  nombre: string
  precios: Precio[]
}

export interface Bodega {
  id: number
  nombre: string
  paisId: number // derivado (el backend no lo envía)
}

export interface Servicio {
  id: number
  categoria: string
  nombre: string
}

export interface Estilista {
  id: number
  nombre: string
}

export interface MetodoPago {
  id: number
  nombre: string
}

export interface ComboProducto {
  id?: number
  producto_id: number
  producto_nombre: string
  cantidad: number
}

export interface Combo {
  id: number
  nombre: string
  descripcion: string | null
  precio: number
  activo: boolean
  productos: ComboProducto[]
}

// El backend no envía pais_id en /bodegas; se deriva por el nombre (igual que Flutter).
export function mapBodega(raw: { id: number; nombre: string; pais_id?: number }): Bodega {
  return {
    id: raw.id,
    nombre: raw.nombre,
    paisId: raw.pais_id ?? (raw.nombre.toLowerCase().includes('usa') ? 2 : 1),
  }
}

// ---- Items del carrito (estado local del POS) ----

export interface CartProducto {
  tipo: 'producto'
  uid: string
  producto: Producto
  tipoPrecio: TipoPrecio
  cantidad: number
  descuento: number // %
  precioUnitario: number // ya con descuento aplicado
  bodegaId: number
}

export interface CartServicio {
  tipo: 'servicio'
  uid: string
  servicio: Servicio
  estilista: Estilista
  precio: number // ya con descuento aplicado
  porcentajeEstilista: number
  comisionEstilista: number
  esCortesia: boolean
}

export interface CartCombo {
  tipo: 'combo'
  uid: string
  combo: Combo
  cantidad: number
  bodegaId: number
  precioUnitario: number
  subtotal: number
}

export type CartItem = CartProducto | CartServicio | CartCombo

export interface PagoSeleccionado {
  metodo: MetodoPago
  monto: number
}

// ---- Payload de /api/ventas/registrar_venta ----

export interface VentaPayload {
  cliente_id: number
  metodos_pago: { metodo_pago_id: number; monto: number }[]
  carrito: Record<string, unknown>[]
  fecha_venta?: string
}

export function cartItemSubtotal(item: CartItem): number {
  switch (item.tipo) {
    case 'producto':
      return item.precioUnitario * item.cantidad
    case 'servicio':
      return item.precio
    case 'combo':
      return item.subtotal
  }
}
