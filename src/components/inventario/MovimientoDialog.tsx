import { useEffect, useState } from 'react'
import { ArrowRight, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useProductos, useBodegas } from '@/hooks/useVentas'
import { useRealizarMovimiento } from '@/hooks/useInventario'
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

export function MovimientoDialog({ open, onOpenChange }: Props) {
  const { data: productos = [] } = useProductos()
  const { data: bodegas = [] } = useBodegas()
  const mover = useRealizarMovimiento()

  const [productoId, setProductoId] = useState('')
  const [origenId, setOrigenId] = useState('')
  const [destinoId, setDestinoId] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [obs, setObs] = useState('')

  useEffect(() => {
    if (open) {
      setProductoId('')
      setOrigenId('')
      setDestinoId('')
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
    if (!origenId || !destinoId) return toast.warning('Seleccione ambas bodegas')
    if (origenId === destinoId)
      return toast.warning('El origen y el destino deben ser distintos')
    const cant = Number(cantidad)
    if (!cant || cant <= 0) return toast.warning('La cantidad debe ser mayor a 0')
    try {
      await mover.mutateAsync({
        producto_id: Number(productoId),
        bodega_origen_id: Number(origenId),
        bodega_destino_id: Number(destinoId),
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
          <DialogTitle className="text-navy">Transferir entre bodegas</DialogTitle>
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

          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-1.5">
              <Label>Origen</Label>
              <Select
                value={origenId}
                onValueChange={(v) => {
                  setOrigenId(v)
                  if (v === destinoId) setDestinoId('')
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Bodega" />
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
            <ArrowRight className="mb-2.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="flex-1 space-y-1.5">
              <Label>Destino</Label>
              <Select value={destinoId} onValueChange={setDestinoId}>
                <SelectTrigger>
                  <SelectValue placeholder="Bodega" />
                </SelectTrigger>
                <SelectContent>
                  {bodegas
                    .filter((b) => String(b.id) !== origenId)
                    .map((b) => (
                      <SelectItem key={b.id} value={String(b.id)}>
                        {b.nombre}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
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
          <div className="space-y-1.5">
            <Label>Observación (opcional)</Label>
            <Textarea rows={2} value={obs} onChange={(e) => setObs(e.target.value)} />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={mover.isPending}>
            Cancelar
          </Button>
          <Button variant="secondary" onClick={handleSave} disabled={mover.isPending}>
            {mover.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Transferir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
