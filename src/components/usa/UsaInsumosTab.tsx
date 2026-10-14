import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, Loader2, PackageMinus, Plus, Trash2, Wallet } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import {
  useUsaConsumos,
  useUsaEliminarConsumo,
  useUsaProductos,
  useUsaRegistrarConsumo,
} from '@/hooks/useUsa'
import { dateWithCurrentTime, presetRange, toLocalDateTimeISO, type DateRange } from '@/lib/dateRange'
import { formatFechaHora, formatUSD } from '@/lib/format'
import type { UsaConsumo, UsaProducto } from '@/types/usa'
import { DateRangeControl } from '@/components/reportes/DateRangeControl'
import { StatCard } from '@/components/reportes/StatCard'
import { AutocompleteInput } from '@/components/AutocompleteInput'
import { Combobox, type ComboboxOption } from '@/components/Combobox'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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

const MOTIVOS_SUGERIDOS = [
  'Uso en servicio',
  'Muestra para clienta',
  'Capacitación / práctica',
  'Producto dañado o vencido',
  'Uso personal',
  'Otro',
]

interface Props {
  metodosPago?: string[]
}

// Insumos del Módulo USA: productos que se sacan del inventario para trabajar
// con ellos (no son ventas). Descuentan stock y se llevan como costo del período.
export function UsaInsumosTab(_props: Props) {
  const { user } = useAuth()
  const [range, setRange] = useState<DateRange>(() => presetRange('mes'))
  const [formOpen, setFormOpen] = useState(false)
  const [toDelete, setToDelete] = useState<UsaConsumo | null>(null)

  const consumosQ = useUsaConsumos(range)
  const productosQ = useUsaProductos()
  const eliminar = useUsaEliminarConsumo()

  const consumos = useMemo(() => consumosQ.data ?? [], [consumosQ.data])
  const productos = useMemo(() => productosQ.data ?? [], [productosQ.data])

  const kpis = useMemo(() => {
    const unidades = consumos.reduce((s, c) => s + c.cantidad, 0)
    const costo = consumos.reduce((s, c) => s + c.costo_total, 0)
    const porProducto = new Map<string, { unidades: number; costo: number }>()
    for (const c of consumos) {
      const acc = porProducto.get(c.producto_nombre) ?? { unidades: 0, costo: 0 }
      acc.unidades += c.cantidad
      acc.costo += c.costo_total
      porProducto.set(c.producto_nombre, acc)
    }
    const top = [...porProducto.entries()]
      .map(([nombre, v]) => ({ nombre, ...v }))
      .sort((a, b) => b.costo - a.costo)
      .slice(0, 6)
    return { unidades, costo, top }
  }, [consumos])

  const motivos = useMemo(
    () =>
      [...new Set([...MOTIVOS_SUGERIDOS, ...consumos.map((c) => c.motivo.trim()).filter(Boolean)])].sort((a, b) =>
        a.localeCompare(b, 'es'),
      ),
    [consumos],
  )

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
    <div className="space-y-4">
      <DateRangeControl value={range} onChange={setRange} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <StatCard
          label="Insumos usados"
          value={String(kpis.unidades)}
          subtitle={`${consumos.length} registro(s)`}
          icon={PackageMinus}
        />
        <StatCard
          label="Costo de insumos"
          value={formatUSD(kpis.costo)}
          subtitle="A precio de costo"
          icon={Wallet}
          tone="warning"
        />
        <div className="col-span-2 rounded-xl border bg-white p-4 shadow-sm md:col-span-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Más usados</p>
          {kpis.top.length === 0 ? (
            <p className="mt-1 text-sm text-muted-foreground">Sin insumos en el período</p>
          ) : (
            <ul className="mt-1 space-y-0.5 text-sm">
              {kpis.top.slice(0, 3).map((t) => (
                <li key={t.nombre} className="flex justify-between gap-2">
                  <span className="truncate">{t.nombre}</span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {t.unidades} · {formatUSD(t.costo)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-navy">
          <PackageMinus className="h-4 w-4" /> Historial de insumos
        </h3>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setFormOpen(true)}
          disabled={productos.length === 0}
        >
          <Plus className="h-4 w-4" /> Registrar insumo
        </Button>
      </div>

      {consumosQ.isError ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border bg-white py-16 text-center">
          <AlertCircle className="h-10 w-10 text-destructive" />
          <p className="text-destructive">Error al cargar los insumos</p>
          <Button variant="outline" onClick={() => consumosQ.refetch()}>
            Reintentar
          </Button>
        </div>
      ) : consumosQ.isLoading ? (
        <div className="flex items-center justify-center gap-2 rounded-xl border bg-white py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-gold" /> Cargando...
        </div>
      ) : (
        <div className="rounded-xl border bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead className="hidden sm:table-cell">Motivo</TableHead>
                <TableHead className="text-right">Cant.</TableHead>
                <TableHead className="hidden md:table-cell text-right">Costo</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {consumos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    No hay insumos registrados en este período
                  </TableCell>
                </TableRow>
              ) : (
                consumos.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="text-muted-foreground">{formatFechaHora(c.fecha)}</TableCell>
                    <TableCell className="font-medium">
                      {c.producto_nombre}
                      {c.notas && <p className="text-xs font-normal text-muted-foreground">{c.notas}</p>}
                      {c.usuario_nombre && (
                        <p className="text-xs font-normal text-muted-foreground">por {c.usuario_nombre}</p>
                      )}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="outline">{c.motivo}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">{c.cantidad}</TableCell>
                    <TableCell className="hidden md:table-cell text-right tabular-nums text-orange-600">
                      {formatUSD(c.costo_total)}
                    </TableCell>
                    <TableCell>
                      {user?.esAdmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setToDelete(c)}
                          aria-label="Eliminar insumo"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <ConsumoFormDialog open={formOpen} onOpenChange={setFormOpen} productos={productos} motivos={motivos} />

      <AlertDialog open={toDelete !== null} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar insumo</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete && (
                <>
                  ¿Eliminar el consumo de {toDelete.cantidad} × «{toDelete.producto_nombre}»? Las unidades
                  volverán al inventario USA.
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

function ConsumoFormDialog({
  open,
  onOpenChange,
  productos,
  motivos,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  productos: UsaProducto[]
  motivos: string[]
}) {
  const registrar = useUsaRegistrarConsumo()
  const [productoId, setProductoId] = useState('')
  const [cantidad, setCantidad] = useState('1')
  const [motivo, setMotivo] = useState('')
  const [fecha, setFecha] = useState('')
  const [notas, setNotas] = useState('')

  useEffect(() => {
    if (open) {
      setProductoId('')
      setCantidad('1')
      setMotivo('')
      setFecha('')
      setNotas('')
    }
  }, [open])

  const producto = productos.find((p) => String(p.id) === productoId)
  const options: ComboboxOption[] = productos.map((p) => ({
    value: String(p.id),
    label: p.nombre,
    node: (
      <div className="flex w-full items-center justify-between gap-3">
        <span className="truncate">{p.nombre}</span>
        <span className="shrink-0 text-xs text-muted-foreground">
          stock {p.cantidad} · costo {formatUSD(p.costo)}
        </span>
      </div>
    ),
  }))
  const cant = Number(cantidad)
  const costoEstimado = producto && Number.isFinite(cant) ? producto.costo * cant : 0

  async function handleSave() {
    if (!producto) return toast.warning('Seleccione un producto')
    if (!Number.isInteger(cant) || cant <= 0) return toast.warning('La cantidad debe ser un entero mayor a 0')
    if (cant > producto.cantidad)
      return toast.warning(`Stock insuficiente: solo hay ${producto.cantidad} unidad(es)`)
    if (!motivo.trim()) return toast.warning('Indique el motivo')
    try {
      await registrar.mutateAsync({
        producto_id: producto.id,
        cantidad: cant,
        motivo: motivo.trim(),
        fecha: fecha ? dateWithCurrentTime(fecha) : toLocalDateTimeISO(),
        notas: notas.trim() || null,
      })
      onOpenChange(false)
    } catch {
      /* toast lo maneja el hook */
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-navy">Registrar insumo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Producto</Label>
            <Combobox
              options={options}
              value={productoId}
              onSelect={setProductoId}
              placeholder="Seleccione un producto"
              searchPlaceholder="Buscar producto..."
              emptyText="Sin productos"
            />
            {producto && (
              <p className="text-xs text-muted-foreground">
                Disponible: <span className="font-semibold text-navy">{producto.cantidad}</span> · costo unitario{' '}
                {formatUSD(producto.costo)}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="usa-cons-cant">Cantidad</Label>
              <Input
                id="usa-cons-cant"
                type="number"
                min={1}
                step={1}
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="usa-cons-fecha">Fecha (opcional)</Label>
              <Input id="usa-cons-fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="usa-cons-motivo">Motivo</Label>
            <AutocompleteInput
              id="usa-cons-motivo"
              value={motivo}
              onChange={setMotivo}
              options={motivos.map((m) => ({ value: m }))}
              heading="Motivos"
              createLabel={(t) => `Usar motivo «${t}»`}
              placeholder="Ej: Uso en servicio"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="usa-cons-notas">Notas (opcional)</Label>
            <Textarea
              id="usa-cons-notas"
              rows={2}
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Ej: para la keratina de Ana"
            />
          </div>
          {producto && cant > 0 && (
            <div className="flex items-baseline justify-between rounded-lg bg-muted px-3 py-2 text-sm">
              <span className="text-muted-foreground">Costo del insumo</span>
              <span className="font-semibold tabular-nums">{formatUSD(costoEstimado)}</span>
            </div>
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={registrar.isPending}>
            Cancelar
          </Button>
          <Button variant="secondary" onClick={handleSave} disabled={registrar.isPending}>
            {registrar.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Registrar insumo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
