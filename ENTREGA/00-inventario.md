# Control de Obra v2 — Inventario Exhaustivo de v1 y Auditoría Técnica (`00-inventario.md`)

> **Propósito**: Documentar el estado exacto de la aplicación de referencia v1 (commit `4ed79ad` de `D:\obra`), incluyendo todas las rutas, pantallas, componentes, consultas a Supabase, funciones RPC, reglas de permisos, módulos dorados y las discrepancias encontradas entre la especificación y el código real.

---

## 1. Mapa de Rutas, Pantallas y Actores

### 1.1 Rutas Públicas y de Autenticación (sin `AuthGate`)

| Ruta | Archivo en v1 | Actores | Estado / Variantes | Consultas / API / RPC |
| :--- | :--- | :--- | :--- | :--- |
| `/` (sin sesión) | `app/(dashboard)/page.tsx` → `<AuthGate>` → `<LandingMock>` (`components/landing/LandingMock.tsx`) | Anónimo | Portada pública 100dvh sin scroll vertical ni horizontal. Selector de 3 obras de ejemplo (`Obra Marbella`, `Obra Centro`, `Obra Norte`), tarjeta de progreso (`72%` + `Sparkline`), ilustración vectorial de plano, enlace a `/login`. | Ninguna (100% en memoria). |
| `/login` | `app/login/page.tsx` | Anónimo | 4 vistas internas (`vista`): `entrar`, `registro`, `codigo`, `olvide`. Selector de idioma (`ES`/`UA`/`EN`). Banner `?aviso=confirmado` cuando vuelve de confirmar email. | `supabase.auth.signInWithPassword`, `supabase.auth.signUp`, `supabase.auth.resetPasswordForEmail`, `supabase.rpc("unirse_con_codigo", { p_codigo })`. |
| `/reset-password` | `app/reset-password/page.tsx` | Usuario con enlace de recuperación | Espera `onAuthStateChange` (`PASSWORD_RECOVERY`) o `getSession()`. Si no hay sesión en 1,5 s muestra aviso de enlace caducado (`sinEnlace`). Tras guardar redirige a `/`. | `supabase.auth.updateUser({ password })`. |
| `/alta` | `app/alta/page.tsx` | Anónimo / Nuevo dueño | Consulta disponibilidad de Stripe (`GET /api/alta/checkout`). Si disponible: muestra precio formateado, 14 días de prueba y botón de pago (`POST /api/alta/checkout`). Si no disponible: muestra aviso de contacto. Enlace a `/login` para quien ya tiene código. | `GET /api/alta/checkout`, `POST /api/alta/checkout`. |
| `/alta/ok` | `app/alta/ok/page.tsx` | Nuevo comprador tras Stripe | Lee `?session_id=...`. Hace polling hasta 10 intentos (cada 1,5 s) a `GET /api/alta/codigo?session_id=...`. Muestra código de 8 letras con botón de copiar y paso a `/login`. | `GET /api/alta/codigo`. |
| `/facturas` | `app/(dashboard)/facturas/page.tsx` | Todos | Redirección inmediata (`redirect("/gastos")`) para mantener enlaces antiguos guardados en móviles. | Ninguna. |

### 1.2 Rutas Protegidas del Panel (`app/(dashboard)/layout.tsx`)

Todas pasan por `<AuthGate>` → `<MiembroProvider>` → `<AccesoGate>` → `<ObraProvider>` → `<DashboardShell>`.

