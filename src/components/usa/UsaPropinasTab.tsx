import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, Coins, Loader2, Plus, Trash2, Users } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { useUsaEliminarTip, useUsaRegistrarTip, useUsaResumen, useUsaTips } from '@/hooks/useUsa'
import { dateWithCurrentTime, presetRange, toLocalDateTimeISO, type DateRange } from '@/lib/dateRange'
import { formatFechaHora, formatUSD } from '@/lib/format'
import type { UsaTip } from '@/types/usa'
import { DateRangeControl } from '@/components/reportes/DateRangeControl'
import { StatCard } from '@/components/reportes/StatCard'
import { AutocompleteInput } from '@/components/AutocompleteInput'
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

interface Props {
  metodosPago: string[]
}

// Propinas del Módulo USA: contabilidad y trazabilidad aparte de las ventas.
export function UsaPropinasTab({ metodosPago }: Props) {
  const { user } = useAuth()
  const [range, setRange] = useState<DateRange>(() => presetRange('mes'))
  const [formOpen, setFormOpen] = useState(false)
  const [toDelete, setToDelete] = useState<UsaTip | null>(null)

  const tipsQ = useUsaTips(range)
  const resumenQ = useUsaResumen(range)
  const eliminar = useUsaEliminarTip()

  const tips = useMemo(() => tipsQ.data ?? [], [tipsQ.data])
  const resumen = resumenQ.data

  const personas = useMemo(
    () => [...new Set(tips.map((t) => (t.para ?? '').trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es')),
    [tips],
  )
  const promedio = tips.length > 0 ? tips.reduce((s, t) => s + t.monto, 0) / tips.length : 0

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

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          label="Propinas"
          value={formatUSD(resumen?.tips_total ?? 0)}
          subtitle={`${resumen?.tips_cantidad ?? 0} propina(s)`}
          icon={Coins}
          tone="positive"
        />
        <StatCard label="Promedio" value={formatUSD(promedio)} subtitle="por propina" icon={Coins} />
        <StatCard
          label="Personas"
          value={String(resumen?.tips_por_persona.filter((p) => p.para !== 'Sin asignar').length ?? 0)}
          subtitle="con propinas asignadas"
          icon={Users}
        />
        <StatCard
          label="Ingresos del período"
          value={formatUSD(resumen?.ingresos ?? 0)}
          subtitle="Las propinas van aparte"
          icon={Coins}
        />
      </div>

      {resumen && (resumen.tips_por_metodo.length > 0 || resumen.tips_por_persona.length > 0) && (
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <h3 className="mb-2 text-sm font-semibold text-navy">Por método de pago</h3>
            <div className="flex flex-wrap gap-2">
              {resumen.tips_por_metodo.map((m) => (
                <div key={m.metodo_pago} className="flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm">
                  <span className="text-muted-foreground">{m.metodo_pago}</span>
                  <span className="font-semibold tabular-nums">{formatUSD(m.monto)}</span>
                  <span className="text-xs text-muted-foreground">({m.cantidad})</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <h3 className="mb-2 text-sm font-semibold text-navy">Por persona</h3>
            <ul className="divide-y text-sm">
              {resumen.tips_por_persona.map((p) => (
                <li key={p.para} className="flex items-center justify-between py-1.5">
                  <span className={p.para === 'Sin asignar' ? 'text-muted-foreground' : ''}>{p.para}</span>
                  <span>
                    <span className="font-semibold tabular-nums">{formatUSD(p.monto)}</span>
                    <span className="ml-1 text-xs text-muted-foreground">({p.cantidad})</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-navy">
          <Coins className="h-4 w-4" /> Detalle de propinas
        </h3>
        <Button variant="secondary" size="sm" onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4" /> Registrar propina
        </Button>
      </div>

      {tipsQ.isError ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border bg-white py-16 text-center">
          <AlertCircle className="h-10 w-10 text-destructive" />
          <p className="text-destructive">Error al cargar las propinas</p>
          <Button variant="outline" onClick={() => tipsQ.refetch()}>
            Reintentar
          </Button>
        </div>
      ) : tipsQ.isLoading ? (
        <div className="flex items-center justify-center gap-2 rounded-xl border bg-white py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-gold" /> Cargando...
        </div>
      ) : (
        <div className="rounded-xl border bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Venta / clienta</TableHead>
                <TableHead>Para</TableHead>
                <TableHead className="hidden sm:table-cell">Método</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {tips.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    No hay propinas en este período
                  </TableCell>
                </TableRow>
              ) : (
                tips.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="text-muted-foreground">{formatFechaHora(t.fecha)}</TableCell>
                    <TableCell>
                      {t.venta_id ? (
                        <>
                          <span className="font-medium">#{t.venta_id}</span>
                          {t.cliente_nombre && (
                            <span className="ml-1 text-muted-foreground">· {t.cliente_nombre}</span>
                          )}
                        </>
                      ) : (
                        <span className="text-muted-foreground">Sin venta asociada</span>
                      )}
                      {t.notas && <p className="text-xs text-muted-foreground">{t.notas}</p>}
                    </TableCell>
                    <TableCell>
                      {t.para ?? <span className="text-muted-foreground">Sin asignar</span>}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="outline">{t.metodo_pago}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums text-green-700">
                      {formatUSD(t.monto)}
                    </TableCell>
                    <TableCell>
                      {user?.esAdmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setToDelete(t)}
                          aria-label="Eliminar propina"
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

      <PropinaFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        metodosPago={metodosPago}
        personas={personas}
      />

      <AlertDialog open={toDelete !== null} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar propina</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete && (
                <>
                  ¿Eliminar la propina de {formatUSD(toDelete.monto)}
                  {toDelete.para ? ` para ${toDelete.para}` : ''}? Esta acción no se puede deshacer.
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

function PropinaFormDialog({
  open,
  onOpenChange,
  metodosPago,
  personas,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  metodosPago: string[]
  personas: string[]
}) {
  const registrar = useUsaRegistrarTip()
  const [monto, setMonto] = useState('')
  const [metodo, setMetodo] = useState('')
  const [para, setPara] = useState('')
  const [ventaId, setVentaId] = useState('')
  const [fecha, setFecha] = useState('')
  const [notas, setNotas] = useState('')

  useEffect(() => {
    if (open) {
      setMonto('')
      setMetodo('')
      setPara('')
      setVentaId('')
      setFecha('')
      setNotas('')
    }
  }, [open])

  async function handleSave() {
    const montoNum = Number(monto)
    if (!Number.isFinite(montoNum) || montoNum <= 0) return toast.warning('Ingrese un monto válido')
    if (!metodo) return toast.warning('Seleccione el método de pago')
    const ventaNum = ventaId.trim() ? Number(ventaId) : null
    if (ventaNum !== null && (!Number.isInteger(ventaNum) || ventaNum <= 0))
      return toast.warning('El número de venta no es válido')
    try {
      await registrar.mutateAsync({
        venta_id: ventaNum,
        monto: Math.round(montoNum * 100) / 100,
        metodo_pago: metodo,
        para: para.trim() || null,
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
          <DialogTitle className="text-navy">Registrar propina</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="usa-tip-monto">Monto (USD)</Label>
              <Input
                id="usa-tip-monto"
                type="number"
                min={0}
                step="0.01"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Método de pago</Label>
              <Select value={metodo} onValueChange={setMetodo}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione" />
                </SelectTrigger>
                <SelectContent>
                  {metodosPago.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="usa-tip-para">Para quién (opcional)</Label>
            <AutocompleteInput
              id="usa-tip-para"
              value={para}
              onChange={setPara}
              options={personas.map((p) => ({ value: p }))}
              heading="Personas con propinas"
              placeholder="Nombre de quien recibe la propina"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="usa-tip-venta">N° de venta (opcional)</Label>
              <Input
                id="usa-tip-venta"
                type="number"
                min={1}
                step={1}
                value={ventaId}
                onChange={(e) => setVentaId(e.target.value)}
                placeholder="Ej: 12"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="usa-tip-fecha">Fecha (opcional)</Label>
              <Input id="usa-tip-fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="usa-tip-notas">Notas (opcional)</Label>
            <Textarea id="usa-tip-notas" rows={2} value={notas} onChange={(e) => setNotas(e.target.value)} />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={registrar.isPending}>
            Cancelar
          </Button>
          <Button variant="secondary" onClick={handleSave} disabled={registrar.isPending}>
            {registrar.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Registrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
