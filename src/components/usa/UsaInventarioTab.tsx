import { useMemo, useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  Boxes,
  History,
  Loader2,
  Pencil,
  Plus,
  Search,
  Wallet,
  X,
} from 'lucide-react'
import { useUsaMovimientos, useUsaProductos } from '@/hooks/useUsa'
import { presetRange, type DateRange } from '@/lib/dateRange'
import { formatFechaHora, formatUSD } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { UsaProducto, UsaTipoMovimiento } from '@/types/usa'
import { DateRangeControl } from '@/components/reportes/DateRangeControl'
import { StatCard } from '@/components/reportes/StatCard'
import { UsaStockDialog, type UsaStockModo } from '@/components/usa/UsaStockDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const UMBRAL_BAJO = 3

type Sub = 'existencias' | 'movimientos'

const TIPO_LABEL: Record<UsaTipoMovimiento, { label: string; variant: 'success' | 'info' | 'secondary' | 'outline' }> = {
  entrada: { label: 'Entrada', variant: 'success' },
  ajuste: { label: 'Ajuste', variant: 'info' },
  venta: { label: 'Venta', variant: 'secondary' },
  devolucion: { label: 'Devolución', variant: 'outline' },
}

// Inventario del Módulo USA (una sola bodega, separado de las bodegas de Colombia).
export function UsaInventarioTab() {
  const [sub, setSub] = useState<Sub>('existencias')
  const [search, setSearch] = useState('')
  const [range, setRange] = useState<DateRange>(() => presetRange('mes'))

  const [dialogOpen, setDialogOpen] = useState(false)
  const [modo, setModo] = useState<UsaStockModo>('entrada')
  const [productoSel, setProductoSel] = useState<UsaProducto | null>(null)

  const productosQ = useUsaProductos()
  const movimientosQ = useUsaMovimientos(range)

  const productos = useMemo(() => productosQ.data ?? [], [productosQ.data])
  const movimientos = movimientosQ.data ?? []

  const filtrados = useMemo(() => {
    const q = search.trim().toLowerCase()
    return q ? productos.filter((p) => p.nombre.toLowerCase().includes(q)) : productos
  }, [productos, search])

  const kpis = useMemo(() => {
    const unidades = productos.reduce((s, p) => s + p.cantidad, 0)
    const valorCosto = productos.reduce((s, p) => s + p.cantidad * p.costo, 0)
    const valorVenta = productos.reduce((s, p) => s + p.cantidad * p.precio_venta, 0)
    const bajos = productos.filter((p) => p.cantidad <= UMBRAL_BAJO).length
    return { unidades, valorCosto, valorVenta, bajos }
  }, [productos])

  function openDialog(m: UsaStockModo, p: UsaProducto | null = null) {
    setModo(m)
    setProductoSel(p)
    setDialogOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Productos" value={String(productos.length)} icon={Boxes} />
        <StatCard label="Unidades" value={String(kpis.unidades)} icon={Boxes} />
        <StatCard
          label="Valor a costo"
          value={formatUSD(kpis.valorCosto)}
          subtitle={`A precio de venta ${formatUSD(kpis.valorVenta)}`}
          icon={Wallet}
        />
        <StatCard
          label="Stock bajo"
          value={String(kpis.bajos)}
          subtitle={`≤ ${UMBRAL_BAJO} unidades`}
          icon={AlertTriangle}
          tone={kpis.bajos > 0 ? 'warning' : 'default'}
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 rounded-lg border bg-white p-1 shadow-sm">
          {(
            [
              { key: 'existencias', label: 'Existencias', icon: Boxes },
              { key: 'movimientos', label: 'Movimientos', icon: History },
            ] as { key: Sub; label: string; icon: typeof Boxes }[]
          ).map((t) => (
            <button
              key={t.key}
              onClick={() => setSub(t.key)}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                sub === t.key ? 'bg-navy text-white' : 'text-muted-foreground hover:bg-muted',
              )}
            >
              <t.icon className="h-4 w-4" /> {t.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => openDialog('ajuste')} disabled={productos.length === 0}>
            <Pencil className="h-4 w-4" /> Ajustar
          </Button>
          <Button variant="secondary" onClick={() => openDialog('entrada')} disabled={productos.length === 0}>
            <Plus className="h-4 w-4" /> Entrada
          </Button>
        </div>
      </div>

      {sub === 'existencias' ? (
        <>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9 pr-9"
              placeholder="Buscar producto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Limpiar búsqueda"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {productosQ.isError ? (
            <ErrorBox onRetry={() => productosQ.refetch()} texto="Error al cargar el inventario" />
          ) : productosQ.isLoading ? (
            <LoadingBox />
          ) : (
            <div className="rounded-xl border bg-white shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead className="hidden sm:table-cell text-right">Costo</TableHead>
                    <TableHead className="hidden sm:table-cell text-right">Precio</TableHead>
                    <TableHead className="hidden md:table-cell text-right">Valor (costo)</TableHead>
                    <TableHead className="w-24" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtrados.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                        {productos.length === 0
                          ? 'Aún no hay productos USA. Créelos en la pestaña Catálogo.'
                          : 'Sin coincidencias'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtrados.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {p.nombre}
                            {p.cantidad <= UMBRAL_BAJO && (
                              <Badge variant="outline" className="gap-1 text-orange-600">
                                <AlertTriangle className="h-3 w-3" /> Bajo
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell
                          className={cn(
                            'text-right font-semibold tabular-nums',
                            p.cantidad === 0 ? 'text-destructive' : 'text-navy',
                          )}
                        >
                          {p.cantidad}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-right tabular-nums text-muted-foreground">
                          {formatUSD(p.costo)}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-right tabular-nums">
                          {formatUSD(p.precio_venta)}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-right tabular-nums">
                          {formatUSD(p.cantidad * p.costo)}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openDialog('entrada', p)}
                              aria-label="Entrada"
                            >
                              <Plus className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openDialog('ajuste', p)}
                              aria-label="Ajustar"
                            >
                              <Pencil className="h-4 w-4 text-navy" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      ) : (
        <>
          <DateRangeControl value={range} onChange={setRange} />
          {movimientosQ.isError ? (
            <ErrorBox onRetry={() => movimientosQ.refetch()} texto="Error al cargar los movimientos" />
          ) : movimientosQ.isLoading ? (
            <LoadingBox />
          ) : (
            <div className="rounded-xl border bg-white shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Cambio</TableHead>
                    <TableHead className="hidden sm:table-cell text-right">Quedó</TableHead>
                    <TableHead className="hidden md:table-cell">Observaciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movimientos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                        No hay movimientos en este período
                      </TableCell>
                    </TableRow>
                  ) : (
                    movimientos.map((m) => {
                      const t = TIPO_LABEL[m.tipo] ?? { label: m.tipo, variant: 'outline' as const }
                      return (
                        <TableRow key={m.id}>
                          <TableCell className="text-muted-foreground">{formatFechaHora(m.fecha)}</TableCell>
                          <TableCell className="font-medium">{m.producto_nombre}</TableCell>
                          <TableCell>
                            <Badge variant={t.variant}>{t.label}</Badge>
                          </TableCell>
                          <TableCell
                            className={cn(
                              'text-right font-semibold tabular-nums',
                              m.cantidad > 0 ? 'text-green-600' : m.cantidad < 0 ? 'text-destructive' : '',
                            )}
                          >
                            {m.cantidad > 0 ? `+${m.cantidad}` : m.cantidad}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-right tabular-nums">
                            {m.cantidad_resultante}
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-muted-foreground">
                            {m.observaciones ?? '—'}
                            {m.usuario_nombre && (
                              <span className="block text-xs">por {m.usuario_nombre}</span>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}

      <UsaStockDialog
        open={dialogOpen}
        modo={modo}
        productos={productos}
        productoInicial={productoSel}
        onOpenChange={setDialogOpen}
      />
    </div>
  )
}

function LoadingBox() {
  return (
    <div className="flex items-center justify-center gap-2 rounded-xl border bg-white py-16 text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin text-gold" /> Cargando...
    </div>
  )
}

function ErrorBox({ texto, onRetry }: { texto: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border bg-white py-16 text-center">
      <AlertCircle className="h-10 w-10 text-destructive" />
      <p className="text-destructive">{texto}</p>
      <Button variant="outline" onClick={onRetry}>
        Reintentar
      </Button>
    </div>
  )
}
