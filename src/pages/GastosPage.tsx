import { useMemo, useState } from 'react'
import {
  AlertCircle,
  Loader2,
  Pencil,
  Plus,
  Receipt,
  Trash2,
  Wallet,
} from 'lucide-react'
import { presetRange, type DateRange } from '@/lib/dateRange'
import {
  useCategoriasGasto,
  useEliminarGasto,
  useGastos,
} from '@/hooks/useFinanzas'
import type { Gasto } from '@/types/finanzas'
import { formatCOP } from '@/lib/format'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/components/PageHeader'
import { DateRangeControl } from '@/components/reportes/DateRangeControl'
import { StatCard } from '@/components/reportes/StatCard'
import { TopBars } from '@/components/reportes/Charts'
import { GastoFormDialog } from '@/components/gastos/GastoFormDialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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

function fmtFecha(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`
}

export function GastosPage() {
  const [range, setRange] = useState<DateRange>(() => presetRange('mes'))
  const [tab, setTab] = useState<Tab>('historial')
  const [filtroCategoria, setFiltroCategoria] = useState('all')
  const [filtroTipo, setFiltroTipo] = useState('all')

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Gasto | null>(null)
  const [toDelete, setToDelete] = useState<Gasto | null>(null)

  const { data: gastos = [], isLoading, isError, refetch } = useGastos(range)
  const { data: categorias = [] } = useCategoriasGasto()
  const eliminar = useEliminarGasto()

  const filtrados = useMemo(
    () =>
      gastos.filter(
        (g) =>
          (filtroCategoria === 'all' || g.categoria === filtroCategoria) &&
          (filtroTipo === 'all' || g.tipo === filtroTipo),
      ),
    [gastos, filtroCategoria, filtroTipo],
  )

  const kpis = useMemo(() => {
    const total = filtrados.reduce((s, g) => s + g.monto, 0)
    const fijos = filtrados.filter((g) => g.tipo === 'Fijo').reduce((s, g) => s + g.monto, 0)
    const variables = total - fijos
    return { total, fijos, variables }
  }, [filtrados])

  const porCategoria = useMemo(() => {
    const m = new Map<string, number>()
    for (const g of filtrados) m.set(g.categoria, (m.get(g.categoria) ?? 0) + g.monto)
    return [...m.entries()]
      .map(([nombre, valor]) => ({ nombre, valor }))
      .sort((a, b) => b.valor - a.valor)
  }, [filtrados])

  async function confirmarEliminar() {
    if (!toDelete) return
    try {
      await eliminar.mutateAsync(toDelete.id)
      setToDelete(null)
    } catch {
      /* toast lo maneja el hook */
    }
  }

  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }
  function openEdit(g: Gasto) {
    setEditing(g)
    setFormOpen(true)
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-gray-100 to-white">
      <PageHeader
        title="Gastos"
        subtitle="Gastos operativos del negocio"
        actions={
          <Button
            variant="ghost"
            className="text-white hover:bg-white/10 hover:text-white"
            onClick={openCreate}
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nuevo gasto</span>
          </Button>
        }
      />

      <div className="mx-auto w-full max-w-5xl flex-1 space-y-4 p-4 sm:p-6">
        <DateRangeControl value={range} onChange={setRange} />

        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Total gastos" value={formatCOP(kpis.total)} icon={Wallet} tone="warning" />
          <StatCard label="Fijos" value={formatCOP(kpis.fijos)} icon={Receipt} />
          <StatCard label="Variables" value={formatCOP(kpis.variables)} icon={Receipt} />
        </div>

        {/* Filtros */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
            <SelectTrigger className="sm:w-56">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {categorias.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filtroTipo} onValueChange={setFiltroTipo}>
            <SelectTrigger className="sm:w-44">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              <SelectItem value="Fijo">Fijo</SelectItem>
              <SelectItem value="Variable">Variable</SelectItem>
            </SelectContent>
          </Select>
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
            <p className="text-destructive">Error al cargar los gastos</p>
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
                  <TableHead>Concepto</TableHead>
                  <TableHead className="hidden sm:table-cell">Categoría</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="hidden md:table-cell">Fecha</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtrados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                      No hay gastos en este período
                    </TableCell>
                  </TableRow>
                ) : (
                  filtrados.map((g) => (
                    <TableRow key={g.id}>
                      <TableCell className="font-medium">
                        {g.concepto}
                        {g.notas && (
                          <p className="text-xs text-muted-foreground">{g.notas}</p>
                        )}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
                        {g.categoria}
                      </TableCell>
                      <TableCell>
                        <Badge variant={g.tipo === 'Fijo' ? 'info' : 'secondary'}>
                          {g.tipo}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {fmtFecha(g.fecha)}
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums text-orange-600">
                        {formatCOP(g.monto)}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEdit(g)}
                          >
                            <Pencil className="h-4 w-4 text-navy" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setToDelete(g)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        ) : (
          <TopBars title="Gastos por categoría" data={porCategoria} color="#B5873A" formatValue={formatCOP} />
        )}
      </div>

      <GastoFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        gasto={editing}
        categorias={categorias}
      />

      <AlertDialog open={toDelete !== null} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar gasto</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete && (
                <>
                  ¿Eliminar el gasto «{toDelete.concepto}» por{' '}
                  {formatCOP(toDelete.monto)}? Esta acción no se puede deshacer.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={eliminar.isPending}>Cancelar</AlertDialogCancel>
            <Button variant="destructive" onClick={confirmarEliminar} disabled={eliminar.isPending}>
              {eliminar.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Eliminar
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
