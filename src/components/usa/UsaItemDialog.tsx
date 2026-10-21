import { useEffect, useState } from 'react'
import { Check, Minus, Package, Plus, Sparkles } from 'lucide-react'
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

const DESCRIPCION_LISTA: Record<UsaListaPrecio, string> = {
  Particular: 'Precio al público',
  Mayorista: 'Compra al por mayor',
  Estilista: 'Para estilistas',
  'Beauty Boss': 'Programa Beauty Boss',
}

// Configura cantidad, lista de precios y precio (USD) de un producto o servicio
// antes de agregarlo al carrito del punto de venta USA. Pensado para usarse en
// el celular: una sola columna, botones grandes y sin desbordes horizontales.
export function UsaItemDialog({ seleccion, listaInicial, onClose, onAdd }: Props) {
  const [cantidad, setCantidad] = useState('1')
  const [precio, setPrecio] = useState('')
  const [lista, setLista] = useState<UsaListaPrecio>(listaInicial)

  const open = seleccion !== null
  const producto = seleccion?.tipo === 'producto' ? seleccion.producto : null
  const servicio = seleccion?.tipo === 'servicio' ? seleccion.servicio : null
  // Precio de referencia: el de la lista elegida; si el producto no lo tiene, el Particular.
  const precioLista = producto ? usaPrecioEnLista(producto, lista) : null
  const listaUsada: UsaListaPrecio = precioLista === null ? 'Particular' : lista
  const precioBase = producto ? (precioLista ?? producto.precio_venta) : (servicio?.precio ?? 0)
  const stock = producto ? producto.cantidad : null
  const nombre = producto ? producto.nombre : servicio ? servicio.nombre : ''

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
  const precioEditado = Number.isFinite(precioNum) && precioNum !== precioBase
  const sinStock = stock !== null && stock <= 0

  function cambiarCantidad(delta: number) {
    const actual = Number.isInteger(cant) && cant > 0 ? cant : 1
    const nueva = Math.max(1, actual + delta)
    if (stock !== null && nueva > stock) return toast.warning(`Solo hay ${stock} unidad(es) disponibles`)
    setCantidad(String(nueva))
  }

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
        listaPrecio: listaUsada,
      })
    } else {
      onAdd({
        uid,
        tipo: 'servicio',
        servicio: seleccion.servicio,
        descripcion: `${seleccion.servicio.categoria} — ${seleccion.servicio.nombre}`,
        cantidad: cant,
        precioUnitario: precioNum,
      })
    }
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md overflow-x-hidden p-5 sm:p-6">
        <DialogHeader className="pr-8 text-left">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {producto ? <Package className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
            {producto ? 'Producto' : servicio ? `Servicio · ${servicio.categoria}` : 'Servicio'}
          </div>
          <DialogTitle className="break-words text-lg leading-snug text-navy">{nombre}</DialogTitle>
          {stock !== null && (
            <p className="text-sm text-muted-foreground">
              Disponible en inventario USA:{' '}
              <span className={cn('font-semibold', sinStock ? 'text-destructive' : 'text-navy')}>{stock}</span>
              {sinStock && ' · sin existencias'}
            </p>
          )}
        </DialogHeader>

        <div className="space-y-4">
          {producto && (
            <div className="space-y-1.5">
              <Label>Lista de precios</Label>
              <div className="overflow-hidden rounded-lg border" role="radiogroup" aria-label="Lista de precios">
                {USA_LISTAS_PRECIOS.map((l) => {
                  const valor = usaPrecioEnLista(producto, l.nombre)
                  const activa = lista === l.nombre
                  return (
                    <button
                      key={l.nombre}
                      type="button"
                      role="radio"
                      aria-checked={activa}
                      onClick={() => setLista(l.nombre)}
                      disabled={valor === null}
                      className={cn(
                        'flex w-full items-center gap-3 border-b px-3 py-2.5 text-left text-sm transition-colors last:border-b-0',
                        activa ? 'bg-navy text-white' : 'bg-white hover:bg-muted',
                        valor === null && 'cursor-not-allowed opacity-50',
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border',
                          activa ? 'border-white bg-white text-navy' : 'border-muted-foreground/40',
                        )}
                      >
                        {activa && <Check className="h-3.5 w-3.5" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium">{l.nombre}</span>
                        <span className={cn('block text-xs', activa ? 'text-white/80' : 'text-muted-foreground')}>
                          {valor === null ? 'Sin precio en esta lista' : DESCRIPCION_LISTA[l.nombre]}
                        </span>
                      </span>
                      <span className="shrink-0 text-base font-semibold tabular-nums">
                        {valor === null ? '—' : formatUSD(valor)}
                      </span>
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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="usa-item-cant">Cantidad</Label>
              <div className="flex items-center">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 shrink-0 rounded-r-none"
                  onClick={() => cambiarCantidad(-1)}
                  disabled={!Number.isInteger(cant) || cant <= 1}
                  aria-label="Una unidad menos"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  id="usa-item-cant"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  step={1}
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                  className="h-10 min-w-0 rounded-none text-center font-semibold [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 shrink-0 rounded-l-none"
                  onClick={() => cambiarCantidad(1)}
                  disabled={stock !== null && Number.isInteger(cant) && cant >= stock}
                  aria-label="Una unidad más"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="usa-item-precio">Precio unitario (USD)</Label>
              <Input
                id="usa-item-precio"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                className="h-10 font-semibold"
              />
            </div>
          </div>
          {precioEditado && (
            <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
              <span>
                Precio de lista{producto ? ` ${listaUsada}` : ''}: {formatUSD(precioBase)}
              </span>
              <button type="button" className="font-medium text-navy underline" onClick={() => setPrecio(String(precioBase))}>
                Restablecer
              </button>
            </p>
          )}
          <div className="flex items-baseline justify-between rounded-lg bg-muted px-3 py-2.5">
            <span className="text-sm text-muted-foreground">
              Subtotal{Number.isInteger(cant) && cant > 1 ? ` (${cant} × ${formatUSD(precioNum)})` : ''}
            </span>
            <span className="text-xl font-bold text-navy">{formatUSD(subtotal)}</span>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="secondary" onClick={handleAdd} disabled={sinStock}>
            <Plus className="h-4 w-4" /> Agregar al carrito
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export type { Seleccion as UsaItemSeleccion }
