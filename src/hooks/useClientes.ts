import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { clienteService, type ClienteQuery } from '@/services/clienteService'
import { getApiErrorMessage } from '@/lib/apiError'
import type { Cliente, ClientePayload } from '@/types/cliente'

const CLIENTES_KEY = ['clientes'] as const

/**
 * Lista clientes con búsqueda/orden/paginación resueltos en el servidor.
 * Cada combinación de parámetros es su propia entrada de caché.
 */
export function useClientes(params: ClienteQuery = {}) {
  const { search = '', sort = 'nombre', skip = 0, limit = 100 } = params
  return useQuery({
    queryKey: [...CLIENTES_KEY, { search: search.trim(), sort, skip, limit }],
    queryFn: () => clienteService.list({ search, sort, skip, limit }),
    placeholderData: keepPreviousData,
  })
}

export function useCreateCliente() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: ClientePayload) => clienteService.create(payload),
    onSuccess: (cliente) => {
      qc.invalidateQueries({ queryKey: CLIENTES_KEY })
      toast.success(`Cliente «${cliente.nombre} ${cliente.apellido}» creado`)
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'No se pudo crear el cliente'))
    },
  })
}

export function useUpdateCliente() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ClientePayload }) =>
      clienteService.update(id, payload),
    onSuccess: (cliente) => {
      qc.invalidateQueries({ queryKey: CLIENTES_KEY })
      toast.success(`Cliente «${cliente.nombre} ${cliente.apellido}» actualizado`)
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'No se pudo actualizar el cliente'))
    },
  })
}

export function useDeleteCliente() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (cliente: Cliente) => clienteService.remove(cliente.id),
    onSuccess: (_data, cliente) => {
      qc.invalidateQueries({ queryKey: CLIENTES_KEY })
      toast.success(`Cliente «${cliente.nombre} ${cliente.apellido}» eliminado`)
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(
          error,
          'No se pudo eliminar el cliente (puede tener registros asociados)',
        ),
      )
    },
  })
}
