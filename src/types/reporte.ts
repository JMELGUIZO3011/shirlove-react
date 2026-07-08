// Respuesta de GET /api/ventas/reporte (ver app/routers/venta.py)

export interface ReporteCliente {
  id: number
  nombre: string
  apellido: string
  documentoidentidad: number
}

export interface ReporteProducto {
  id: number
  producto_id: number
  producto_nombre: string
  cantidad: number
  precio_unitario: number
  subtotal: number
  costo_unitario: number
}

export interface ReporteServicio {
  id: number
  servicio_id: number
  servicio_nombre: string
  servicio_categoria: string
  precio: number
  estilista: { id: number; nombre: string }
  porcentaje_estilista: number
  pago_estilista: number
  es_cortesia: boolean
}

export interface ReporteCombo {
  id: number
  combo_id: number
  combo_nombre: string
  cantidad: number
  precio_unitario: number
  subtotal: number
  costo_unitario: number
}

export interface VentaReporte {
  id: number
  fecha: string
  cliente: ReporteCliente
  productos: ReporteProducto[]
  servicios: ReporteServicio[]
  combos: ReporteCombo[]
  total: number
}
