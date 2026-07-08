export interface ConfiguracionTransformacion {
  id: number
  producto_origen: { id: number; nombre: string }
  producto_destino: { id: number; nombre: string }
  cantidad_origen: number
  cantidad_destino: number
}

export interface TransformacionHistorial {
  id: number
  fecha: string
  producto_origen: string
  producto_destino: string
  cantidad_origen: number
  cantidad_destino: number
  bodega_id: number
  usuario: string | null
  notas: string | null
}

export interface TransformarPayload {
  configuracion_id: number
  bodega_id: number
  cantidad_transformar: number
  usuario_id: number
  notas?: string
}
