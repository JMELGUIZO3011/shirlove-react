import { useEffect, useState } from 'react'
import { formatCOP } from '@/lib/format'
import type { Bodega, CartCombo, Combo } from '@/types/venta'
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
  combo: Combo | null
  bodega: Bodega
  onClose: () => void
  onAdd: (item: CartCombo) => void
}

export function AddComboDialog({ combo, bodega, onClose, onAdd }: Props) {
  const open = combo !== null
  const [cantidad, setCantidad] = useState('1')

  useEffect(() => {
    if (open) setCantidad('1')
  }, [open, combo])

  const cant = Math.max(1, Number(cantidad) || 0)
  const subtotal = combo ? combo.precio * cant : 0

  function handleAdd() {
    if (!combo) return
    onAdd({
      tipo: 'combo',
      uid: crypto.randomUUID(),
      combo,
      cantidad: cant,
      bodegaId: bodega.id,
      precioUnitario: combo.precio,
      subtotal,
    })
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-navy">
            Agregar combo: {combo?.nombre}
          </DialogTitle>
        </DialogHeader>

        {combo && (
          <div className="space-y-4">
            <div className="rounded-lg border border-gold/30 bg-gold/10 p-3">
              {combo.descripcion && (
                <p className="mb-2 text-xs text-muted-foreground">
                  {combo.descripcion}
                </p>
              )}
              <p className="text-sm font-semibold">Productos incluidos:</p>
              <ul className="mt-1 space-y-0.5 text-sm">
                {combo.productos.map((p) => (
                  <li key={p.producto_id}>
                    • {p.cantidad}× {p.producto_nombre}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-lg font-bold text-navy">
                {formatCOP(combo.precio)}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>Cantidad</Label>
              <Input
                type="number"
                min={1}
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
              />
            </div>

            <div className="flex justify-between rounded-lg bg-muted p-3 text-sm font-semibold">
              <span>Subtotal</span>
              <span>{formatCOP(subtotal)}</span>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="secondary" onClick={handleAdd}>
            Agregar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
