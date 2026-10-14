import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useUsaRegistrarTip } from '@/hooks/useUsa'
import { dateWithCurrentTime, toLocalDateTimeISO } from '@/lib/dateRange'
import { formatFechaHora, formatUSD } from '@/lib/format'
import type { UsaVenta } from '@/types/usa'
import { AutocompleteInput } from '@/components/AutocompleteInput'
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
  open: boolean
  onOpenChange: (open: boolean) => void
  metodosPago: string[]
  /** Nombres sugeridos para "para quién". */
  personas?: string[]
  /** Si se pasa, la propina queda ligada a esta venta (y no se pide el número). */
  venta?: UsaVenta | null
}

// Registrar una propina: suelta (con N° de venta opcional) o para una venta concreta.
export function UsaPropinaDialog({ open, onOpenChange, metodosPago, personas = [], venta }: Props) {
  const registrar = useUsaRegistrarTip()
  const [monto, setMonto] = useState('')
  const [metodo, setMetodo] = useState('')
  const [para, setPara] = useState('')
  const [ventaId, setVentaId] = useState('')
  const [fecha, setFecha] = useState('')
  const [notas, setNotas] = useState('')

  useEffect(() => {
    if (open) {
      setMonto('')
      setMetodo('')
      setPara('')
      setVentaId('')
      setFecha('')
      setNotas('')
    }
  }, [open])

  async function handleSave() {
    const montoNum = Number(monto)
    if (!Number.isFinite(montoNum) || montoNum <= 0) return toast.warning('Ingrese un monto válido')
    if (!metodo) return toast.warning('Seleccione el método de pago')
    let ventaNum: number | null = venta ? venta.id : null
    if (!venta && ventaId.trim()) {
      ventaNum = Number(ventaId)
      if (!Number.isInteger(ventaNum) || ventaNum <= 0) return toast.warning('El número de venta no es válido')
    }
    try {
      await registrar.mutateAsync({
        venta_id: ventaNum,
        monto: Math.round(montoNum * 100) / 100,
        metodo_pago: metodo,
        para: para.trim() || null,
        // Sin fecha: si es para una venta, el backend usa la fecha de la venta.
        fecha: fecha ? dateWithCurrentTime(fecha) : venta ? undefined : toLocalDateTimeISO(),
        notas: notas.trim() || null,
      })
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
            {venta ? `Propina para la venta #${venta.id}` : 'Registrar propina'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {venta && (
            <p className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
              {venta.cliente_nombre ?? 'Sin clienta'} · {formatFechaHora(venta.fecha)} ·{' '}
              {formatUSD(venta.total)}
              {venta.tips_total > 0 && ` · ya tiene ${formatUSD(venta.tips_total)} en propinas`}
            </p>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="usa-tip-monto">Monto (USD)</Label>
              <Input
                id="usa-tip-monto"
                type="number"
                min={0}
                step="0.01"
                autoFocus
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Método de pago</Label>
              <Select value={metodo} onValueChange={setMetodo}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione" />
                </SelectTrigger>
                <SelectContent>
                  {metodosPago.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="usa-tip-para">Para quién (opcional)</Label>
            <AutocompleteInput
              id="usa-tip-para"
              value={para}
              onChange={setPara}
              options={personas.map((p) => ({ value: p }))}
              heading="Personas con propinas"
              placeholder="Nombre de quien recibe la propina"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {!venta && (
              <div className="space-y-1.5">
                <Label htmlFor="usa-tip-venta">N° de venta (opcional)</Label>
                <Input
                  id="usa-tip-venta"
                  type="number"
                  min={1}
                  step={1}
                  value={ventaId}
                  onChange={(e) => setVentaId(e.target.value)}
                  placeholder="Ej: 12"
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="usa-tip-fecha">Fecha (opcional)</Label>
              <Input id="usa-tip-fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
              {venta && (
                <p className="text-xs text-muted-foreground">Si se deja vacía, usa la fecha de la venta.</p>
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="usa-tip-notas">Notas (opcional)</Label>
            <Textarea id="usa-tip-notas" rows={2} value={notas} onChange={(e) => setNotas(e.target.value)} />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={registrar.isPending}>
            Cancelar
          </Button>
          <Button variant="secondary" onClick={handleSave} disabled={registrar.isPending}>
            {registrar.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Registrar propina
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
