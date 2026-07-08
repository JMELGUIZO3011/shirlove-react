import { apiClient } from '@/lib/apiClient'
import type {
  ActualizarCantidadPayload,
  AgregarStockPayload,
  InventarioItem,
  MovimientoBodega,
  MovimientoPayload,
  RegistroInventario,
} from '@/types/inventario'

// Equivalente a inventario_service.dart
export const inventarioService = {
  async getInventario(): Promise<InventarioItem[]> {
    const { data } = await apiClient.get<InventarioItem[]>('/api/inventario')
    return data
  },

  async getMovimientos(): Promise<MovimientoBodega[]> {
    const { data } = await apiClient.get<MovimientoBodega[]>(
      '/api/movimientos-bodega',
    )
    return data
  },

  async getRegistros(): Promise<RegistroInventario[]> {
    const { data } = await apiClient.get<RegistroInventario[]>(
      '/api/registros-inventario',
    )
    return data
  },

  // Suma cantidad al stock (crea el registro si no existe).
  async agregarStock(payload: AgregarStockPayload): Promise<InventarioItem> {
    const { data } = await apiClient.post<InventarioItem>(
      '/api/inventario',
      payload,
    )
    return data
  },

  // Reemplaza la cantidad por el valor indicado.
  async actualizarCantidad(
    inventarioId: number,
    payload: ActualizarCantidadPayload,
  ): Promise<InventarioItem> {
    const { data } = await apiClient.put<InventarioItem>(
      `/api/inventario/${inventarioId}/cantidad`,
      payload,
    )
    return data
  },

  async realizarMovimiento(
    payload: MovimientoPayload,
  ): Promise<MovimientoBodega> {
    const { data } = await apiClient.post<MovimientoBodega>(
      '/api/movimientos-bodega',
      payload,
    )
    return data
  },
}
