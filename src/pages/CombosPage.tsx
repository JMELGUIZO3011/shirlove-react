import { useState } from 'react'
import { AlertCircle, Loader2, Package, Pencil, Plus, Power } from 'lucide-react'
import { useActualizarCombo, useCombosAdmin } from '@/hooks/useCombos'
import type { Combo } from '@/types/venta'
import { formatCOP } from '@/lib/format'
import { PageHeader } from '@/components/PageHeader'
import { ComboFormDialog } from '@/components/combos/ComboFormDialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

export function CombosPage() {
  const [mostrarInactivos, setMostrarInactivos] = useState(false)
  const { data: combos = [], isLoading, isError, refetch } =
    useCombosAdmin(mostrarInactivos)
  const actualizar = useActualizarCombo()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Combo | null>(null)

  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }
  function openEdit(c: Combo) {
    setEditing(c)
    setFormOpen(true)
  }
  function toggleActivo(c: Combo) {
    actualizar.mutate({ id: c.id, payload: { activo: !c.activo } })
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-gray-100 to-white">
      <PageHeader
        title="Combos"
        subtitle="Paquetes de productos con precio especial"
        actions={
          <Button
            variant="ghost"
            className="text-white hover:bg-white/10 hover:text-white"
            onClick={openCreate}
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nuevo combo</span>
          </Button>
        }
      />

      <div className="mx-auto w-full max-w-5xl flex-1 space-y-4 p-4 sm:p-6">
        <div className="flex items-center gap-2">
          <Switch
            id="inactivos"
            checked={mostrarInactivos}
            onCheckedChange={setMostrarInactivos}
          />
          <Label htmlFor="inactivos" className="cursor-pointer">
            Mostrar inactivos
          </Label>
        </div>

        {isError ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border bg-white py-16 text-center">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <p className="text-destructive">Error al cargar los combos</p>
            <Button variant="outline" onClick={() => refetch()}>
              Reintentar
            </Button>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center gap-2 rounded-xl border bg-white py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin text-gold" /> Cargando...
          </div>
        ) : combos.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border bg-white py-16 text-center text-muted-foreground">
            <Package className="h-10 w-10" />
            <p>No hay combos {mostrarInactivos ? '' : 'activos'}</p>
            <Button variant="secondary" onClick={openCreate}>
              <Plus className="h-4 w-4" /> Crear el primero
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {combos.map((c) => (
              <div
                key={c.id}
                className={`flex flex-col rounded-xl border bg-white p-4 shadow-sm ${
                  c.activo ? '' : 'opacity-70'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-navy">{c.nombre}</h3>
                    {c.descripcion && (
                      <p className="text-xs text-muted-foreground">{c.descripcion}</p>
                    )}
                  </div>
                  <Badge variant={c.activo ? 'success' : 'secondary'}>
                    {c.activo ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>

                <p className="mt-2 text-xl font-bold text-navy">
                  {formatCOP(c.precio)}
                </p>

                <ul className="mt-2 flex-1 space-y-0.5 text-sm text-muted-foreground">
                  {c.productos.map((p) => (
                    <li key={p.producto_id}>
                      • {p.cantidad}× {p.producto_nombre}
                    </li>
                  ))}
                </ul>

                <div className="mt-3 flex gap-2 border-t pt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => openEdit(c)}
                  >
                    <Pencil className="h-4 w-4" /> Editar
                  </Button>
                  <Button
                    variant={c.activo ? 'ghost' : 'secondary'}
                    size="sm"
                    className="flex-1"
                    disabled={actualizar.isPending}
                    onClick={() => toggleActivo(c)}
                  >
                    <Power className="h-4 w-4" />
                    {c.activo ? 'Desactivar' : 'Activar'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ComboFormDialog open={formOpen} onOpenChange={setFormOpen} combo={editing} />
    </div>
  )
}
