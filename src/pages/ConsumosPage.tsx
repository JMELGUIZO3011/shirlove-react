import { useMemo, useState } from 'react'
import {
  AlertCircle,
  DollarSign,
  Loader2,
  PackageMinus,
  Plus,
  Trash2,
} from 'lucide-react'
import { presetRange, type DateRange } from '@/lib/dateRange'
import { useConsumos, useEliminarConsumo } from '@/hooks/useFinanzas'
import type { ConsumoInterno } from '@/types/finanzas'
import { formatCOP } from '@/lib/format'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/components/PageHeader'
import { DateRangeControl } from '@/components/reportes/DateRangeControl'
import { StatCard } from '@/components/reportes/StatCard'
import { TopBars } from '@/components/reportes/Charts'
import { RegistrarConsumoDialog } from '@/components/consumos/RegistrarConsumoDialog'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

type Tab = 'historial' | 'resumen'

function fmtFechaHora(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function ConsumosPage() {
  const [range, setRange] = useState<DateRange>(() => presetRange('mes'))
  const [tab, setTab] = useState<Tab>('historial')
  const [addOpen, setAddOpen] = useState(false)
  const [toDelete, setToDelete] = useState<ConsumoInterno | null>(null)

  const { data: consumos = [], isLoading, isError, refetch } = useConsumos(range)
  const eliminar = useEliminarConsumo()

  const costoTotal = useMemo(
    () => consumos.reduce((s, c) => s + c.costo_total, 0),
    [consumos],
  )

  const topProductos = useMemo(() => {
    const m = new Map<string, number>()
    for (const c of consumos)
      m.set(c.producto_nombre, (m.get(c.producto_nombre) ?? 0) + c.cantidad)
    return [...m.entries()]
      .map(([nombre, valor]) => ({ nombre, valor }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 8)
  }, [consumos])

  const porMotivo = useMemo(() => {
    const m = new Map<string, number>()
    for (const c of consumos) m.set(c.motivo, (m.get(c.motivo) ?? 0) + c.costo_total)
    return [...m.entries()]
      .map(([nombre, valor]) => ({ nombre, valor }))
      .sort((a, b) => b.valor - a.valor)
  }, [consumos])

  async function confirmarEliminar() {
    if (!toDelete) return
    try {
      await eliminar.mutateAsync(toDelete.id)
      setToDelete(null)
    } catch {
      /* toast lo maneja el hook */
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-gray-100 to-white">
      <PageHeader
        title="Consumos Internos"
        subtitle="Producto usado internamente (no vendido)"
        actions={
          <Button
            variant="ghost"
            className="text-white hover:bg-white/10 hover:text-white"
            onClick={() => setAddOpen(true)}
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Registrar consumo</span>
          </Button>
        }
      />

      <div className="mx-auto w-full max-w-5xl flex-1 space-y-4 p-4 sm:p-6">
        <DateRangeControl value={range} onChange={setRange} />

        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="Total consumos"
            value={String(consumos.length)}
            icon={PackageMinus}
          />
          <StatCard
            label="Costo total"
            value={formatCOP(costoTotal)}
            subtitle="Precio de costo"
            icon={DollarSign}
            tone="warning"
          />
        </div>

        <div className="flex gap-1 rounded-lg border bg-white p-1 shadow-sm">
          {(['historial', 'resumen'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'flex-1 rounded-md px-3 py-2 text-sm font-medium capitalize transition-colors',
                tab === t ? 'bg-navy text-white' : 'text-muted-foreground hover:bg-muted',
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {isError ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border bg-white py-16 text-center">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <p className="text-destructive">Error al cargar los consumos</p>
            <Button variant="outline" onClick={() => refetch()}>
              Reintentar
            </Button>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center gap-2 rounded-xl border bg-white py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin text-gold" /> Cargando...
          </div>
        ) : tab === 'historial' ? (
          <div className="rounded-xl border bg-white shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead className="text-center">Cant.</TableHead>
                  <TableHead className="hidden sm:table-cell">Motivo</TableHead>
                  <TableHead className="hidden md:table-cell">Bodega</TableHead>
                  <TableHead className="hidden lg:table-cell">Usuario</TableHead>
                  <TableHead className="hidden md:table-cell">Fecha</TableHead>
                  <TableHead className="text-right">Costo</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {consumos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                      No hay consumos en este período
                    </TableCell>
                  </TableRow>
                ) : (
                  consumos.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.producto_nombre}</TableCell>
                      <TableCell className="text-center">{c.cantidad}</TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
                        {c.motivo}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {c.bodega_nombre}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">
                        {c.usuario_nombre}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {fmtFechaHora(c.fecha)}
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums text-orange-600">
                        {formatCOP(c.costo_total)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setToDelete(c)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <TopBars
              title="Productos más consumidos (unidades)"
              data={topProductos}
              color="#002B5C"
            />
            <TopBars
              title="Consumo por motivo (costo)"
              data={porMotivo}
              color="#B5873A"
              formatValue={formatCOP}
            />
          </div>
        )}
      </div>

      <RegistrarConsumoDialog open={addOpen} onOpenChange={setAddOpen} />

      <AlertDialog open={toDelete !== null} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar consumo</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete && (
                <>
                  Se eliminará el consumo de {toDelete.cantidad}×{' '}
                  «{toDelete.producto_nombre}» y se{' '}
                  <span className="font-semibold text-foreground">
                    restaurará esa cantidad al inventario
                  </span>{' '}
                  de {toDelete.bodega_nombre}.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={eliminar.isPending}>Cancelar</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={confirmarEliminar}
              disabled={eliminar.isPending}
            >
              {eliminar.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Eliminar
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
