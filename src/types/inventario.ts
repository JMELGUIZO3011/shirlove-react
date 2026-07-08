import type { Producto } from '@/types/venta'

export interface BodegaRef {
  id: number
  nombre: string
}

export interface InventarioItem {
  id: number
  producto_id: number
  bodega_id: number
  cantidad: number
  observaciones: string | null
  producto: Producto
  bodega: BodegaRef
}

export interface MovimientoBodega {
  id: number
  bodega_origen_id: number
  bodega_destino_id: number
  producto_id: number
  cantidad: number
  observaciones: string | null
  fecha: string
  bodega_origen: BodegaRef
  bodega_destino: BodegaRef
  producto: Producto
}

export interface RegistroInventario {
  id: number
  producto_id: number
  bodega_id: number
  cantidad: number
  fecha: string
  observaciones: string | null
  producto: Producto
  bodega: BodegaRef
}

// Payloads
export interface AgregarStockPayload {
  producto_id: number
  bodega_id: number
  cantidad: number
  observaciones?: string | null
}

export interface ActualizarCantidadPayload {
  cantidad: number
  observacion?: string | null
}

export interface MovimientoPayload {
  bodega_origen_id: number
  bodega_destino_id: number
  producto_id: number
  cantidad: number
  observaciones?: string | null
}

// Costo unitario de un producto según el país de su bodega (tipo_precio_id === 1).
export function costoUnitario(producto: Producto, paisId: number): number {
  const costos = producto.precios.filter((p) => p.tipo_precio_id === 1)
  const match = costos.find((p) => p.pais_id === paisId) ?? costos[0]
  return match?.precio ?? 0
}
