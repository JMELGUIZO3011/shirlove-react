import { apiClient } from '@/lib/apiClient'
import type {
  CrearProductoPayload,
  Pais,
  PrecioInput,
  ProductoAdmin,
  TipoPrecio,
} from '@/types/producto'

// Router /api/productos (barra final para list/create → evita 307).
export const productoService = {
  async getAll(): Promise<ProductoAdmin[]> {
    const { data } = await apiClient.get<ProductoAdmin[]>('/api/productos/')
    return data
  },

  async getTiposPrecio(): Promise<TipoPrecio[]> {
    const { data } = await apiClient.get<TipoPrecio[]>('/api/productos/tipos-precio')
    return data
  },

  async getPaises(): Promise<Pais[]> {
    const { data } = await apiClient.get<Pais[]>('/api/productos/paises')
    return data
  },

  async create(payload: CrearProductoPayload): Promise<{ producto_id: number }> {
    const { data } = await apiClient.post('/api/productos/', payload)
    return data
  },

  async updateNombre(id: number, nombre: string): Promise<void> {
    await apiClient.put(`/api/productos/${id}`, { nombre })
  },

  async addPrecio(productoId: number, payload: PrecioInput): Promise<void> {
    await apiClient.post(`/api/productos/${productoId}/precios`, payload)
  },

  async updatePrecio(precioId: number, precio: number): Promise<void> {
    await apiClient.put(`/api/productos/precios/${precioId}`, { precio })
  },

  async removePrecio(precioId: number): Promise<void> {
    await apiClient.delete(`/api/productos/precios/${precioId}`)
  },
}
