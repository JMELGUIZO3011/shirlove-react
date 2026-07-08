import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  Layers,
  Loader2,
  Pencil,
  Plus,
  Search,
  Wallet,
  X,
} from 'lucide-react'
import {
  useInventario,
  useMovimientos,
  useRegistros,
} from '@/hooks/useInventario'
import { costoUnitario } from '@/types/inventario'
import type {
  InventarioItem,
  MovimientoBodega,
  RegistroInventario,
} from '@/types/inventario'
import { mapBodega } from '@/types/venta'
import { formatCOP } from '@/lib/format'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/components/PageHeader'
import { StatCard } from '@/components/reportes/StatCard'
import { AgregarStockDialog } from '@/components/inventario/AgregarStockDialog'
import { EditarCantidadDialog } from '@/components/inventario/EditarCantidadDialog'
import { MovimientoDialog } from '@/components/inventario/MovimientoDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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

const UMBRAL_BAJO = 5

type Tab = 'existencias' | 'movimientos' | 'registros'
const TABS: { key: Tab; label: string }[] = [
  { key: 'existencias', label: 'Existencias' },
  { key: 'movimientos', label: 'Movimientos' },
  { key: 'registros', label: 'Registros' },
]

function fmtFechaHora(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function InventarioPage() {
  const [tab, setTab] = useState<Tab>('existencias')
  const [addOpen, setAddOpen] = useState(false)
  const [moveOpen, setMoveOpen] = useState(false)
  const [editItem, setEditItem] = useState<InventarioItem | null>(null)

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-gray-100 to-white">
      <PageHeader
        title="Inventario"
        subtitle="Existencias, movimientos y registros"
        actions={
          <>
            <Button
              variant="ghost"
              className="text-white hover:bg-white/10 hover:text-white"
              onClick={() => setMoveOpen(true)}
            >
              <ArrowRight className="h-4 w-4" />
              <span className="hidden sm:inline">Transferir</span>
            </Button>
            <Button
              variant="ghost"
              className="text-white hover:bg-white/10 hover:text-white"
              onClick={() => setAddOpen(true)}
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Agregar stock</span>
            </Button>
          </>
        }
      />

      <div className="mx-auto w-full max-w-6xl flex-1 space-y-4 p-4 sm:p-6">
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

        {tab === 'existencias' && <ExistenciasTab onEdit={setEditItem} />}
        {tab === 'movimientos' && <MovimientosTab />}
        {tab === 'registros' && <RegistrosTab />}
      </div>

      <AgregarStockDialog open={addOpen} onOpenChange={setAddOpen} />
      <MovimientoDialog open={moveOpen} onOpenChange={setMoveOpen} />
      <EditarCantidadDialog item={editItem} onClose={() => setEditItem(null)} />
    </div>
  )
}

function ExistenciasTab({ onEdit }: { onEdit: (item: InventarioItem) => void }) {
  const { data: items = [], isLoading, isError, refetch } = useInventario()
  const [search, setSearch] = useState('')
  const [bodegaId, setBodegaId] = useState('all')

  const bodegas = useMemo(() => {
    const map = new Map<number, string>()
    for (const it of items) map.set(it.bodega.id, it.bodega.nombre)
    return [...map.entries()].map(([id, nombre]) => ({ id, nombre }))
  }, [items])

  const conValor = useMemo(
    () =>
      items.map((it) => ({
        item: it,
        valor: costoUnitario(it.producto, mapBodega(it.bodega).paisId) * it.cantidad,
      })),
    [items],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return conValor.filter(
      ({ item }) =>
        (bodegaId === 'all' || String(item.bodega.id) === bodegaId) &&
        (q === '' ||
          item.producto.nombre.toLowerCase().includes(q) ||
          String(item.producto.id).includes(q)),
    )
  }, [conValor, search, bodegaId])

  const kpis = useMemo(() => {
    const unidades = items.reduce((s, i) => s + i.cantidad, 0)
    const valorTotal = conValor.reduce((s, x) => s + x.valor, 0)
    const bajo = items.filter((i) => i.cantidad > 0 && i.cantidad <= UMBRAL_BAJO).length
    return { unidades, valorTotal, bajo }
  }, [items, conValor])

  if (isError)
    return (
      <ErrorBox onRetry={refetch} />
    )
  if (isLoading) return <LoadingBox />

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Registros" value={String(items.length)} icon={Layers} />
        <StatCard label="Unidades" value={String(kpis.unidades)} icon={Boxes} />
        <StatCard
          label="Valor inventario"
          value={formatCOP(kpis.valorTotal)}
          subtitle="Precio de costo"
          icon={Wallet}
        />
        <StatCard
          label={`Stock bajo (≤${UMBRAL_BAJO})`}
          value={String(kpis.bajo)}
          icon={AlertTriangle}
          tone={kpis.bajo > 0 ? 'warning' : 'default'}
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy/60" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar producto..."
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
        <Select value={bodegaId} onValueChange={setBodegaId}>
          <SelectTrigger className="sm:w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las bodegas</SelectItem>
            {bodegas.map((b) => (
              <SelectItem key={b.id} value={String(b.id)}>
                {b.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead className="hidden sm:table-cell">Bodega</TableHead>
              <TableHead className="text-right">Cantidad</TableHead>
              <TableHead className="hidden md:table-cell text-right">Valor (costo)</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  No se encontraron existencias
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(({ item, valor }) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.producto.nombre}</TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    {item.bodega.nombre}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="inline-flex items-center gap-2">
                      {item.cantidad > 0 && item.cantidad <= UMBRAL_BAJO && (
                        <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                          bajo
                        </Badge>
                      )}
                      {item.cantidad === 0 && (
                        <Badge variant="secondary" className="bg-red-100 text-red-700">
                          agotado
                        </Badge>
                      )}
                      <span className="font-semibold tabular-nums">{item.cantidad}</span>
                    </span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-right tabular-nums text-muted-foreground">
                    {formatCOP(valor)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onEdit(item)}
                    >
                      <Pencil className="h-4 w-4 text-navy" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <p className="text-right text-xs text-muted-foreground">
        {filtered.length} de {items.length} registros
      </p>
    </div>
  )
}

// Filtro compartido de historial (búsqueda + rango de fechas)
function useHistorialFiltro<T extends { fecha: string }>(
  data: T[],
  matchText: (item: T, q: string) => boolean,
) {
  const [search, setSearch] = useState('')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return data
      .filter((item) => {
        if (q && !matchText(item, q)) return false
        const fecha = item.fecha.slice(0, 10)
        if (desde && fecha < desde) return false
        if (hasta && fecha > hasta) return false
        return true
      })
      .slice()
      .sort((a, b) => b.fecha.localeCompare(a.fecha))
  }, [data, search, desde, hasta, matchText])

  return { search, setSearch, desde, setDesde, hasta, setHasta, filtered }
}

