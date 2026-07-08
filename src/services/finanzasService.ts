import { apiClient } from '@/lib/apiClient'
import type {
  ConsumoInterno,
  ConsumoInternoPayload,
  Gasto,
  GastoPayload,
  PagoNomina,
  PagoNominaPayload,
} from '@/types/finanzas'

// Rangos: el backend usa fromisoformat; enviamos 'YYYY-MM-DDTHH:mm:ss'.
// Rutas con barra final para evitar el redirect 307.
export const gastoService = {
  async getByRange(inicio: string, fin: string): Promise<Gasto[]> {
    const { data } = await apiClient.get<Gasto[]>('/api/gastos/', {
      params: { fecha_inicio: inicio, fecha_fin: fin },
    })
    return data
  },

  async getCategorias(): Promise<string[]> {
    const { data } = await apiClient.get<string[]>('/api/gastos/categorias')
    return data
  },

  async create(payload: GastoPayload): Promise<Gasto> {
    const { data } = await apiClient.post<Gasto>('/api/gastos/', payload)
    return data
  },

  async update(id: number, payload: GastoPayload): Promise<Gasto> {
    const { data } = await apiClient.put<Gasto>(`/api/gastos/${id}`, payload)
    return data
  },

  async remove(id: number): Promise<void> {
    await apiClient.delete(`/api/gastos/${id}`)
  },
}

export const consumoService = {
  async getByRange(inicio: string, fin: string): Promise<ConsumoInterno[]> {
    const { data } = await apiClient.get<ConsumoInterno[]>(
      '/api/consumos-internos/',
      { params: { fecha_inicio: inicio, fecha_fin: fin } },
    )
    return data
  },

  async create(payload: ConsumoInternoPayload): Promise<ConsumoInterno> {
    const { data } = await apiClient.post<ConsumoInterno>(
      '/api/consumos-internos/',
      payload,
    )
    return data
  },

  async remove(id: number): Promise<void> {
    await apiClient.delete(`/api/consumos-internos/${id}`)
  },
}

export const nominaService = {
  async getByRange(inicio: string, fin: string): Promise<PagoNomina[]> {
    const { data } = await apiClient.get<PagoNomina[]>('/api/nomina/', {
      params: { fecha_inicio: inicio, fecha_fin: fin },
    })
    return data
  },

  async create(payload: PagoNominaPayload): Promise<PagoNomina> {
    const { data } = await apiClient.post<PagoNomina>('/api/nomina/', payload)
    return data
  },

  async update(id: number, payload: PagoNominaPayload): Promise<PagoNomina> {
    const { data } = await apiClient.put<PagoNomina>(
      `/api/nomina/${id}`,
      payload,
    )
    return data
  },

  async remove(id: number): Promise<void> {
    await apiClient.delete(`/api/nomina/${id}`)
  },
}
