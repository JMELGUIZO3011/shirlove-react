import { apiClient } from '@/lib/apiClient'
import {
  mapBodega,
  type Bodega,
  type Combo,
  type Estilista,
  type MetodoPago,
  type Producto,
  type Servicio,
  type VentaPayload,
} from '@/types/venta'

// Catálogos que alimentan el punto de venta + registro de venta.
// (equivalente a venta_service.dart / inventario_service.dart / combo_service.dart)
export const ventaService = {
  async getProductos(): Promise<Producto[]> {
    const { data } = await apiClient.get<Producto[]>('/api/productos')
    return data
  },

  async getBodegas(): Promise<Bodega[]> {
    const { data } = await apiClient.get<
      { id: number; nombre: string; pais_id?: number }[]
    >('/api/bodegas')
    return data.map(mapBodega)
  },

  async getMetodosPago(): Promise<MetodoPago[]> {
    const { data } = await apiClient.get<MetodoPago[]>('/api/metodos-pago')
    return data
  },

  async getServicios(): Promise<Servicio[]> {
    const { data } = await apiClient.get<Servicio[]>('/api/servicios-salon')
    return data
  },

  async getEstilistas(): Promise<Estilista[]> {
    const { data } = await apiClient.get<Estilista[]>('/api/estilistas')
    return data
  },

  async getCombos(): Promise<Combo[]> {
    // Barra final para evitar el redirect 307 de FastAPI.
    const { data } = await apiClient.get<Combo[]>('/api/combos/')
    return data
  },

  async registrarVenta(
    payload: VentaPayload,
  ): Promise<{ message: string; venta_id: number }> {
    const { data } = await apiClient.post('/api/ventas/registrar_venta', payload)
    return data
  },

  // Anula una venta (soft delete) y devuelve las unidades a la bodega indicada.
  async eliminarVenta(
    ventaId: number,
    bodegaId: number,
    motivo?: string,
  ): Promise<void> {
    await apiClient.delete(`/api/ventas/${ventaId}`, {
      params: { bodega_id: bodegaId, ...(motivo ? { motivo } : {}) },
    })
  },
}
