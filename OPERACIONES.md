# Operaciones y despliegue — Shirlove

Guía para levantar, desplegar y mantener el sistema. Escrita al terminar la migración
del panel Flutter a React (julio 2026).

## Arquitectura

| Pieza | Tecnología | Dónde vive | URL |
|-------|-----------|------------|-----|
| **Frontend** | React + Vite + TypeScript | GitHub Pages (repo `shirlove-react`) | https://shirlove.co |
| **Backend** | FastAPI (Python) | Heroku (app `shirloveapp`) | https://shirloveapp-53919d0b2003.herokuapp.com |
| **Base de datos** | PostgreSQL | Heroku Postgres | (add-on de la app) |

El backend vive en el repo `shirloveApp` (carpeta `C:\shirloveApp`). El frontend en
`C:\shirloveAppFront\shirlove_react`. El Flutter original queda archivado en
`C:\shirloveAppFront\shirlove_admin` (solo referencia).

El front llama al backend por su URL de Heroku (CORS abierto). Se puede sobrescribir con
`VITE_API_BASE_URL` (ver `.env.example`).

---

## Desarrollo local (frontend)

```bash
cd C:\shirloveAppFront\shirlove_react
npm install
npm run dev        # servidor de desarrollo (http://localhost:5173)
npm run build      # build de producción -> dist/
npm run preview    # previsualizar el build
```

Requiere Node 20+.

---

## Desplegar el FRONTEND

**Automático.** Cada `push` a la rama `main` dispara el workflow
`.github/workflows/deploy.yml`, que compila y publica en GitHub Pages.

```bash
cd C:\shirloveAppFront\shirlove_react
git add -A
git commit -m "..."
git push        # -> GitHub Actions despliega a shirlove.co
```

- Ver el progreso: pestaña **Actions** del repo `shirlove-react`.
- El dominio `shirlove.co` se mantiene por el archivo `public/CNAME` (se copia a `dist/`
  en cada build) + la config en **Settings → Pages** (Source: GitHub Actions, Enforce HTTPS).
- Rutas SPA: el workflow copia `dist/index.html` a `dist/404.html` para que recargar en
  `/ventas`, `/reportes`, etc. no dé 404.

---

## Desplegar el BACKEND

El backend está en `C:\shirloveApp` con remote `heroku`.

```bash
cd C:\shirloveApp
git add -A
git commit -m "..."
git push heroku main      # (o master, según tu rama)
```

### Migraciones de base de datos

`Base.metadata.create_all` **solo crea tablas nuevas**, no altera columnas existentes.
Los cambios de esquema se hacen con scripts sueltos que se corren en Heroku:

```bash
heroku run python <script>.py -a shirloveapp
```

Scripts existentes (en `C:\shirloveApp`): `crear_tabla_gastos.py`,
`crear_tabla_consumos_internos.py`, `crear_tabla_metodos_pago_mixtos.py`,
`crear_tabla_pagos_nomina.py`, y **`agregar_anulacion_ventas.py`** (columnas de anulación
de ventas — ver abajo). Son idempotentes (`IF NOT EXISTS`).

> Orden: primero `git push heroku` (para que el script esté en el dyno) y luego
> `heroku run python <script>.py`.

---

## Cambios de backend hechos durante la migración

El backend se mantuvo casi intacto; solo se agregaron **funciones nuevas pedidas**:

1. **Revertir transformación** — `DELETE /api/transformaciones/{id}`
   (`app/routers/transformacion.py`). Devuelve inventario y borra el registro. Desplegado.

2. **Anular venta** — `DELETE /api/ventas/{id}?bodega_id=&motivo=`
   (`app/routers/venta.py`, solo admin). **No borra**: marca la venta como `anulada`
   (guarda quién, cuándo y motivo), devuelve productos y componentes de combos al
   inventario de la bodega indicada, y registra cada devolución en el historial de
   inventario. El reporte (`/api/ventas/reporte`) excluye las anuladas.
   - Requirió columnas nuevas en `ventas`: `anulada`, `anulada_por_id`,
     `fecha_anulacion`, `motivo_anulacion` → migración `agregar_anulacion_ventas.py` (ya corrida).

---

3. **Módulo USA** — `app/routers/usa.py` + modelos `Usa*` en `app/models.py`
   (prefijo `/api/usa`). Tablas **nuevas e independientes** con prefijo `usa_`
   (`usa_configuracion`, `usa_productos`, `usa_servicios`, `usa_inventario`,
   `usa_movimientos_inventario`, `usa_ventas`, `usa_ventas_items`). Las crea
   `Base.metadata.create_all` al arrancar: **no requiere script de migración**, solo
   `git push heroku main`.
   - Seguridad en dos capas: sesión normal del panel + **contraseña propia del módulo**.
     `POST /api/usa/acceso` entrega un token de módulo (12 h) que viaja en el header
     `X-USA-Token`. Si falta o venció, el back responde `403 USA_ACCESO_REQUERIDO` y el
     front vuelve a pedir la contraseña.
   - La contraseña la configura/cambia **solo un admin** (`POST /api/usa/password`). La
     primera vez se configura desde la propia pantalla del módulo.
   - Anular una venta USA (`DELETE /api/usa/ventas/{id}`) es solo admin: soft delete y
     devuelve las unidades al inventario USA.

