# Shirlove Admin — Frontend React

Migración del panel administrativo de Shirlove desde Flutter (`../shirlove_admin`) a React.
Consume el mismo backend FastAPI (Heroku); **no se modifica el backend**.

## Stack

- **Vite + React + TypeScript**
- **Tailwind CSS + shadcn/ui** (Radix UI) — replica el diseño Material del Flutter
- **React Router** — navegación y rutas protegidas
- **Axios** — cliente HTTP con inyección automática del token Bearer
- **TanStack Query** — estado de servidor (caché, invalidación, loading/error)
- **react-hook-form + zod** — formularios con validación
- **sonner** — notificaciones (toasts)
- **Context API** — estado de autenticación (equivalente a los `Provider` de Flutter)

## Comandos

```bash
npm install      # instalar dependencias
npm run dev      # servidor de desarrollo
npm run build    # build de producción
npm run preview  # previsualizar el build
```

## Configuración

Copia `.env.example` a `.env` para sobrescribir `VITE_API_BASE_URL` si el backend cambia de URL.

## Estructura

```
src/
  components/ui/     Componentes shadcn (button, input, card, select, dialog, label)
  components/        Logo, ProtectedRoute
  config/api.ts      URL base + endpoints
  contexts/          AuthContext (login, logout, checkAuthStatus)
  lib/               apiClient (axios), cn (utilidad de clases)
  pages/             LoginPage, RegisterPage, HomePage, PlaceholderPage
  services/          authService
  types/             Tipos (User, AuthResponse, ...)
```

## Estado de la migración

**Migrado y verificado:**

- Autenticación (login form-urlencoded, registro, perfil, persistencia de token)
- Home / menú principal con control de rol admin
- Tema de marca, componentes base y routing con rutas protegidas
- **Clientes** — CRUD completo con TanStack Query, búsqueda instantánea en todos
  los campos, orden (nombre / documento / cumpleaños / recientes), validación
  con zod, toasts y campo cumpleaños. Género pendiente (necesita endpoint `/generos`).
- **Ventas (POS)** — punto de venta: cliente + bodega, carrito mixto
  (productos con tipo de precio y descuento, servicios con estilista/comisión/cortesía,
  combos), pagos mixtos con validación de total, fecha opcional. Comboboxes con
  búsqueda, resumen en vivo y registro contra `/api/ventas/registrar_venta`.
- **Reportes** — dashboard con selector de rango (presets + custom), 3 pestañas
  (Resumen, Ventas, Comisiones). Integra ventas + nómina + consumos + gastos para
  calcular ganancia neta y márgenes. Gráficas (Recharts): ventas/día y mensual
  ingresos-vs-ganancia. Tabla de ventas expandible, comisiones por estilista, CRUD
  de nómina, y exportación a Excel (9 hojas). Páginas pesadas cargadas con `React.lazy`.
- **Inventario** — 3 pestañas (Existencias, Movimientos, Registros). KPIs (registros,
  unidades, valor del inventario a precio de costo, stock bajo). Búsqueda + filtro por
  bodega. Diálogos para agregar stock, editar cantidad y transferir entre bodegas.
  Movimientos y registros con búsqueda y rango de fechas.
- **Transformaciones** — convierte productos según configuraciones (ej: caja → unidades
  sueltas). Tarjetas de conversión disponibles, diálogo con vista previa de unidades
  consumidas/producidas por bodega, historial y opción de revertir.
- **Consumos Internos** — registra producto usado internamente (descuenta inventario).
  Rango de fechas, KPIs, historial con eliminar (restaura inventario) y resumen
  (top productos y por motivo). Diálogo con motivos predefinidos y stock disponible.
- **Gastos** — CRUD de gastos operativos (crear/editar/eliminar). Rango de fechas,
  KPIs (total/fijos/variables), filtros por categoría y tipo, resumen por categoría.
  Formulario con categoría autocompletable, tipo Fijo/Variable, fecha, comprobante y notas.
- **Combos** — paquetes de productos con precio especial. Grid de combos con activar/
  desactivar, toggle para ver inactivos, y formulario crear/editar con selector de
  productos, cantidades y margen estimado (costo vs precio).
- **Gestión de Productos** — lista de productos con búsqueda; cada uno se expande para
  gestionar sus precios por tipo y país (agregar/editar/eliminar). Crear producto con
  precios iniciales y editar nombre. Formato COP/USD según país.

**✅ Migración completa** — los 10 módulos del panel Flutter están migrados a React.

Cada módulo pendiente tiene su ruta y tarjeta funcionando; se irán migrando página
por página tomando como referencia el proyecto Flutter en `../shirlove_admin/lib/pages`.
