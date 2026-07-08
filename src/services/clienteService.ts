import { apiClient } from '@/lib/apiClient'
import { ApiEndpoints } from '@/config/api'
import type { Cliente, ClientePayload } from '@/types/cliente'

// Equivalente a lib/services/cliente_service.dart
export const clienteService = {
  async getAll(): Promise<Cliente[]> {
    // Cargamos la cartera completa; la búsqueda/orden se hace en el cliente.
    const { data } = await apiClient.get<Cliente[]>(ApiEndpoints.clientes, {
      params: { limit: 1000 },
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