| Ruta | Archivo en v1 | Rol permitido | Módulo requerido | Componentes hijos clave |
| :--- | :--- | :--- | :--- | :--- |
| `/` | `app/(dashboard)/page.tsx` | Todos (`trabajador` ve `<InicioTrabajador>`, `gestiona` ve panel de obra) | Ninguno (siempre visible, adapta bloques según `modulos`) | `<InicioTrabajador>`, `<MiFichaje>`, `<BarrasProgreso>`, `<MiniGantt>`, `<Sheet>` (detalle de horas por trabajador). |
| `/fichajes` | `app/(dashboard)/fichajes/page.tsx` | `dueno`, `manager`, `jefe_obra` (`trabajador` redirigido a `/`) | `horas` | `<MiFichaje>`, `<DayNav>`, `<StampButton>`, `<TransporteSelector>`, `<Sheet>` (`CorregirHorasForm`, `UbicacionForm`, mover obra, añadir trabajador). |
| `/gastos` | `app/(dashboard)/gastos/page.tsx` | `dueno`, `manager`, `jefe_obra` | `gastos` (si apagado redirige a `/`) | `<ProveedorSelector>`, `<ArchivoViewer>`, `<Sheet>` (nuevo gasto, editar gasto, detalle con visor y borrado en 2 toques). |
| `/dinero` | `app/(dashboard)/dinero/page.tsx` | `dueno`, `manager`, `jefe_obra` | `dinero` (si apagado redirige a `/`) | `<ArchivoViewer>`, `<Sheet>` (apuntar cobro de cliente, apuntar dinero para la obra, editar movimiento, ver justificante). |
| `/planificacion` | `app/(dashboard)/planificacion/page.tsx` | `dueno`, `manager`, `jefe_obra` | `planificacion` (si apagado redirige a `/`) | `<Gantt>`, `<ImportarExcel>`, `<TareaForm>`, `<Sheet>`. |
| `/vehiculos` | `app/(dashboard)/vehiculos/page.tsx` | Todos (`trabajador` puede coger/devolver; `gestiona` añade/edita; `dueno` borra) | `vehiculos` (si apagado redirige a `/`) | `<Sheet>` (coger vehículo, devolver vehículo, nuevo/editar vehículo, historial de usos). |
| `/notas` | `app/(dashboard)/notas/page.tsx` | `dueno`, `manager`, `jefe_obra` | `notas` (si apagado redirige a `/`) | `<Sheet>` (añadir nota), lista con fijar (`fijada`) y borrar. |
| `/resumen` | `app/(dashboard)/resumen/page.tsx` | `dueno`, `manager`, `jefe_obra` (`trabajador` redirigido a `/`) | Ninguno (adapta bloques a `modulos.horas` y `modulos.gastos`) | Selector de mes, exportación Excel (`exportarResumenExcel`), desglose por trabajador + días corregidos, desglose de gastos por tipo/proveedor/forma de pago. |
| `/ajustes` | `app/(dashboard)/ajustes/page.tsx` | Todos (vista segmentada por rol) | Ninguno | `<SelectorIdioma>`, `<ConfigurarObra>`, `<Accesos>`, `<SoporteAcceso>`, `<EliminarObra>`, formulario de cambiar contraseña y cerrar sesión. |

### 1.3 Ruta de Administración de Plataforma

| Ruta | Archivo en v1 | Permiso requerido | Funcionalidades |
| :--- | :--- | :--- | :--- |
| `/admin` | `app/admin/page.tsx` | `es_admin_plataforma()` === `true` | Tarjetas de resumen (empresas, activas, códigos sin usar, soporte abierto, errores 24h), generación de códigos de alta (`generar_codigo_alta`), lista de códigos (`listar_codigos_alta`, `cancelar_codigo_alta`), lista de empresas con edición de fecha de pago (`listar_empresas_admin`, `poner_fecha_pago_empresa`), sesiones de soporte abiertas (`entradas_soporte_abiertas`, `entrar_como_soporte`), últimos 50 errores (`ultimos_errores`). |

### 1.4 Rutas API (`app/api/**` — Módulos Dorados Intocables)

| Endpoint | Método | Archivo | Propósito |
| :--- | :--- | :--- | :--- |
| `/api/alta/checkout` | `GET`, `POST` | `app/api/alta/checkout/route.ts` | Consulta el precio en Stripe (`GET`) y crea la sesión de Checkout con 14 días de prueba (`POST`). |
| `/api/alta/codigo` | `GET` | `app/api/alta/codigo/route.ts` | Recupera o genera el código de alta de 8 letras tras completar el Checkout de Stripe (`?session_id=...`). |
| `/api/stripe/webhook` | `POST` | `app/api/stripe/webhook/route.ts` | Recibe eventos de Stripe (`checkout.session.completed`, `customer.subscription.*`), valida firma y actualiza `pagado_hasta` vía RPC `actualizar_pago_suscripcion`. |

---

## 2. Inventario de Consultas Supabase, RPCs y Storage

