import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useUsaConfigurarPassword } from '@/hooks/useUsa'
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

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Cambio de la contraseña del módulo USA (solo administradores).
export function UsaPasswordDialog({ open, onOpenChange }: Props) {
  const configurar = useUsaConfigurarPassword()
  const [actual, setActual] = useState('')
  const [nueva, setNueva] = useState('')
  const [confirmar, setConfirmar] = useState('')

  useEffect(() => {
    if (open) {
      setActual('')
      setNueva('')
      setConfirmar('')
    }
  }, [open])

  async function handleSave() {
    if (!actual) return toast.warning('Ingrese la contraseña actual')
    if (nueva.length < 4) return toast.warning('La nueva contraseña debe tener al menos 4 caracteres')
    if (nueva !== confirmar) return toast.warning('Las contraseñas no coinciden')
    try {
      await configurar.mutateAsync({ passwordActual: actual, passwordNueva: nueva })
      onOpenChange(false)
    } catch {
      /* toast lo maneja el hook */
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-navy">Cambiar contraseña del módulo</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="usa-pw-actual">Contraseña actual</Label>
            <Input
              id="usa-pw-actual"
              type="password"
              autoComplete="off"
              value={actual}
              onChange={(e) => setActual(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="usa-pw-nueva">Nueva contraseña</Label>
            <Input
              id="usa-pw-nueva"
              type="password"
              autoComplete="new-password"
              value={nueva}
              onChange={(e) => setNueva(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="usa-pw-confirmar">Confirmar nueva contraseña</Label>
            <Input
              id="usa-pw-confirmar"
              type="password"
              autoComplete="new-password"
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={configurar.isPending}>
            Cancelar
          </Button>
          <Button variant="secondary" onClick={handleSave} disabled={configurar.isPending}>
            {configurar.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
