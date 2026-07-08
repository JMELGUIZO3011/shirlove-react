import { useEffect, useMemo, useState } from 'react'
import { Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useProductos } from '@/hooks/useVentas'
import { useActualizarCombo, useCrearCombo } from '@/hooks/useCombos'
import { costoUnitario } from '@/types/inventario'
import type { Combo } from '@/types/venta'
import { formatCOP } from '@/lib/format'
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

interface Item {
  producto_id: number
  producto_nombre: string
  cantidad: number
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  combo?: Combo | null
}

export function ComboFormDialog({ open, onOpenChange, combo }: Props) {
  const isEdit = Boolean(combo)
  const { data: productos = [] } = useProductos()
  const crear = useCrearCombo()
  const actualizar = useActualizarCombo()
  const saving = crear.isPending || actualizar.isPending

  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [precio, setPrecio] = useState('')
  const [items, setItems] = useState<Item[]>([])

  useEffect(() => {
    if (!open) return
    if (combo) {
      setNombre(combo.nombre)
      setDescripcion(combo.descripcion ?? '')
      setPrecio(String(combo.precio))
      setItems(
        combo.productos.map((p) => ({
          producto_id: p.producto_id,
          producto_nombre: p.producto_nombre,
          cantidad: p.cantidad,
        })),
      )
    } else {
      setNombre('')
      setDescripcion('')
      setPrecio('')
      setItems([])
    }
  }, [open, combo])

  const opcionesProducto: ComboboxOption[] = useMemo(
    () =>
      productos
        .filter((p) => !items.some((i) => i.producto_id === p.id))
        .map((p) => ({ value: String(p.id), label: p.nombre })),
    [productos, items],
  )

  // Costo estimado de los productos incluidos (precio de costo, Colombia)
  const costoEstimado = useMemo(
    () =>
      items.reduce((sum, item) => {
        const prod = productos.find((p) => p.id === item.producto_id)
        return sum + (prod ? costoUnitario(prod, 1) * item.cantidad : 0)
      }, 0),
    [items, productos],
  )
  const precioNum = Number(precio) || 0

  function addProducto(value: string) {
    const prod = productos.find((p) => String(p.id) === value)
    if (!prod) return
    setItems((prev) => [
      ...prev,
      { producto_id: prod.id, producto_nombre: prod.nombre, cantidad: 1 },
    ])
  }

  function setCantidad(productoId: number, cantidad: number) {
    setItems((prev) =>
      prev.map((i) =>
        i.producto_id === productoId ? { ...i, cantidad: Math.max(1, cantidad) } : i,
      ),
    )
  }

  function removeItem(productoId: number) {
    setItems((prev) => prev.filter((i) => i.producto_id !== productoId))
  }

  async function handleSave() {
    if (!nombre.trim()) return toast.warning('Indique el nombre del combo')
    if (precioNum <= 0) return toast.warning('El precio debe ser mayor a 0')
    if (items.length === 0) return toast.warning('Agregue al menos un producto')

    const payload = {
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      precio: precioNum,
      productos: items.map((i) => ({ producto_id: i.producto_id, cantidad: i.cantidad })),
    }
    try {
      if (combo) {
        await actualizar.mutateAsync({ id: combo.id, payload })
      } else {
        await crear.mutateAsync(payload)
      }
      onOpenChange(false)
    } catch {
      /* toast lo maneja el hook */
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-navy">
            {isEdit ? 'Editar combo' : 'Nuevo combo'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nombre del combo</Label>
            <Input value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Descripción (opcional)</Label>
            <Textarea rows={2} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Precio del combo</Label>
            <Input type="number" min={0} value={precio} onChange={(e) => setPrecio(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Productos incluidos</Label>
            <Combobox
              actionMode
              options={opcionesProducto}
              onSelect={addProducto}
              placeholder="Agregar producto..."
              searchPlaceholder="Buscar producto..."
              emptyText="Sin productos"
            />

            {items.length === 0 ? (
              <p className="rounded-md border border-dashed py-4 text-center text-sm text-muted-foreground">
                Aún no hay productos en el combo
              </p>
            ) : (
              <ul className="space-y-1.5">
                {items.map((item) => (
                  <li
                    key={item.producto_id}
                    className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
                  >
                    <span className="flex-1 truncate">{item.producto_nombre}</span>
                    <Input
                      type="number"
                      min={1}
                      value={item.cantidad}
                      onChange={(e) =>
                        setCantidad(item.producto_id, Number(e.target.value))
                      }
                      className="h-8 w-20"
                    />
                    <button
                      onClick={() => removeItem(item.producto_id)}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label="Quitar producto"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {items.length > 0 && (
            <div className="rounded-lg bg-muted p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Costo estimado productos</span>
                <span>{formatCOP(costoEstimado)}</span>
              </div>
              <div className="mt-1 flex justify-between">
                <span className="text-muted-foreground">Precio del combo</span>
                <span>{formatCOP(precioNum)}</span>
              </div>
              <div className="mt-1 flex justify-between font-semibold">
                <span>Margen estimado</span>
                <span className={precioNum - costoEstimado >= 0 ? 'text-green-600' : 'text-destructive'}>
                  {formatCOP(precioNum - costoEstimado)}
                </span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="secondary" onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? 'Guardar cambios' : 'Crear combo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
