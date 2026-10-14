import { useEffect, useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useUsaActualizarVenta } from '@/hooks/useUsa'
import { useClientes } from '@/hooks/useClientes'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { nombreCompleto } from '@/types/cliente'
import type { UsaVenta } from '@/types/usa'
import { formatUSD } from '@/lib/format'
import { AutocompleteInput, type AutocompleteOption } from '@/components/AutocompleteInput'
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

interface Props {
  venta: UsaVenta | null
  onClose: () => void
}

function toLocalInput(iso: string): string {
  // 'YYYY-MM-DDTHH:mm' para <input type="datetime-local"> en hora local
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

// Editar los datos "seguros" de una venta: clienta, fecha, notas y fecha límite.
// Los productos, servicios, montos y pagos no se editan (anular y registrar de nuevo).
export function UsaVentaEditDialog({ venta, onClose }: Props) {
  const actualizar = useUsaActualizarVenta()
  const [cliente, setCliente] = useState('')
  const [fecha, setFecha] = useState('')
  const [notas, setNotas] = useState('')
  const [fechaVencimiento, setFechaVencimiento] = useState('')

  const open = venta !== null

  useEffect(() => {
    if (venta) {
      setCliente(venta.cliente_nombre ?? '')
      setFecha(toLocalInput(venta.fecha))
      setNotas(venta.notas ?? '')
      setFechaVencimiento(venta.fecha_vencimiento ?? '')
    }
  }, [venta])

  const clienteBusqueda = useDebouncedValue(cliente, 300)
  const clientesQ = useClientes({ search: clienteBusqueda, limit: 8 })
  const clienteOptions: AutocompleteOption[] = useMemo(() => {
    const vistos = new Set<string>()
    const out: AutocompleteOption[] = []
    for (const c of clientesQ.data ?? []) {
      const n = nombreCompleto(c)
      if (!n || vistos.has(n.toLowerCase())) continue
      vistos.add(n.toLowerCase())
      const detalle = c.telefono?.trim() || (c.documentoidentidad ? `CC ${c.documentoidentidad}` : undefined)
      out.push({ value: n, detail: detalle })
    }
    return out
  }, [clientesQ.data])

  async function handleSave() {
    if (!venta) return
    if (!fecha) return toast.warning('Indique la fecha de la venta')
    try {
      await actualizar.mutateAsync({
        id: venta.id,
        payload: {
          cliente_nombre: cliente.trim() || null,
          fecha: fecha.length === 16 ? `${fecha}:00` : fecha,
          notas: notas.trim() || null,
          fecha_vencimiento: venta.saldo_pendiente > 0 ? fechaVencimiento || null : undefined,
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
          <DialogTitle className="text-navy">Editar venta #{venta?.id}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
            Total {formatUSD(venta?.total ?? 0)} · {venta?.items.length ?? 0} ítem(s) · pagos:{' '}
            {venta?.metodo_pago}. Los productos, servicios, montos y pagos no se editan aquí; para
            corregirlos, anule la venta y regístrela de nuevo.
          </p>
          <div className="space-y-1.5">
            <Label>Clienta</Label>
            <AutocompleteInput
              value={cliente}
              onChange={setCliente}
              options={clienteOptions}
              filter={false}
              loading={clientesQ.isFetching && clienteOptions.length === 0}
              heading="Clientas registradas"
              createLabel={(t) => `Usar «${t}»`}
              placeholder="Nombre de la clienta"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="usa-edit-fecha">Fecha y hora de la venta</Label>
            <Input
              id="usa-edit-fecha"
              type="datetime-local"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Los pagos y la propina recibidos con la venta se mueven a la nueva fecha.
            </p>
          </div>
          {venta && venta.saldo_pendiente > 0 && (
            <div className="space-y-1.5">
              <Label htmlFor="usa-edit-venc">Fecha límite de pago (opcional)</Label>
              <Input
                id="usa-edit-venc"
                type="date"
                value={fechaVencimiento}
                onChange={(e) => setFechaVencimiento(e.target.value)}
              />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="usa-edit-notas">Notas</Label>
            <Textarea id="usa-edit-notas" rows={2} value={notas} onChange={(e) => setNotas(e.target.value)} />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={actualizar.isPending}>
            Cancelar
          </Button>
          <Button variant="secondary" onClick={handleSave} disabled={actualizar.isPending}>
            {actualizar.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Guardar cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
