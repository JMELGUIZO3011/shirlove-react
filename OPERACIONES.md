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
`crear_tabla_pagos_nomina.py`, **`agregar_anulacion_ventas.py`** (columnas de anulación
de ventas — ver abajo), **`agregar_credito_usa_ventas.py`** (columnas de crédito /
cuentas por cobrar en `usa_ventas`) y **`agregar_pagos_tips_insumos_usa.py`** (pagos
mixtos, propinas e insumos del módulo USA). Son idempotentes (`IF NOT EXISTS`).

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
   - **Crédito / cuentas por cobrar**: una venta puede registrarse con `a_credito: true`
     (método de pago "Crédito", `fecha_vencimiento` y `abono_inicial` opcionales). Queda
     con `saldo_pendiente` y aparece en `GET /api/usa/cuentas-por-cobrar`. Los cobros se
     registran con `POST /api/usa/ventas/{id}/abonos` (parciales o el saldo completo; al
     llegar a 0 se marca `fecha_pago_total`); `DELETE .../abonos/{id}` (solo admin) revierte
     un cobro. Tabla nueva `usa_ventas_abonos` (la crea `create_all`) + columnas en
     `usa_ventas` → **migración `agregar_credito_usa_ventas.py`** (hay que correrla con
     `heroku run` después del push). El resumen reparte lo cobrado por el método real de
     cada abono y muestra el saldo como "Crédito (pendiente)".
   - **Pagos mixtos** (migración `agregar_pagos_tips_insumos_usa.py`): `POST /api/usa/ventas`
     recibe `pagos: [{metodo_pago, monto}]`; cada pago se guarda en `usa_ventas_abonos` con
     `es_pago_inicial = true`, y si la suma es menor al total el resto queda a crédito
     (`a_credito`, `saldo_pendiente`, `fecha_vencimiento` opcional). Sin pagos = toda la
     venta a crédito. `usa_ventas.metodo_pago` guarda un resumen ("Efectivo + Zelle + Crédito")
     que se recalcula al cobrar o eliminar cobros. La migración crea el pago de las ventas de
     contado antiguas para que el modelo sea uniforme. El formato anterior (`metodo_pago`,
     `a_credito` + `abono_inicial`) sigue aceptándose.
   - **Propinas** (`usa_tips`): se registran con la venta (`tips: [...]` en el POST) o sueltas
     (`POST /api/usa/tips`, con `venta_id` opcional). `GET /api/usa/tips?fecha_inicio&fecha_fin`,
     `DELETE /api/usa/tips/{id}` (admin). No suman a los ingresos; el resumen trae
     `tips_total`, `tips_por_metodo` y `tips_por_persona`. Se excluyen las de ventas anuladas.
   - **Editar venta**: `PUT /api/usa/ventas/{id}` solo cambia clienta, fecha, notas y fecha
     límite de pago (se modifican únicamente los campos enviados). Al cambiar la fecha se mueven
     con la venta los pagos iniciales, las propinas con esa fecha y los movimientos de inventario
     de la venta. Ítems, montos y pagos no se editan (anular y registrar de nuevo).
   - **Insumos** (`usa_consumos_internos`): `POST /api/usa/consumos` descuenta el inventario USA
     (movimiento tipo `consumo`) y guarda el costo como snapshot; `DELETE` (admin) devuelve las
     unidades. El resumen trae `insumos_costo`, `insumos_unidades` y `ganancia_neta`
     (= ganancia bruta − insumos).

---

## Sesión y expiración del token

- El token de login dura **12 horas** (`ACCESS_TOKEN_EXPIRE_MINUTES` en
  `app/routers/auth.py`; antes eran 30 min).
- Si el backend responde **401** a cualquier petición (token vencido o inválido), `apiClient`
  borra el token del panel y el del módulo USA y dispara el evento `session-expired`;
  `AuthContext` cierra la sesión y muestra el aviso "Tu sesión expiró", y `ProtectedRoute`
  lleva al login. Se excluyen `/api/auth/login` y `/api/usa/acceso`, donde un 401 significa
  "contraseña incorrecta".
- Ojo: solo algunos routers exigen token en los GET (gastos, nómina, consumos internos,
  clientes, servicios, estilistas). Inventario, productos, combos y el reporte de ventas no
  lo verifican. Por eso, con el token vencido, "solo fallaban" esos módulos.

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
- Pestañas: Nueva venta (POS con productos/servicios USA; **pagos mixtos**: se agregan
  varios pagos por método y lo que falte queda a crédito con fecha límite opcional;
  **propina** opcional con método y "para quién"), Historial (resumen + anular; muestra cómo
  se pagó cada venta, saldo que debe y propina; por fila: agregar propina, registrar pago si
  debe, editar clienta/fecha/notas), **Por cobrar** (cuentas pendientes ordenadas
  por vencidas primero, KPIs, botón "Cobrar" para abonos parciales o "Marcar como cobrada",
  pagos registrados y eliminación de cobros para admin), **Propinas** (KPIs, por método, por
  persona, detalle, registrar sueltas y eliminar para admin), **Insumos** (productos que se
  sacan del inventario para trabajar: KPIs, historial, registrar y eliminar para admin),
  Inventario (existencias, entradas, ajustes, movimientos) y Catálogo (productos y servicios
  USA con activar/desactivar).
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