function HistorialControles({
  search,
  setSearch,
  desde,
  setDesde,
  hasta,
  setHasta,
  placeholder,
}: {
  search: string
  setSearch: (v: string) => void
  desde: string
  setDesde: (v: string) => void
  hasta: string
  setHasta: (v: string) => void
  placeholder: string
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy/60" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={placeholder}
          className="pl-9"
        />
      </div>
      <Input
        type="date"
        className="sm:w-40"
        value={desde}
        onChange={(e) => setDesde(e.target.value)}
      />
      <Input
        type="date"
        className="sm:w-40"
        value={hasta}
        onChange={(e) => setHasta(e.target.value)}
      />
      {(search || desde || hasta) && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSearch('')
            setDesde('')
            setHasta('')
          }}
        >
          Limpiar
        </Button>
      )}
    </div>
  )
}

function MovimientosTab() {
  const { data = [], isLoading, isError, refetch } = useMovimientos()
  const f = useHistorialFiltro<MovimientoBodega>(data, (m, q) =>
    [m.producto.nombre, m.bodega_origen.nombre, m.bodega_destino.nombre, m.observaciones ?? '']
      .join(' ')
      .toLowerCase()
      .includes(q),
  )

  if (isError) return <ErrorBox onRetry={refetch} />
  if (isLoading) return <LoadingBox />

  return (
    <div className="space-y-4">
      <HistorialControles {...f} placeholder="Buscar por producto, bodega u observación..." />
      <div className="rounded-xl border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead>Transferencia</TableHead>
              <TableHead className="text-right">Cantidad</TableHead>
              <TableHead className="hidden md:table-cell">Fecha</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {f.filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                  No hay movimientos
                </TableCell>
              </TableRow>
            ) : (
              f.filtered.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.producto.nombre}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                      {m.bodega_origen.nombre}
                      <ArrowRight className="h-3.5 w-3.5" />
                      {m.bodega_destino.nombre}
                    </span>
                    {m.observaciones && (
                      <p className="text-xs text-muted-foreground">{m.observaciones}</p>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">
                    {m.cantidad}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {fmtFechaHora(m.fecha)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function RegistrosTab() {
  const { data = [], isLoading, isError, refetch } = useRegistros()
  const f = useHistorialFiltro<RegistroInventario>(data, (r, q) =>
    [r.producto.nombre, r.bodega.nombre, r.observaciones ?? '']
      .join(' ')
      .toLowerCase()
      .includes(q),
  )

  if (isError) return <ErrorBox onRetry={refetch} />
  if (isLoading) return <LoadingBox />

  return (
    <div className="space-y-4">
      <HistorialControles {...f} placeholder="Buscar en registros..." />
      <div className="rounded-xl border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead className="hidden sm:table-cell">Bodega</TableHead>
              <TableHead>Observación</TableHead>
              <TableHead className="text-right">Cantidad</TableHead>
              <TableHead className="hidden md:table-cell">Fecha</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {f.filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  No hay registros
                </TableCell>
              </TableRow>
            ) : (
              f.filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.producto.nombre}</TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    {r.bodega.nombre}
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                    {r.observaciones ?? '—'}
                  </TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">
                    {r.cantidad}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {fmtFechaHora(r.fecha)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function LoadingBox() {
  return (
    <div className="flex items-center justify-center gap-2 rounded-xl border bg-white py-20 text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin text-gold" /> Cargando...
    </div>
  )
}

function ErrorBox({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border bg-white py-20 text-center">
      <AlertTriangle className="h-10 w-10 text-destructive" />
      <p className="text-destructive">Error al cargar los datos</p>
      <Button variant="outline" onClick={onRetry}>
        Reintentar
      </Button>
    </div>
  )
}
