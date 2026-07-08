import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useActualizarCantidad } from '@/hooks/useInventario'
import type { InventarioItem } from '@/types/inventario'
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
import { Textarea } from '@/components/ui/textarea'

interface Props {
  item: InventarioItem | null
  onClose: () => void
}

export function EditarCantidadDialog({ item, onClose }: Props) {
  const open = item !== null
  const actualizar = useActualizarCantidad()
  const [cantidad, setCantidad] = useState('')
  const [obs, setObs] = useState('')

  useEffect(() => {
    if (item) {
      setCantidad(String(item.cantidad))
      setObs('')
    }
  }, [item])

  async function handleSave() {
    if (!item) return
    const cant = Number(cantidad)
    if (cantidad === '' || cant < 0 || !Number.isInteger(cant))
      return toast.warning('Ingrese una cantidad válida')
    try {
      await actualizar.mutateAsync({
        id: item.id,
        payload: { cantidad: cant, observacion: obs.trim() || null },
      })
      onClose()
    } catch {
      /* toast lo maneja el hook */
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-navy">
            Editar cantidad — {item?.producto.nombre}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Bodega: {item?.bodega.nombre} · Actual: {item?.cantidad}
          </p>
          <div className="space-y-1.5">
            <Label>Nueva cantidad</Label>
            <Input
              type="number"
              min={0}
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Reemplaza la cantidad actual por este valor.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label>Observación (opcional)</Label>
            <Textarea rows={2} value={obs} onChange={(e) => setObs(e.target.value)} />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={actualizar.isPending}>
            Cancelar
          </Button>
          <Button variant="secondary" onClick={handleSave} disabled={actualizar.isPending}>
            {actualizar.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
