import { useMemo, useState } from 'react'
import { AlertCircle, Loader2, Package, Pencil, Plus, Sparkles } from 'lucide-react'
import {
  useUsaActualizarProducto,
  useUsaActualizarServicio,
  useUsaProductos,
  useUsaServicios,
} from '@/hooks/useUsa'
import { formatUSD } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { UsaProducto, UsaServicio } from '@/types/usa'
import { UsaProductoFormDialog } from '@/components/usa/UsaProductoFormDialog'
import { UsaServicioFormDialog } from '@/components/usa/UsaServicioFormDialog'
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

type Sub = 'productos' | 'servicios'

// Catálogo del Módulo USA: productos y servicios propios (independientes de Colombia).
export function UsaCatalogoTab() {
  const [sub, setSub] = useState<Sub>('productos')
  const [verInactivos, setVerInactivos] = useState(false)

  const productosQ = useUsaProductos(verInactivos)
  const serviciosQ = useUsaServicios(verInactivos)
  const actualizarProducto = useUsaActualizarProducto()
  const actualizarServicio = useUsaActualizarServicio()

  const [prodFormOpen, setProdFormOpen] = useState(false)
  const [prodEditing, setProdEditing] = useState<UsaProducto | null>(null)
  const [servFormOpen, setServFormOpen] = useState(false)
  const [servEditing, setServEditing] = useState<UsaServicio | null>(null)

  const productos = productosQ.data ?? []
  const servicios = useMemo(() => serviciosQ.data ?? [], [serviciosQ.data])

  const categorias = useMemo(
    () => [...new Set(servicios.map((s) => s.categoria))].sort((a, b) => a.localeCompare(b, 'es')),
    [servicios],
  )

  const q = sub === 'productos' ? productosQ : serviciosQ

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 rounded-lg border bg-white p-1 shadow-sm">
          {(
            [
              { key: 'productos', label: 'Productos', icon: Package },
              { key: 'servicios', label: 'Servicios', icon: Sparkles },
            ] as { key: Sub; label: string; icon: typeof Package }[]
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
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <Switch checked={verInactivos} onCheckedChange={setVerInactivos} />
            Ver inactivos
          </label>
          {sub === 'productos' ? (
            <Button
              variant="secondary"
              onClick={() => {
                setProdEditing(null)
                setProdFormOpen(true)
              }}
            >
              <Plus className="h-4 w-4" /> Nuevo producto
            </Button>
          ) : (
            <Button
              variant="secondary"
              onClick={() => {
                setServEditing(null)
                setServFormOpen(true)
              }}
            >
              <Plus className="h-4 w-4" /> Nuevo servicio
            </Button>
          )}
        </div>
      </div>

      {q.isError ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border bg-white py-16 text-center">
          <AlertCircle className="h-10 w-10 text-destructive" />
          <p className="text-destructive">Error al cargar el catálogo</p>
          <Button variant="outline" onClick={() => q.refetch()}>
            Reintentar
          </Button>
        </div>
      ) : q.isLoading ? (
        <div className="flex items-center justify-center gap-2 rounded-xl border bg-white py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-gold" /> Cargando...
        </div>
      ) : sub === 'productos' ? (
        <div className="rounded-xl border bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead className="text-right">Precio</TableHead>
                <TableHead className="hidden sm:table-cell text-right">Costo</TableHead>
                <TableHead className="hidden md:table-cell text-right">Margen</TableHead>
                <TableHead className="hidden sm:table-cell text-right">Stock</TableHead>
                <TableHead className="text-center">Activo</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {productos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    No hay productos USA. Cree el primero con «Nuevo producto».
                  </TableCell>
                </TableRow>
              ) : (
                productos.map((p) => {
                  const margen = p.precio_venta > 0 ? ((p.precio_venta - p.costo) / p.precio_venta) * 100 : 0
                  return (
                    <TableRow key={p.id} className={cn(!p.activo && 'opacity-60')}>
                      <TableCell className="font-medium">
                        {p.nombre}
                        {!p.activo && (
                          <Badge variant="outline" className="ml-2">
                            Inactivo
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums text-navy">
                        {formatUSD(p.precio_venta)}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-right tabular-nums text-muted-foreground">
                        {formatUSD(p.costo)}
                      </TableCell>
                      <TableCell
                        className={cn(
                          'hidden md:table-cell text-right tabular-nums',
                          margen < 0 ? 'text-destructive' : 'text-green-600',
                        )}
                      >
                        {margen.toFixed(0)}%
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-right tabular-nums">{p.cantidad}</TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={p.activo}
                          disabled={actualizarProducto.isPending}
                          onCheckedChange={(v) =>
                            actualizarProducto.mutate({ id: p.id, payload: { activo: v } })
                          }
                          aria-label={p.activo ? 'Desactivar producto' : 'Activar producto'}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setProdEditing(p)
                            setProdFormOpen(true)
                          }}
                          aria-label="Editar producto"
                        >
                          <Pencil className="h-4 w-4 text-navy" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="rounded-xl border bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Categoría</TableHead>
                <TableHead>Servicio</TableHead>
                <TableHead className="text-right">Precio</TableHead>
                <TableHead className="text-center">Activo</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {servicios.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    No hay servicios USA. Cree el primero con «Nuevo servicio».
                  </TableCell>
                </TableRow>
              ) : (
                servicios.map((s) => (
                  <TableRow key={s.id} className={cn(!s.activo && 'opacity-60')}>
                    <TableCell className="text-muted-foreground">{s.categoria}</TableCell>
                    <TableCell className="font-medium">
                      {s.nombre}
                      {!s.activo && (
                        <Badge variant="outline" className="ml-2">
                          Inactivo
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums text-navy">
                      {formatUSD(s.precio)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={s.activo}
                        disabled={actualizarServicio.isPending}
                        onCheckedChange={(v) =>
                          actualizarServicio.mutate({ id: s.id, payload: { activo: v } })
                        }
                        aria-label={s.activo ? 'Desactivar servicio' : 'Activar servicio'}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setServEditing(s)
                          setServFormOpen(true)
                        }}
                        aria-label="Editar servicio"
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
      )}

      <UsaProductoFormDialog open={prodFormOpen} onOpenChange={setProdFormOpen} producto={prodEditing} />
      <UsaServicioFormDialog
        open={servFormOpen}
        onOpenChange={setServFormOpen}
        servicio={servEditing}
        categorias={categorias}
      />
    </div>
  )
}
