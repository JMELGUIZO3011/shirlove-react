// Shape del router de productos (/api/productos/ con barra — precios planos).
export interface ProductoPrecio {
  id: number
  precio: number
  tipo_precio_id: number
  tipo_precio_nombre: string | null
  pais_id: number
  pais_nombre: string | null
}

export interface ProductoAdmin {
  id: number
  nombre: string
  precios: ProductoPrecio[]
}

export interface TipoPrecio {
  id: number
  nombre: string
}

export interface Pais {
  id: number
  nombre: string
}

export interface PrecioInput {
  tipo_precio_id: number
  pais_id: number
  precio: number
}

export interface CrearProductoPayload {
  nombre: string
  precios: PrecioInput[]
}
