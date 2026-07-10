import { Fragment, useMemo, useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  Gift,
  Loader2,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import type { VentaReporte } from '@/types/reporte'
import { formatCOP } from '@/lib/format'
import { useAuth } from '@/contexts/AuthContext'
import { useBodegas } from '@/hooks/useVentas'
import { useEliminarVenta, useEliminarItemVenta } from '@/hooks/useVentas'
import type { TipoItemVenta } from '@/services/ventaService'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

function fmtFechaHora(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function VentasTable({ ventas }: { ventas: VentaReporte[] }) {
  const { user } = useAuth()
  const isAdmin = user?.esAdmin ?? false
  const { data: bodegas = [] } = useBodegas()
  const eliminar = useEliminarVenta()

  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<number | null>(null)
  const [toDelete, setToDelete] = useState<VentaReporte | null>(null)
  const [bodegaId, setBodegaId] = useState('')
  const [motivo, setMotivo] = useState('')

  const colSpan = isAdmin ? 8 : 7

  function cerrarDialogo() {
    setToDelete(null)
    setBodegaId('')
    setMotivo('')
  }

  async function confirmarEliminar() {
    if (!toDelete) return
    if (!bodegaId) return
    try {
      await eliminar.mutateAsync({
        ventaId: toDelete.id,
        bodegaId: Number(bodegaId),
        motivo: motivo.trim() || undefined,
      })
      cerrarDialogo()
    } catch {
      /* toast lo maneja el hook */
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return ventas
    return ventas.filter((v) => {
      const nombre = `${v.cliente.nombre} ${v.cliente.apellido}`.toLowerCase()
      return nombre.includes(q) || String(v.id).includes(q)
    })
  }, [ventas, search])

  return (
    <div className="rounded-xl border bg-white shadow-sm">
      <div className="border-b p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy/60" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por cliente o ID..."
            className="pl-9 pr-9"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Limpiar"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {search && (
          <p className="mt-2 text-xs text-muted-foreground">
            Mostrando {filtered.length} de {ventas.length} ventas
          </p>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8" />
            <TableHead>ID</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead className="hidden sm:table-cell">Fecha</TableHead>
            <TableHead className="text-center">Prods</TableHead>
            <TableHead className="text-center">Servs</TableHead>
            <TableHead className="text-right">Total</TableHead>
            {isAdmin && <TableHead className="w-10" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <TableRow>
              <TableCell colSpan={colSpan} className="py-10 text-center text-muted-foreground">
                No hay ventas en este período
              </TableCell>
            </TableRow>
          ) : (
            filtered.map((v) => {
              const isOpen = expanded === v.id
              const numProds =
                v.productos.length + v.combos.length
              return (
                <Fragment key={v.id}>
                  <TableRow
                    className="cursor-pointer"
                    onClick={() => setExpanded(isOpen ? null : v.id)}
                  >
                    <TableCell>
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </TableCell>
                    <TableCell className="font-medium">#{v.id}</TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {v.cliente.nombre} {v.cliente.apellido}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {v.cliente.documentoidentidad}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {fmtFechaHora(v.fecha)}
                    </TableCell>
                    <TableCell className="text-center">{numProds}</TableCell>
                    <TableCell className="text-center">{v.servicios.length}</TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {formatCOP(v.total)}
                    </TableCell>
                    {isAdmin && (
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setToDelete(v)
                            setBodegaId('')
                            setMotivo('')
                          }}
                          aria-label="Anular venta"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                  {isOpen && (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={colSpan} className="bg-muted/30">
                        <DetalleVenta venta={v} />
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              )
            })
          )}
        </TableBody>
      </Table>

      <AlertDialog
        open={toDelete !== null}
        onOpenChange={(o) => {
          if (!o) cerrarDialogo()
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Anular venta #{toDelete?.id}</AlertDialogTitle>
            <AlertDialogDescription>
              La venta de{' '}
              <span className="font-semibold text-foreground">
                {toDelete ? `${toDelete.cliente.nombre} ${toDelete.cliente.apellido}` : ''}
              </span>{' '}
              se marcará como anulada (se conserva el registro y deja de contar en los
              reportes). Las unidades de productos y combos se devolverán al inventario
              de la bodega que elijas y quedarán en el historial de registros. Los
              servicios no afectan inventario.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Bodega a la que devolver las unidades</Label>
              <Select value={bodegaId} onValueChange={setBodegaId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione una bodega" />
                </SelectTrigger>
                <SelectContent>
                  {bodegas.map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>
                      {b.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Motivo (opcional)</Label>
              <Textarea
                rows={2}
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ej: venta duplicada, error de registro..."
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={eliminar.isPending}>Cancelar</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={confirmarEliminar}
              disabled={eliminar.isPending || !bodegaId}
            >
              {eliminar.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Anular venta
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

interface ItemAAnular {
  tipo: TipoItemVenta
  id: number
  nombre: string
}

function DetalleVenta({ venta }: { venta: VentaReporte }) {
  const { user } = useAuth()
  const isAdmin = user?.esAdmin ?? false
  const { data: bodegas = [] } = useBodegas()
  const eliminarItem = useEliminarItemVenta()

  const [itemToDelete, setItemToDelete] = useState<ItemAAnular | null>(null)
  const [bodegaId, setBodegaId] = useState('')
  const [motivo, setMotivo] = useState('')

  // Servicios no afectan inventario; productos y combos exigen bodega destino
  const requiereBodega = itemToDelete?.tipo !== 'servicio'
  const totalItems =
    venta.productos.length + venta.servicios.length + venta.combos.length
  const esUltimoItem = totalItems === 1

  function abrirDialogo(item: ItemAAnular) {
    setItemToDelete(item)
    setBodegaId('')
    setMotivo('')
  }

  function cerrarDialogo() {
    setItemToDelete(null)
    setBodegaId('')
    setMotivo('')
  }

  async function confirmarEliminarItem() {
    if (!itemToDelete) return
    if (requiereBodega && !bodegaId) return
    try {
      await eliminarItem.mutateAsync({
        ventaId: venta.id,
        tipo: itemToDelete.tipo,
        itemId: itemToDelete.id,
        bodegaId: requiereBodega ? Number(bodegaId) : undefined,
        motivo: motivo.trim() || undefined,
      })
      cerrarDialogo()
    } catch {
      /* toast lo maneja el hook */
    }
  }

  function BotonAnularItem({ item }: { item: ItemAAnular }) {
    if (!isAdmin) return null
    return (
      <button
        onClick={() => abrirDialogo(item)}
        className="shrink-0 text-muted-foreground hover:text-destructive"
        aria-label={`Anular ${item.nombre}`}
        title="Anular item"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    )
  }

  return (
    <div className="grid gap-4 py-2 md:grid-cols-3">
      <div>
        <p className="mb-1 text-xs font-semibold uppercase text-navy">Productos</p>
        {venta.productos.length === 0 ? (
          <p className="text-xs text-muted-foreground">—</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {venta.productos.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-2">
                <span className="truncate">
                  {p.cantidad}× {p.producto_nombre}
                </span>
                <span className="flex items-center gap-2">
                  <span className="tabular-nums text-muted-foreground">
                    {formatCOP(p.subtotal)}
                  </span>
                  <BotonAnularItem
                    item={{
                      tipo: 'producto',
                      id: p.id,
                      nombre: `${p.cantidad}× ${p.producto_nombre}`,
                    }}
                  />
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div>
        <p className="mb-1 text-xs font-semibold uppercase text-navy">Servicios</p>
        {venta.servicios.length === 0 ? (
          <p className="text-xs text-muted-foreground">—</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {venta.servicios.map((s) => (
              <li key={s.id}>
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate">
                    {s.servicio_nombre}
                    {s.es_cortesia && (
                      <Badge variant="info" className="ml-1 gap-1">
                        <Gift className="h-3 w-3" /> Cortesía
                      </Badge>
                    )}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="tabular-nums text-muted-foreground">
                      {formatCOP(s.precio)}
                    </span>
                    <BotonAnularItem
                      item={{ tipo: 'servicio', id: s.id, nombre: s.servicio_nombre }}
                    />
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {s.estilista.nombre}
                  {!s.es_cortesia &&
                    ` · comisión ${formatCOP(s.pago_estilista)} (${s.porcentaje_estilista}%)`}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div>
        <p className="mb-1 text-xs font-semibold uppercase text-navy">Combos</p>
        {venta.combos.length === 0 ? (
          <p className="text-xs text-muted-foreground">—</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {venta.combos.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-2">
                <span className="truncate">
                  {c.cantidad}× {c.combo_nombre}
                </span>
                <span className="flex items-center gap-2">
                  <span className="tabular-nums text-muted-foreground">
                    {formatCOP(c.subtotal)}
                  </span>
                  <BotonAnularItem
                    item={{
                      tipo: 'combo',
                      id: c.id,
                      nombre: `${c.cantidad}× ${c.combo_nombre}`,
                    }}
                  />
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <AlertDialog
        open={itemToDelete !== null}
        onOpenChange={(o) => {
          if (!o) cerrarDialogo()
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Anular item de la venta #{venta.id}
            </AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-semibold text-foreground">
                {itemToDelete?.nombre}
              </span>{' '}
              se marcará como anulado (se conserva el registro y deja de contar en
              los reportes).{' '}
              {itemToDelete?.tipo === 'servicio'
                ? 'Los servicios no afectan inventario.'
                : 'Las unidades se devolverán al inventario de la bodega que elijas y quedarán en el historial de registros.'}
              {esUltimoItem &&
                ' Es el último item activo de la venta: al anularlo, la venta completa quedará anulada.'}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-3">
            {requiereBodega && (
              <div className="space-y-1.5">
                <Label>Bodega a la que devolver las unidades</Label>
                <Select value={bodegaId} onValueChange={setBodegaId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione una bodega" />
                  </SelectTrigger>
                  <SelectContent>
                    {bodegas.map((b) => (
                      <SelectItem key={b.id} value={String(b.id)}>
                        {b.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Motivo (opcional)</Label>
              <Textarea
                rows={2}
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ej: item registrado por error, devolución..."
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={eliminarItem.isPending}>
              Cancelar
            </AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={confirmarEliminarItem}
              disabled={eliminarItem.isPending || (requiereBodega && !bodegaId)}
            >
              {eliminarItem.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Anular item
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
