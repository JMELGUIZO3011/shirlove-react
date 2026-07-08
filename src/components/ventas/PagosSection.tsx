import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { formatCOP } from '@/lib/format'
import type { MetodoPago, PagoSeleccionado } from '@/types/venta'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Props {
  total: number
  metodosPago: MetodoPago[]
  pagos: PagoSeleccionado[]
  onChange: (pagos: PagoSeleccionado[]) => void
}

export function PagosSection({ total, metodosPago, pagos, onChange }: Props) {
  const pagado = pagos.reduce((sum, p) => sum + p.monto, 0)
  const saldo = Math.round((total - pagado) * 100) / 100

  const [metodoId, setMetodoId] = useState('')
  const [monto, setMonto] = useState('')

  function addPago() {
    const metodo = metodosPago.find((m) => String(m.id) === metodoId)
    if (!metodo) return toast.warning('Seleccione un método de pago')
    const value = Number(monto)
    if (!value || value <= 0) return toast.warning('Ingrese un monto válido')
    if (value > saldo + 0.01)
      return toast.warning(
        `El monto no puede exceder el saldo pendiente (${formatCOP(saldo)})`,
      )
    onChange([...pagos, { metodo, monto: value }])
    setMetodoId('')
    setMonto('')
  }

  function removePago(index: number) {
    onChange(pagos.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg bg-muted p-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Total</span>
          <span className="font-semibold">{formatCOP(total)}</span>
        </div>
        <div className="mt-1 flex justify-between">
          <span className="text-muted-foreground">Pagado</span>
          <span>{formatCOP(pagado)}</span>
        </div>
        <div className="mt-1 flex justify-between">
          <span className="text-muted-foreground">Saldo pendiente</span>
          <span
            className={saldo > 0.01 ? 'font-semibold text-orange-600' : 'font-semibold text-green-600'}
          >
            {formatCOP(saldo)}
          </span>
        </div>
      </div>

      {pagos.length > 0 && (
        <ul className="space-y-1.5">
          {pagos.map((p, i) => (
            <li
              key={i}
              className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
            >
              <span>{p.metodo.nombre}</span>
              <div className="flex items-center gap-2">
                <span className="font-medium">{formatCOP(p.monto)}</span>
                <button
                  onClick={() => removePago(i)}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label="Quitar pago"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {saldo > 0.01 && (
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Select value={metodoId} onValueChange={setMetodoId}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Método de pago" />
              </SelectTrigger>
              <SelectContent>
                {metodosPago.map((m) => (
                  <SelectItem key={m.id} value={String(m.id)}>
                    {m.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Input
            type="number"
            className="h-9 w-28"
            placeholder="Monto"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            onFocus={() => {
              if (!monto) setMonto(String(saldo))
            }}
          />
          <Button type="button" size="icon" className="h-9 w-9" onClick={addPago}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
