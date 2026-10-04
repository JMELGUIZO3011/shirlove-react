import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  ShoppingCart,
  BarChart3,
  Boxes,
  Repeat,
  PackageMinus,
  Wallet,
  Package,
  Pencil,
  Globe,
  LogOut,
  UserPlus,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Logo } from '@/components/Logo'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface MenuItem {
  title: string
  icon: LucideIcon
  color: string
  route: string
  adminOnly: boolean
}

// Orden y permisos replicados de lib/main.dart
const MENU_ITEMS: MenuItem[] = [
  {
    title: 'Gestionar Clientes',
    icon: Users,
    color: '#B5873A',
    route: '/clientes',
    adminOnly: true,
  },
  {
    title: 'Gestionar Ventas',
    icon: ShoppingCart,
    color: '#002B5C',
    route: '/ventas',
    adminOnly: true,
  },
  {
    title: 'Reportes',
    icon: BarChart3,
    color: '#16a34a',
    route: '/reportes',
    adminOnly: false,
  },
  {
    title: 'Inventario',
    icon: Boxes,
    color: '#b45309',
    route: '/inventario',
    adminOnly: false,
  },
  {
    title: 'Transformar Productos',
    icon: Repeat,
    color: '#0d9488',
    route: '/transformaciones',
    adminOnly: true,
  },
  {
    title: 'Consumos Internos',
    icon: PackageMinus,
    color: '#ea580c',
    route: '/consumos-internos',
    adminOnly: true,
  },
  {
    title: 'Gastos',
    icon: Wallet,
    color: '#dc2626',
    route: '/gastos',
    adminOnly: true,
  },
  {
    title: 'Combos',
    icon: Package,
    color: '#f97316',
    route: '/combos',
    adminOnly: true,
  },
  {
    title: 'Gestión de Productos',
    icon: Pencil,
    color: '#0d9488',
    route: '/productos',
    adminOnly: true,
  },
  {
    // Operación en Estados Unidos: datos separados de Colombia y protegido
    // con contraseña propia (se pide al entrar).
    title: 'Módulo USA',
    icon: Globe,
    color: '#1d4ed8',
    route: '/usa',
    adminOnly: false,
  },
]

// Equivalente al AuthWrapper autenticado de lib/main.dart
export function HomePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [showLogout, setShowLogout] = useState(false)

  const isAdmin = user?.esAdmin ?? false
  const items = MENU_ITEMS.filter((item) => !item.adminOnly || isAdmin)

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-gray-100 to-white">
      {/* AppBar */}
      <header className="bg-gradient-to-br from-navy to-gold px-4 py-3 text-white shadow">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-white/95 p-2">
              <Logo className="h-10 w-28" />
            </div>
            <div>
              <p className="text-xl font-bold leading-tight">
                Panel Administrativo
              </p>
              <p className="text-xs text-white/90">
                Shirlove - Belleza que nace del alma
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {isAdmin && (
              <Button
                variant="ghost"
                onClick={() => navigate('/register')}
                className="text-white hover:bg-white/10 hover:text-white"
              >
                <UserPlus className="h-4 w-4" />
                <span className="hidden sm:inline">Nuevo Usuario</span>
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={() => setShowLogout(true)}
              className="text-white hover:bg-white/10 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Bienvenida */}
      <div className="bg-white px-6 py-6 shadow-sm">
        <h2 className="text-2xl font-bold text-navy">
          Bienvenido, {user?.nombre ?? ''}
        </h2>
        <p className="mt-1 text-gray-500">Rol: {user?.rol ?? ''}</p>
      </div>

      {/* Menú */}
      <main className="flex-1 p-6">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => {
            const Icon = item.icon
            return (
              <Card
                key={item.route}
                onClick={() => navigate(item.route)}
                className="cursor-pointer border transition-shadow hover:shadow-md"
                style={{ borderColor: `${item.color}33` }}
              >
                <div className="flex items-center gap-3 px-4 py-3">
                  <div
                    className="rounded-lg p-2"
                    style={{ backgroundColor: `${item.color}1a` }}
                  >
                    <Icon className="h-6 w-6" style={{ color: item.color }} />
                  </div>
                  <span className="flex-1 text-sm font-semibold text-gray-800">
                    {item.title}
                  </span>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </Card>
            )
          })}
        </div>
      </main>

      {/* Diálogo de cierre de sesión */}
      <Dialog open={showLogout} onOpenChange={setShowLogout}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <LogOut className="h-5 w-5 text-destructive" />
              Cerrar Sesión
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            ¿Está seguro que desea cerrar sesión?
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowLogout(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={logout}>
              Cerrar Sesión
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
