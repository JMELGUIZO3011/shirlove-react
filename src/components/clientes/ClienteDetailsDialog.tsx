import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Cliente } from '@/types/cliente'
import { nombreCompleto } from '@/types/cliente'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

function fmtDate(value: string | null, withTime = false) {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return format(d, withTime ? "d 'de' MMMM 'de' yyyy" : "d 'de' MMMM 'de' yyyy", {
    locale: es,
  })
}

interface Props {
  cliente: Cliente | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: (cliente: Cliente) => void
}

export function ClienteDetailsDialog({
  cliente,
  open,
  onOpenChange,
  onEdit,
}: Props) {
  if (!cliente) return null

  const rows: [string, string | null][] = [
    ['Nombre completo', nombreCompleto(cliente)],
    ['Documento', String(cliente.documentoidentidad)],
    ['Email', cliente.email],
    ['Teléfono', cliente.telefono],
    ['Dirección', cliente.direccion],
    ['Cumpleaños', fmtDate(cliente.cumpleanos)],
    ['Cliente desde', fmtDate(cliente.fechaDeCreacion)],
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-navy text-white">
              {cliente.nombre[0]?.toUpperCase()}
            </span>
            <span className="text-navy">Detalles del cliente</span>
          </DialogTitle>
        </DialogHeader>

        <dl className="divide-y">
          {rows.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4 py-2.5">
              <dt className="text-sm font-medium text-muted-foreground">
                {label}
              </dt>
              <dd className="text-right text-sm text-foreground">
                {value ?? '—'}
              </dd>
            </div>
          ))}
        </dl>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              onOpenChange(false)
              onEdit(cliente)
            }}
          >
            Editar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
