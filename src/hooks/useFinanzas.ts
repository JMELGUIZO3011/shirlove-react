import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  consumoService,
  gastoService,
  nominaService,
} from '@/services/finanzasService'
import { getApiErrorMessage } from '@/lib/apiError'
import { toBackendRange, type DateRange } from '@/lib/dateRange'
import type {
  ConsumoInternoPayload,
  GastoPayload,
  PagoNominaPayload,
} from '@/types/finanzas'

export function useGastos(range: DateRange) {
  const { inicio, fin } = toBackendRange(range)
  return useQuery({
    queryKey: ['gastos', inicio, fin],
    queryFn: () => gastoService.getByRange(inicio, fin),
    enabled: Boolean(range.inicio && range.fin),
    staleTime: 60_000,
  })
}

export function useCategoriasGasto() {
  return useQuery({
    queryKey: ['gastos', 'categorias'],
    queryFn: gastoService.getCategorias,
    staleTime: 5 * 60_000,
  })
}

export function useCrearGasto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: GastoPayload) => gastoService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gastos'] })
      toast.success('Gasto registrado')
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'No se pudo registrar el gasto')),
  })
}

export function useActualizarGasto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: GastoPayload }) =>
      gastoService.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gastos'] })
      toast.success('Gasto actualizado')
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'No se pudo actualizar el gasto')),
  })
}

export function useEliminarGasto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => gastoService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gastos'] })
      toast.success('Gasto eliminado')
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'No se pudo eliminar el gasto')),
  })
}

export function useConsumos(range: DateRange) {
  const { inicio, fin } = toBackendRange(range)
  return useQuery({
    queryKey: ['consumos', inicio, fin],
    queryFn: () => consumoService.getByRange(inicio, fin),
    enabled: Boolean(range.inicio && range.fin),
    staleTime: 60_000,
  })
}

export function useCrearConsumo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: ConsumoInternoPayload) => consumoService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['consumos'] })
      qc.invalidateQueries({ queryKey: ['inventario'] })
      toast.success('Consumo registrado')
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'No se pudo registrar el consumo')),
  })
}

export function useEliminarConsumo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => consumoService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['consumos'] })
      qc.invalidateQueries({ queryKey: ['inventario'] })
      toast.success('Consumo eliminado (inventario restaurado)')
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'No se pudo eliminar el consumo')),
  })
}

const NOMINA_KEY = 'nomina'

export function useNomina(range: DateRange) {
  const { inicio, fin } = toBackendRange(range)
  return useQuery({
    queryKey: [NOMINA_KEY, inicio, fin],
    queryFn: () => nominaService.getByRange(inicio, fin),
    enabled: Boolean(range.inicio && range.fin),
    staleTime: 60_000,
  })
}

export function useCrearPagoNomina() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: PagoNominaPayload) => nominaService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [NOMINA_KEY] })
      toast.success('Pago de nómina registrado')
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'No se pudo registrar el pago')),
  })
}

export function useActualizarPagoNomina() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: PagoNominaPayload }) =>
      nominaService.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [NOMINA_KEY] })
      toast.success('Pago de nómina actualizado')
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'No se pudo actualizar el pago')),
  })
}

export function useEliminarPagoNomina() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => nominaService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [NOMINA_KEY] })
      toast.success('Pago de nómina eliminado')
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'No se pudo eliminar el pago')),
  })
}
