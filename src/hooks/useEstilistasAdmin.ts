import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { estilistaService, type EstilistaPayload } from '@/services/estilistaService'
import { getApiErrorMessage } from '@/lib/apiError'

// La consulta de estilistas vive en useVentas (useEstilistas) con la llave
// ['estilistas']; aquí solo van las mutaciones del apartado de administración.

export function useCrearEstilista() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: EstilistaPayload) => estilistaService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['estilistas'] })
      toast.success('Estilista creada')
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'No se pudo crear la estilista')),
  })
}

export function useActualizarEstilista() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: EstilistaPayload }) =>
      estilistaService.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['estilistas'] })
      toast.success('Estilista actualizada')
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'No se pudo actualizar la estilista')),
  })
}

export function useEliminarEstilista() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => estilistaService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['estilistas'] })
      toast.success('Estilista eliminada')
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'No se pudo eliminar la estilista')),
  })
}
