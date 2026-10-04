import { useEffect, useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useUsaActualizarProducto, useUsaCrearProducto } from '@/hooks/useUsa'
import { useProductos as useProductosColombia } from '@/hooks/useVentas'
import { formatUSD } from '@/lib/format'
import type { UsaProducto } from '@/types/usa'
import type { Producto as ProductoColombia } from '@/types/venta'
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
  open: boolean
  onOpenChange: (open: boolean) => void
  producto?: UsaProducto | null
}

// Crear / editar un producto del catálogo USA (precios en USD).
export function UsaProductoFormDialog({ open, onOpenChange, producto }: Props) {
  const isEdit = Boolean(producto)
  const crear = useUsaCrearProducto()
  const actualizar = useUsaActualizarProducto()
  const saving = crear.isPending || actualizar.isPending

  const [nombre, setNombre] = useState('')
  const [precio, setPrecio] = useState('')
  const [costo, setCosto] = useState('')
  const [cantidadInicial, setCantidadInicial] = useState('0')

  // Catálogo de Colombia: solo se usa para SUGERIR nombres (y precios en USD si
  // existen). El producto USA se crea aparte; no se relaciona con el de Colombia.
  const colombiaQ = useProductosColombia()
  const nombresColombia = useMemo(
    () =>
      [...new Set((colombiaQ.data ?? []).map((p) => p.nombre.trim()).filter(Boolean))].sort(
        (a, b) => a.localeCompare(b, 'es'),
      ),
    [colombiaQ.data],
  )

  function handleNombreChange(valor: string) {
    setNombre(valor)
    const match = (colombiaQ.data ?? []).find(
      (p) => p.nombre.trim().toLowerCase() === valor.trim().toLowerCase(),
    )
    if (!match) return
    // Si el producto de Colombia ya tiene precios definidos para USA, los proponemos
    // (solo si el campo está vacío, para no pisar lo que la usuaria ya escribió).
    const { venta, costo: costoUsa } = preciosUsaDeColombia(match)
    if (venta !== null && !precio) setPrecio(String(venta))
    if (costoUsa !== null && !costo) setCosto(String(costoUsa))
  }

  useEffect(() => {
    if (!open) return
    if (producto) {
      setNombre(producto.nombre)
      setPrecio(String(producto.precio_venta))
      setCosto(String(producto.costo))
    } else {
      setNombre('')
      setPrecio('')
      setCosto('')
      setCantidadInicial('0')
    }
  }, [open, producto])

  const precioNum = Number(precio)
  const costoNum = Number(costo)
  const margen =
    Number.isFinite(precioNum) && Number.isFinite(costoNum) && precioNum > 0
      ? ((precioNum - costoNum) / precioNum) * 100
      : null

  async function handleSave() {
    if (!nombre.trim()) return toast.warning('Indique el nombre del producto')
    if (!Number.isFinite(precioNum) || precioNum < 0) return toast.warning('Ingrese un precio de venta válido')
    if (!Number.isFinite(costoNum) || costoNum < 0) return toast.warning('Ingrese un costo válido')
    const cantInicial = Number(cantidadInicial || 0)
    if (!isEdit && (!Number.isInteger(cantInicial) || cantInicial < 0))
      return toast.warning('La cantidad inicial debe ser un entero mayor o igual a 0')

    try {
      if (producto) {
        await actualizar.mutateAsync({
          id: producto.id,
          payload: { nombre: nombre.trim(), precio_venta: precioNum, costo: costoNum },
        })
      } else {
        await crear.mutateAsync({
          nombre: nombre.trim(),
          precio_venta: precioNum,
          costo: costoNum,
          cantidad_inicial: cantInicial,
        })
      }
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
            {isEdit ? 'Editar producto USA' : 'Nuevo producto USA'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="usa-prod-nombre">Nombre</Label>
            <Input
              id="usa-prod-nombre"
              list="usa-productos-colombia"
              autoComplete="off"
              value={nombre}
              onChange={(e) => handleNombreChange(e.target.value)}
              placeholder="Ej: Keratina 8oz"
            />
            <datalist id="usa-productos-colombia">
              {nombresColombia.map((n) => (
                <option key={n} value={n} />
              ))}
            </datalist>
            {!isEdit && (
              <p className="text-xs text-muted-foreground">
                Puede elegir un nombre del catálogo de Colombia o escribir uno nuevo. Solo se
                copia el nombre: el inventario y los precios USA son independientes.
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="usa-prod-precio">Precio de venta (USD)</Label>
              <Input
                id="usa-prod-precio"
                type="number"
                min={0}
                step="0.01"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="usa-prod-costo">Costo (USD)</Label>
              <Input
                id="usa-prod-costo"
                type="number"
                min={0}
                step="0.01"
                value={costo}
                onChange={(e) => setCosto(e.target.value)}
              />
            </div>
          </div>
          {margen !== null && (
            <p className="text-xs text-muted-foreground">
              Ganancia por unidad: {formatUSD(precioNum - costoNum)} ({margen.toFixed(0)}% de margen)
            </p>
          )}
          {!isEdit && (
            <div className="space-y-1.5">
              <Label htmlFor="usa-prod-cant">Cantidad inicial en inventario</Label>
              <Input
                id="usa-prod-cant"
                type="number"
                min={0}
                step={1}
                value={cantidadInicial}
                onChange={(e) => setCantidadInicial(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Puede dejarlo en 0 y registrar entradas después desde Inventario.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="secondary" onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? 'Guardar cambios' : 'Crear producto'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Busca en los precios del producto de Colombia los definidos para el país USA.
// Devuelve null cuando no hay precio para proponer.
function preciosUsaDeColombia(p: ProductoColombia): { venta: number | null; costo: number | null } {
  const usa = p.precios.filter((pr) => pr.pais?.nombre?.toUpperCase() === 'USA')
  const esCosto = (nombre?: string) => (nombre ?? '').toLowerCase().includes('costo')
  const costo = usa.find((pr) => esCosto(pr.tipo_precio?.nombre))
  const venta = usa.find((pr) => !esCosto(pr.tipo_precio?.nombre))
  return {
    venta: venta ? venta.precio : null,
    costo: costo ? costo.precio : null,
  }
}
