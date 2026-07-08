import type ExcelJSNs from 'exceljs'
import type { VentaReporte } from '@/types/reporte'
import type { ConsumoInterno, Gasto, PagoNomina } from '@/types/finanzas'
import {
  calcularRentabilidad,
  calcularResumen,
  comisionesVenta,
  costoVenta,
  porEstilista,
  porProducto,
} from '@/lib/reporteCalculos'
import type { DateRange } from '@/lib/dateRange'

const NAVY = 'FF002B5C'
const GOLD = 'FFB5873A'
const CURRENCY = '"$"#,##0'

function styleHeader(row: ExcelJSNs.Row, color: string) {
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } }
    cell.alignment = { vertical: 'middle' }
  })
}

function fmtFecha(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

interface ExportInput {
  ventas: VentaReporte[]
  nomina: PagoNomina[]
  consumos: ConsumoInterno[]
  gastos: Gasto[]
  range: DateRange
}

export async function exportarReporteExcel({
  ventas,
  nomina,
  consumos,
  gastos,
  range,
}: ExportInput) {
  // Carga diferida: ExcelJS solo se descarga al exportar.
  const ExcelJS = (await import('exceljs')).default
  const { saveAs } = await import('file-saver')

  const wb = new ExcelJS.Workbook()
  wb.creator = 'Shirlove Admin'

  const resumen = calcularResumen(ventas)
  const rent = calcularRentabilidad({
    ingresos: resumen.ingresos,
    costoProductos: resumen.costo,
    comisiones: resumen.comisiones,
    nomina: nomina.reduce((s, p) => s + p.monto, 0),
    consumos: consumos.reduce((s, c) => s + c.costo_total, 0),
    gastos: gastos.reduce((s, g) => s + g.monto, 0),
  })

  // --- Resumen ---
  const resumenSheet = wb.addWorksheet('Resumen')
  resumenSheet.columns = [
    { header: 'Métrica', key: 'm', width: 30 },
    { header: 'Valor', key: 'v', width: 22, style: { numFmt: CURRENCY } },
  ]
  styleHeader(resumenSheet.getRow(1), NAVY)
  const money = (m: string, v: number) => resumenSheet.addRow({ m, v })
  resumenSheet.addRow({ m: 'Período', v: `${range.inicio} a ${range.fin}` })
  resumenSheet.addRow({ m: 'Número de ventas', v: resumen.numVentas })
  money('Ingresos totales', rent.ingresos)
  money('Costo de mercancía', rent.costoProductos)
  money('Comisiones estilistas', rent.comisiones)
  money('Pagos de nómina', rent.nomina)
  money('Consumos internos', rent.consumos)
  money('Gastos operativos', rent.gastos)
  money('Ganancia neta', rent.gananciaNeta)
  resumenSheet.addRow({ m: 'Margen neto (%)', v: `${rent.margenNeto.toFixed(1)}%` })
  resumenSheet.addRow({ m: 'Margen bruto (%)', v: `${rent.margenBruto.toFixed(1)}%` })
  money('Ticket promedio', Math.round(resumen.ticketPromedio))

  // --- Ventas ---
  const ventasSheet = wb.addWorksheet('Ventas')
  ventasSheet.columns = [
    { header: 'ID Venta', key: 'id', width: 10 },
    { header: 'Fecha', key: 'fecha', width: 18 },
    { header: 'Cliente', key: 'cliente', width: 30 },
    { header: 'Documento', key: 'doc', width: 16 },
    { header: 'Costo', key: 'costo', width: 14, style: { numFmt: CURRENCY } },
    { header: 'Comisiones', key: 'com', width: 14, style: { numFmt: CURRENCY } },
    { header: 'Total', key: 'total', width: 16, style: { numFmt: CURRENCY } },
  ]
  styleHeader(ventasSheet.getRow(1), NAVY)
  for (const v of ventas) {
    ventasSheet.addRow({
      id: v.id,
      fecha: fmtFecha(v.fecha),
      cliente: `${v.cliente.nombre} ${v.cliente.apellido}`,
      doc: v.cliente.documentoidentidad,
      costo: costoVenta(v),
      com: comisionesVenta(v),
      total: v.total,
    })
  }

  // --- Servicios ---
  const serviciosSheet = wb.addWorksheet('Servicios')
  serviciosSheet.columns = [
    { header: 'ID Venta', key: 'id', width: 10 },
    { header: 'Fecha', key: 'fecha', width: 18 },
    { header: 'Cliente', key: 'cliente', width: 28 },
    { header: 'Servicio', key: 'servicio', width: 28 },
    { header: 'Categoría', key: 'categoria', width: 20 },
    { header: 'Estilista', key: 'estilista', width: 22 },
    { header: 'Precio', key: 'precio', width: 14, style: { numFmt: CURRENCY } },
    { header: 'Comisión', key: 'comision', width: 14, style: { numFmt: CURRENCY } },
    { header: 'Cortesía', key: 'cortesia', width: 10 },
  ]
  styleHeader(serviciosSheet.getRow(1), GOLD)
  for (const v of ventas) {
    for (const s of v.servicios) {
      serviciosSheet.addRow({
        id: v.id,
        fecha: fmtFecha(v.fecha),
        cliente: `${v.cliente.nombre} ${v.cliente.apellido}`,
        servicio: s.servicio_nombre,
        categoria: s.servicio_categoria,
        estilista: s.estilista.nombre,
        precio: s.precio,
        comision: s.pago_estilista,
        cortesia: s.es_cortesia ? 'Sí' : 'No',
      })
    }
  }

  // --- Comisiones por estilista ---
  const comisionesSheet = wb.addWorksheet('Comisiones')
  comisionesSheet.columns = [
    { header: 'Estilista', key: 'estilista', width: 24 },
    { header: 'Servicios', key: 'servicios', width: 12 },
    { header: 'Total comisiones', key: 'comisiones', width: 18, style: { numFmt: CURRENCY } },
  ]
  styleHeader(comisionesSheet.getRow(1), GOLD)
  for (const e of porEstilista(ventas)) {
    comisionesSheet.addRow({
      estilista: e.nombre,
      servicios: e.servicios,
      comisiones: e.comisiones,
    })
  }

  // --- Productos ---
  const productosSheet = wb.addWorksheet('Productos')
  productosSheet.columns = [
    { header: 'Producto', key: 'nombre', width: 36 },
    { header: 'Cantidad', key: 'cantidad', width: 12 },
    { header: 'Ingresos', key: 'ingresos', width: 16, style: { numFmt: CURRENCY } },
    { header: 'Costo', key: 'costo', width: 16, style: { numFmt: CURRENCY } },
    { header: 'Ganancia', key: 'ganancia', width: 16, style: { numFmt: CURRENCY } },
  ]
  styleHeader(productosSheet.getRow(1), NAVY)
  for (const p of porProducto(ventas)) {
    productosSheet.addRow({
      nombre: p.nombre,
      cantidad: p.cantidad,
      ingresos: p.ingresos,
      costo: p.costo,
      ganancia: p.ganancia,
    })
  }

  // --- Nómina ---
  const nominaSheet = wb.addWorksheet('Nómina')
  nominaSheet.columns = [
    { header: 'Estilista', key: 'estilista', width: 24 },
    { header: 'Monto', key: 'monto', width: 16, style: { numFmt: CURRENCY } },
    { header: 'Fecha pago', key: 'fechaPago', width: 14 },
    { header: 'Periodo inicio', key: 'ini', width: 14 },
    { header: 'Periodo fin', key: 'fin', width: 14 },
    { header: 'Concepto', key: 'concepto', width: 16 },
    { header: 'Notas', key: 'notas', width: 28 },
  ]
  styleHeader(nominaSheet.getRow(1), GOLD)
  for (const p of nomina) {
    nominaSheet.addRow({
      estilista: p.estilista_nombre,
      monto: p.monto,
      fechaPago: p.fecha_pago.slice(0, 10),
      ini: p.periodo_inicio,
      fin: p.periodo_fin,
      concepto: p.concepto,
      notas: p.notas ?? '',
    })
  }

  // --- Consumos internos ---
  const consumosSheet = wb.addWorksheet('Consumos Internos')
  consumosSheet.columns = [
    { header: 'Fecha', key: 'fecha', width: 14 },
    { header: 'Producto', key: 'producto', width: 32 },
    { header: 'Cantidad', key: 'cantidad', width: 12 },
    { header: 'Bodega', key: 'bodega', width: 16 },
    { header: 'Motivo', key: 'motivo', width: 20 },
    { header: 'Costo total', key: 'costo', width: 16, style: { numFmt: CURRENCY } },
  ]
  styleHeader(consumosSheet.getRow(1), NAVY)
  for (const c of consumos) {
    consumosSheet.addRow({
      fecha: c.fecha.slice(0, 10),
      producto: c.producto_nombre,
      cantidad: c.cantidad,
      bodega: c.bodega_nombre,
      motivo: c.motivo,
      costo: c.costo_total,
    })
  }

  // --- Gastos ---
  const gastosSheet = wb.addWorksheet('Gastos')
  gastosSheet.columns = [
    { header: 'Fecha', key: 'fecha', width: 14 },
    { header: 'Categoría', key: 'categoria', width: 20 },
    { header: 'Concepto', key: 'concepto', width: 28 },
    { header: 'Tipo', key: 'tipo', width: 12 },
    { header: 'Monto', key: 'monto', width: 16, style: { numFmt: CURRENCY } },
    { header: 'Notas', key: 'notas', width: 28 },
  ]
  styleHeader(gastosSheet.getRow(1), NAVY)
  for (const g of gastos) {
    gastosSheet.addRow({
      fecha: g.fecha.slice(0, 10),
      categoria: g.categoria,
      concepto: g.concepto,
      tipo: g.tipo,
      monto: g.monto,
      notas: g.notas ?? '',
    })
  }

  const buffer = await wb.xlsx.writeBuffer()
  saveAs(
    new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    `reporte_shirlove_${range.inicio}_a_${range.fin}.xlsx`,
  )
}
