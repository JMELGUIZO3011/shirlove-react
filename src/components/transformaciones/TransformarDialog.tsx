import { useEffect, useState } from 'react'
import { ArrowRight, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { useBodegas } from '@/hooks/useVentas'
import { useInventario } from '@/hooks/useInventario'
import { useTransformar } from '@/hooks/useTransformaciones'
import type { ConfiguracionTransformacion } from '@/types/transformacion'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Props {
  configuracion: ConfiguracionTransformacion | null
  onClose: () => void
}

export function TransformarDialog({ configuracion, onClose }: Props) {
  const open = configuracion !== null
  const { user } = useAuth()
  const { data: bodegas = [] } = useBodegas()
  const { data: inventario = [] } = useInventario()
  const transformar = useTransformar()

  const [bodegaId, setBodegaId] = useState('')
  const [cantidad, setCantidad] = useState('1')
  const [notas, setNotas] = useState('')

  useEffect(() => {
    if (open) {
      setBodegaId('')
      setCantidad('1')
      setNotas('')
    }
  }, [open])

  const cant = Math.max(0, Number(cantidad) || 0)
  const consume = configuracion ? cant * configuracion.cantidad_origen : 0
  const produce = configuracion ? cant * configuracion.cantidad_destino : 0

  // Stock del producto origen en cada bodega
  const stockPorBodega = configuracion
    ? bodegas.map((b) => ({
        bodega: b,
        cantidad:
          inventario.find(
            (i) =>
              i.producto_id === configuracion.producto_origen.id &&
              i.bodega_id === b.id,
          )?.cantidad ?? 0,
      }))
    : []

  const disponible =
    configuracion && bodegaId
      ? (stockPorBodega.find((s) => String(s.bodega.id) === bodegaId)?.cantidad ??
        0)
      : null
  const stockInsuficiente = disponible !== null && consume > disponible

  async function handleSubmit() {
    if (!configuracion) return
    if (!bodegaId) return toast.warning('Seleccione una bodega')
    if (cant <= 0) return toast.warning('Ingrese una cantidad válida')
    if (stockInsuficiente)
      return toast.warning('No hay suficiente stock del producto origen')
    try {
      await transformar.mutateAsync({
        configuracion_id: configuracion.id,
        bodega_id: Number(bodegaId),
        cantidad_transformar: cant,
        usuario_id: user?.id ?? 0,
        notas: notas.trim(),
      })
      onClose()
    } catch {
      /* toast lo maneja el hook */
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-navy">Transformar productos</DialogTitle>
        </DialogHeader>

        {configuracion && (
          <div className="space-y-4">
            <div className="rounded-lg border border-gold/30 bg-gold/10 p-3">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Producto origen</p>
                  <p className="font-semibold">
                    {configuracion.producto_origen.nombre}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-gold" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Producto destino</p>
                  <p className="font-semibold">
                    {configuracion.producto_destino.nombre}
                  </p>
                </div>
              </div>
              <p className="mt-2 text-center text-sm text-muted-foreground">
                Conversión: {configuracion.cantidad_origen} ⟶{' '}
                {configuracion.cantidad_destino} unidades
              </p>
            </div>

            {/* Stock del producto origen por bodega */}
            <div className="rounded-lg border bg-muted/40 p-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Stock de «{configuracion.producto_origen.nombre}» por bodega
              </p>
              <div className="flex flex-wrap gap-2">
                {stockPorBodega.map((s) => (
                  <span
                    key={s.bodega.id}
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs ${
                      s.cantidad > 0
                        ? 'border-navy/20 bg-white text-navy'
                        : 'border-transparent bg-gray-100 text-muted-foreground'
                    }`}
                  >
                    {s.bodega.nombre}:{' '}
                    <span className="font-semibold">{s.cantidad}</span>
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Bodega de origen</Label>
              <Select value={bodegaId} onValueChange={setBodegaId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione una bodega" />
                </SelectTrigger>
                <SelectContent>
                  {stockPorBodega.map((s) => (
                    <SelectItem
                      key={s.bodega.id}
                      value={String(s.bodega.id)}
                      disabled={s.cantidad === 0}
                    >
                      {s.bodega.nombre} ({s.cantidad} disp.)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-baseline justify-between">
                <Label>Cantidad a transformar</Label>
                {disponible !== null && (
                  <span className="text-xs text-muted-foreground">
                    Disponible: {disponible}
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

            <div className="flex items-center justify-between rounded-lg bg-muted p-3 text-sm">
              <span className="text-destructive">
                − {consume} de {configuracion.producto_origen.nombre}
              </span>
              <span className="font-semibold text-green-600">
                + {produce} de {configuracion.producto_destino.nombre}
              </span>
            </div>

            {stockInsuficiente && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                Stock insuficiente: se necesitan {consume} unidades de «
                {configuracion.producto_origen.nombre}» y solo hay {disponible}.
              </p>
            )}

            <div className="space-y-1.5">
              <Label>Notas (opcional)</Label>
              <Textarea rows={2} value={notas} onChange={(e) => setNotas(e.target.value)} />
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={transformar.isPending}>
            Cancelar
          </Button>
          <Button
            variant="secondary"
            onClick={handleSubmit}
            disabled={transformar.isPending || stockInsuficiente}
          >
            {transformar.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Transformar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
