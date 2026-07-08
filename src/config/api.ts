// Configuración central de la API (equivalente a lib/config/api_config.dart)
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  'https://shirloveapp-53919d0b2003.herokuapp.com'

export const ApiEndpoints = {
  // Auth
  login: '/api/auth/login',
  register: '/api/auth/register',
  userProfile: '/api/auth/me',

  // Clientes
  clientes: '/api/clientes',

  // Inventario
  inventario: '/api/inventario',
  bodegas: '/api/bodegas',
  productos: '/api/productos',
  movimientosBodega: '/api/movimientos-bodega',
  registrosInventario: '/api/registros-inventario',

  // Otros módulos
  ventas: '/api/ventas',
  transformaciones: '/api/transformaciones',
  combos: '/api/combos',
  nomina: '/api/nomina',
  consumosInternos: '/api/consumos-internos',
  gastos: '/api/gastos',
} as const
