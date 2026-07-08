import { apiClient } from '@/lib/apiClient'
import type { VentaReporte } from '@/types/reporte'

// Fechas en hora local de Colombia (sin 'Z'), como espera el backend.
// Inicio → 00:00:00, fin → 23:59:59 (el backend expande el rango del día).
export const reportService = {
  async getVentasPorFecha(
    inicioISO: string,
    finISO: string,
  ): Promise<VentaReporte[]> {
    const { data } = await apiClient.get<VentaReporte[]>('/api/ventas/reporte', {
      params: { fecha_inicio: inicioISO, fecha_fin: finISO },
    })
    return data
  },
}
