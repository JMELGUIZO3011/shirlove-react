import type { VentaReporte } from '@/types/reporte'
import type { ConsumoInterno, Gasto, PagoNomina } from '@/types/finanzas'

// Costo de mercancía vendida (COGS): productos + productos dentro de combos.
export function costoVenta(venta: VentaReporte): number {
  const costoProductos = venta.productos.reduce(
    (s, p) => s + p.costo_unitario * p.cantidad,
    0,
  )
  const costoCombos = venta.combos.reduce(
    (s, c) => s + c.costo_unitario * c.cantidad,
    0,
  )
  return costoProductos + costoCombos
}

export function comisionesVenta(venta: VentaReporte): number {
  return venta.servicios.reduce((s, sv) => s + sv.pago_estilista, 0)
}

export interface ResumenReporte {
  numVentas: number
  ingresos: number
  costo: number
  comisiones: number
  ganancia: number
  ticketPromedio: number
  numProductos: number
  numServicios: number
  numCombos: number
  serviciosCortesia: number
}

export function calcularResumen(ventas: VentaReporte[]): ResumenReporte {
  let ingresos = 0
  let costo = 0
  let comisiones = 0
  let numProductos = 0
  let numServicios = 0
  let numCombos = 0
  let serviciosCortesia = 0

  for (const v of ventas) {
    ingresos += v.total
    costo += costoVenta(v)
    comisiones += comisionesVenta(v)
    numProductos += v.productos.reduce((s, p) => s + p.cantidad, 0)
    numCombos += v.combos.reduce((s, c) => s + c.cantidad, 0)
    numServicios += v.servicios.length
    serviciosCortesia += v.servicios.filter((s) => s.es_cortesia).length
  }

  return {
    numVentas: ventas.length,
    ingresos,
    costo,
    comisiones,
    ganancia: ingresos - costo - comisiones,
    ticketPromedio: ventas.length ? ingresos / ventas.length : 0,
    numProductos,
    numServicios,
    numCombos,
    serviciosCortesia,
  }
}

export interface PuntoDia {
  fecha: string // YYYY-MM-DD
  ingresos: number
  numVentas: number
}

export function ventasPorDia(ventas: VentaReporte[]): PuntoDia[] {
  const mapa = new Map<string, PuntoDia>()
  for (const v of ventas) {
    const dia = v.fecha.slice(0, 10)
    const punto = mapa.get(dia) ?? { fecha: dia, ingresos: 0, numVentas: 0 }
    punto.ingresos += v.total
    punto.numVentas += 1
    mapa.set(dia, punto)
  }
  return [...mapa.values()].sort((a, b) => a.fecha.localeCompare(b.fecha))
}

export interface FilaEstilista {
  estilistaId: number
  nombre: string
  servicios: number
  comisiones: number
}

export function porEstilista(ventas: VentaReporte[]): FilaEstilista[] {
  const mapa = new Map<number, FilaEstilista>()
  for (const v of ventas) {
    for (const s of v.servicios) {
      const fila = mapa.get(s.estilista.id) ?? {
        estilistaId: s.estilista.id,
        nombre: s.estilista.nombre,
        servicios: 0,
        comisiones: 0,
      }
      fila.servicios += 1
      fila.comisiones += s.pago_estilista
      mapa.set(s.estilista.id, fila)
    }
  }
  return [...mapa.values()].sort((a, b) => b.comisiones - a.comisiones)
}

export interface FilaProducto {
  productoId: number
  nombre: string
  cantidad: number
  ingresos: number
  costo: number
  ganancia: number
}

export function porProducto(ventas: VentaReporte[]): FilaProducto[] {
  const mapa = new Map<number, FilaProducto>()
  for (const v of ventas) {
    for (const p of v.productos) {
      const fila = mapa.get(p.producto_id) ?? {
        productoId: p.producto_id,
        nombre: p.producto_nombre,
        cantidad: 0,
        ingresos: 0,
        costo: 0,
        ganancia: 0,
      }
      fila.cantidad += p.cantidad
      fila.ingresos += p.subtotal
      fila.costo += p.costo_unitario * p.cantidad
      fila.ganancia = fila.ingresos - fila.costo
      mapa.set(p.producto_id, fila)
    }
  }
  return [...mapa.values()].sort((a, b) => b.ingresos - a.ingresos)
}

// ---- Rentabilidad (integra nómina, consumos internos y gastos) ----

export interface FinanzasInput {
  ingresos: number
  costoProductos: number
  comisiones: number
  nomina: number
  consumos: number
  gastos: number
}

export interface Rentabilidad extends FinanzasInput {
  totalCostosGastos: number
  gananciaNeta: number
  margenNeto: number // %
  margenBruto: number // %
}

export function calcularRentabilidad(input: FinanzasInput): Rentabilidad {
  const totalCostosGastos =
    input.costoProductos +
    input.comisiones +
    input.nomina +
    input.consumos +
    input.gastos
  const gananciaNeta = input.ingresos - totalCostosGastos
  // Margen bruto: no descuenta el costo de mercancía (igual que el Flutter original)
  const gastosSinMercancia =
    input.comisiones + input.nomina + input.consumos + input.gastos
  return {
    ...input,
    totalCostosGastos,
    gananciaNeta,
    margenNeto: input.ingresos ? (gananciaNeta / input.ingresos) * 100 : 0,
    margenBruto: input.ingresos
      ? ((input.ingresos - gastosSinMercancia) / input.ingresos) * 100
      : 0,
  }
}

export interface PuntoMes {
  mes: string // YYYY-MM
  ingresos: number
  ganancia: number
}

// Serie mensual "Ingresos vs Ganancia" a partir de las 4 fuentes del rango.
export function porMes(
  ventas: VentaReporte[],
  nomina: PagoNomina[],
  consumos: ConsumoInterno[],
  gastos: Gasto[],
): PuntoMes[] {
  const mapa = new Map<
    string,
    { ingresos: number; costo: number; comisiones: number; egresos: number }
  >()
  const get = (mes: string) => {
    let m = mapa.get(mes)
    if (!m) {
      m = { ingresos: 0, costo: 0, comisiones: 0, egresos: 0 }
      mapa.set(mes, m)
    }
    return m
  }

  for (const v of ventas) {
    const m = get(v.fecha.slice(0, 7))
    m.ingresos += v.total
    m.costo += costoVenta(v)
    m.comisiones += comisionesVenta(v)
  }
  for (const p of nomina) get(p.fecha_pago.slice(0, 7)).egresos += p.monto
  for (const c of consumos) get(c.fecha.slice(0, 7)).egresos += c.costo_total
  for (const g of gastos) get(g.fecha.slice(0, 7)).egresos += g.monto

  return [...mapa.entries()]
    .map(([mes, m]) => ({
      mes,
      ingresos: m.ingresos,
      ganancia: m.ingresos - m.costo - m.comisiones - m.egresos,
    }))
    .sort((a, b) => a.mes.localeCompare(b.mes))
}

export interface FilaCategoria {
  categoria: string
  cantidad: number
  ingresos: number
}

export function porCategoriaServicio(ventas: VentaReporte[]): FilaCategoria[] {
  const mapa = new Map<string, FilaCategoria>()
  for (const v of ventas) {
    for (const s of v.servicios) {
      const cat = s.servicio_categoria || 'Sin categoría'
      const fila = mapa.get(cat) ?? { categoria: cat, cantidad: 0, ingresos: 0 }
      fila.cantidad += 1
      fila.ingresos += s.precio
      mapa.set(cat, fila)
    }
  }
  return [...mapa.values()].sort((a, b) => b.ingresos - a.ingresos)
}
