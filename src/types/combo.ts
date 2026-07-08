import type { Combo, ComboProducto } from '@/types/venta'

export type { Combo, ComboProducto }

export interface ComboProductoInput {
  producto_id: number
  cantidad: number
}

export interface ComboPayload {
  nombre: string
  descripcion?: string
  precio: number
  productos: ComboProductoInput[]
}

export interface ComboUpdatePayload {
  nombre?: string
  descripcion?: string
  precio?: number
  activo?: boolean
  productos?: ComboProductoInput[]
}
