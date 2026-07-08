import { useEffect, useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useProductos, useBodegas } from '@/hooks/useVentas'
import { useInventario } from '@/hooks/useInventario'
import { useCrearConsumo } from '@/hooks/useFinanzas'
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

const MOTIVOS = [
  'Uso en servicio',
  'Capacitación',
  'Muestra a cliente',
  'Prueba de producto',
  'Consumo personal',
  'Evento/Promoción',
  'Otro',
]

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RegistrarConsumoDialog({ open, onOpenChange }: Props) {
  const { data: productos = [] } = useProductos()
  const { data: bodegas = [] } = useBodegas()
  const { data: inventario = [] } = useInventario()
  const crear = useCrearConsumo()

  const [productoId, setProductoId] = useState('')
  const [bodegaId, setBodegaId] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [motivo, setMotivo] = useState('')
  const [motivoOtro, setMotivoOtro] = useState('')
  const [notas, setNotas] = useState('')

  useEffect(() => {
    if (open) {
      setProductoId('')
      setBodegaId('')
      setCantidad('')
      setMotivo('')
      setMotivoOtro('')
      setNotas('')
    }
  }, [open])

  const productoOptions: ComboboxOption[] = useMemo(
    () => productos.map((p) => ({ value: String(p.id), label: p.nombre })),
    [productos],
  )

  const disponible =
    productoId && bodegaId
      ? (inventario.find(
          (i) =>
            i.producto_id === Number(productoId) &&
            i.bodega_id === Number(bodegaId),
        )?.cantidad ?? 0)
      : null
  const cant = Number(cantidad) || 0
  const stockInsuficiente = disponible !== null && cant > disponible

  async function handleSave() {
    if (!productoId) return toast.warning('Seleccione un producto')
    if (!bodegaId) return toast.warning('Seleccione una bodega')
    if (cant <= 0) return toast.warning('La cantidad debe ser mayor a 0')
    const motivoFinal = motivo === 'Otro' ? motivoOtro.trim() : motivo
    if (!motivoFinal) return toast.warning('Indique el motivo')
    if (stockInsuficiente) return toast.warning('No hay suficiente stock')

    try {
      await crear.mutateAsync({
        producto_id: Number(productoId),
        bodega_id: Number(bodegaId),
        cantidad: cant,
        motivo: motivoFinal,
        notas: notas.trim() || null,
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
          <DialogTitle className="text-navy">Registrar consumo interno</DialogTitle>
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Bodega</Label>
              <Select value={bodegaId} onValueChange={setBodegaId}>
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
            <div className="space-y-1.5">
              <div className="flex items-baseline justify-between">
                <Label>Cantidad</Label>
                {disponible !== null && (
                  <span className="text-xs text-muted-foreground">
                    Disp: {disponible}
                  </span>
                )}
              </div>
              <Input
                type="number"
                min={1}
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
              />
            </div>
          </div>

          {stockInsuficiente && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              Stock insuficiente: hay {disponible} disponibles.
            </p>
          )}

          <div className="space-y-1.5">
            <Label>Motivo</Label>
            <Select value={motivo} onValueChange={setMotivo}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione un motivo" />
              </SelectTrigger>
              <SelectContent>
                {MOTIVOS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {motivo === 'Otro' && (
            <div className="space-y-1.5">
              <Label>Especifique el motivo</Label>
              <Input
                value={motivoOtro}
                onChange={(e) => setMotivoOtro(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Notas (opcional)</Label>
            <Textarea rows={2} value={notas} onChange={(e) => setNotas(e.target.value)} />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={crear.isPending}>
            Cancelar
          </Button>
          <Button variant="secondary" onClick={handleSave} disabled={crear.isPending || stockInsuficiente}>
            {crear.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Registrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