---

## Módulos del panel (todos migrados)

Auth/Home · Clientes · Ventas (POS) · Reportes · Inventario · Transformaciones ·
Consumos Internos · Gastos · Combos · Gestión de Productos · **Módulo USA**.

Patrón de cada módulo: `services/*` (axios) → `hooks/*` (TanStack Query + toasts) →
`pages/*` + diálogos. Reutilizables clave: `PageHeader`, `Combobox`, `StatCard`,
`DateRangeControl`, `lib/format.ts` (`formatCOP`/`formatMoneyByPais`), `lib/apiError.ts`.

Notas de API:
- Varios endpoints FastAPI con prefijo propio **requieren barra final** (si no, redirect 307):
  `/api/combos/`, `/api/gastos/`, `/api/consumos-internos/`, `/api/nomina/`, `/api/productos/`.
- Hay **dos** `/api/productos`: el de inventario (precios anidados) y el de gestión de
  productos (`/api/productos/` con barra, precios planos).
- Las bodegas no traen `pais_id` en `/api/bodegas` → se deriva por nombre (USA→2, resto→1).

### Módulo USA (aislado de Colombia)

- Ruta `/usa`, tarjeta "Módulo USA" en el Home (visible para cualquier usuario con sesión;
  la contraseña del módulo es la que protege el acceso).
- Archivos: `pages/UsaPage.tsx`, `components/usa/*`, `hooks/useUsa.ts`,
  `services/usaService.ts`, `types/usa.ts`, `lib/usaAccess.ts`.
- El token del módulo se guarda en `sessionStorage` (`usa_token`): al cerrar la pestaña hay
  que volver a ingresar la contraseña. `apiClient` agrega el header `X-USA-Token` a todas
  las rutas `/api/usa` y, si recibe `403 USA_ACCESO_REQUERIDO`, borra el token y dispara
  el evento `usa-access-revoked` para que `UsaGate` vuelva a pedir la contraseña.
- Todo en **USD** (`formatUSD`). Las cachés de TanStack Query cuelgan de `['usa', ...]` y
  no se cruzan con las de Colombia.
- Pestañas: Nueva venta (POS con productos/servicios USA), Historial (resumen + anular),
  Inventario (existencias, entradas, ajustes, movimientos) y Catálogo (productos y
  servicios USA con activar/desactivar).
- Al crear un producto o servicio USA, el campo nombre **sugiere los del catálogo de
  Colombia** (`/api/productos` y `/api/servicios-salon`) pero admite escribir uno nuevo.
  Solo se copia el nombre (y la categoría en servicios); si el producto de Colombia ya
  tenía precios para el país USA, se proponen como precio/costo iniciales. No se crea
  ninguna relación entre ambos catálogos.
- En la venta USA, el campo **clienta** sugiere nombres de la base de clientes de Colombia
  (`/api/clientes?search=` con debounce) y también admite un nombre nuevo. La venta guarda
  el nombre como texto libre (`cliente_nombre`), sin FK a `clientes`.
- Estas sugerencias usan `components/AutocompleteInput.tsx` (texto libre + desplegable
  estilizado, navegable con ↑ ↓ Enter Esc, fila "crear nuevo"); reemplaza al `<datalist>`
  nativo, que no se puede estilizar. Admite filtro local o resultados ya filtrados por el
  servidor (`filter={false}` + `loading`).
- **Nada del módulo USA aparece en Reportes, Inventario, Ventas ni Gastos de Colombia**, ni
  al revés: son tablas distintas.
- **Equivalente en COP (Historial)**: la tasa USD→COP se obtiene de `open.er-api.com`
  (ExchangeRate-API, gratuita, tasa de mercado actualizada a diario; Google no ofrece API
  pública). `services/tasaCambioService.ts` + `hooks/useTasaCambio.ts`: se refresca cada
  10 min y al volver a la pestaña, guarda la última tasa en `localStorage` como respaldo
  si la fuente falla, y se consulta con axios "pelado" (nunca con `apiClient`, para no
  enviar el token del panel a un tercero). La usuaria puede escribir una tasa manual. Los
  COP son referenciales: la contabilidad del módulo sigue siendo en USD.

---

## Checklist de despliegue (resumen)

- **Cambio solo de front** → `git push` en `shirlove_react` (Actions despliega a shirlove.co).
- **Cambio de back sin esquema** → `git push heroku main` en `shirloveApp`.
- **Cambio de back con columnas/tablas** → `git push heroku main` + `heroku run python <migracion>.py -a shirloveapp`.
