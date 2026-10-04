import { useQuery } from '@tanstack/react-query'
import { tasaCambioService } from '@/services/tasaCambioService'

// Tasa USD -> COP "en vivo": se refresca sola cada 10 minutos mientras la
// pantalla esté abierta y al volver a la pestaña del navegador.
const REFRESH_MS = 10 * 60_000

export function useTasaUsdCop() {
  return useQuery({
    queryKey: ['tasa-cambio', 'USD', 'COP'],
    queryFn: tasaCambioService.getUsdCop,
    staleTime: REFRESH_MS,
    refetchInterval: REFRESH_MS,
    refetchOnWindowFocus: true,
    retry: 2,
  })
}
