import { useEffect, useMemo, useState } from 'react'
import { formatCOP } from '@/lib/format'
import type { Bodega, CartProducto, Producto } from '@/types/venta'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Props {
  producto: Producto | null
  bodega: Bodega
  onClose: () => void
  onAdd: (item: CartProducto) => void
}

export function AddProductoDialog({ producto, bodega, onClose, onAdd }: Props) {
  const open = producto !== null

  const preciosDelPais = useMemo(
    () => producto?.precios.filter((p) => p.pais_id === bodega.paisId) ?? [],
    [producto, bodega.paisId],
  )

  const [precioId, setPrecioId] = useState<string>('')
  const [cantidad, setCantidad] = useState('1')
  const [descuento, setDescuento] = useState('0')

  useEffect(() => {
    if (open) {
      setPrecioId('')
      setCantidad('1')
      setDescuento('0')
    }
  }, [open, producto])

  const precio = preciosDelPais.find((p) => String(p.id) === precioId)
  const cant = Math.max(1, Number(cantidad) || 0)
  const desc = Math.min(100, Math.max(0, Number(descuento) || 0))
  const precioUnitario = precio
    ? Math.round(precio.precio * (1 - desc / 100) * 100) / 100
    : 0
  const subtotal = precioUnitario * cant

  function handleAdd() {
    if (!producto || !precio) return
    onAdd({
      tipo: 'producto',
      uid: crypto.randomUUID(),
      producto,
      tipoPrecio: precio.tipo_precio,
      cantidad: cant,
      descuento: desc,
      precioUnitario,
      bodegaId: bodega.id,
    })
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-navy">
            Agregar {producto?.nombre}
          </DialogTitle>
        </DialogHeader>

        {preciosDelPais.length === 0 ? (
          <p className="py-4 text-sm text-destructive">
            No hay precios configurados para este producto en{' '}
            {bodega.paisId === 1 ? 'Colombia' : 'USA'}.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Tipo de precio</Label>
              <Select value={precioId} onValueChange={setPrecioId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un precio" />
                </SelectTrigger>
                <SelectContent>
                  {preciosDelPais.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.tipo_precio.nombre} — {formatCOP(p.precio)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                <Label>Descuento (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={descuento}
                  onChange={(e) => setDescuento(e.target.value)}
                />
              </div>
            </div>

            {precio && (
              <div className="rounded-lg bg-muted p-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Precio unitario</span>
                  <span>{formatCOP(precioUnitario)}</span>
                </div>
                <div className="mt-1 flex justify-between font-semibold">
                  <span>Subtotal</span>
                  <span>{formatCOP(subtotal)}</span>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="secondary" onClick={handleAdd} disabled={!precio}>
            Agregar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
