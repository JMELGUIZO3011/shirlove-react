import { useState } from 'react'
import { ArrowRight, History, Loader2, Repeat, Undo2 } from 'lucide-react'
import {
  useConfiguracionesTransformacion,
  useHistorialTransformaciones,
  useRevertirTransformacion,
} from '@/hooks/useTransformaciones'
import type {
  ConfiguracionTransformacion,
  TransformacionHistorial,
} from '@/types/transformacion'
import { PageHeader } from '@/components/PageHeader'
import { TransformarDialog } from '@/components/transformaciones/TransformarDialog'
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

function fmtFechaHora(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function TransformacionesPage() {
  const configsQ = useConfiguracionesTransformacion()
  const historialQ = useHistorialTransformaciones()
  const revertir = useRevertirTransformacion()
  const [seleccionada, setSeleccionada] = useState<ConfiguracionTransformacion | null>(
    null,
  )
  const [aRevertir, setARevertir] = useState<TransformacionHistorial | null>(null)

  const configs = configsQ.data ?? []
  const historial = historialQ.data ?? []

  async function confirmarRevertir() {
    if (!aRevertir) return
    try {
      await revertir.mutateAsync(aRevertir.id)
      setARevertir(null)
    } catch {
      /* toast lo maneja el hook */
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-gray-100 to-white">
      <PageHeader
        title="Transformar Productos"
        subtitle="Convierte productos según las configuraciones"
      />

      <div className="mx-auto w-full max-w-5xl flex-1 space-y-6 p-4 sm:p-6">
        {/* Configuraciones */}
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-navy">
            <Repeat className="h-5 w-5" /> Transformaciones disponibles
          </h2>

          {configsQ.isLoading ? (
            <LoadingBox />
          ) : configs.length === 0 ? (
            <EmptyCard text="No hay configuraciones de transformación disponibles" />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {configs.map((c) => (
                <div
                  key={c.id}
                  className="flex flex-col gap-3 rounded-xl border bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Origen</p>
                      <p className="font-semibold leading-tight">
                        {c.producto_origen.nombre}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-gold" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Destino</p>
                      <p className="font-semibold leading-tight">
                        {c.producto_destino.nombre}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {c.cantidad_origen} ⟶ {c.cantidad_destino} uds
                    </span>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setSeleccionada(c)}
                    >
                      <Repeat className="h-4 w-4" /> Transformar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Historial */}
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-navy">
            <History className="h-5 w-5" /> Historial de transformaciones
          </h2>

          {historialQ.isLoading ? (
            <LoadingBox />
          ) : historial.length === 0 ? (
            <EmptyCard text="No hay transformaciones registradas" />
          ) : (
            <div className="rounded-xl border bg-white shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Origen</TableHead>
                    <TableHead>Destino</TableHead>
                    <TableHead className="text-right">Cant. origen</TableHead>
                    <TableHead className="text-right">Cant. destino</TableHead>
                    <TableHead className="hidden md:table-cell">Usuario</TableHead>
                    <TableHead className="hidden lg:table-cell">Notas</TableHead>
                    <TableHead className="w-24 text-right">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historial.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="text-muted-foreground">
                        {fmtFechaHora(t.fecha)}
                      </TableCell>
                      <TableCell className="font-medium">{t.producto_origen}</TableCell>
                      <TableCell className="font-medium">{t.producto_destino}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {t.cantidad_origen}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {t.cantidad_destino}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {t.usuario ?? '—'}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell max-w-xs truncate text-muted-foreground">
                        {t.notas || '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setARevertir(t)}
                        >
                          <Undo2 className="h-4 w-4" /> Revertir
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </section>
      </div>

      <TransformarDialog
        configuracion={seleccionada}
        onClose={() => setSeleccionada(null)}
      />

      <AlertDialog
        open={aRevertir !== null}
        onOpenChange={(o) => !o && setARevertir(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revertir transformación</AlertDialogTitle>
            <AlertDialogDescription>
              {aRevertir && (
                <>
                  Se devolverán{' '}
                  <span className="font-semibold text-foreground">
                    {aRevertir.cantidad_origen}
                  </span>{' '}
                  de «{aRevertir.producto_origen}» y se descontarán{' '}
                  <span className="font-semibold text-foreground">
                    {aRevertir.cantidad_destino}
                  </span>{' '}
                  de «{aRevertir.producto_destino}» del inventario. Esta acción
                  elimina la transformación del historial.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={revertir.isPending}>
              Cancelar
            </AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={confirmarRevertir}
              disabled={revertir.isPending}
            >
              {revertir.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Revertir
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function LoadingBox() {
  return (
    <div className="flex items-center justify-center gap-2 rounded-xl border bg-white py-12 text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin text-gold" /> Cargando...
    </div>
  )
}

function EmptyCard({ text }: { text: string }) {
  return (
    <div className="rounded-xl border bg-white py-12 text-center text-sm text-muted-foreground shadow-sm">
      {text}
    </div>
  )
}
