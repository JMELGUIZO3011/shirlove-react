import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { HomePage } from '@/pages/HomePage'

// Páginas pesadas cargadas bajo demanda (gráficas, Excel, etc.)
const ClientesPage = lazy(() =>
  import('@/pages/ClientesPage').then((m) => ({ default: m.ClientesPage })),
)
const VentasPage = lazy(() =>
  import('@/pages/VentasPage').then((m) => ({ default: m.VentasPage })),
)
const ReportesPage = lazy(() =>
  import('@/pages/ReportesPage').then((m) => ({ default: m.ReportesPage })),
)
const InventarioPage = lazy(() =>
  import('@/pages/InventarioPage').then((m) => ({ default: m.InventarioPage })),
)
const TransformacionesPage = lazy(() =>
  import('@/pages/TransformacionesPage').then((m) => ({
    default: m.TransformacionesPage,
  })),
)
const ConsumosPage = lazy(() =>
  import('@/pages/ConsumosPage').then((m) => ({ default: m.ConsumosPage })),
)
const GastosPage = lazy(() =>
  import('@/pages/GastosPage').then((m) => ({ default: m.GastosPage })),
)
const CombosPage = lazy(() =>
  import('@/pages/CombosPage').then((m) => ({ default: m.CombosPage })),
)
const GestionProductosPage = lazy(() =>
  import('@/pages/GestionProductosPage').then((m) => ({
    default: m.GestionProductosPage,
  })),
)
const UsaPage = lazy(() =>
  import('@/pages/UsaPage').then((m) => ({ default: m.UsaPage })),
)

export default function App() {
  const { initializing } = useAuth()

  // Mientras se verifica el token guardado, evitamos parpadeos de login.
  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    )
  }

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white">
          <Loader2 className="h-8 w-8 animate-spin text-gold" />
        </div>
      }
    >
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/register"
        element={
          <ProtectedRoute requireAdmin>
            <RegisterPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/clientes"
        element={
          <ProtectedRoute requireAdmin>
            <ClientesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ventas"
        element={
          <ProtectedRoute requireAdmin>
            <VentasPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reportes"
        element={
          <ProtectedRoute>
            <ReportesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/inventario"
        element={
          <ProtectedRoute>
            <InventarioPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/transformaciones"
        element={
          <ProtectedRoute requireAdmin>
            <TransformacionesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/consumos-internos"
        element={
          <ProtectedRoute requireAdmin>
            <ConsumosPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/gastos"
        element={
          <ProtectedRoute requireAdmin>
            <GastosPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/combos"
        element={
          <ProtectedRoute requireAdmin>
            <CombosPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/productos"
        element={
          <ProtectedRoute requireAdmin>
            <GestionProductosPage />
          </ProtectedRoute>
        }
      />
      {/* Módulo USA: cualquier usuario con sesión, pero protegido por la contraseña del módulo */}
      <Route
        path="/usa"
        element={
          <ProtectedRoute>
            <UsaPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>
  )
}
