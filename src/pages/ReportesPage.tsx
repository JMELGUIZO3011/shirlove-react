import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  AlertCircle,
  Download,
  Loader2,
  Receipt,
  Scissors,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react'
import { presetRange, type DateRange } from '@/lib/dateRange'
import { useReporte } from '@/hooks/useReporte'
import { useConsumos, useGastos, useNomina } from '@/hooks/useFinanzas'
import {
  calcularRentabilidad,
  calcularResumen,
  porCategoriaServicio,
  porEstilista,
  porMes,
  porProducto,
  ventasPorDia,
} from '@/lib/reporteCalculos'
import { exportarReporteExcel } from '@/lib/reporteExcel'
import { formatCOP } from '@/lib/format'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/components/PageHeader'
import { DateRangeControl } from '@/components/reportes/DateRangeControl'
import { StatCard } from '@/components/reportes/StatCard'
import { VentasDiaChart, MensualChart, TopBars } from '@/components/reportes/Charts'
import { VentasTable } from '@/components/reportes/VentasTable'
import { NominaSection } from '@/components/reportes/NominaSection'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type Tab = 'resumen' | 'ventas' | 'comisiones'
const TABS: { key: Tab; label: string }[] = [
  { key: 'resumen', label: 'Resumen' },
  { key: 'ventas', label: 'Ventas' },
  { key: 'comisiones', label: 'Comisiones' },
]

