import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ventaService } from '@/services/ventaService'
import { getApiErrorMessage } from '@/lib/apiError'
import type { VentaPayload } from '@/types/venta'

// Catálogos: se cachean bastante tiempo porque cambian poco.
const CATALOG_STALE = 5 * 60_000

export function useProductos() {
  return useQuery({
    queryKey: ['productos'],
    queryFn: ventaService.getProductos,
    staleTime: CATALOG_STALE,
  })
}

export function useBodegas() {
  return useQuery({
    queryKey: ['bodegas'],
    queryFn: ventaService.getBodegas,
    staleTime: CATALOG_STALE,
  })
}

export function useMetodosPago() {
  return useQuery({
    queryKey: ['metodos-pago'],
    queryFn: ventaService.getMetodosPago,
    staleTime: CATALOG_STALE,
  })
}

export function useServicios() {
  return useQuery({
    queryKey: ['servicios-salon'],
    queryFn: ventaService.getServicios,
    staleTime: CATALOG_STALE,
  })
}

export function useEstilistas() {
  return useQuery({
    queryKey: ['estilistas'],
    queryFn: ventaService.getEstilistas,
    staleTime: CATALOG_STALE,
  })
}

export function useCombos() {
  return useQuery({
    queryKey: ['combos'],
    queryFn: ventaService.getCombos,
    staleTime: CATALOG_STALE,
  })
}

export function useRegistrarVenta() {
  return useMutation({
    mutationFn: (payload: VentaPayload) => ventaService.registrarVenta(payload),
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'No se pudo registrar la venta'))
    },
  })
}

export function useEliminarVenta() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      ventaId,
      bodegaId,
      motivo,
    }: {
      ventaId: number
      bodegaId: number
      motivo?: string
    }) => ventaService.eliminarVenta(ventaId, bodegaId, motivo),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reporte'] })
      qc.invalidateQueries({ queryKey: ['inventario'] })
      qc.invalidateQueries({ queryKey: ['registros'] })
      toast.success('Venta anulada y unidades devueltas al inventario')
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'No se pudo anular la venta'))
    },
  })
}