### 2.1 Tablas Consultadas desde el Cliente
1. `obras` (`SELECT`, `INSERT`, `UPDATE`, `DELETE`)
2. `trabajadores` (`SELECT`, `INSERT`, `UPDATE`, `DELETE`)
3. `fichajes` (`SELECT`, `INSERT`, `UPDATE`, `DELETE`)
4. `fichajes_cambios` (`SELECT`, `INSERT` + escrita por trigger en DB)
5. `gastos` (`SELECT`, `INSERT`, `UPDATE`, `DELETE`)
6. `movimientos_obra` (`SELECT`, `INSERT`, `UPDATE`, `DELETE`)
7. `tareas_obra` (`SELECT`, `INSERT`, `UPDATE`, `DELETE`)
8. `vehiculos` (`SELECT`, `INSERT`, `UPDATE`, `DELETE`)
9. `vehiculo_usos` (`SELECT`, `INSERT`, `UPDATE`)
10. `notas` (`SELECT`, `INSERT`, `UPDATE`, `DELETE`)
11. `miembros` (`SELECT`, `UPDATE`, `DELETE`)
12. `invitaciones` (`SELECT`, `INSERT`, `DELETE`)
13. `invitaciones_empresa` (`SELECT`, `INSERT`, `DELETE`)
14. `soporte_accesos` (`SELECT`, `INSERT`, `UPDATE`)
15. `empresas` (`SELECT`, `UPDATE`)
16. `errores_app` (`SELECT`, `INSERT`)

### 2.2 Funciones RPC Invocadas desde el Cliente (`supabase.rpc(...)`)
1. `claiming_miembro()`: Vincula invitación pendiente al usuario recién autenticado y devuelve su fila en `miembros`.
2. `unirse_con_codigo(p_codigo)`: Crea empresa + miembro `dueno` (si es código de alta de 8 letras) o miembro `pendiente` (si es código de invitación de 6 letras).
3. `fichar_abiertos_ahora(p_obra_id)`: Devuelve `{ trabajador_id, hora_entrada }[]` de quienes tienen fichaje abierto hoy en esa obra (para el contador «Trabajando ahora» del trabajador sin exponer nombres).
4. `avance_obra(o_id)`: Devuelve porcentaje entero `0..100` ponderado por `presupuesto` de `tareas_obra` (para la portada del trabajador).
5. `fichar_propio(p_obra_id, p_tipo, p_ubicacion, p_transporte, p_lat, p_lng, p_precision_m)`: Registra entrada/salida del trabajador con `clock_timestamp()` del servidor en `Europe/Madrid`.
6. `cambiar_transporte_propio(p_obra_id, p_transporte)`: Actualiza el medio de transporte del fichaje de hoy del propio usuario.
7. `Salir_de_modo_soporte()`: Cierra la sesión de soporte del administrador de plataforma y restaura su miembro original.
8. `es_admin_plataforma()`: Comprueba si el usuario autenticado figura en `admins_plataforma`.
9. `listar_empresas_admin()`: Lista empresas con contadores para `/admin`.
10. `listar_codigos_alta()`: Lista códigos de alta para `/admin`.
11. `generar_codigo_alta(p_empresa, p_nota, p_dias)`: Crea código de alta manual en `/admin`.
12. `cancelar_codigo_alta(p_id)`: Cancela código de alta sin usar en `/admin`.
13. `poner_fecha_pago_empresa(p_empresa_id, p_pagado_hasta, p_motivo)`: Cambia la fecha `pagado_hasta` de una empresa en `/admin`.
14. `entradas_soporte_abiertas()`: Lista autorizaciones temporales de soporte activas en `/admin`.
15. `entrar_como_soporte(p_acceso_id)`: Cambia temporalmente la empresa activa del admin de plataforma a la empresa que abrió soporte.

### 2.3 Buckets de Supabase Storage
- Bucket único: `documentos` (privado, acceso mediante `createSignedUrl(path, 3600)` y `remove([path])`).
- Prefijos utilizados:
  - `${obraId}/gastos/...` (tickets y facturas en `/gastos`).
  - `${obraId}/dinero/...` (justificantes en `/dinero`).
  - `${obraId}/planos/...` (planos en `ConfigurarObra`).
  - `${obraId}/fotos/...` (fotos de obra en `ConfigurarObra`).

---

## 3. Discrepancias Detectadas entre Especificación y Código v1 (`Spec vs Code`)

