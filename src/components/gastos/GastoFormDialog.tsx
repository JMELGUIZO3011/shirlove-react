import { useEffect, useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useActualizarGasto, useCrearGasto } from '@/hooks/useFinanzas'
import type { Gasto, GastoPayload } from '@/types/finanzas'
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

const CATEGORIAS_PREDEFINIDAS = [
  'Arriendo',
  'Servicios Públicos',
  'Insumos Papelería',
  'Insumos Aseo',
  'Insumos Café',
  'Mantenimiento',
  'Publicidad',
  'Internet/Teléfono',
  'Transporte',
  'Otros',
]

function hoyYMD() {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  gasto?: Gasto | null
  categorias: string[]
}

export function GastoFormDialog({ open, onOpenChange, gasto, categorias }: Props) {
  const isEdit = Boolean(gasto)
  const crear = useCrearGasto()
  const actualizar = useActualizarGasto()
  const saving = crear.isPending || actualizar.isPending

  const [categoria, setCategoria] = useState('')
  const [concepto, setConcepto] = useState('')
  const [monto, setMonto] = useState('')
  const [tipo, setTipo] = useState('Variable')
  const [fecha, setFecha] = useState(hoyYMD())
  const [comprobante, setComprobante] = useState('')
  const [notas, setNotas] = useState('')

  useEffect(() => {
    if (!open) return
    if (gasto) {
      setCategoria(gasto.categoria)
      setConcepto(gasto.concepto)
      setMonto(String(gasto.monto))
      setTipo(gasto.tipo)
      setFecha(gasto.fecha.slice(0, 10))
      setComprobante(gasto.comprobante ?? '')
      setNotas(gasto.notas ?? '')
    } else {
      setCategoria('')
      setConcepto('')
      setMonto('')
      setTipo('Variable')
      setFecha(hoyYMD())
      setComprobante('')
      setNotas('')
    }
  }, [open, gasto])

  const opcionesCategoria = useMemo(() => {
    const set = new Set([...CATEGORIAS_PREDEFINIDAS, ...categorias])
    return [...set].sort((a, b) => a.localeCompare(b, 'es'))
  }, [categorias])

  async function handleSave() {
    if (!categoria.trim()) return toast.warning('Indique la categoría')
    if (!concepto.trim()) return toast.warning('Indique el concepto')
    const montoNum = Number(monto)
    if (!montoNum || montoNum <= 0) return toast.warning('El monto debe ser mayor a 0')

    const payload: GastoPayload = {
      categoria: categoria.trim(),
      concepto: concepto.trim(),
      monto: montoNum,
      tipo,
      fecha: fecha || null,
      comprobante: comprobante.trim() || null,
      notas: notas.trim() || null,
    }
    try {
      if (gasto) {
        await actualizar.mutateAsync({ id: gasto.id, payload })
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
            {isEdit ? 'Editar gasto' : 'Nuevo gasto'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="categoria">Categoría</Label>
              <Input
                id="categoria"
                list="categorias-gasto"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                placeholder="Ej: Arriendo"
              />
              <datalist id="categorias-gasto">
                {opcionesCategoria.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Fijo">Fijo (mensual)</SelectItem>
                  <SelectItem value="Variable">Variable (ocasional)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="concepto">Concepto</Label>
            <Input
              id="concepto"
              value={concepto}
              onChange={(e) => setConcepto(e.target.value)}
              placeholder="Descripción del gasto"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="monto">Monto</Label>
              <Input
                id="monto"
                type="number"
                min={0}
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fecha">Fecha</Label>
              <Input
                id="fecha"
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="comprobante">Comprobante (opcional)</Label>
            <Input
              id="comprobante"
              value={comprobante}
              onChange={(e) => setComprobante(e.target.value)}
              placeholder="N° factura / referencia"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notas">Notas (opcional)</Label>
            <Textarea
              id="notas"
              rows={2}
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="secondary" onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? 'Guardar cambios' : 'Registrar gasto'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
