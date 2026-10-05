import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useUsaRegistrarAbono } from '@/hooks/useUsa'
import { dateWithCurrentTime, toLocalDateTimeISO } from '@/lib/dateRange'
import { formatUSD } from '@/lib/format'
import type { UsaVenta } from '@/types/usa'
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
  venta: UsaVenta | null
  metodosPago: string[]
  onClose: () => void
}

// Registrar un cobro sobre una venta a crédito: el saldo completo (por defecto)
// o un abono parcial.
export function UsaCobroDialog({ venta, metodosPago, onClose }: Props) {
  const registrar = useUsaRegistrarAbono()
  const [monto, setMonto] = useState('')
  const [metodo, setMetodo] = useState('')
  const [fecha, setFecha] = useState('')
  const [notas, setNotas] = useState('')

  const open = venta !== null
  const saldo = venta?.saldo_pendiente ?? 0

  useEffect(() => {
    if (open) {
      setMonto(String(saldo))
      setMetodo('')
      setFecha('')
      setNotas('')
    }
  }, [open, saldo])

  const montoNum = Number(monto)
  const esTotal = Number.isFinite(montoNum) && Math.abs(montoNum - saldo) < 0.005
  const quedaria = Number.isFinite(montoNum) ? Math.max(0, saldo - montoNum) : saldo

  async function handleSave() {
    if (!venta) return
    if (!Number.isFinite(montoNum) || montoNum <= 0) return toast.warning('Ingrese un monto válido')
    if (montoNum > saldo + 0.009)
      return toast.warning(`El monto no puede superar el saldo pendiente (${formatUSD(saldo)})`)
    if (!metodo) return toast.warning('Seleccione el método de pago')
    try {
      await registrar.mutateAsync({
        ventaId: venta.id,
        payload: {
          monto: Math.round(montoNum * 100) / 100,
          metodo_pago: metodo,
          fecha: fecha ? dateWithCurrentTime(fecha) : toLocalDateTimeISO(),
          notas: notas.trim() || null,
        },
      })
      onClose()
    } catch {
      /* toast lo maneja el hook */
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-navy">
            Cobrar venta #{venta?.id}
            {venta?.cliente_nombre ? ` · ${venta.cliente_nombre}` : ''}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted p-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="font-semibold tabular-nums">{formatUSD(venta?.total ?? 0)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Abonado</p>
              <p className="font-semibold tabular-nums">{formatUSD(venta?.abonado ?? 0)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Saldo</p>
              <p className="font-semibold tabular-nums text-amber-700">{formatUSD(saldo)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="usa-cobro-monto">Monto a cobrar (USD)</Label>
              <Input
                id="usa-cobro-monto"
                type="number"
                min={0}
                step="0.01"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
              />
              {!esTotal && (
                <button
                  type="button"
                  className="text-xs text-navy underline-offset-2 hover:underline"
                  onClick={() => setMonto(String(saldo))}
                >
                  Cobrar el saldo completo
                </button>
              )}
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
            <Label htmlFor="usa-cobro-fecha">Fecha del cobro (opcional)</Label>
            <Input
              id="usa-cobro-fecha"
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="usa-cobro-notas">Notas (opcional)</Label>
            <Textarea
              id="usa-cobro-notas"
              rows={2}
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
            />
          </div>

          <p className="text-sm">
            {esTotal ? (
              <span className="font-medium text-green-700">
                La venta quedará marcada como cobrada en su totalidad.
              </span>
            ) : (
              <>
                Después de este abono quedará por cobrar{' '}
                <span className="font-semibold tabular-nums">{formatUSD(quedaria)}</span>.
              </>
            )}
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={registrar.isPending}>
            Cancelar
          </Button>
          <Button variant="secondary" onClick={handleSave} disabled={registrar.isPending}>
            {registrar.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {esTotal ? 'Marcar como cobrada' : 'Registrar abono'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
