import { Fragment, useMemo, useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  HandCoins,
  Loader2,
  Receipt,
  Trash2,
  Users,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useUsaCuentasPorCobrar, useUsaEliminarAbono } from '@/hooks/useUsa'
import { formatFecha, formatFechaHora, formatUSD } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { UsaAbono, UsaVenta } from '@/types/usa'
import { StatCard } from '@/components/reportes/StatCard'
import { UsaCobroDialog } from '@/components/usa/UsaCobroDialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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

interface Props {
  metodosPago: string[]
}

// Cuentas por cobrar del Módulo USA: ventas a crédito con saldo pendiente.
export function UsaCuentasPorCobrarTab({ metodosPago }: Props) {
  const { user } = useAuth()
  const [verCobradas, setVerCobradas] = useState(false)
  const [expanded, setExpanded] = useState<number | null>(null)
  const [aCobrar, setACobrar] = useState<UsaVenta | null>(null)
  const [abonoAEliminar, setAbonoAEliminar] = useState<{ venta: UsaVenta; abono: UsaAbono } | null>(null)

  const cuentasQ = useUsaCuentasPorCobrar(verCobradas)
  const eliminarAbono = useUsaEliminarAbono()
  const cuentas = useMemo(() => cuentasQ.data ?? [], [cuentasQ.data])

  const kpis = useMemo(() => {
    const pendientes = cuentas.filter((c) => c.saldo_pendiente > 0)
    const porCobrar = pendientes.reduce((s, c) => s + c.saldo_pendiente, 0)
    const vencidas = pendientes.filter((c) => c.dias_vencida > 0)
    const clientas = new Set(pendientes.map((c) => (c.cliente_nombre ?? '').trim().toLowerCase())).size
    return {
      porCobrar,
      pendientes: pendientes.length,
      vencidas: vencidas.length,
      montoVencido: vencidas.reduce((s, c) => s + c.saldo_pendiente, 0),
      clientas,
    }
  }, [cuentas])

  async function confirmarEliminarAbono() {
    if (!abonoAEliminar) return
    try {
      await eliminarAbono.mutateAsync({
        ventaId: abonoAEliminar.venta.id,
        abonoId: abonoAEliminar.abono.id,
      })
      setAbonoAEliminar(null)
    } catch {
      /* toast lo maneja el hook */
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          label="Por cobrar"
          value={formatUSD(kpis.porCobrar)}
          subtitle={`${kpis.pendientes} cuenta(s) pendiente(s)`}
          icon={HandCoins}
          tone={kpis.porCobrar > 0 ? 'warning' : 'default'}
        />
        <StatCard
          label="Vencidas"
          value={String(kpis.vencidas)}
          subtitle={kpis.vencidas > 0 ? `${formatUSD(kpis.montoVencido)} vencidos` : 'Ninguna vencida'}
          icon={AlertTriangle}
          tone={kpis.vencidas > 0 ? 'negative' : 'default'}
        />
        <StatCard label="Clientas con saldo" value={String(kpis.clientas)} icon={Users} />
        <StatCard
          label="Cuentas listadas"
          value={String(cuentas.length)}
          subtitle={verCobradas ? 'Incluye cobradas' : 'Solo pendientes'}
          icon={Receipt}
        />
      </div>

      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-navy">
          <HandCoins className="h-4 w-4" /> Ventas a crédito
        </h3>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Switch checked={verCobradas} onCheckedChange={setVerCobradas} />
          Ver cobradas
        </label>
      </div>

      {cuentasQ.isError ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border bg-white py-16 text-center">
          <AlertCircle className="h-10 w-10 text-destructive" />
          <p className="text-destructive">Error al cargar las cuentas por cobrar</p>
          <Button variant="outline" onClick={() => cuentasQ.refetch()}>
            Reintentar
          </Button>
        </div>
      ) : cuentasQ.isLoading ? (
        <div className="flex items-center justify-center gap-2 rounded-xl border bg-white py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-gold" /> Cargando...
        </div>
      ) : (
        <div className="rounded-xl border bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>Clienta</TableHead>
                <TableHead className="hidden md:table-cell">Vence</TableHead>
                <TableHead className="hidden sm:table-cell text-right">Total</TableHead>
                <TableHead className="hidden sm:table-cell text-right">Abonado</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
                <TableHead className="w-28" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {cuentas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                    <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-green-600" />
                    {verCobradas
                      ? 'No hay ventas a crédito registradas'
                      : 'No hay cuentas pendientes por cobrar'}
                  </TableCell>
                </TableRow>
              ) : (
                cuentas.map((v) => {
                  const isOpen = expanded === v.id
                  const cobrada = v.saldo_pendiente <= 0
                  const vencida = v.dias_vencida > 0
                  return (
                    <Fragment key={v.id}>
                      <TableRow
                        className={cn('cursor-pointer', cobrada && 'opacity-70')}
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
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium">
                              {v.cliente_nombre ?? <span className="text-muted-foreground">Sin nombre</span>}
                            </span>
                            {cobrada ? (
                              <Badge variant="success">Cobrada</Badge>
                            ) : vencida ? (
                              <Badge className="border-transparent bg-destructive text-white">
                                Vencida · {v.dias_vencida} día{v.dias_vencida === 1 ? '' : 's'}
                              </Badge>
                            ) : v.abonado > 0 ? (
                              <Badge variant="info">Abono parcial</Badge>
                            ) : (
                              <Badge className="border-transparent bg-amber-500 text-white">Pendiente</Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Venta #{v.id} · {formatFechaHora(v.fecha)}
                          </div>
                        </TableCell>
                        <TableCell
                          className={cn(
                            'hidden md:table-cell',
                            vencida ? 'font-medium text-destructive' : 'text-muted-foreground',
                          )}
                        >
                          {v.fecha_vencimiento ? formatFecha(`${v.fecha_vencimiento}T00:00:00`) : '—'}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-right tabular-nums">
                          {formatUSD(v.total)}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-right tabular-nums text-muted-foreground">
                          {formatUSD(v.abonado)}
                        </TableCell>
                        <TableCell
                          className={cn(
                            'text-right font-semibold tabular-nums',
                            cobrada ? 'text-green-700' : 'text-amber-700',
                          )}
                        >
                          {formatUSD(v.saldo_pendiente)}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          {!cobrada && (
                            <Button variant="secondary" size="sm" onClick={() => setACobrar(v)}>
                              <HandCoins className="h-4 w-4" />
                              Cobrar
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                      {isOpen && (
                        <TableRow className="bg-muted/40 hover:bg-muted/40">
                          <TableCell colSpan={7} className="p-0">
                            <div className="grid gap-3 px-6 py-3 text-sm md:grid-cols-2">
                              <div>
                                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                  Detalle de la venta
                                </p>
                                <ul className="divide-y rounded-lg border bg-white">
                                  {v.items.map((i) => (
                                    <li key={i.id} className="flex items-center justify-between gap-3 px-3 py-2">
                                      <span className="truncate">
                                        {i.descripcion}
                                        <span className="ml-2 text-xs text-muted-foreground">
                                          {i.cantidad} × {formatUSD(i.precio_unitario)}
                                        </span>
                                      </span>
                                      <span className="font-medium tabular-nums">{formatUSD(i.subtotal)}</span>
                                    </li>
                                  ))}
                                </ul>
                                {v.notas && (
                                  <p className="mt-1 text-xs text-muted-foreground">Notas: {v.notas}</p>
                                )}
                              </div>
                              <div>
                                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                  Cobros registrados
                                </p>
                                {v.abonos.length === 0 ? (
                                  <p className="rounded-lg border bg-white px-3 py-2 text-muted-foreground">
                                    Aún no se ha recibido ningún pago
                                  </p>
                                ) : (
                                  <ul className="divide-y rounded-lg border bg-white">
                                    {v.abonos.map((a) => (
                                      <li key={a.id} className="flex items-center justify-between gap-3 px-3 py-2">
                                        <div className="min-w-0">
                                          <div className="flex items-center gap-2">
                                            <span className="font-medium tabular-nums">{formatUSD(a.monto)}</span>
                                            <Badge variant="outline">{a.metodo_pago}</Badge>
                                          </div>
                                          <p className="text-xs text-muted-foreground">
                                            {formatFechaHora(a.fecha)}
                                            {a.usuario_nombre ? ` · ${a.usuario_nombre}` : ''}
                                            {a.notas ? ` · ${a.notas}` : ''}
                                          </p>
                                        </div>
                                        {user?.esAdmin && (
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => setAbonoAEliminar({ venta: v, abono: a })}
                                            aria-label="Eliminar cobro"
                                          >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                          </Button>
                                        )}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                                {v.fecha_pago_total && (
                                  <p className="mt-1 text-xs text-green-700">
                                    Cobrada en su totalidad el {formatFechaHora(v.fecha_pago_total)}
                                  </p>
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

      <UsaCobroDialog venta={aCobrar} metodosPago={metodosPago} onClose={() => setACobrar(null)} />

      <AlertDialog open={abonoAEliminar !== null} onOpenChange={(o) => !o && setAbonoAEliminar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar cobro</AlertDialogTitle>
            <AlertDialogDescription>
              {abonoAEliminar && (
                <>
                  ¿Eliminar el cobro de {formatUSD(abonoAEliminar.abono.monto)} (
                  {abonoAEliminar.abono.metodo_pago}) de la venta #{abonoAEliminar.venta.id}? El monto
                  volverá a quedar pendiente por cobrar.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={eliminarAbono.isPending}>Cancelar</AlertDialogCancel>
            <Button variant="destructive" onClick={confirmarEliminarAbono} disabled={eliminarAbono.isPending}>
              {eliminarAbono.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Eliminar
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
