import { useState } from 'react'
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import type { DateRange } from '@/lib/dateRange'
import { useEliminarPagoNomina, useNomina } from '@/hooks/useFinanzas'
import type { PagoNomina } from '@/types/finanzas'
import { formatCOP } from '@/lib/format'
import { NominaFormDialog } from '@/components/reportes/NominaFormDialog'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

function fmt(d: string) {
  return d.slice(0, 10).split('-').reverse().join('/')
}

export function NominaSection({ range }: { range: DateRange }) {
  const { data: pagos = [], isLoading } = useNomina(range)
  const eliminar = useEliminarPagoNomina()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<PagoNomina | null>(null)
  const [toDelete, setToDelete] = useState<PagoNomina | null>(null)

  const total = pagos.reduce((s, p) => s + p.monto, 0)

  return (
    <div className="rounded-xl border bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
        <div>
          <h3 className="font-semibold text-navy">Pagos de nómina</h3>
          <p className="text-sm text-muted-foreground">
            {pagos.length} pagos · {formatCOP(total)} en total
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setEditing(null)
            setFormOpen(true)
          }}
        >
          <Plus className="h-4 w-4" /> Nuevo pago
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-gold" /> Cargando...
        </div>
      ) : pagos.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No hay pagos de nómina en este período
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Estilista</TableHead>
              <TableHead className="hidden sm:table-cell">Periodo</TableHead>
              <TableHead className="hidden md:table-cell">Concepto</TableHead>
              <TableHead className="hidden md:table-cell">Fecha pago</TableHead>
              <TableHead className="text-right">Monto</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagos.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.estilista_nombre}</TableCell>
                <TableCell className="hidden sm:table-cell text-muted-foreground">
                  {fmt(p.periodo_inicio)} - {fmt(p.periodo_fin)}
                </TableCell>
                <TableCell className="hidden md:table-cell">{p.concepto}</TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">
                  {fmt(p.fecha_pago)}
                </TableCell>
                <TableCell className="text-right font-semibold tabular-nums">
                  {formatCOP(p.monto)}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        setEditing(p)
                        setFormOpen(true)
                      }}
                    >
                      <Pencil className="h-4 w-4 text-navy" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setToDelete(p)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <NominaFormDialog open={formOpen} onOpenChange={setFormOpen} pago={editing} />

      <AlertDialog
        open={toDelete !== null}
        onOpenChange={(o) => !o && setToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar pago de nómina</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Eliminar el pago de {toDelete?.estilista_nombre} por{' '}
              {toDelete ? formatCOP(toDelete.monto) : ''}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={eliminar.isPending}>Cancelar</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={eliminar.isPending}
              onClick={async () => {
                if (!toDelete) return
                try {
                  await eliminar.mutateAsync(toDelete.id)
                  setToDelete(null)
                } catch {
                  /* toast lo maneja el hook */
                }
              }}
            >
              {eliminar.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Eliminar
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
