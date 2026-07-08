import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { inventarioService } from '@/services/inventarioService'
import { getApiErrorMessage } from '@/lib/apiError'
import type {
  ActualizarCantidadPayload,
  AgregarStockPayload,
  MovimientoPayload,
} from '@/types/inventario'

const INVENTARIO_KEY = ['inventario']
const MOVIMIENTOS_KEY = ['movimientos']
const REGISTROS_KEY = ['registros']

export function useInventario() {
  return useQuery({
    queryKey: INVENTARIO_KEY,
    queryFn: inventarioService.getInventario,
    staleTime: 60_000,
  })
}

export function useMovimientos() {
  return useQuery({
    queryKey: MOVIMIENTOS_KEY,
    queryFn: inventarioService.getMovimientos,
    staleTime: 60_000,
  })
}

export function useRegistros() {
  return useQuery({
    queryKey: REGISTROS_KEY,
    queryFn: inventarioService.getRegistros,
    staleTime: 60_000,
  })
}

// Invalida todo lo que cambia tras una operación de inventario.
function useInvalidarInventario() {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: INVENTARIO_KEY })
    qc.invalidateQueries({ queryKey: MOVIMIENTOS_KEY })
    qc.invalidateQueries({ queryKey: REGISTROS_KEY })
  }
}

export function useAgregarStock() {
  const invalidar = useInvalidarInventario()
  return useMutation({
    mutationFn: (payload: AgregarStockPayload) =>
      inventarioService.agregarStock(payload),
    onSuccess: () => {
      invalidar()
      toast.success('Stock agregado al inventario')
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'No se pudo agregar el stock')),
  })
}

export function useActualizarCantidad() {
  const invalidar = useInvalidarInventario()
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number
      payload: ActualizarCantidadPayload
    }) => inventarioService.actualizarCantidad(id, payload),
    onSuccess: () => {
      invalidar()
      toast.success('Cantidad actualizada')
    },
    onError: (e) =>
      toast.error(getApiErrorMessage(e, 'No se pudo actualizar la cantidad')),
  })
}

export function useRealizarMovimiento() {
  const invalidar = useInvalidarInventario()
  return useMutation({
    mutationFn: (payload: MovimientoPayload) =>
      inventarioService.realizarMovimiento(payload),
    onSuccess: () => {
      invalidar()
      toast.success('Movimiento realizado')
    },
    onError: (e) =>
      toast.error(getApiErrorMessage(e, 'No se pudo realizar el movimiento')),
  })
}
