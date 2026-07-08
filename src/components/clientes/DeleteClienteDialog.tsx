import { Loader2 } from 'lucide-react'
import { useDeleteCliente } from '@/hooks/useClientes'
import type { Cliente } from '@/types/cliente'
import { nombreCompleto } from '@/types/cliente'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

interface Props {
  cliente: Cliente | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteClienteDialog({ cliente, open, onOpenChange }: Props) {
  const deleteCliente = useDeleteCliente()

  async function handleDelete() {
    if (!cliente) return
    try {
      await deleteCliente.mutateAsync(cliente)
      onOpenChange(false)
    } catch {
      // El toast de error lo dispara el hook.
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar eliminación</AlertDialogTitle>
          <AlertDialogDescription>
            ¿Está seguro que desea eliminar al cliente{' '}
            <span className="font-semibold text-foreground">
              {cliente ? nombreCompleto(cliente) : ''}
            </span>
            ? Esta acción no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteCliente.isPending}>
            Cancelar
          </AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteCliente.isPending}
          >
            {deleteCliente.isPending && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            Eliminar
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
