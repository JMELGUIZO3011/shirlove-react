import { apiClient } from '@/lib/apiClient'
import { ApiEndpoints } from '@/config/api'
import type { Cliente, ClientePayload } from '@/types/cliente'

export type ClienteSort = 'nombre' | 'documento' | 'cumpleanos' | 'recientes'

export interface ClienteQuery {
  search?: string
  sort?: ClienteSort
  skip?: number
  limit?: number
}

// Equivalente a lib/services/cliente_service.dart
export const clienteService = {
  // La búsqueda y el orden se resuelven en el servidor para que la
  // paginación no oculte clientes (p. ej. los del final del alfabeto).
  async list({ search, sort = 'nombre', skip = 0, limit = 100 }: ClienteQuery = {}): Promise<
    Cliente[]
  > {
    const term = search?.trim()
    const { data } = await apiClient.get<Cliente[]>(ApiEndpoints.clientes, {
      params: {
        ...(term ? { search: term } : {}),
        sort,
        skip,
        limit,
      },
    })
    return data
  },

  async create(payload: ClientePayload): Promise<Cliente> {
    const { data } = await apiClient.post<Cliente>(
      ApiEndpoints.clientes,
      payload,
    )
    return data
  },

  async update(id: number, payload: ClientePayload): Promise<Cliente> {
    const { data } = await apiClient.put<Cliente>(
      `${ApiEndpoints.clientes}/${id}`,
      payload,
    )
    return data
  },

  async remove(id: number): Promise<void> {
    await apiClient.delete(`${ApiEndpoints.clientes}/${id}`)
  },
}
