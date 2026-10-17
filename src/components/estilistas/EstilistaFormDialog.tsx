import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useActualizarEstilista, useCrearEstilista } from '@/hooks/useEstilistasAdmin'
import type { Estilista } from '@/types/venta'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  estilista?: Estilista | null
}

// Formulario para crear o renombrar una estilista.
export function EstilistaFormDialog({ open, onOpenChange, estilista }: Props) {
  const isEdit = Boolean(estilista)
  const crear = useCrearEstilista()
  const actualizar = useActualizarEstilista()
  const saving = crear.isPending || actualizar.isPending

  const [nombre, setNombre] = useState('')

  useEffect(() => {
    if (!open) return
    setNombre(estilista?.nombre ?? '')
  }, [open, estilista])

  async function handleSave() {
    const limpio = nombre.trim()
    if (!limpio) return toast.warning('Indique el nombre de la estilista')

    try {
      if (estilista) {
        await actualizar.mutateAsync({ id: estilista.id, payload: { nombre: limpio } })
      } else {
        await crear.mutateAsync({ nombre: limpio })
      }
      onOpenChange(false)
    } catch {
      // El error ya se muestra con toast desde el hook.
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar estilista' : 'Nueva estilista'}</DialogTitle>
        </DialogHeader>

        <form
          className="space-y-1.5"
          onSubmit={(e) => {
            e.preventDefault()
            void handleSave()
          }}
        >
          <Label htmlFor="estilista-nombre">Nombre</Label>
          <Input
            id="estilista-nombre"
            autoFocus
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej. Shirley"
            maxLength={80}
          />
        </form>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? 'Guardar' : 'Crear'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
