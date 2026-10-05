import { apiClient } from '@/lib/apiClient'
import { ApiEndpoints } from '@/config/api'
import type {
  UsaAbonoPayload,
  UsaAcceso,
  UsaEstado,
  UsaMovimiento,
  UsaProducto,
  UsaProductoPayload,
  UsaProductoUpdate,
  UsaResumen,
  UsaServicio,
  UsaServicioPayload,
  UsaServicioUpdate,
  UsaStockPayload,
  UsaVenta,
  UsaVentaPayload,
} from '@/types/usa'

const BASE = ApiEndpoints.usa

// El header X-USA-Token lo agrega automáticamente apiClient para rutas /api/usa.
export const usaService = {
  // ---- Acceso ----
  async getEstado(): Promise<UsaEstado> {
    const { data } = await apiClient.get<UsaEstado>(`${BASE}/estado`)
    return data
  },

  async acceder(password: string): Promise<UsaAcceso> {
    const { data } = await apiClient.post<UsaAcceso>(`${BASE}/acceso`, { password })
    return data
  },

  async configurarPassword(params: {
    passwordActual?: string
    passwordNueva: string
  }): Promise<{ message: string }> {
    const { data } = await apiClient.post<{ message: string }>(`${BASE}/password`, {
      password_actual: params.passwordActual ?? null,
      password_nueva: params.passwordNueva,
    })
    return data
  },

  // ---- Productos ----
  async getProductos(incluirInactivos = false): Promise<UsaProducto[]> {
    const { data } = await apiClient.get<UsaProducto[]>(`${BASE}/productos`, {
      params: { incluir_inactivos: incluirInactivos },
    })
    return data
  },

  async crearProducto(payload: UsaProductoPayload): Promise<UsaProducto> {
    const { data } = await apiClient.post<UsaProducto>(`${BASE}/productos`, payload)
    return data
  },

  async actualizarProducto(id: number, payload: UsaProductoUpdate): Promise<UsaProducto> {
    const { data } = await apiClient.put<UsaProducto>(`${BASE}/productos/${id}`, payload)
    return data
  },

  async desactivarProducto(id: number): Promise<void> {
    await apiClient.delete(`${BASE}/productos/${id}`)
  },

  // ---- Servicios ----
  async getServicios(incluirInactivos = false): Promise<UsaServicio[]> {
    const { data } = await apiClient.get<UsaServicio[]>(`${BASE}/servicios`, {
      params: { incluir_inactivos: incluirInactivos },
    })
    return data
  },

  async crearServicio(payload: UsaServicioPayload): Promise<UsaServicio> {
    const { data } = await apiClient.post<UsaServicio>(`${BASE}/servicios`, payload)
    return data
  },

  async actualizarServicio(id: number, payload: UsaServicioUpdate): Promise<UsaServicio> {
    const { data } = await apiClient.put<UsaServicio>(`${BASE}/servicios/${id}`, payload)
    return data
  },

  async desactivarServicio(id: number): Promise<void> {
    await apiClient.delete(`${BASE}/servicios/${id}`)
  },

  // ---- Inventario ----
  async entradaStock(payload: UsaStockPayload): Promise<UsaProducto> {
    const { data } = await apiClient.post<UsaProducto>(`${BASE}/inventario/entrada`, payload)
    return data
  },

  async ajusteStock(payload: UsaStockPayload): Promise<UsaProducto> {
    const { data } = await apiClient.post<UsaProducto>(`${BASE}/inventario/ajuste`, payload)
    return data
  },

  async getMovimientos(params: {
    inicio?: string
    fin?: string
    productoId?: number
  }): Promise<UsaMovimiento[]> {
    const { data } = await apiClient.get<UsaMovimiento[]>(`${BASE}/inventario/movimientos`, {
      params: {
        ...(params.inicio ? { fecha_inicio: params.inicio } : {}),
        ...(params.fin ? { fecha_fin: params.fin } : {}),
        ...(params.productoId ? { producto_id: params.productoId } : {}),
      },
    })
    return data
  },

  // ---- Ventas ----
  async registrarVenta(payload: UsaVentaPayload): Promise<UsaVenta> {
    const { data } = await apiClient.post<UsaVenta>(`${BASE}/ventas`, payload)
    return data
  },

  async getVentas(inicio: string, fin: string, incluirAnuladas = false): Promise<UsaVenta[]> {
    const { data } = await apiClient.get<UsaVenta[]>(`${BASE}/ventas`, {
      params: { fecha_inicio: inicio, fecha_fin: fin, incluir_anuladas: incluirAnuladas },
    })
    return data
  },

  // ---- Cuentas por cobrar (ventas a crédito) ----
  async getCuentasPorCobrar(incluirCobradas = false): Promise<UsaVenta[]> {
    const { data } = await apiClient.get<UsaVenta[]>(`${BASE}/cuentas-por-cobrar`, {
      params: { incluir_cobradas: incluirCobradas },
    })
    return data
  },

  async registrarAbono(ventaId: number, payload: UsaAbonoPayload): Promise<UsaVenta> {
    const { data } = await apiClient.post<UsaVenta>(`${BASE}/ventas/${ventaId}/abonos`, payload)
    return data
  },

  async eliminarAbono(ventaId: number, abonoId: number): Promise<UsaVenta> {
    const { data } = await apiClient.delete<UsaVenta>(`${BASE}/ventas/${ventaId}/abonos/${abonoId}`)
    return data
  },

  async anularVenta(id: number, motivo?: string): Promise<{ message: string }> {
    const { data } = await apiClient.delete<{ message: string }>(`${BASE}/ventas/${id}`, {
      params: motivo ? { motivo } : {},
    })
    return data
  },

  async getResumen(inicio: string, fin: string): Promise<UsaResumen> {
    const { data } = await apiClient.get<UsaResumen>(`${BASE}/resumen`, {
      params: { fecha_inicio: inicio, fecha_fin: fin },
    })
    return data
  },
}
