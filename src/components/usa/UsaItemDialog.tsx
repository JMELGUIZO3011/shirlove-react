import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { formatUSD } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  USA_LISTAS_PRECIOS,
  usaPrecioEnLista,
  type UsaCartItem,
  type UsaListaPrecio,
  type UsaProducto,
  type UsaServicio,
} from '@/types/usa'
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
import { Badge } from '@/components/ui/badge'

type Seleccion =
  | { tipo: 'producto'; producto: UsaProducto }
  | { tipo: 'servicio'; servicio: UsaServicio }

interface Props {
  seleccion: Seleccion | null
  /** Lista de precios elegida para la venta (queda preseleccionada en los productos). */
  listaInicial: UsaListaPrecio
  onClose: () => void
  onAdd: (item: UsaCartItem) => void
}

// Configura cantidad, lista de precios y precio (USD) de un producto o servicio
// antes de agregarlo al carrito del punto de venta USA.
export function UsaItemDialog({ seleccion, listaInicial, onClose, onAdd }: Props) {
  const [cantidad, setCantidad] = useState('1')
  const [precio, setPrecio] = useState('')
  const [lista, setLista] = useState<UsaListaPrecio>(listaInicial)

  const open = seleccion !== null
  const producto = seleccion?.tipo === 'producto' ? seleccion.producto : null
  // Precio de referencia: el de la lista elegida; si el producto no lo tiene, el Particular.
  const precioLista = producto ? usaPrecioEnLista(producto, lista) : null
  const precioBase = producto
    ? (precioLista ?? producto.precio_venta)
    : seleccion?.tipo === 'servicio'
      ? seleccion.servicio.precio
      : 0
  const stock = producto ? producto.cantidad : null
  const nombre = producto
    ? producto.nombre
    : seleccion?.tipo === 'servicio'
      ? `${seleccion.servicio.categoria} — ${seleccion.servicio.nombre}`
      : ''

  useEffect(() => {
    if (open) {
      setCantidad('1')
      setLista(listaInicial)
    }
  }, [open, listaInicial])

  // Al abrir o cambiar de lista, el precio se rellena con el de esa lista.
  useEffect(() => {
    if (open) setPrecio(String(precioBase))
  }, [open, precioBase])

  const cant = Number(cantidad)
  const precioNum = Number(precio)
  const subtotal = Number.isFinite(cant) && Number.isFinite(precioNum) ? cant * precioNum : 0

  function handleAdd() {
    if (!seleccion) return
    if (!Number.isInteger(cant) || cant <= 0) return toast.warning('La cantidad debe ser un entero mayor a 0')
    if (!Number.isFinite(precioNum) || precioNum < 0) return toast.warning('Ingrese un precio válido')
    if (stock !== null && cant > stock)
      return toast.warning(`Stock insuficiente: solo hay ${stock} unidad(es) disponibles`)

    const uid = `${seleccion.tipo}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    if (seleccion.tipo === 'producto') {
      onAdd({
        uid,
        tipo: 'producto',
        producto: seleccion.producto,
        descripcion: seleccion.producto.nombre,
        cantidad: cant,
        precioUnitario: precioNum,
        // Se registra la lista realmente usada (si no tenía precio en la elegida, Particular).
        listaPrecio: precioLista === null ? 'Particular' : lista,
      })
    } else {
      onAdd({
        uid,
        tipo: 'servicio',
        servicio: seleccion.servicio,
        descripcion: nombre,
        cantidad: cant,
        precioUnitario: precioNum,
      })
    }
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-navy">
            <span className="truncate">{nombre}</span>
            <Badge variant={producto ? 'secondary' : 'info'}>{producto ? 'Producto' : 'Servicio'}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {stock !== null && (
            <p className="text-sm text-muted-foreground">
              Disponible en inventario USA:{' '}
              <span className={stock > 0 ? 'font-semibold text-navy' : 'font-semibold text-destructive'}>
                {stock}
              </span>
            </p>
          )}

          {producto && (
            <div className="space-y-1.5">
              <Label>Lista de precios</Label>
              <div className="grid grid-cols-2 gap-2">
                {USA_LISTAS_PRECIOS.map((l) => {
                  const valor = usaPrecioEnLista(producto, l.nombre)
                  const activa = lista === l.nombre
                  return (
                    <button
                      key={l.nombre}
                      type="button"
                      onClick={() => setLista(l.nombre)}
                      disabled={valor === null}
                      className={cn(
                        'flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm transition-colors',
                        activa ? 'border-navy bg-navy text-white' : 'bg-white hover:bg-muted',
                        valor === null && 'cursor-not-allowed opacity-50',
                      )}
                      aria-pressed={activa}
                    >
                      <span>{l.nombre}</span>
                      <span className="font-semibold tabular-nums">{valor === null ? '—' : formatUSD(valor)}</span>
                    </button>
                  )
                })}
              </div>
              {precioLista === null && (
                <p className="text-xs text-amber-700">
                  Este producto no tiene precio en la lista {lista}; se usa el precio Particular.
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="usa-item-cant">Cantidad</Label>
              <Input
                id="usa-item-cant"
                type="number"
                min={1}
                step={1}
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="usa-item-precio">Precio unitario (USD)</Label>
              <Input
                id="usa-item-precio"
                type="number"
                min={0}
                step="0.01"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
              />
            </div>
          </div>
          {precioNum !== precioBase && (
            <p className="text-xs text-muted-foreground">
              Precio de lista{producto ? ` ${precioLista === null ? 'Particular' : lista}` : ''}:{' '}
              {formatUSD(precioBase)}
            </p>
          )}
          <div className="flex items-baseline justify-between rounded-lg bg-muted px-3 py-2">
            <span className="text-sm text-muted-foreground">Subtotal</span>
            <span className="text-lg font-bold text-navy">{formatUSD(subtotal)}</span>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="secondary" onClick={handleAdd}>
            Agregar al carrito
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export type { Seleccion as UsaItemSeleccion }
