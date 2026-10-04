import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { usaService } from '@/services/usaService'
import { getApiErrorMessage } from '@/lib/apiError'
import { setUsaToken } from '@/lib/usaAccess'
import { toBackendRange, type DateRange } from '@/lib/dateRange'
import type {
  UsaProductoPayload,
  UsaProductoUpdate,
  UsaServicioPayload,
  UsaServicioUpdate,
  UsaStockPayload,
  UsaVentaPayload,
} from '@/types/usa'

// Todas las queries del módulo cuelgan de ['usa'] para invalidarlas en bloque
// y no cruzarse jamás con las cachés de Colombia (['productos'], ['inventario'], ...).
const USA = 'usa'
const CATALOG_STALE = 5 * 60_000

// ---- Acceso ----

export function useUsaEstado(enabled = true) {
  return useQuery({
    queryKey: [USA, 'estado'],
    queryFn: usaService.getEstado,
    enabled,
    staleTime: 0,
    retry: false,
  })
}

export function useUsaAcceder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (password: string) => usaService.acceder(password),
    onSuccess: (data) => {
      setUsaToken(data.usa_token)
      qc.invalidateQueries({ queryKey: [USA] })
    },
  })
}

export function useUsaConfigurarPassword() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: usaService.configurarPassword,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: [USA, 'estado'] })
      toast.success(data.message)
    },
    onError: (e) =>
      toast.error(getApiErrorMessage(e, 'No se pudo guardar la contraseña del módulo')),
  })
}

// ---- Productos ----

export function useUsaProductos(incluirInactivos = false) {
  return useQuery({
    queryKey: [USA, 'productos', incluirInactivos],
    queryFn: () => usaService.getProductos(incluirInactivos),
    staleTime: CATALOG_STALE,
  })
}

export function useUsaCrearProducto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UsaProductoPayload) => usaService.crearProducto(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [USA, 'productos'] })
      qc.invalidateQueries({ queryKey: [USA, 'movimientos'] })
      toast.success('Producto USA creado')
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'No se pudo crear el producto')),
  })
}

export function useUsaActualizarProducto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UsaProductoUpdate }) =>
      usaService.actualizarProducto(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [USA, 'productos'] })
      toast.success('Producto actualizado')
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'No se pudo actualizar el producto')),
  })
}

// ---- Servicios ----

export function useUsaServicios(incluirInactivos = false) {
  return useQuery({
    queryKey: [USA, 'servicios', incluirInactivos],
    queryFn: () => usaService.getServicios(incluirInactivos),
    staleTime: CATALOG_STALE,
  })
}

export function useUsaCrearServicio() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UsaServicioPayload) => usaService.crearServicio(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [USA, 'servicios'] })
      toast.success('Servicio USA creado')
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'No se pudo crear el servicio')),
  })
}

export function useUsaActualizarServicio() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UsaServicioUpdate }) =>
      usaService.actualizarServicio(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [USA, 'servicios'] })
      toast.success('Servicio actualizado')
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'No se pudo actualizar el servicio')),
  })
}

// ---- Inventario ----

export function useUsaEntradaStock() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UsaStockPayload) => usaService.entradaStock(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [USA, 'productos'] })
      qc.invalidateQueries({ queryKey: [USA, 'movimientos'] })
      toast.success('Entrada de inventario registrada')
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'No se pudo registrar la entrada')),
  })
}

export function useUsaAjusteStock() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UsaStockPayload) => usaService.ajusteStock(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [USA, 'productos'] })
      qc.invalidateQueries({ queryKey: [USA, 'movimientos'] })
      toast.success('Inventario ajustado')
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'No se pudo ajustar el inventario')),
  })
}

export function useUsaMovimientos(range: DateRange, productoId?: number) {
  const { inicio, fin } = toBackendRange(range)
  return useQuery({
    queryKey: [USA, 'movimientos', inicio, fin, productoId ?? null],
    queryFn: () => usaService.getMovimientos({ inicio, fin, productoId }),
    enabled: Boolean(range.inicio && range.fin),
    staleTime: 60_000,
  })
}

// ---- Ventas ----

export function useUsaRegistrarVenta() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UsaVentaPayload) => usaService.registrarVenta(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [USA, 'productos'] })
      qc.invalidateQueries({ queryKey: [USA, 'ventas'] })
      qc.invalidateQueries({ queryKey: [USA, 'resumen'] })
      qc.invalidateQueries({ queryKey: [USA, 'movimientos'] })
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'No se pudo registrar la venta')),
  })
}

export function useUsaVentas(range: DateRange, incluirAnuladas = false) {
  const { inicio, fin } = toBackendRange(range)
  return useQuery({
    queryKey: [USA, 'ventas', inicio, fin, incluirAnuladas],
    queryFn: () => usaService.getVentas(inicio, fin, incluirAnuladas),
    enabled: Boolean(range.inicio && range.fin),
    staleTime: 60_000,
  })
}

export function useUsaAnularVenta() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, motivo }: { id: number; motivo?: string }) =>
      usaService.anularVenta(id, motivo),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: [USA, 'productos'] })
      qc.invalidateQueries({ queryKey: [USA, 'ventas'] })
      qc.invalidateQueries({ queryKey: [USA, 'resumen'] })
      qc.invalidateQueries({ queryKey: [USA, 'movimientos'] })
      toast.success(data.message)
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'No se pudo anular la venta')),
  })
}

export function useUsaResumen(range: DateRange) {
  const { inicio, fin } = toBackendRange(range)
  return useQuery({
    queryKey: [USA, 'resumen', inicio, fin],
    queryFn: () => usaService.getResumen(inicio, fin),
    enabled: Boolean(range.inicio && range.fin),
    staleTime: 60_000,
  })
}
