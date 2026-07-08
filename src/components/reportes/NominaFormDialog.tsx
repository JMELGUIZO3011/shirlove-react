import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  useActualizarPagoNomina,
  useCrearPagoNomina,
} from '@/hooks/useFinanzas'
import { useEstilistas } from '@/hooks/useVentas'
import type { PagoNomina, PagoNominaPayload } from '@/types/finanzas'
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

const CONCEPTOS = ['Quincenal', 'Mensual', 'Bono', 'Extraordinario']

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  pago?: PagoNomina | null
}

export function NominaFormDialog({ open, onOpenChange, pago }: Props) {
  const isEdit = Boolean(pago)
  const { data: estilistas = [] } = useEstilistas()
  const crear = useCrearPagoNomina()
  const actualizar = useActualizarPagoNomina()
  const saving = crear.isPending || actualizar.isPending

  const [estilistaId, setEstilistaId] = useState('')
  const [monto, setMonto] = useState('')
  const [fechaPago, setFechaPago] = useState('')
  const [periodoInicio, setPeriodoInicio] = useState('')
  const [periodoFin, setPeriodoFin] = useState('')
  const [concepto, setConcepto] = useState('Quincenal')
  const [notas, setNotas] = useState('')

  useEffect(() => {
    if (!open) return
    if (pago) {
      setEstilistaId(String(pago.estilista_id))
      setMonto(String(pago.monto))
      setFechaPago(pago.fecha_pago.slice(0, 10))
      setPeriodoInicio(pago.periodo_inicio.slice(0, 10))
      setPeriodoFin(pago.periodo_fin.slice(0, 10))
      setConcepto(pago.concepto)
      setNotas(pago.notas ?? '')
    } else {
      setEstilistaId('')
      setMonto('')
      setFechaPago('')
      setPeriodoInicio('')
      setPeriodoFin('')
      setConcepto('Quincenal')
      setNotas('')
    }
  }, [open, pago])

  async function handleSave() {
    if (!estilistaId) return toast.warning('Seleccione un estilista')
    if (!Number(monto) || Number(monto) <= 0)
      return toast.warning('Ingrese un monto válido')
    if (!fechaPago || !periodoInicio || !periodoFin)
      return toast.warning('Complete las fechas')

    const payload: PagoNominaPayload = {
      estilista_id: Number(estilistaId),
      monto: Number(monto),
      fecha_pago: `${fechaPago}T12:00:00`,
      periodo_inicio: periodoInicio,
      periodo_fin: periodoFin,
      concepto,
      notas: notas.trim() || null,
    }
    try {
      if (pago) {
        await actualizar.mutateAsync({ id: pago.id, payload })
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
            {isEdit ? 'Editar pago de nómina' : 'Nuevo pago de nómina'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Monto</Label>
              <Input
                type="number"
                min={0}
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Concepto</Label>
              <Select value={concepto} onValueChange={setConcepto}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONCEPTOS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Periodo inicio</Label>
              <Input
                type="date"
                value={periodoInicio}
                onChange={(e) => setPeriodoInicio(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Periodo fin</Label>
              <Input
                type="date"
                value={periodoFin}
                onChange={(e) => setPeriodoFin(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Fecha de pago</Label>
            <Input
              type="date"
              value={fechaPago}
              onChange={(e) => setFechaPago(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Notas (opcional)</Label>
            <Textarea rows={2} value={notas} onChange={(e) => setNotas(e.target.value)} />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="secondary" onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? 'Guardar cambios' : 'Registrar pago'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
