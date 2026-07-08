import { apiClient } from '@/lib/apiClient'
import type { Combo } from '@/types/venta'
import type { ComboPayload, ComboUpdatePayload } from '@/types/combo'

// Rutas con barra final para list/create (evita el redirect 307 de FastAPI).
export const comboService = {
  async getAll(incluirInactivos = false): Promise<Combo[]> {
    const { data } = await apiClient.get<Combo[]>('/api/combos/', {
      params: incluirInactivos ? { incluir_inactivos: true } : undefined,
    })
    return data
  },

  async create(payload: ComboPayload): Promise<{ combo_id: number }> {
    const { data } = await apiClient.post('/api/combos/', payload)
    return data
  },

  async update(id: number, payload: ComboUpdatePayload): Promise<void> {
    await apiClient.put(`/api/combos/${id}`, payload)
  },
}