Durante la auditoría exhaustiva línea por línea de `_ref-v1` frente a `ESPECIFICACION-ESTRUCTURA.md` y `TRAMPAS-Y-LIMITES-TECNICOS.md`, se han identificado los siguientes defectos y discrepancias en v1 que **corregiremos y documentaremos en v2**:

### 3.1 Permisos de Interfaz que Prometen Acciones Prohibidas por RLS (Bugs de v1 a corregir)
1. **Botón «Nueva obra» en `ObraPicker.tsx` (`SHL-04` / §3.2)**:
   - **En v1**: `components/layout/ObraPicker.tsx` muestra el botón `Nueva obra` a **todos** los usuarios (incluidos `trabajador` y `jefe_obra`), porque no filtra por rol. Sin embargo, en la base de datos (`obras_insert`), solo `dueno` y `manager` tienen permiso de inserción.
   - **Corrección en v2**: Mostrar el botón «Nueva obra» únicamente cuando `rol === "dueno" || rol === "manager"`.
2. **Botón «+ Añadir trabajador» en `/fichajes` (`FIC-15` / §3.2)**:
   - **En v1**: `app/(dashboard)/fichajes/page.tsx` muestra el botón `+ Añadir trabajador` a cualquier usuario que entra en `/fichajes` (incluyendo `jefe_obra`). Sin embargo, la política RLS de `trabajadores` solo permite `INSERT` a `dueno` y `manager`.
   - **Corrección en v2**: Mostrar `+ Añadir trabajador` solo cuando `rol === "dueno" || rol === "manager"`.

### 3.2 Violaciones de Reglas de Lint / React 19 Purity en v1
3. **`Date.now()` impuro durante el render en `SoporteAcceso.tsx`**:
   - **En v1**: `components/ajustes/SoporteAcceso.tsx` (línea 64) ejecuta `if (new Date(a.expira_en).getTime() <= Date.now()) return "caducado";` directamente durante el renderizado del componente, lo que dispara un error de `react-hooks/purity` en ESLint 9.
   - **Corrección en v2**: Mantener la marca temporal `ahora` en estado inicializado/actualizado en `useEffect` (o tras recargar datos) para que el render sea 100% puro y `npm run lint` pase con **0 errores**.
4. **Regla `no-require-imports` en `scripts/claves-i18n.js`**:
   - **En v1**: `eslint.config.mjs` no ignora `scripts/**`, por lo que `scripts/claves-i18n.js` (CommonJS) genera 3 errores de `@typescript-eslint/no-require-imports`.
   - **Corrección en v2**: Añadir `"scripts/**"` a `globalIgnores` en `eslint.config.mjs` y registrarlo en `ENTREGA/cambios-en-dorados.md`.

### 3.3 Cadenas de Texto y Fechas sin Internacionalizar en v1 (§20.3)
5. **Etiquetas de dinero en Portada (`app/(dashboard)/page.tsx`, líneas 251–254)**:
   - `"Cobrado"`, `"Gastado"` y `"Balance"` se pasaban a `<Cifra etiqueta="..." />` sin `tr(...)`. En v2 se pasan por `tr("Cobrado")`, `tr("Gastado")` y `tr("Balance")`.
6. **Fechas y estados en `SoporteAcceso.tsx` (líneas 115 y 129)**:
   - `"Hasta "` y `toLocaleString("es-ES")` estaban fijados en español, y el estado `e` (`activo` / `caducado` / `revocado`) se pintaba sin `tr(e)`. En v2 se envuelven en `tr(...)` y `localeActual()`.
7. **Fechas y estado «cancelado» en `app/admin/page.tsx` (líneas 13 y 249)**:
   - La función `fecha(iso)` usaba `"es-ES"` fijo en lugar de `localeActual()`, y la etiqueta `"cancelado"` (línea 249) no pasaba por `tr("cancelado")`. Corregido en v2.
8. **Formato de precio en `app/alta/page.tsx` (línea 48)**:
   - `Intl.NumberFormat("es-ES", ...)` usaba `"es-ES"` fijo en lugar de `localeActual()`. Corregido en v2.
9. **Formato de fecha de cambio en `app/(dashboard)/fichajes/page.tsx` (línea 698)**:
   - `fmtCambio` usaba `toLocaleString("es-ES", ...)` en vez de `localeActual()`. Corregido en v2.

