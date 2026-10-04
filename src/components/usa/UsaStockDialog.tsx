import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useUsaAjusteStock, useUsaEntradaStock } from '@/hooks/useUsa'
import type { UsaProducto } from '@/types/usa'
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
import { Combobox, type ComboboxOption } from '@/components/Combobox'

export type UsaStockModo = 'entrada' | 'ajuste'

interface Props {
  open: boolean
  modo: UsaStockModo
  productos: UsaProducto[]
  productoInicial?: UsaProducto | null
  onOpenChange: (open: boolean) => void
}

// Entrada (sumar unidades) o ajuste (fijar cantidad exacta) del inventario USA.
export function UsaStockDialog({ open, modo, productos, productoInicial, onOpenChange }: Props) {
  const entrada = useUsaEntradaStock()
  const ajuste = useUsaAjusteStock()
  const saving = entrada.isPending || ajuste.isPending

  const [productoId, setProductoId] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [obs, setObs] = useState('')

  useEffect(() => {
    if (open) {
      setProductoId(productoInicial ? String(productoInicial.id) : '')
      setCantidad(modo === 'ajuste' && productoInicial ? String(productoInicial.cantidad) : '')
      setObs('')
    }
  }, [open, modo, productoInicial])

  const producto = productos.find((p) => String(p.id) === productoId)
  const options: ComboboxOption[] = productos.map((p) => ({
    value: String(p.id),
    label: p.nombre,
    keywords: `stock ${p.cantidad}`,
  }))

  async function handleSave() {
    if (!productoId) return toast.warning('Seleccione un producto')
    const cant = Number(cantidad)
    if (!Number.isInteger(cant)) return toast.warning('La cantidad debe ser un número entero')
    if (modo === 'entrada' && cant <= 0) return toast.warning('La cantidad debe ser mayor a 0')
    if (modo === 'ajuste' && cant < 0) return toast.warning('La cantidad no puede ser negativa')

    const payload = {
      producto_id: Number(productoId),
      cantidad: cant,
      observaciones: obs.trim() || null,
    }
    try {
      if (modo === 'entrada') await entrada.mutateAsync(payload)
      else await ajuste.mutateAsync(payload)
      onOpenChange(false)
    } catch {
      /* toast lo maneja el hook */
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-navy">
            {modo === 'entrada' ? 'Entrada de inventario USA' : 'Ajustar inventario USA'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Producto</Label>
            <Combobox
              options={options}
              value={productoId}
              onSelect={(v) => {
                setProductoId(v)
                if (modo === 'ajuste') {
                  const p = productos.find((x) => String(x.id) === v)
                  if (p) setCantidad(String(p.cantidad))
                }
              }}
              placeholder="Seleccione un producto"
              searchPlaceholder="Buscar producto..."
              emptyText="Sin productos"
            />
            {producto && (
              <p className="text-xs text-muted-foreground">
                Stock actual: <span className="font-semibold text-navy">{producto.cantidad}</span>
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>{modo === 'entrada' ? 'Cantidad a agregar' : 'Cantidad real en inventario'}</Label>
            <Input
              type="number"
              min={0}
              step={1}
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
            />
            {modo === 'entrada' && producto && Number(cantidad) > 0 && (
              <p className="text-xs text-muted-foreground">
                Quedará en {producto.cantidad + Number(cantidad)} unidades
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Observaciones (opcional)</Label>
            <Textarea
              rows={2}
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              placeholder={modo === 'entrada' ? 'Ej: llegó pedido de Colombia' : 'Ej: conteo físico'}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="secondary" onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {modo === 'entrada' ? 'Registrar entrada' : 'Guardar ajuste'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
