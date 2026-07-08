import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { comboService } from '@/services/comboService'
import { getApiErrorMessage } from '@/lib/apiError'
import type { ComboPayload, ComboUpdatePayload } from '@/types/combo'

export function useCombosAdmin(incluirInactivos: boolean) {
  return useQuery({
    queryKey: ['combos', 'admin', incluirInactivos],
    queryFn: () => comboService.getAll(incluirInactivos),
    staleTime: 60_000,
  })
}

export function useCrearCombo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: ComboPayload) => comboService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['combos'] })
      toast.success('Combo creado')
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'No se pudo crear el combo')),
  })
}

export function useActualizarCombo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ComboUpdatePayload }) =>
      comboService.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['combos'] })
      toast.success('Combo actualizado')
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'No se pudo actualizar el combo')),
  })
}
