import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { productoService } from '@/services/productoService'
import { getApiErrorMessage } from '@/lib/apiError'
import type { CrearProductoPayload, PrecioInput } from '@/types/producto'

export function useProductosAdmin() {
  return useQuery({
    queryKey: ['productos-admin'],
    queryFn: productoService.getAll,
    staleTime: 60_000,
  })
}

export function useTiposPrecio() {
  return useQuery({
    queryKey: ['tipos-precio'],
    queryFn: productoService.getTiposPrecio,
    staleTime: 10 * 60_000,
  })
}

export function usePaises() {
  return useQuery({
    queryKey: ['paises'],
    queryFn: productoService.getPaises,
    staleTime: 10 * 60_000,
  })
}

// Al cambiar productos/precios se invalida también el catálogo del POS (['productos']).
function useInvalidarProductos() {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: ['productos-admin'] })
    qc.invalidateQueries({ queryKey: ['productos'] })
  }
}

export function useCrearProducto() {
  const invalidar = useInvalidarProductos()
  return useMutation({
    mutationFn: (payload: CrearProductoPayload) => productoService.create(payload),
    onSuccess: () => {
      invalidar()
      toast.success('Producto creado')
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'No se pudo crear el producto')),
  })
}

export function useActualizarNombreProducto() {
  const invalidar = useInvalidarProductos()
  return useMutation({
    mutationFn: ({ id, nombre }: { id: number; nombre: string }) =>
      productoService.updateNombre(id, nombre),
    onSuccess: () => {
      invalidar()
      toast.success('Producto actualizado')
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'No se pudo actualizar el producto')),
  })
}

export function useAgregarPrecio() {
  const invalidar = useInvalidarProductos()
  return useMutation({
    mutationFn: ({ productoId, payload }: { productoId: number; payload: PrecioInput }) =>
      productoService.addPrecio(productoId, payload),
    onSuccess: () => {
      invalidar()
      toast.success('Precio agregado')
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'No se pudo agregar el precio')),
  })
}

export function useActualizarPrecio() {
  const invalidar = useInvalidarProductos()
  return useMutation({
    mutationFn: ({ precioId, precio }: { precioId: number; precio: number }) =>
      productoService.updatePrecio(precioId, precio),
    onSuccess: () => {
      invalidar()
      toast.success('Precio actualizado')
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'No se pudo actualizar el precio')),
  })
}

export function useEliminarPrecio() {
  const invalidar = useInvalidarProductos()
  return useMutation({
    mutationFn: (precioId: number) => productoService.removePrecio(precioId),
    onSuccess: () => {
      invalidar()
      toast.success('Precio eliminado')
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'No se pudo eliminar el precio')),
  })
}
