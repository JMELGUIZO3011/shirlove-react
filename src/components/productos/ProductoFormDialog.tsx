import { useEffect, useState } from 'react'
import { Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  useActualizarNombreProducto,
  useCrearProducto,
  usePaises,
  useTiposPrecio,
} from '@/hooks/useProductosAdmin'
import type { ProductoAdmin } from '@/types/producto'
import { formatMoneyByPais } from '@/lib/format'
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

interface PrecioRow {
  tipo_precio_id: number
  pais_id: number
  precio: number
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  producto?: ProductoAdmin | null
}

export function ProductoFormDialog({ open, onOpenChange, producto }: Props) {
  const isEdit = Boolean(producto)
  const { data: tipos = [] } = useTiposPrecio()
  const { data: paises = [] } = usePaises()
  const crear = useCrearProducto()
  const actualizar = useActualizarNombreProducto()
  const saving = crear.isPending || actualizar.isPending

  const [nombre, setNombre] = useState('')
  const [rows, setRows] = useState<PrecioRow[]>([])

  // Formulario para agregar una fila de precio
  const [paisId, setPaisId] = useState('')
  const [tipoId, setTipoId] = useState('')
  const [precio, setPrecio] = useState('')

  useEffect(() => {
    if (!open) return
    setNombre(producto?.nombre ?? '')
    setRows([])
    setPaisId('')
    setTipoId('')
    setPrecio('')
  }, [open, producto])

  const nombreTipo = (id: number) => tipos.find((t) => t.id === id)?.nombre ?? ''
  const nombrePais = (id: number) => paises.find((p) => p.id === id)?.nombre ?? ''

  function addRow() {
    if (!paisId || !tipoId) return toast.warning('Seleccione país y tipo de precio')
    const val = Number(precio)
    if (!val || val <= 0) return toast.warning('Ingrese un precio válido')
    if (rows.some((r) => r.pais_id === Number(paisId) && r.tipo_precio_id === Number(tipoId)))
      return toast.warning('Ya agregó ese tipo/país')
    setRows((prev) => [
      ...prev,
      { pais_id: Number(paisId), tipo_precio_id: Number(tipoId), precio: val },
    ])
    setPrecio('')
    setTipoId('')
  }

  async function handleSave() {
    if (!nombre.trim()) return toast.warning('Indique el nombre del producto')
    try {
      if (producto) {
        await actualizar.mutateAsync({ id: producto.id, nombre: nombre.trim() })
      } else {
        await crear.mutateAsync({ nombre: nombre.trim(), precios: rows })
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
            {isEdit ? 'Editar producto' : 'Nuevo producto'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nombre del producto</Label>
            <Input value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </div>

          {!isEdit && (
            <div className="space-y-2">
              <Label>Precios iniciales (opcional)</Label>
              <div className="flex flex-wrap items-end gap-2">
                <div className="flex-1 space-y-1">
                  <span className="text-xs text-muted-foreground">País</span>
                  <Select value={paisId} onValueChange={setPaisId}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="País" />
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
                <div className="flex-1 space-y-1">
                  <span className="text-xs text-muted-foreground">Tipo</span>
                  <Select value={tipoId} onValueChange={setTipoId}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Tipo" />
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
                <Input
                  type="number"
                  min={0}
                  className="h-9 w-28"
                  placeholder="Precio"
                  value={precio}
                  onChange={(e) => setPrecio(e.target.value)}
                />
                <Button type="button" size="sm" variant="outline" onClick={addRow}>
                  Agregar
                </Button>
              </div>

              {rows.length > 0 && (
                <ul className="space-y-1">
                  {rows.map((r, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between rounded-md border px-3 py-1.5 text-sm"
                    >
                      <span>
                        {nombreTipo(r.tipo_precio_id)} · {nombrePais(r.pais_id)}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {formatMoneyByPais(r.precio, nombrePais(r.pais_id))}
                        </span>
                        <button
                          onClick={() => setRows((prev) => prev.filter((_, j) => j !== i))}
                          className="text-muted-foreground hover:text-destructive"
                          aria-label="Quitar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="secondary" onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? 'Guardar cambios' : 'Crear producto'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
