import { Fragment, useState } from 'react'
import {
  AlertCircle,
  Ban,
  ChevronDown,
  ChevronRight,
  DollarSign,
  Loader2,
  Package,
  Receipt,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useUsaAnularVenta, useUsaResumen, useUsaVentas } from '@/hooks/useUsa'
import { presetRange, type DateRange } from '@/lib/dateRange'
import { formatFechaHora, formatUSD } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { UsaVenta } from '@/types/usa'
import { DateRangeControl } from '@/components/reportes/DateRangeControl'
import { StatCard } from '@/components/reportes/StatCard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
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

// Historial y resumen de ventas USA del período (solo datos del módulo USA).
export function UsaHistorialTab() {
  const { user } = useAuth()
  const [range, setRange] = useState<DateRange>(() => presetRange('mes'))
  const [verAnuladas, setVerAnuladas] = useState(false)
  const [expanded, setExpanded] = useState<number | null>(null)
  const [toAnular, setToAnular] = useState<UsaVenta | null>(null)
  const [motivo, setMotivo] = useState('')

  const ventasQ = useUsaVentas(range, verAnuladas)
  const resumenQ = useUsaResumen(range)
  const anular = useUsaAnularVenta()

  const ventas = ventasQ.data ?? []
  const resumen = resumenQ.data

  async function confirmarAnular() {
    if (!toAnular) return
    try {
      await anular.mutateAsync({ id: toAnular.id, motivo: motivo.trim() || undefined })
      setToAnular(null)
      setMotivo('')
    } catch {
      /* toast lo maneja el hook */
    }
  }

  return (
    <div className="space-y-4">
      <DateRangeControl value={range} onChange={setRange} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          label="Ingresos"
          value={formatUSD(resumen?.ingresos ?? 0)}
          subtitle={`${resumen?.numero_ventas ?? 0} venta(s)`}
          icon={DollarSign}
        />
        <StatCard
          label="Productos"
          value={formatUSD(resumen?.ingresos_productos ?? 0)}
          subtitle={`${resumen?.unidades_vendidas ?? 0} unidad(es)`}
          icon={Package}
        />
        <StatCard
          label="Servicios"
          value={formatUSD(resumen?.ingresos_servicios ?? 0)}
          subtitle={`${resumen?.servicios_prestados ?? 0} servicio(s)`}
          icon={Sparkles}
        />
        <StatCard
          label="Ganancia bruta"
          value={formatUSD(resumen?.ganancia_bruta ?? 0)}
          subtitle={`Costo productos ${formatUSD(resumen?.costo_productos ?? 0)}`}
          icon={TrendingUp}
          tone="positive"
        />
      </div>

      {resumen && resumen.por_metodo_pago.length > 0 && (
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <h3 className="mb-2 text-sm font-semibold text-navy">Por método de pago</h3>
          <div className="flex flex-wrap gap-2">
            {resumen.por_metodo_pago.map((m) => (
              <div
                key={m.metodo_pago}
                className="flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm"
              >
                <span className="text-muted-foreground">{m.metodo_pago}</span>
                <span className="font-semibold tabular-nums">{formatUSD(m.monto)}</span>
                <span className="text-xs text-muted-foreground">({m.ventas})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-navy">
          <Receipt className="h-4 w-4" /> Ventas del período
        </h3>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Switch checked={verAnuladas} onCheckedChange={setVerAnuladas} />
          Ver anuladas
        </label>
      </div>

      {ventasQ.isError ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border bg-white py-16 text-center">
          <AlertCircle className="h-10 w-10 text-destructive" />
          <p className="text-destructive">Error al cargar las ventas</p>
          <Button variant="outline" onClick={() => ventasQ.refetch()}>
            Reintentar
          </Button>
        </div>
      ) : ventasQ.isLoading ? (
        <div className="flex items-center justify-center gap-2 rounded-xl border bg-white py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-gold" /> Cargando...
        </div>
      ) : (
        <div className="rounded-xl border bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>Fecha</TableHead>
                <TableHead className="hidden sm:table-cell">Cliente</TableHead>
                <TableHead className="hidden md:table-cell">Pago</TableHead>
                <TableHead className="hidden md:table-cell">Items</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {ventas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    No hay ventas USA en este período
                  </TableCell>
                </TableRow>
              ) : (
                ventas.map((v) => {
                  const isOpen = expanded === v.id
                  return (
                    <Fragment key={v.id}>
                      <TableRow
                        className={cn('cursor-pointer', v.anulada && 'opacity-60')}
                        onClick={() => setExpanded(isOpen ? null : v.id)}
                      >
                        <TableCell>
                          {isOpen ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">#{v.id}</div>
                          <div className="text-xs text-muted-foreground">{formatFechaHora(v.fecha)}</div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {v.cliente_nombre ?? <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="outline">{v.metodo_pago}</Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                          {v.items.length}
                        </TableCell>
                        <TableCell className="text-right font-semibold tabular-nums text-navy">
                          <div className="flex flex-col items-end gap-1">
                            {formatUSD(v.total)}
                            {v.anulada && <Badge variant="outline" className="text-destructive">Anulada</Badge>}
                          </div>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          {user?.esAdmin && !v.anulada && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setToAnular(v)}
                              aria-label="Anular venta"
                            >
                              <Ban className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                      {isOpen && (
                        <TableRow className="bg-muted/40 hover:bg-muted/40">
                          <TableCell colSpan={7} className="p-0">
                            <div className="space-y-2 px-6 py-3 text-sm">
                              <ul className="divide-y rounded-lg border bg-white">
                                {v.items.map((i) => (
                                  <li key={i.id} className="flex items-center justify-between gap-3 px-3 py-2">
                                    <div className="flex min-w-0 items-center gap-2">
                                      <Badge variant={i.tipo === 'producto' ? 'secondary' : 'info'}>
                                        {i.tipo === 'producto' ? 'Producto' : 'Servicio'}
                                      </Badge>
                                      <span className="truncate">{i.descripcion}</span>
                                      <span className="text-xs text-muted-foreground">
                                        {i.cantidad} × {formatUSD(i.precio_unitario)}
                                      </span>
                                    </div>
                                    <span className="font-medium tabular-nums">{formatUSD(i.subtotal)}</span>
                                  </li>
                                ))}
                              </ul>
                              <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
                                {v.usuario_nombre && <span>Registrada por {v.usuario_nombre}</span>}
                                {v.notas && <span>Notas: {v.notas}</span>}
                                {v.anulada && (
                                  <span className="text-destructive">
                                    Anulada{v.fecha_anulacion ? ` el ${formatFechaHora(v.fecha_anulacion)}` : ''}
                                    {v.motivo_anulacion ? ` · ${v.motivo_anulacion}` : ''}
                                  </span>
                                )}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog open={toAnular !== null} onOpenChange={(o) => !o && setToAnular(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Anular venta USA</AlertDialogTitle>
            <AlertDialogDescription>
              {toAnular && (
                <>
                  ¿Anular la venta #{toAnular.id} por {formatUSD(toAnular.total)}? Los productos
                  volverán al inventario USA. La venta quedará marcada como anulada (no se borra).
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="usa-motivo">Motivo (opcional)</Label>
            <Input id="usa-motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={anular.isPending}>Cancelar</AlertDialogCancel>
            <Button variant="destructive" onClick={confirmarAnular} disabled={anular.isPending}>
              {anular.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Anular
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
