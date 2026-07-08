import { useMemo, useState } from 'react'
import {
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Loader2,
  Pencil,
  Plus,
  Search,
  Tag,
  Trash2,
  X,
} from 'lucide-react'
import { useEliminarPrecio, useProductosAdmin } from '@/hooks/useProductosAdmin'
import type { ProductoAdmin, ProductoPrecio } from '@/types/producto'
import { formatMoneyByPais } from '@/lib/format'
import { PageHeader } from '@/components/PageHeader'
import { ProductoFormDialog } from '@/components/productos/ProductoFormDialog'
import { PrecioDialog } from '@/components/productos/PrecioDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export function GestionProductosPage() {
  const { data: productos = [], isLoading, isError, refetch } = useProductosAdmin()
  const eliminarPrecio = useEliminarPrecio()

  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<number | null>(null)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<ProductoAdmin | null>(null)

  const [precioDialog, setPrecioDialog] = useState<{
    productoId?: number
    precio?: ProductoPrecio | null
  } | null>(null)
  const [precioToDelete, setPrecioToDelete] = useState<ProductoPrecio | null>(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return productos
    return productos.filter(
      (p) => p.nombre.toLowerCase().includes(q) || String(p.id).includes(q),
    )
  }, [productos, search])

  async function confirmarEliminarPrecio() {
    if (!precioToDelete) return
    try {
      await eliminarPrecio.mutateAsync(precioToDelete.id)
      setPrecioToDelete(null)
    } catch {
      /* toast lo maneja el hook */
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-gray-100 to-white">
      <PageHeader
        title="Gestión de Productos"
        subtitle="Productos y sus precios por tipo y país"
        actions={
          <Button
            variant="ghost"
            className="text-white hover:bg-white/10 hover:text-white"
            onClick={() => {
              setEditing(null)
              setFormOpen(true)
            }}
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nuevo producto</span>
          </Button>
        }
      />

      <div className="mx-auto w-full max-w-4xl flex-1 space-y-4 p-4 sm:p-6">
        <div className="relative">
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

        {isError ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border bg-white py-16 text-center">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <p className="text-destructive">Error al cargar los productos</p>
            <Button variant="outline" onClick={() => refetch()}>
              Reintentar
            </Button>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center gap-2 rounded-xl border bg-white py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin text-gold" /> Cargando...
          </div>
        ) : (
          <>
            <div className="divide-y overflow-hidden rounded-xl border bg-white shadow-sm">
              {filtered.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  No se encontraron productos
                </p>
              ) : (
                filtered.map((p) => {
                  const isOpen = expanded === p.id
                  return (
                    <div key={p.id}>
                      <button
                        onClick={() => setExpanded(isOpen ? null : p.id)}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/50"
                      >
                        {isOpen ? (
                          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                        )}
                        <span className="flex-1 font-medium">{p.nombre}</span>
                        <Badge variant="secondary">
                          {p.precios.length}{' '}
                          {p.precios.length === 1 ? 'precio' : 'precios'}
                        </Badge>
                      </button>

                      {isOpen && (
                        <div className="space-y-3 bg-muted/30 px-4 py-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-navy">
                              Precios
                            </span>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditing(p)
                                  setFormOpen(true)
                                }}
                              >
                                <Pencil className="h-4 w-4" /> Nombre
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setPrecioDialog({ productoId: p.id })}
                              >
                                <Plus className="h-4 w-4" /> Precio
                              </Button>
                            </div>
                          </div>

                          {p.precios.length === 0 ? (
                            <p className="rounded-md border border-dashed py-3 text-center text-sm text-muted-foreground">
                              Sin precios configurados
                            </p>
                          ) : (
                            <ul className="grid gap-2 sm:grid-cols-2">
                              {p.precios.map((precio) => (
                                <li
                                  key={precio.id}
                                  className="flex items-center justify-between rounded-md border bg-white px-3 py-2 text-sm"
                                >
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <Tag className="h-3.5 w-3.5 text-gold" />
                                      <span className="truncate font-medium">
                                        {precio.tipo_precio_nombre}
                                      </span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                      {precio.pais_nombre}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold tabular-nums">
                                      {formatMoneyByPais(precio.precio, precio.pais_nombre)}
                                    </span>
                                    <button
                                      onClick={() =>
                                        setPrecioDialog({ precio })
                                      }
                                      className="text-muted-foreground hover:text-navy"
                                      aria-label="Editar precio"
                                    >
                                      <Pencil className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      onClick={() => setPrecioToDelete(precio)}
                                      className="text-muted-foreground hover:text-destructive"
                                      aria-label="Eliminar precio"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
            <p className="text-right text-xs text-muted-foreground">
              {filtered.length} de {productos.length} productos
            </p>
          </>
        )}
      </div>

      <ProductoFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        producto={editing}
      />

      <PrecioDialog
        open={precioDialog !== null}
        onClose={() => setPrecioDialog(null)}
        productoId={precioDialog?.productoId}
        precioExistente={precioDialog?.precio}
      />

      <AlertDialog
        open={precioToDelete !== null}
        onOpenChange={(o) => !o && setPrecioToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar precio</AlertDialogTitle>
            <AlertDialogDescription>
              {precioToDelete && (
                <>
                  ¿Eliminar el precio {precioToDelete.tipo_precio_nombre} (
                  {precioToDelete.pais_nombre})? Esta acción no se puede deshacer.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={eliminarPrecio.isPending}>
              Cancelar
            </AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={confirmarEliminarPrecio}
              disabled={eliminarPrecio.isPending}
            >
              {eliminarPrecio.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Eliminar
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
