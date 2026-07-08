import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useProductos, useBodegas } from '@/hooks/useVentas'
import { useAgregarStock } from '@/hooks/useInventario'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AgregarStockDialog({ open, onOpenChange }: Props) {
  const { data: productos = [] } = useProductos()
  const { data: bodegas = [] } = useBodegas()
  const agregar = useAgregarStock()

  const [productoId, setProductoId] = useState('')
  const [bodegaId, setBodegaId] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [obs, setObs] = useState('')

  useEffect(() => {
    if (open) {
      setProductoId('')
      setBodegaId('')
      setCantidad('')
      setObs('')
    }
  }, [open])

  const productoOptions: ComboboxOption[] = productos.map((p) => ({
    value: String(p.id),
    label: p.nombre,
  }))

  async function handleSave() {
    if (!productoId) return toast.warning('Seleccione un producto')
    if (!bodegaId) return toast.warning('Seleccione una bodega')
    const cant = Number(cantidad)
    if (!cant || cant <= 0) return toast.warning('La cantidad debe ser mayor a 0')
    try {
      await agregar.mutateAsync({
        producto_id: Number(productoId),
        bodega_id: Number(bodegaId),
        cantidad: cant,
        observaciones: obs.trim() || null,
      })
      onOpenChange(false)
    } catch {
      /* toast lo maneja el hook */
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-navy">Agregar stock</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Producto</Label>
            <Combobox
              options={productoOptions}
              value={productoId}
              onSelect={setProductoId}
              placeholder="Seleccione un producto"
              searchPlaceholder="Buscar producto..."
              emptyText="Sin productos"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Bodega</Label>
            <Select value={bodegaId} onValueChange={setBodegaId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione una bodega" />
              </SelectTrigger>
              <SelectContent>
                {bodegas.map((b) => (
                  <SelectItem key={b.id} value={String(b.id)}>
                    {b.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Cantidad a agregar</Label>
            <Input
              type="number"
              min={1}
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Observaciones (opcional)</Label>
            <Textarea rows={2} value={obs} onChange={(e) => setObs(e.target.value)} />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={agregar.isPending}>
            Cancelar
          </Button>
          <Button variant="secondary" onClick={handleSave} disabled={agregar.isPending}>
            {agregar.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Agregar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
