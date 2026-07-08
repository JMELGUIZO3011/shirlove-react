// Tipos de nómina, consumos internos y gastos (para reportes y sus módulos).

export interface Gasto {
  id: number
  categoria: string
  concepto: string
  monto: number
  fecha: string
  tipo: string // "Fijo" | "Variable"
  comprobante: string | null
  usuario_id: number
  usuario_nombre: string
  fecha_registro: string
  notas: string | null
}

export interface ConsumoInterno {
  id: number
  producto_id: number
  producto_nombre: string
  cantidad: number
  bodega_id: number
  bodega_nombre: string
  motivo: string
  costo_unitario: number
  costo_total: number
  usuario_id: number
  usuario_nombre: string
  fecha: string
  notas: string | null
}

export interface ConsumoInternoPayload {
  producto_id: number
  cantidad: number
  bodega_id: number
  motivo: string
  notas?: string | null
}

export interface GastoPayload {
  categoria: string
  concepto: string
  monto: number
  tipo: string // "Fijo" | "Variable"
  fecha?: string | null
  comprobante?: string | null
  notas?: string | null
}

export interface PagoNomina {
  id: number
  estilista_id: number
  estilista_nombre: string
  monto: number
  fecha_pago: string
  periodo_inicio: string
  periodo_fin: string
  concepto: string
  notas: string | null
  usuario_id: number
  usuario_nombre: string
  fecha_registro: string
}

export interface PagoNominaPayload {
  estilista_id: number
  monto: number
  fecha_pago: string // ISO datetime
  periodo_inicio: string // YYYY-MM-DD
  periodo_fin: string // YYYY-MM-DD
  concepto: string
  notas?: string | null
}
