import { apiClient } from '@/lib/apiClient'
import type {
  ConfiguracionTransformacion,
  TransformacionHistorial,
  TransformarPayload,
} from '@/types/transformacion'

// Equivalente a transformacion_service.dart
export const transformacionService = {
  async getConfiguraciones(): Promise<ConfiguracionTransformacion[]> {
    const { data } = await apiClient.get<ConfiguracionTransformacion[]>(
      '/api/transformaciones/configuraciones',
    )
    return data
  },

  async getHistorial(bodegaId?: number): Promise<TransformacionHistorial[]> {
    const { data } = await apiClient.get<TransformacionHistorial[]>(
      '/api/transformaciones/historial',
      { params: bodegaId ? { bodega_id: bodegaId } : undefined },
    )
    return data
  },

  async transformar(payload: TransformarPayload): Promise<{ message: string }> {
    const { data } = await apiClient.post(
      '/api/transformaciones/transformar',
      payload,
    )
    return data
  },

  async revertir(transformacionId: number): Promise<{ message: string }> {
    const { data } = await apiClient.delete(
      `/api/transformaciones/${transformacionId}`,
    )
    return data
  },
}
