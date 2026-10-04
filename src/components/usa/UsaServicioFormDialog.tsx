import { useEffect, useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useUsaActualizarServicio, useUsaCrearServicio } from '@/hooks/useUsa'
import { useServicios as useServiciosColombia } from '@/hooks/useVentas'
import type { UsaServicio } from '@/types/usa'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AutocompleteInput, type AutocompleteOption } from '@/components/AutocompleteInput'
import { Label } from '@/components/ui/label'

const CATEGORIAS_SUGERIDAS = ['Cabello', 'Uñas', 'Pestañas', 'Cejas', 'Facial', 'Maquillaje', 'Otros']

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  servicio?: UsaServicio | null
  categorias: string[]
}

// Crear / editar un servicio del catálogo USA (precio sugerido en USD).
export function UsaServicioFormDialog({ open, onOpenChange, servicio, categorias }: Props) {
  const isEdit = Boolean(servicio)
  const crear = useUsaCrearServicio()
  const actualizar = useUsaActualizarServicio()
  const saving = crear.isPending || actualizar.isPending

  const [categoria, setCategoria] = useState('')
  const [nombre, setNombre] = useState('')
  const [precio, setPrecio] = useState('')

  useEffect(() => {
    if (!open) return
    if (servicio) {
      setCategoria(servicio.categoria)
      setNombre(servicio.nombre)
      setPrecio(String(servicio.precio))
    } else {
      setCategoria('')
      setNombre('')
      setPrecio('')
    }
  }, [open, servicio])

  // Catálogo de servicios de Colombia: solo para SUGERIR nombre y categoría.
  // El servicio USA se crea aparte y tiene su propio precio en USD.
  const colombiaQ = useServiciosColombia()
  const serviciosColombia = useMemo(() => colombiaQ.data ?? [], [colombiaQ.data])

  const opcionesCategoria = useMemo(() => {
    const set = new Set([
      ...CATEGORIAS_SUGERIDAS,
      ...categorias,
      ...serviciosColombia.map((s) => s.categoria.trim()).filter(Boolean),
    ])
    return [...set].sort((a, b) => a.localeCompare(b, 'es'))
  }, [categorias, serviciosColombia])

  const opcionesNombre: AutocompleteOption[] = useMemo(() => {
    const vistos = new Set<string>()
    const out: AutocompleteOption[] = []
    for (const s of serviciosColombia) {
      const n = s.nombre.trim()
      if (!n || vistos.has(n.toLowerCase())) continue
      vistos.add(n.toLowerCase())
      out.push({ value: n, detail: s.categoria })
    }
    return out.sort((a, b) => a.value.localeCompare(b.value, 'es'))
  }, [serviciosColombia])

  function handleNombreChange(valor: string) {
    setNombre(valor)
    // Si coincide con un servicio de Colombia y aún no hay categoría, la proponemos.
    if (categoria.trim()) return
    const match = serviciosColombia.find(
      (s) => s.nombre.trim().toLowerCase() === valor.trim().toLowerCase(),
    )
    if (match) setCategoria(match.categoria)
  }

  async function handleSave() {
    if (!categoria.trim()) return toast.warning('Indique la categoría')
    if (!nombre.trim()) return toast.warning('Indique el nombre del servicio')
    const precioNum = Number(precio)
    if (!Number.isFinite(precioNum) || precioNum < 0) return toast.warning('Ingrese un precio válido')

    const payload = { categoria: categoria.trim(), nombre: nombre.trim(), precio: precioNum }
    try {
      if (servicio) await actualizar.mutateAsync({ id: servicio.id, payload })
      else await crear.mutateAsync(payload)
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
            {isEdit ? 'Editar servicio USA' : 'Nuevo servicio USA'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="usa-serv-cat">Categoría</Label>
            <AutocompleteInput
              id="usa-serv-cat"
              value={categoria}
              onChange={setCategoria}
              options={opcionesCategoria.map((c) => ({ value: c }))}
              heading="Categorías"
              createLabel={(t) => `Crear categoría «${t}»`}
              placeholder="Ej: Cabello"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="usa-serv-nombre">Nombre</Label>
            <AutocompleteInput
              id="usa-serv-nombre"
              value={nombre}
              onChange={handleNombreChange}
              options={opcionesNombre}
              heading="Del catálogo de Colombia"
              createLabel={(t) => `Crear «${t}» como servicio nuevo`}
              placeholder="Ej: Keratina"
            />
            {!isEdit && (
              <p className="text-xs text-muted-foreground">
                Puede elegir un servicio del catálogo de Colombia o escribir uno nuevo. Solo se
                copia el nombre (y la categoría); el precio USA es independiente.
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="usa-serv-precio">Precio sugerido (USD)</Label>
            <Input
              id="usa-serv-precio"
              type="number"
              min={0}
              step="0.01"
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Al vender se puede ajustar el precio para cada clienta.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="secondary" onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? 'Guardar cambios' : 'Crear servicio'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
