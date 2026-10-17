import { apiClient } from '@/lib/apiClient'
import type { Estilista } from '@/types/venta'

export interface EstilistaPayload {
  nombre: string
}

// CRUD de estilistas (solo admin para crear/editar/eliminar).
export const estilistaService = {
  async getAll(): Promise<Estilista[]> {
    const { data } = await apiClient.get<Estilista[]>('/api/estilistas')
    return data
  },

  async create(payload: EstilistaPayload): Promise<Estilista> {
    const { data } = await apiClient.post<Estilista>('/api/estilistas', payload)
    return data
  },

  async update(id: number, payload: EstilistaPayload): Promise<Estilista> {
    const { data } = await apiClient.put<Estilista>(`/api/estilistas/${id}`, payload)
    return data
  },

  async remove(id: number): Promise<void> {
    await apiClient.delete(`/api/estilistas/${id}`)
  },
}
