import { useMemo, useState } from 'react'
import { AlertCircle, Loader2, Pencil, Plus, Scissors, Search, Trash2 } from 'lucide-react'
import { useEstilistas } from '@/hooks/useVentas'
import { useEliminarEstilista } from '@/hooks/useEstilistasAdmin'
import type { Estilista } from '@/types/venta'
import { PageHeader } from '@/components/PageHeader'
import { EstilistaFormDialog } from '@/components/estilistas/EstilistaFormDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

// Apartado de administración de estilistas (crear, renombrar y eliminar).
export function EstilistasPage() {
  const { data: estilistas = [], isLoading, isError, refetch } = useEstilistas()
  const eliminar = useEliminarEstilista()

  const [busqueda, setBusqueda] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Estilista | null>(null)
  const [toDelete, setToDelete] = useState<Estilista | null>(null)

  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return estilistas
    return estilistas.filter((e) => e.nombre.toLowerCase().includes(q))
  }, [estilistas, busqueda])

  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }
  function openEdit(e: Estilista) {
    setEditing(e)
    setFormOpen(true)
  }
  async function confirmarEliminar() {
    if (!toDelete) return
    try {
      await eliminar.mutateAsync(toDelete.id)
    } catch {
      // El error ya se muestra con toast desde el hook.
    }
    setToDelete(null)
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-gray-100 to-white">
      <PageHeader
        title="Estilistas"
        subtitle="Personal que presta los servicios del salón"
        actions={
          <Button
            variant="ghost"
            className="text-white hover:bg-white/10 hover:text-white"
            onClick={openCreate}
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nueva estilista</span>
          </Button>
        }
      />

      <div className="mx-auto w-full max-w-3xl flex-1 space-y-4 p-4 sm:p-6">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar estilista..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        {isError ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border bg-white py-16 text-center">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <p className="text-destructive">Error al cargar las estilistas</p>
            <Button variant="outline" onClick={() => refetch()}>
              Reintentar
            </Button>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center gap-2 rounded-xl border bg-white py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin text-gold" /> Cargando...
          </div>
        ) : estilistas.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border bg-white py-16 text-center text-muted-foreground">
            <Scissors className="h-10 w-10" />
            <p>Aún no hay estilistas registradas</p>
            <Button variant="secondary" onClick={openCreate}>
              <Plus className="h-4 w-4" /> Crear la primera
            </Button>
          </div>
        ) : filtradas.length === 0 ? (
          <div className="rounded-xl border bg-white py-16 text-center text-muted-foreground">
            Ninguna estilista coincide con «{busqueda.trim()}»
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
            <p className="border-b px-4 py-2 text-xs text-muted-foreground">
              {filtradas.length} de {estilistas.length} estilista{estilistas.length === 1 ? '' : 's'}
            </p>
            <ul className="divide-y">
              {filtradas.map((e) => (
                <li key={e.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="rounded-lg bg-gold/10 p-2">
                    <Scissors className="h-5 w-5 text-gold" />
                  </div>
                  <span className="flex-1 font-medium text-gray-800">{e.nombre}</span>
                  <Button variant="outline" size="sm" onClick={() => openEdit(e)}>
                    <Pencil className="h-4 w-4" />
                    <span className="hidden sm:inline">Editar</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setToDelete(e)}
                    aria-label={`Eliminar a ${e.nombre}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <EstilistaFormDialog open={formOpen} onOpenChange={setFormOpen} estilista={editing} />

      <AlertDialog open={toDelete !== null} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar estilista</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete && (
                <>
                  ¿Eliminar a «{toDelete.nombre}»? Solo es posible si no tiene servicios vendidos ni
                  pagos de nómina registrados; en ese caso el sistema lo impedirá para conservar el
                  historial.
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
