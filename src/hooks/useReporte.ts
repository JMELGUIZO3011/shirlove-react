import { useQuery } from '@tanstack/react-query'
import { reportService } from '@/services/reportService'
import { toBackendRange, type DateRange } from '@/lib/dateRange'

export function useReporte(range: DateRange) {
  const { inicio, fin } = toBackendRange(range)
  return useQuery({
    queryKey: ['reporte', inicio, fin],
    queryFn: () => reportService.getVentasPorFecha(inicio, fin),
    enabled: Boolean(range.inicio && range.fin),
    staleTime: 60_000,
  })
}
