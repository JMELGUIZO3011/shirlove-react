import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { transformacionService } from '@/services/transformacionService'
import { getApiErrorMessage } from '@/lib/apiError'
import type { TransformarPayload } from '@/types/transformacion'

export function useConfiguracionesTransformacion() {
  return useQuery({
    queryKey: ['transformaciones', 'configuraciones'],
    queryFn: transformacionService.getConfiguraciones,
    staleTime: 5 * 60_000,
  })
}

export function useHistorialTransformaciones() {
  return useQuery({
    queryKey: ['transformaciones', 'historial'],
    queryFn: () => transformacionService.getHistorial(),
    staleTime: 60_000,
  })
}

export function useTransformar() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: TransformarPayload) =>
      transformacionService.transformar(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transformaciones', 'historial'] })
      qc.invalidateQueries({ queryKey: ['inventario'] })
      toast.success('Transformación realizada')
    },
    onError: (e) =>
      toast.error(getApiErrorMessage(e, 'No se pudo realizar la transformación')),
  })
}

export function useRevertirTransformacion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => transformacionService.revertir(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transformaciones', 'historial'] })
      qc.invalidateQueries({ queryKey: ['inventario'] })
      toast.success('Transformación revertida')
    },
    onError: (e) =>
      toast.error(getApiErrorMessage(e, 'No se pudo revertir la transformación')),
  })
}