export function ReportesPage() {
  const [range, setRange] = useState<DateRange>(() => presetRange('mes'))
  const [tab, setTab] = useState<Tab>('resumen')
  const [exporting, setExporting] = useState(false)

  const ventasQ = useReporte(range)
  const nominaQ = useNomina(range)
  const consumosQ = useConsumos(range)
  const gastosQ = useGastos(range)

  const ventas = useMemo(() => ventasQ.data ?? [], [ventasQ.data])
  const nomina = useMemo(() => nominaQ.data ?? [], [nominaQ.data])
  const consumos = useMemo(() => consumosQ.data ?? [], [consumosQ.data])
  const gastos = useMemo(() => gastosQ.data ?? [], [gastosQ.data])

  const resumen = useMemo(() => calcularResumen(ventas), [ventas])
  const rent = useMemo(
    () =>
      calcularRentabilidad({
        ingresos: resumen.ingresos,
        costoProductos: resumen.costo,
        comisiones: resumen.comisiones,
        nomina: nomina.reduce((s, p) => s + p.monto, 0),
        consumos: consumos.reduce((s, c) => s + c.costo_total, 0),
        gastos: gastos.reduce((s, g) => s + g.monto, 0),
      }),
    [resumen, nomina, consumos, gastos],
  )

  const serieDia = useMemo(() => ventasPorDia(ventas), [ventas])
  const serieMes = useMemo(
    () => porMes(ventas, nomina, consumos, gastos),
    [ventas, nomina, consumos, gastos],
  )
  const estilistas = useMemo(() => porEstilista(ventas), [ventas])
  const productos = useMemo(() => porProducto(ventas), [ventas])
  const categorias = useMemo(() => porCategoriaServicio(ventas), [ventas])

  const topProductos = useMemo(
    () =>
      [...productos]
        .sort((a, b) => b.cantidad - a.cantidad)
        .slice(0, 8)
        .map((p) => ({ nombre: p.nombre, valor: p.cantidad })),
    [productos],
  )
  const topServicios = useMemo(() => {
    const m = new Map<string, number>()
    for (const v of ventas)
      for (const s of v.servicios)
        m.set(s.servicio_nombre, (m.get(s.servicio_nombre) ?? 0) + 1)
    return [...m.entries()]
      .map(([nombre, valor]) => ({ nombre, valor }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 8)
  }, [ventas])

  const isLoading =
    ventasQ.isLoading || nominaQ.isLoading || consumosQ.isLoading || gastosQ.isLoading
  const isError = ventasQ.isError
  const showMensual = serieMes.length > 1

  async function handleExport() {
    if (ventas.length === 0) {
      toast.warning('No hay datos para exportar en este período')
      return
    }
    setExporting(true)
    try {
      await exportarReporteExcel({ ventas, nomina, consumos, gastos, range })
      toast.success('Reporte exportado')
    } catch {
      toast.error('No se pudo generar el Excel')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-gray-100 to-white">
      <PageHeader
        title="Reportes"
        subtitle="Ventas, rentabilidad y comisiones"
        actions={
          <Button
            variant="ghost"
            className="text-white hover:bg-white/10 hover:text-white"
            onClick={handleExport}
            disabled={exporting || isLoading}
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">Exportar Excel</span>
          </Button>
        }
      />

      <div className="mx-auto w-full max-w-6xl flex-1 space-y-4 p-4 sm:p-6">
        <DateRangeControl value={range} onChange={setRange} />

        {/* Tabs */}
        <div className="flex gap-1 rounded-lg border bg-white p-1 shadow-sm">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                tab === t.key
                  ? 'bg-navy text-white'
                  : 'text-muted-foreground hover:bg-muted',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {isError ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border bg-white py-20 text-center">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <p className="text-destructive">
              {(ventasQ.error as Error)?.message ?? 'Error al cargar el reporte'}
            </p>
            <Button variant="outline" onClick={() => ventasQ.refetch()}>
              Reintentar
            </Button>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center gap-2 rounded-xl border bg-white py-20 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin text-gold" /> Cargando reporte...
          </div>
        ) : (
          <>
            {tab === 'resumen' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <StatCard
                    label="Ingresos"
                    value={formatCOP(rent.ingresos)}
                    subtitle={`${resumen.numVentas} ventas`}
                    icon={TrendingUp}
                  />
                  <StatCard
                    label="Ganancia neta"
                    value={formatCOP(rent.gananciaNeta)}
                    subtitle={`Margen ${rent.margenNeto.toFixed(1)}%`}
                    icon={Wallet}
                    tone={rent.gananciaNeta >= 0 ? 'positive' : 'negative'}
                  />
                  <StatCard
                    label="Comisiones"
                    value={formatCOP(rent.comisiones)}
                    subtitle="Pagos a estilistas"
                    icon={Scissors}
                  />
                  <StatCard
                    label="Ticket promedio"
                    value={formatCOP(resumen.ticketPromedio)}
                    subtitle="Por venta"
                    icon={Receipt}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <StatCard label="Costo mercancía" value={formatCOP(rent.costoProductos)} />
                  <StatCard label="Nómina" value={formatCOP(rent.nomina)} />
                  <StatCard label="Consumos internos" value={formatCOP(rent.consumos)} />
                  <StatCard label="Gastos operativos" value={formatCOP(rent.gastos)} />
                </div>

                <VentasDiaChart data={serieDia} />
                {showMensual && <MensualChart data={serieMes} />}

                <div className="grid gap-4 md:grid-cols-2">
                  <TopBars
                    title="Top productos (unidades)"
                    data={topProductos}
                    color="#002B5C"
                  />
                  <TopBars
                    title="Top servicios (realizados)"
                    data={topServicios}
                    color="#B5873A"
                  />
                </div>
              </div>
            )}

            {tab === 'ventas' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                  <StatCard label="Total ingresos" value={formatCOP(rent.ingresos)} />
                  <StatCard label="Transacciones" value={String(resumen.numVentas)} />
                  <StatCard
                    label="Venta promedio"
                    value={formatCOP(resumen.ticketPromedio)}
                  />
                </div>
                <VentasTable ventas={ventas} />
              </div>
            )}

            {tab === 'comisiones' && (
              <div className="space-y-4">
                <div className="rounded-xl border bg-white shadow-sm">
                  <div className="flex items-center gap-2 border-b p-4 text-navy">
                    <Users className="h-5 w-5" />
                    <h3 className="font-semibold">Comisiones por estilista</h3>
                  </div>
                  {estilistas.length === 0 ? (
                    <p className="py-10 text-center text-sm text-muted-foreground">
                      No hay comisiones en este período
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Estilista</TableHead>
                          <TableHead className="text-center">Servicios</TableHead>
                          <TableHead className="text-right">Total comisiones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {estilistas.map((e) => (
                          <TableRow key={e.estilistaId}>
                            <TableCell className="font-medium">{e.nombre}</TableCell>
                            <TableCell className="text-center">{e.servicios}</TableCell>
                            <TableCell className="text-right font-semibold tabular-nums">
                              {formatCOP(e.comisiones)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>

                {categorias.length > 0 && (
                  <TopBars
                    title="Ingresos por categoría de servicio"
                    data={categorias.map((c) => ({ nombre: c.categoria, valor: c.ingresos }))}
                    color="#B5873A"
                    formatValue={formatCOP}
                  />
                )}

                <NominaSection range={range} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