### 3.4 Cálculos de Dinero y Discrepancias de Negocio Documentadas
10. **Fórmula de Balance en Portada vs `/dinero` (Pregunta `Q-01` de `ESPECIFICACION-ESTRUCTURA.md` §19)**:
    - En Portada (`HOM-04`), `balance = cobrado - gastado` (sin sumar `recibidoObra`).
    - En `/dinero` (`DIN-01`), para el `dueno`, `balanceTotal = cobrado + recibidoObra - gastado`, y `enManoEncargado = recibidoObra - gastadoEncargado`.
    - **Acción en v2**: Se mantiene exactamente el comportamiento de v1 para no romper expectativas del dueño y se deja documentado en `ENTREGA/PREGUNTAS.md` para decisión futura de María.
11. **Suma de gastos en `/resumen` (`app/(dashboard)/resumen/page.tsx`)**:
    - En v1, el total de gastos de `/resumen` se calculaba con `.reduce((s, g) => s + Number(g.importe || 0), 0)` en coma flotante en lugar de usar `suma()` de `lib/dinero.ts`.
    - **Acción en v2**: Usar `suma()` de `lib/dinero.ts` en `/resumen` para garantizar precisión al céntimo en toda la app.
12. **Carga diferida (Lazy-load) de `exceljs` en `/resumen` (Trampa `T-36`)**:
    - En v1, `import { exportarResumenExcel } from "@/lib/exportar-excel"` se importaba estáticamente en la cabecera de `/resumen/page.tsx`.
    - **Acción en v2**: Importar `exportar-excel` dinámicamente (`const { exportarResumenExcel } = await import("@/lib/exportar-excel")`) al pulsar el botón «Descargar Excel» para reducir drásticamente el First-Load JS de `/resumen`.
13. **Test de importación de Excel (`scripts/test-importar-excel.ts`)**:
    - En v1, la línea 19 comprueba `plan.presupuestoTotal === 84743`, pero la plantilla `public/plantilla-plan-obra.xlsx` suma `85706` € (tal como documenta el comentario de la línea 5 del propio test).
    - **Acción en v2**: Actualizar el valor esperado a `85706` en `scripts/test-importar-excel.ts` y registrarlo en `ENTREGA/cambios-en-dorados.md`.

---

## 4. Lista Completa de Módulos Dorados (Golden Modules)

Estos archivos se copian byte a byte desde `_ref-v1` y su integridad se verifica mediante SHA-256 en `ENTREGA/dorados-checksums.md`:

- **Lógica de negocio y utilidades (`lib/`)**:
  - `lib/horas.ts`
  - `lib/dinero.ts`
  - `lib/gantt.ts`
  - `lib/importar-excel.ts`
  - `lib/format.ts`
  - `lib/gastos.ts`
  - `lib/geo.ts`
  - `lib/image.ts`
  - `lib/modulos.ts`
  - `lib/offline-fichajes.ts`
  - `lib/exportar-excel.ts`
  - `lib/eliminar-obra.ts`
  - `lib/errores.ts`
  - `lib/pagos.ts`
  - `lib/types.ts`
- **Internacionalización (`lib/i18n/`)**:
  - `lib/i18n/index.ts`
  - `lib/i18n/provider.tsx`
  - `lib/i18n/uk.ts` *(solo se añaden claves nuevas al final para las cadenas antes sin traducir y la galería)*
  - `lib/i18n/en.ts` *(solo se añaden claves nuevas al final para las cadenas antes sin traducir y la galería)*
- **Clientes Supabase y Middleware**:
  - `lib/supabase/client.ts`
  - `lib/supabase/server.ts`
  - `lib/supabase/middleware.ts`
  - `proxy.ts`
- **Telemetría, PWA, API, DB y Scripts**:
  - `instrumentation.ts`
  - `instrumentation-client.ts`
  - `public/sw.js`
  - `public/plantilla-plan-obra.xlsx`
  - `vercel.json`
  - `app/api/alta/checkout/route.ts`
  - `app/api/alta/codigo/route.ts`
  - `app/api/stripe/webhook/route.ts`
  - `supabase/**` (todos los archivos `.sql`)
  - `scripts/**` (`claves-i18n.js`, `generar-iconos.mjs`, `generar-plantilla-plan.py`, `test-dinero.ts`, `test-fechas.ts`, `test-gantt.ts`, `test-horas.ts`, `test-importar-excel.ts`)
  - `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`
