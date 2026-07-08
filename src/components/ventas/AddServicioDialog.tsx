import { useEffect, useState } from 'react'
import { Gift } from 'lucide-react'
import { formatCOP } from '@/lib/format'
import { toast } from 'sonner'
import type { CartServicio, Estilista, Servicio } from '@/types/venta'
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
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Props {
  servicio: Servicio | null
  estilistas: Estilista[]
  onClose: () => void
  onAdd: (item: CartServicio) => void
}

export function AddServicioDialog({
  servicio,
  estilistas,
  onClose,
  onAdd,
}: Props) {
  const open = servicio !== null

  const [estilistaId, setEstilistaId] = useState('')
  const [precio, setPrecio] = useState('')
  const [porcentaje, setPorcentaje] = useState('')
  const [descuento, setDescuento] = useState('0')
  const [esCortesia, setEsCortesia] = useState(false)

  useEffect(() => {
    if (open) {
      setEstilistaId('')
      setPrecio('')
      setPorcentaje('')
      setDescuento('0')
      setEsCortesia(false)
    }
  }, [open, servicio])

  const desc = Math.min(100, Math.max(0, Number(descuento) || 0))
  const precioBase = Number(precio) || 0
  const precioFinal = esCortesia
    ? 0
    : Math.round(precioBase * (1 - desc / 100) * 100) / 100
  const pct = esCortesia ? 0 : Number(porcentaje) || 0
  const comision = Math.round(precioFinal * (pct / 100) * 100) / 100

  function handleAdd() {
    if (!servicio) return
    const estilista = estilistas.find((e) => String(e.id) === estilistaId)
    if (!estilista) {
      toast.warning('Debe seleccionar un estilista')
      return
    }
    if (!esCortesia) {
      if (precio === '' || porcentaje === '') {
        toast.warning('Complete precio y porcentaje del estilista')
        return
      }
      if (precioFinal < 0 || pct < 0 || pct > 100) {
        toast.warning('Precio ≥ 0 y porcentaje entre 0 y 100')
        return
      }
    }
    onAdd({
      tipo: 'servicio',
      uid: crypto.randomUUID(),
      servicio,
      estilista,
      precio: precioFinal,
      porcentajeEstilista: pct,
      comisionEstilista: comision,
      esCortesia,
    })
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-navy">
            Agregar {servicio?.nombre}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border bg-muted/50 p-3 text-sm">
            <p className="text-muted-foreground">
              Categoría: {servicio?.categoria}
            </p>
            <p className="font-semibold">{servicio?.nombre}</p>
          </div>

          {/* Cortesía */}
          <div
            className={`flex items-center gap-3 rounded-lg border p-3 ${
              esCortesia ? 'border-blue-300 bg-blue-50' : 'bg-muted/40'
            }`}
          >
            <Gift
              className={`h-5 w-5 ${esCortesia ? 'text-blue-700' : 'text-muted-foreground'}`}
            />
            <div className="flex-1">
              <p className="text-sm font-semibold">Servicio de cortesía</p>
              <p className="text-xs text-muted-foreground">
                {esCortesia ? 'Gratis · Sin comisión' : 'Marcar como cortesía'}
              </p>
            </div>
            <Switch checked={esCortesia} onCheckedChange={setEsCortesia} />
          </div>

          <div className="space-y-1.5">
            <Label>Estilista</Label>
            <Select value={estilistaId} onValueChange={setEstilistaId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione un estilista" />
              </SelectTrigger>
              <SelectContent>
                {estilistas.map((e) => (
                  <SelectItem key={e.id} value={String(e.id)}>
                    {e.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!esCortesia && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Precio</Label>
                  <Input
                    type="number"
                    min={0}
                    value={precio}
                    onChange={(e) => setPrecio(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>% Estilista</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={porcentaje}
                    onChange={(e) => setPorcentaje(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Descuento (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={descuento}
                  onChange={(e) => setDescuento(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="rounded-lg bg-muted p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Precio del servicio</span>
              <span>{formatCOP(precioFinal)}</span>
            </div>
            <div className="mt-1 flex justify-between">
              <span className="text-muted-foreground">Comisión estilista</span>
              <span>{formatCOP(comision)}</span>
            </div>
          </div>
        </div>

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
