import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  useActualizarPrecio,
  useAgregarPrecio,
  usePaises,
  useTiposPrecio,
} from '@/hooks/useProductosAdmin'
import type { ProductoPrecio } from '@/types/producto'
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
  open: boolean
  onClose: () => void
  // Para agregar: producto destino. Para editar: el precio existente.
  productoId?: number
  precioExistente?: ProductoPrecio | null
}

export function PrecioDialog({ open, onClose, productoId, precioExistente }: Props) {
  const isEdit = Boolean(precioExistente)
  const { data: tipos = [] } = useTiposPrecio()
  const { data: paises = [] } = usePaises()
  const agregar = useAgregarPrecio()
  const actualizar = useActualizarPrecio()
  const saving = agregar.isPending || actualizar.isPending

  const [paisId, setPaisId] = useState('')
  const [tipoId, setTipoId] = useState('')
  const [precio, setPrecio] = useState('')

  useEffect(() => {
    if (!open) return
    if (precioExistente) {
      setPaisId(String(precioExistente.pais_id))
      setTipoId(String(precioExistente.tipo_precio_id))
      setPrecio(String(precioExistente.precio))
    } else {
      setPaisId('')
      setTipoId('')
      setPrecio('')
    }
  }, [open, precioExistente])

  async function handleSave() {
    const val = Number(precio)
    if (!val || val <= 0) return toast.warning('Ingrese un precio válido')
    try {
      if (precioExistente) {
        await actualizar.mutateAsync({ precioId: precioExistente.id, precio: val })
      } else {
        if (!productoId) return
        if (!paisId || !tipoId) return toast.warning('Seleccione país y tipo de precio')
        await agregar.mutateAsync({
          productoId,
          payload: {
            pais_id: Number(paisId),
            tipo_precio_id: Number(tipoId),
            precio: val,
          },
        })
      }
      onClose()
    } catch {
      /* toast lo maneja el hook */
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-navy">
            {isEdit ? 'Editar precio' : 'Agregar precio'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!isEdit && (
            <>
              <div className="space-y-1.5">
                <Label>País</Label>
                <Select value={paisId} onValueChange={setPaisId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione país" />
                  </SelectTrigger>
                  <SelectContent>
                    {paises.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Tipo de precio</Label>
                <Select value={tipoId} onValueChange={setTipoId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {tipos.map((t) => (
                      <SelectItem key={t.id} value={String(t.id)}>
                        {t.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {isEdit && (
            <p className="text-sm text-muted-foreground">
              {precioExistente?.tipo_precio_nombre} · {precioExistente?.pais_nombre}
            </p>
          )}

          <div className="space-y-1.5">
            <Label>Precio</Label>
            <Input
              type="number"
              min={0}
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="secondary" onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? 'Guardar' : 'Agregar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
