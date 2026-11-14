# Matriz de Paridad Funcional v1 → v2 (`MATRIZ-PARIDAD.md`)

> **Propósito**: Seguimiento exhaustivo de cada requisito e identificador funcional de `ESPECIFICACION-ESTRUCTURA.md` (`ACC-01` a `PLT-06`). Ninguna funcionalidad puede darse por terminada (`DONE`) sin código real en disco, prueba en `/galeria` y verificación visual.

---

## 1. Autenticación, Acceso, Alta y Puertas (`ACC-*`, `ONB-*`)

| ID | Requisito / Comportamiento esperado | Ruta / Componente v2 | Estado | Evidencia / Verificación |
| :--- | :--- | :--- | :--- | :--- |
| `ACC-01` | Portada pública sin sesión (`LandingMock`): cabe en `100dvh` sin scroll vertical ni horizontal, selector de obra de ejemplo (`Obra Marbella`, `Obra Centro`, `Obra Norte`), porcentaje de avance (`72%`), gráfico/plano y botón a `/login`. | `components/landing/LandingMock.tsx` | `PENDING` | `/galeria/landing` (`320`, `375`, `1280`) |
| `ACC-02` | Selector de idioma `ES` / `UA` / `EN` visible arriba a la derecha en `/login` y en `/ajustes`, persistiendo en `localStorage["obra_idioma"]` y `<html lang="...">`. | `components/ui/SelectorIdioma.tsx`, `app/login/page.tsx`, `app/(dashboard)/ajustes/page.tsx` | `PENDING` | `/galeria/login`, `/galeria/ajustes` |
| `ACC-03` | Vista `entrar` en `/login`: correo + contraseña (`signInWithPassword`), enlaces a «¿Olvidaste la contraseña?», «Crear cuenta» y «Tengo un código de invitación». | `app/login/page.tsx` | `PENDING` | `/galeria/login?state=entrar` |
| `ACC-04` | Vista `registro` en `/login`: correo + contraseña míni. 6 caracteres (`signUp` con `emailRedirectTo: /login?aviso=confirmado`). Si requiere confirmar correo muestra aviso; si entra directo pasa a `codigo`. | `app/login/page.tsx` | `PENDING` | `/galeria/login?state=registro` |
| `ACC-05` | Banner de confirmación (`?aviso=confirmado`) en `/login`: muestra «Correo confirmado. Ya puedes entrar con tu correo y contraseña.». | `app/login/page.tsx` | `PENDING` | `/galeria/login?state=confirmado` |
| `ACC-06` | Vista `codigo` en `/login`: input en mayúsculas (`maxLength=8`, `tracking-widest`), llama a `unirse_con_codigo(p_codigo)`. Distingue código de empresa (8 letras → `dueno`) y de invitación (6 letras → `pendiente`). | `app/login/page.tsx` | `PENDING` | `/galeria/login?state=codigo` |
| `ACC-07` | Vista `olvide` en `/login`: envía enlace de recuperación (`resetPasswordForEmail` con `redirectTo: /reset-password`) y muestra confirmación `olvideEnviado`. | `app/login/page.tsx` | `PENDING` | `/galeria/login?state=olvide` |
| `ACC-08` | Pantalla `/reset-password`: escucha `PASSWORD_RECOVERY` o sesión activa; pide nueva contraseña + repetir; si no hay enlace válido en 1,5 s muestra aviso y botón para volver a `/login`. | `app/reset-password/page.tsx` | `PENDING` | `/galeria/reset-password` |
| `ACC-09` | Pantalla `/alta`: consulta `GET /api/alta/checkout`; muestra precio mensual con 14 días gratis, lista de ventajas, campo de correo opcional y botón «Continuar al pago» (`POST /api/alta/checkout`) o aviso si Stripe no está activo. | `app/alta/page.tsx` | `PENDING` | `/galeria/alta` |
| `ACC-10` | Pantalla `/alta/ok`: recoge `session_id`, consulta `GET /api/alta/codigo` (hasta 10 intentos cada 1,5 s), muestra código de 8 letras con botón «Copiar código» y enlace a `/login`. | `app/alta/ok/page.tsx` | `PENDING` | `/galeria/alta-ok` |
| `ACC-11` | Puerta `AuthGate`: mientras carga muestra spinner; sin sesión muestra `<LandingMock />`; con sesión envuelve en `<MiembroProvider>` y `<AccesoGate>`. | `components/layout/AuthGate.tsx` | `PENDING` | Revisión de código + `/galeria` |
| `ACC-12` | Puerta `PendienteAprobacion` (`AccesoGate`): se muestra cuando `rol === null`, `rol === "pendiente"` o `!activo`. Incluye formulario para introducir código (`unirse_con_codigo`), botón «Comprobar otra vez» y «Cerrar sesión». | `components/layout/PendienteAprobacion.tsx` | `PENDING` | `/galeria/pendiente` |
| `ACC-13` | Puerta `SuscripcionInactiva` (`AccesoGate`): se muestra cuando `suscripcionActiva === false`. Si `esDueno` explica que la suscripción ha caducado; si es miembro pide avisar al dueño. | `components/layout/SuscripcionInactiva.tsx` | `PENDING` | `/galeria/suscripcion-inactiva` |
| `ACC-14` | Estados sin obras en `DashboardShell`: si `obras.length === 0`, el gestor (`gestiona === true`) ve `<SinObras />` (`ONB-01`) y el `trabajador` ve `<SinObrasAsignadas />` (`ONB-02`). | `components/layout/SinObras.tsx`, `components/layout/SinObrasAsignadas.tsx` | `PENDING` | `/galeria/sin-obras`, `/galeria/sin-obras-asignadas` |
| `ONB-01` | Formulario `<SinObras />`: permite crear la primera obra (nombre obligatorio + dirección opcional) y la selecciona inmediatamente. | `components/layout/SinObras.tsx` | `PENDING` | `/galeria/sin-obras` |
| `ONB-02` | Vista `<SinObrasAsignadas />`: informa al trabajador de que aún no tiene obra asignada. | `components/layout/SinObrasAsignadas.tsx` | `PENDING` | `/galeria/sin-obras-asignadas` |
| `ONB-03` | `claiming_miembro()` automático al iniciar sesión en `MiembroProvider`. | `lib/miembro-context.tsx` | `PENDING` | Revisión de código |
| `ONB-04` | Redirección `/facturas` → `/gastos`. | `app/(dashboard)/facturas/page.tsx` | `PENDING` | Revisión de ruta |

---

## 2. Estructura Global, Navegación y Avisos (`SHL-*`)

| ID | Requisito / Comportamiento esperado | Ruta / Componente v2 | Estado | Evidencia / Verificación |
| :--- | :--- | :--- | :--- | :--- |
| `SHL-01` | `TopBar` móvil y escritorio: emblema `<Logo />` a la izquierda en móvil (lleva a `/`), selector de obra central con indicador de activa/terminada, e icono de calendario a `/resumen` a la derecha (solo si `gestiona`). Respeta `env(safe-area-inset-top)`. | `components/layout/TopBar.tsx` | `PENDING` | `/galeria/home-dueno` |
| `SHL-02` | `BottomNav` móvil (`< 768px`): barra flotante inferior con hasta 5 iconos según `navMovil(rol, modulos)`. Respeta `env(safe-area-inset-bottom)`. | `components/layout/BottomNav.tsx`, `lib/nav.ts` | `PENDING` | `/galeria/home-dueno` (`375`) |
| `SHL-03` | `Sidebar` escritorio (`>= 768px`): barra lateral fija de `100dvh` con `<Logo />`, título «Control de Obra», lista completa `navLateral(rol, modulos)` y botón «Cerrar sesión». | `components/layout/Sidebar.tsx`, `lib/nav.ts` | `PENDING` | `/galeria/home-dueno` (`1280`) |
| `SHL-04` | Selector de obra (`ObraPicker`): lista todas las obras visibles con marca en la actual e insignia «Terminada» si `activa === false`. Botón «Nueva obra» visible **solo para `dueno` y `manager`** (corrige bug de v1). | `components/layout/ObraPicker.tsx` | `PENDING` | `/galeria/home-dueno?state=obra-picker` |
| `SHL-05` | `PullToRefresh`: deslizar hacia abajo desde el tope (`scrollY <= 0`) más de 70 px recarga los datos (`router.refresh()` + evento `"obra:refresh"`). Ignora gestos dentro de `[data-no-ptr]`. | `components/layout/PullToRefresh.tsx` | `PENDING` | Revisión de código |
| `SHL-06` | `AvisoControl` (modo soporte activo para `dueno`): franja superior cuando hay una sesión activa en `soporte_accesos`, con botón «Cortar acceso ahora» y actualización en tiempo real (`postgres_changes`). | `components/layout/AvisoControl.tsx` | `PENDING` | `/galeria/home-dueno?state=aviso-soporte` |
| `SHL-07` | `AvisoControl` (modo soporte visto por quien entra con `enSoporte === true`): franja naranja con botón «Salir del modo soporte» (`Salir_de_modo_soporte()`). | `components/layout/AvisoControl.tsx` | `PENDING` | `/galeria/home-dueno?state=en-soporte` |
| `SHL-08` | `AvisoControl` (aviso semanal al `dueno`): muestra los cambios de los últimos 7 días hechos por managers/jefes de obra (`fichajes_cambios`, `gastos`, `movimientos_obra`, `tareas_obra`), con detalle desplegable y cierre guardado en `localStorage`. | `components/layout/AvisoControl.tsx` | `PENDING` | `/galeria/home-dueno?state=aviso-semanal` |
| `SHL-09` | Cero scroll horizontal en toda la aplicación (`overflow-x: hidden`, `overscroll-behavior-x: none` en `html` y `body`, `touch-action: pan-y` en `body`, `min-w-0` en hijos flex). | `app/globals.css`, todos los componentes | `PENDING` | Auditoría Playwright `320`/`375`/`430`/`768`/`1280` |

---

## 3. Inicio — Vista Gestor (`HOM-*`) y Vista Trabajador (`HOM-W*`)

| ID | Requisito / Comportamiento esperado | Ruta / Componente v2 | Estado | Evidencia / Verificación |
| :--- | :--- | :--- | :--- | :--- |
| `HOM-01` | Cabecera de obra en Inicio (gestor): nombre de la obra, dirección con icono `MapPin` (si existe) e insignia «Obra terminada» si `activa === false`. | `app/(dashboard)/page.tsx` | `PENDING` | `/galeria/home-dueno` |
| `HOM-02` | Bloque de progreso / horas en Inicio (gestor): si `modulos.planificacion` y hay tareas con presupuesto > 0, muestra porcentaje exacto con 2 decimales (`avanceObraExacto`), presupuesto total y `<MiniGantt />` clicable hacia `/planificacion`. Si no, y `modulos.horas` está activo, muestra horas totales, coste y `<BarrasProgreso />` de 14 días clicable hacia `/fichajes`. | `app/(dashboard)/page.tsx` | `PENDING` | `/galeria/home-dueno` |
| `HOM-03` | Bloque «Trabajando ahora» y «Fichajes de hoy» (gestor, si `modulos.horas`): contador de fichajes abiertos hoy (con nombres en verde) y total de fichajes del día con enlace a `/fichajes`. | `app/(dashboard)/page.tsx` | `PENDING` | `/galeria/home-dueno` |
| `HOM-04` | Bloque «Dinero de la obra» (gestor, si `modulos.dinero` o `modulos.gastos`): muestra Cobrado, Gastado y Balance (`cobrado - gastado`), más el recuadro «El encargado tiene en mano» si hay entregas o gastos del encargado. | `app/(dashboard)/page.tsx` | `PENDING` | `/galeria/home-dueno` |
| `HOM-05` | Bloque `<MiFichaje />` en Inicio (gestor, si `modulos.horas`): permite al propio dueño/manager/jefe de obra fichar su entrada y salida si tiene ficha en `trabajadores`. | `components/fichajes/MiFichaje.tsx` | `PENDING` | `/galeria/home-dueno` |
| `HOM-06` | Bloque «Horas y coste por trabajador» (gestor, si `modulos.horas`): lista de trabajadores con horas totales, días trabajados y coste en €; al tocar un trabajador se abre un `<Sheet>` con su historial día a día en la obra (`hora_entrada → hora_salida`, `ubicacion`, horas y coste). | `app/(dashboard)/page.tsx` | `PENDING` | `/galeria/home-dueno?state=detalle-trabajador` |
| `HOM-07` | Galería de planos y fotos de la obra en Inicio (gestor): cuadrícula con miniaturas firmadas del bucket `documentos` (planos y fotos subidas en `ConfigurarObra`), que al tocar abren `<ArchivoViewer />`, más enlace «Subir o quitar en Ajustes». | `app/(dashboard)/page.tsx` | `PENDING` | `/galeria/home-dueno` |
| `HOM-W1` | Cabecera de obra en `<InicioTrabajador />`: nombre de la obra, dirección e insignia «Obra terminada» si `activa === false`. | `components/inicio/InicioTrabajador.tsx` | `PENDING` | `/galeria/home-trabajador` |
| `HOM-W2` | Bloque «Progreso de la obra» en `<InicioTrabajador />`: si `modulos.planificacion` y el RPC `avance_obra(o_id)` devuelve `> 0`, muestra el porcentaje entero con `<NumeroGrande />`. | `components/inicio/InicioTrabajador.tsx` | `PENDING` | `/galeria/home-trabajador` |
| `HOM-W3` | Bloque `<MiFichaje />` en `<InicioTrabajador />` (si `modulos.horas`): tarjeta principal de fichaje del trabajador. | `components/inicio/InicioTrabajador.tsx`, `components/fichajes/MiFichaje.tsx` | `PENDING` | `/galeria/home-trabajador` |
| `HOM-W4` | Bloque «Trabajando ahora» en `<InicioTrabajador />` (si `modulos.horas`): usa RPC `fichar_abiertos_ahora(p_obra_id)` y muestra solo el número de personas trabajando ahora (sin exponer los nombres de otros compañeros). | `components/inicio/InicioTrabajador.tsx` | `PENDING` | `/galeria/home-trabajador` |
| `HOM-W5` | Galería de planos y fotos de la obra en `<InicioTrabajador />` (solo lectura, con visor `<ArchivoViewer />`, sin enlace a Ajustes). | `components/inicio/InicioTrabajador.tsx` | `PENDING` | `/galeria/home-trabajador` |

---

## 4. Fichajes: Propio (`MiFichaje`) y Cuadrilla (`/fichajes`) (`FIC-*`)

| ID | Requisito / Comportamiento esperado | Ruta / Componente v2 | Estado | Evidencia / Verificación |
| :--- | :--- | :--- | :--- | :--- |
| `FIC-01` | Estado sin ficha de trabajador en `MiFichaje`: si no existe fila en `trabajadores` con `correo === emailSesion`, muestra aviso «Aún no tienes ficha de trabajador. Pídele al encargado o al dueño que te añada con tu correo ({emailSesion}).». | `components/fichajes/MiFichaje.tsx` | `PENDING` | `/galeria/mi-fichaje?state=sin-ficha` |
| `FIC-02` | Tarjeta `MiFichaje` con nombre, oficio, fecha de hoy (`fmtDateShort`) y horas trabajadas hoy (`fmtHoras`). | `components/fichajes/MiFichaje.tsx` | `PENDING` | `/galeria/mi-fichaje?state=sin-fichar` |
| `FIC-03` | Selector de medio de transporte (`TransporteSelector`: `coche`, `furgoneta`, `moto`, `otro` con iconos): antes de fichar se guarda en estado local; después de fichar llama a `cambiar_transporte_propio`. | `components/fichajes/TransporteSelector.tsx`, `components/fichajes/MiFichaje.tsx` | `PENDING` | `/galeria/mi-fichaje` |
| `FIC-04` | Campo «Dónde estás / qué tarea haces» en `MiFichaje`: editable antes de fichar la salida; se envía en `fichar_propio`. | `components/fichajes/MiFichaje.tsx` | `PENDING` | `/galeria/mi-fichaje?state=trabajando` |
| `FIC-05` | Botones de sello `Entrada` y `Salida` (`StampButton`, altura táctil >= 48–56 px): `Entrada` activa cuando no hay `hora_entrada`; `Salida` deshabilitada hasta que haya `hora_entrada` (o `pendienteEntrada`). Una vez fichada una hora, el botón queda bloqueado (`disabled`) para no machacarla. | `components/ui/StampButton.tsx`, `components/fichajes/MiFichaje.tsx` | `PENDING` | `/galeria/mi-fichaje` |
| `FIC-06` | Captura GPS silenciosa (`pedir Coordenadas` de `lib/geo.ts`, timeout 5 s): nunca bloquea el fichaje si el usuario rechaza permisos o falla el GPS. | `lib/geo.ts`, `components/fichajes/MiFichaje.tsx` | `PENDING` | Revisión de módulo dorado |
| `FIC-07` | Cola offline de fichajes (`lib/offline-fichajes.ts`): si `fichar_propio` falla por falta de red (`esFalloDeRed`), guarda el intento en `localStorage["obra_fichajes_pendientes_v1"]`, muestra «Enviando…» en el `StampButton` y banner amarillo «Guardado en el móvil — no había cobertura...», y reintenta al volver `online` / `visibilitychange`. | `lib/offline-fichajes.ts`, `components/fichajes/MiFichaje.tsx` | `PENDING` | `/galeria/mi-fichaje?state=offline` |
| `FIC-08` | Choque con corrección del dueño: si mientras estaba sin cobertura el dueño ya corrigió ese día (`corregido_por_dueno`), descarta el envío pendiente y muestra aviso explicativo. | `components/fichajes/MiFichaje.tsx` | `PENDING` | Revisión de código |
| `FIC-09` | Etiqueta «Corregido por el dueño» en `MiFichaje` y muestra del historial de cambios de hoy (`fichajes_cambios`), incluyendo movimientos de obra («Hoy el dueño ha cambiado tus horas de {antes} a {despues}»). | `components/fichajes/MiFichaje.tsx` | `PENDING` | `/galeria/mi-fichaje?state=corregido` |
| `FIC-10` | Bloque desplegable «Mis últimos días» en `MiFichaje`: últimos 14 fichajes del trabajador (en cualquier obra), indicando nombre de obra si fue en otra, `hora_entrada → hora_salida`, horas totales, insignia «corregido» y cambios registrados. | `components/fichajes/MiFichaje.tsx` | `PENDING` | `/galeria/mi-fichaje?state=ultimos-dias` |
| `FIC-11` | Protección de ruta `/fichajes`: si `rol === "trabajador"` o `!modulos.horas`, redirige a `/`. | `app/(dashboard)/fichajes/page.tsx` | `PENDING` | Revisión de código |
| `FIC-12` | Navegador de fecha `<DayNav />` en `/fichajes`: permite ir al día anterior/siguiente (bloquea ir al futuro más allá de hoy) y botón «Volver a hoy». | `components/ui/DayNav.tsx`, `app/(dashboard)/fichajes/page.tsx` | `PENDING` | `/galeria/fichajes` |
| `FIC-13` | Tarjetas de resumen del día en `/fichajes`: «Fichados» (`presentes/total`), «Horas hoy» (`fmtHoras`) y «Coste hoy» (`fmtEur`). | `app/(dashboard)/fichajes/page.tsx` | `PENDING` | `/galeria/fichajes` |
| `FIC-14` | Ordenación de cuadrilla en `/fichajes`: el propio usuario aparece primero con insignia «Tú»; el resto en orden alfabético (`localeCompare("es")`). | `app/(dashboard)/fichajes/page.tsx` | `PENDING` | `/galeria/fichajes` |
| `FIC-15` | Botón «+ Añadir trabajador» en `/fichajes`: visible **solo para `dueno` y `manager`** (corrige bug de v1). Abre `<Sheet>` con nombre, oficio, €/hora, teléfono y correo opcional. | `app/(dashboard)/fichajes/page.tsx` | `PENDING` | `/galeria/fichajes?state=nuevo-trabajador` |
| `FIC-16` | Borrado de trabajador en `/fichajes`: botón `Trash2` visible **solo para `dueno`**, con confirmación (`confirm`). | `app/(dashboard)/fichajes/page.tsx` | `PENDING` | `/galeria/fichajes` |
| `FIC-17` | Fichaje de cuadrilla en el día de hoy (`esHoy`): el gestor puede pulsar `Entrada` y `Salida` (`marcar("hora_entrada" | "hora_salida")`), elegir `TransporteSelector` y editar `UbicacionForm` para cada trabajador. | `app/(dashboard)/fichajes/page.tsx` | `PENDING` | `/galeria/fichajes` |
| `FIC-18` | Indicador GPS en tarjeta de trabajador en `/fichajes`: muestra «GPS ±Xm» con enlace a Google Maps (`urlMapa`) para entrada y salida si existen coordenadas. | `app/(dashboard)/fichajes/page.tsx` | `PENDING` | `/galeria/fichajes` |
| `FIC-19` | Mover fichaje a otra obra (`moverObra`): si el trabajador ya fichó y existen `obras.length > 1`, botón con icono `ArrowRightLeft` que abre `<Sheet>` para cambiar el fichaje de obra. | `app/(dashboard)/fichajes/page.tsx` | `PENDING` | `/galeria/fichajes?state=mover-obra` |
| `FIC-20` | Corrección de horas por el dueño (`CorregirHorasForm`): botón con icono `Pencil` visible **solo para `dueno`** (`esDueno`). Permite editar `Entrada` y `Salida` en cualquier fecha (hoy o días pasados), valida con `validarHoras()` (avisa si salida <= entrada o si supera 12 h), marca `corregido_por_dueno: true`, muestra historial de cambios y permite «Quitar este día (no vino)» en 2 toques. | `app/(dashboard)/fichajes/page.tsx` | `PENDING` | `/galeria/fichajes?state=corregir-horas` |
| `FIC-21` | Vista de días pasados para `manager` y `jefe_obra` (`!esHoy && !esDueno`): muestra las horas del día en modo solo lectura (sin botones de fichar ni lápiz de corregir). | `app/(dashboard)/fichajes/page.tsx` | `PENDING` | `/galeria/fichajes?actor=jefe_obra` |

---

## 5. Gastos: Tickets y Facturas (`/gastos`) (`GAS-*`)

| ID | Requisito / Comportamiento esperado | Ruta / Componente v2 | Estado | Evidencia / Verificación |
| :--- | :--- | :--- | :--- | :--- |
| `GAS-01` | Cabecera de `/gastos`: total acumulado en € (`suma()` en céntimos), contador de gastos de la obra y botón «Apuntar gasto». | `app/(dashboard)/gastos/page.tsx` | `PENDING` | `/galeria/gastos` |
| `GAS-02` | Filtros combinables en `/gastos`: por documento (`todos` / `ticket` / `factura`), por tipo (`material` / `combustible` / `herramienta` / `comida` / `transporte` / `alquiler` / `subcontrata` / `otro`), por quién pagó (`encargado` / `dueno`) y por proveedor (si hay > 1 proveedor distinto). Botón «Quitar filtros» cuando hay alguno activo. | `app/(dashboard)/gastos/page.tsx` | `PENDING` | `/galeria/gastos` |
| `GAS-03` | Formulario de nuevo/editar gasto en `<Sheet>`: selector `Ticket` vs `Factura`, captura de cámara (`capture="environment"`) o archivo (imagen comprimida con `compressImage` o PDF hasta 15 MB), selector de tipo, campo `ProveedorSelector` con autocompletado de proveedores previos, número de factura (si `es_factura`), concepto, importe, fecha, quién pagó (`encargado` / `dueno`), forma de pago (`efectivo` / `tarjeta_empresa` / `transferencia`) y selector de vehículo si `tipo === "combustible"` y `modulos.vehiculos`. | `app/(dashboard)/gastos/page.tsx`, `components/gastos/ProveedorSelector.tsx` | `PENDING` | `/galeria/gastos?state=nuevo` |
| `GAS-04` | Validación en tiempo real del formulario de gasto (`validarGasto` de `lib/gastos.ts`): muestra el motivo exacto por el que aún no se puede guardar y deshabilita el botón hasta que sea válido. | `app/(dashboard)/gastos/page.tsx`, `lib/gastos.ts` | `PENDING` | `/galeria/gastos?state=nuevo` |
| `GAS-05` | Lista de gastos agrupada por mes (`YYYY-MM`): cada grupo muestra nombre del mes, cantidad y subtotal en €; cada fila muestra icono (`FileText` si factura o icono del tipo), concepto/proveedor, insignias (`Factura`, `Pagó el dueño`, forma de pago, matrícula de vehículo, clip de adjunto) e importe en €. | `app/(dashboard)/gastos/page.tsx` | `PENDING` | `/galeria/gastos` |
| `GAS-06` | Hoja de detalle de gasto (`<Sheet>`): muestra importe grande, datos completos, visor `<ArchivoViewer />` con descarga/ampliación si hay foto o PDF, y botón «Cambiar datos». | `app/(dashboard)/gastos/page.tsx`, `components/ui/ArchivoViewer.tsx` | `PENDING` | `/galeria/gastos?state=detalle` |
| `GAS-07` | Permisos de borrado de gasto: el botón «Borrar este gasto» (con confirmación en 2 toques y limpieza del archivo en Storage) es visible **solo para `dueno`**. `manager` y `jefe_obra` pueden crear y editar, pero no borrar. | `app/(dashboard)/gastos/page.tsx` | `PENDING` | `/galeria/gastos?state=detalle` |
| `GAS-08` | Subida segura al editar/crear gasto: si falla el `INSERT` o `UPDATE` en base de datos después de subir un archivo a Storage, elimina el archivo recién subido para no dejar huérfanos; al reemplazar adjunto en edición, borra el antiguo. | `app/(dashboard)/gastos/page.tsx` | `PENDING` | Revisión de código |

---

## 6. Dinero de la Obra (`/dinero`) (`DIN-*`)

| ID | Requisito / Comportamiento esperado | Ruta / Componente v2 | Estado | Evidencia / Verificación |
| :--- | :--- | :--- | :--- | :--- |
| `DIN-01` | Resumen financiero en `/dinero` adaptado por rol: el `dueno` ve la tarjeta principal con Cobrado del cliente, Gastado en la obra y Balance (`cobrado + recibidoObra - gastado`), más la tarjeta «El encargado tiene en mano» (`recibidoObra - gastadoEncargado`). `manager` y `jefe_obra` ven como tarjeta principal «Tienes en mano para la obra» (`recibidoObra - gastadoEncargado`) y no ven los cobros del cliente. | `app/(dashboard)/dinero/page.tsx` | `PENDING` | `/galeria/dinero`, `/galeria/dinero?actor=jefe_obra` |
| `DIN-02` | Botones de acción en `/dinero`: «Apuntar cobro de cliente» visible **solo para `dueno`**; «Apuntar dinero para la obra» visible para `dueno`, `manager` y `jefe_obra`. | `app/(dashboard)/dinero/page.tsx` | `PENDING` | `/galeria/dinero` |
| `DIN-03` | Formulario de movimiento en `<Sheet>`: importe (> 0 y <= 10.000.000), fecha, forma de pago (`efectivo` / `transferencia` / `bizum` / `otro`), nota opcional y justificante opcional (foto comprimida o PDF hasta 15 MB). | `app/(dashboard)/dinero/page.tsx` | `PENDING` | `/galeria/dinero?state=nuevo` |
| `DIN-04` | Lista de movimientos en `/dinero`: el `dueno` tiene filtro (`Todos` / `Cobros` / `Para la obra`); `manager` y `jefe_obra` ven solo los movimientos `entrega_obra`. Cada fila permite ver el justificante (`ArchivoViewer`) y editar (`Pencil`). | `app/(dashboard)/dinero/page.tsx` | `PENDING` | `/galeria/dinero` |
| `DIN-05` | Permiso de borrado en `/dinero`: el botón de papelera (`Trash2`) para borrar un movimiento (y su justificante en Storage) es visible **solo para `dueno`**. | `app/(dashboard)/dinero/page.tsx` | `PENDING` | `/galeria/dinero` |

---

## 7. Planificación y Diagrama de Gantt (`/planificacion`) (`PLA-*`)

| ID | Requisito / Comportamiento esperado | Ruta / Componente v2 | Estado | Evidencia / Verificación |
| :--- | :--- | :--- | :--- | :--- |
| `PLA-01` | Cabecera de `/planificacion`: porcentaje de avance ponderado (`avanceObra(tareas)`), presupuesto total en € y contadores de tareas (`hecha`, `en_marcha`, `retrasada`, `pendiente`). | `app/(dashboard)/planificacion/page.tsx` | `PENDING` | `/galeria/planificacion` |
| `PLA-02` | Diagrama `<Gantt />` sin scroll horizontal: barras posicionadas en porcentaje (`0..100%`) mediante `posicionBarra(t, rango)` y línea vertical de «Hoy» (`posicionHoy`). Al tocar una tarea se abre `<TareaForm />` para editarla. | `components/planificacion/Gantt.tsx` | `PENDING` | `/galeria/planificacion` (`320`, `375`, `1280`) |
| `PLA-03` | Formulario `<TareaForm />` en `<Sheet>`: título, capítulo opcional, presupuesto en €, cantidad/unidad opcional, fecha inicio y fin (`fin >= inicio`), deslizador de `avance` (`0..100%` de 5 en 5 con botones rápidos `0%`, `25%`, `50%`, `75%`, `100%`) y notas. Botón de borrar tarea visible **solo si `puedeBorrar` (`esDueno`)**. | `components/planificacion/TareaForm.tsx` | `PENDING` | `/galeria/planificacion?state=editar-tarea` |
| `PLA-04` | Importador de Excel (`<ImportarExcel />`): descarga de `/plantilla-plan-obra.xlsx`, lectura en el navegador con `leerExcelPlanificacion(buf)` (`lib/importar-excel.ts`), vista previa de capítulos/importe/fechas y opciones «Añadir a las que hay» o «Sustituir todas» (sustituir todas disponible **solo para `dueno`**). | `components/planificacion/ImportarExcel.tsx` | `PENDING` | `/galeria/planificacion?state=importar-excel` |
| `PLA-05` | Sincronización automática del avance con la portada: cualquier cambio en `tareas_obra` actualiza el avance en `/` y en `avance_obra(o_id)`. | `lib/gantt.ts`, `app/(dashboard)/planificacion/page.tsx` | `PENDING` | Pruebas unitarias `test-gantt.ts` + `test-importar-excel.ts` |
| `PLA-06` | Estado vacío de `/planificacion`: ofrece crear la primera tarea a mano o importar desde Excel. | `app/(dashboard)/planificacion/page.tsx` | `PENDING` | `/galeria/planificacion?state=vacio` |

---

## 8. Vehículos (`/vehiculos`) (`VEH-*`)

| ID | Requisito / Comportamiento esperado | Ruta / Componente v2 | Estado | Evidencia / Verificación |
| :--- | :--- | :--- | :--- | :--- |
| `VEH-01` | Lista de vehículos de la empresa en `/vehiculos` (accesible también para `trabajador` si `modulos.vehiculos`): muestra nombre, matrícula, km actuales (`km_actual`), estado («Libre» en verde o «Lo lleva {quien}» en amarillo) y botón «Coger» o «Devolver». | `app/(dashboard)/vehiculos/page.tsx` | `PENDING` | `/galeria/vehiculos` |
| `VEH-02` | Flujo de «Coger» y «Devolver» vehículo en `<Sheet>`: al coger pide quién lo coge (autocompletado con nombre del trabajador), km al salir (sugiere `km_actual`), obra y nota; al devolver pide km al volver (valida `kmFin >= km_inicio`) y actualiza `vehiculos.km_actual`. | `app/(dashboard)/vehiculos/page.tsx` | `PENDING` | `/galeria/vehiculos?state=coger` |
| `VEH-03` | Crear/editar vehículo en `/vehiculos`: visible para `gestiona` (`dueno`, `manager`, `jefe_obra`). Borrar vehículo visible **solo para `dueno`** y bloqueado si tiene un uso abierto. | `app/(dashboard)/vehiculos/page.tsx` | `PENDING` | `/galeria/vehiculos` |
| `VEH-04` | Historial de usos y combustible por vehículo: desplegable «Ver usos» con los últimos recorridos (`km_inicio → km_fin`, diferencia de km, quién y fecha) y total gastado en combustible vinculado a ese vehículo en la obra actual. | `app/(dashboard)/vehiculos/page.tsx` | `PENDING` | `/galeria/vehiculos` |

---

## 9. Notas (`/notas`) (`NOT-*`)

| ID | Requisito / Comportamiento esperado | Ruta / Componente v2 | Estado | Evidencia / Verificación |
| :--- | :--- | :--- | :--- | :--- |
| `NOT-01` | Lista de notas de la obra en `/notas`: ordenadas con las fijadas (`fijada === true`) primero y luego por fecha descendente. | `app/(dashboard)/notas/page.tsx` | `PENDING` | `/galeria/notas` |
| `NOT-02` | Crear nota en `<Sheet>`: título, texto obligatorio y autor opcional. | `app/(dashboard)/notas/page.tsx` | `PENDING` | `/galeria/notas?state=nueva` |
| `NOT-03` | Fijar / desfijar nota (`Pin`) con un toque. | `app/(dashboard)/notas/page.tsx` | `PENDING` | `/galeria/notas` |
| `NOT-04` | Borrar nota (`Trash2`) con un toque. | `app/(dashboard)/notas/page.tsx` | `PENDING` | `/galeria/notas` |

---

## 10. Resumen Mensual (`/resumen`) (`RES-*`)

| ID | Requisito / Comportamiento esperado | Ruta / Componente v2 | Estado | Evidencia / Verificación |
| :--- | :--- | :--- | :--- | :--- |
| `RES-01` | Selector de mes (`shiftMonth(mes, -1 | 1)`) y tarjetas de totales del mes (Horas, Coste mano de obra, Gastos con `suma()` en céntimos y Total mes). | `app/(dashboard)/resumen/page.tsx` | `PENDING` | `/galeria/resumen` |
| `RES-02` | Exportación a Excel (`exportarResumenExcel` cargado con `import()` dinámico al pulsar el botón): genera el archivo `.xlsx` con las hojas del mes (Resumen, Mano de obra, Fichajes detallados, Gastos). | `app/(dashboard)/resumen/page.tsx`, `lib/exportar-excel.ts` | `PENDING` | `/galeria/resumen` + verificación de bundle en `metricas.md` |
| `RES-03` | Tabla «Por trabajador» en `/resumen` (si `modulos.horas`): días, horas, €/h, coste total e insignia «{n} corregido(s)» si tiene días con `corregido_por_dueno`. | `app/(dashboard)/resumen/page.tsx` | `PENDING` | `/galeria/resumen` |
| `RES-04` | Bloque «Días corregidos por el dueño» en `/resumen`: lista auditable de cada corrección del mes con fecha, trabajador, horas resultantes e historial `antes → después` o cambio de obra. | `app/(dashboard)/resumen/page.tsx` | `PENDING` | `/galeria/resumen` |
| `RES-05` | Desgloses de gastos en `/resumen` (si `modulos.gastos`): «Gastos por tipo» (con barra de porcentaje), «Gastos por proveedor» (con subtotales de facturas y tickets) y «Gastos por forma de pago» (`Pagó el encargado` vs `Pagó el dueño` y método). | `app/(dashboard)/resumen/page.tsx` | `PENDING` | `/galeria/resumen` |

---

## 11. Ajustes (`/ajustes`) (`AJU-*`, `AJU-W1`)

| ID | Requisito / Comportamiento esperado | Ruta / Componente v2 | Estado | Evidencia / Verificación |
| :--- | :--- | :--- | :--- | :--- |
| `AJU-01` | Selector de idioma (`SelectorIdioma`) en `/ajustes` visible para todos los roles. | `app/(dashboard)/ajustes/page.tsx` | `PENDING` | `/galeria/ajustes` |
| `AJU-02` | `<ConfigurarObra />` (visible si `gestiona`): editar nombre y dirección de la obra, marcar como «En curso» o «Terminada» (`activa`), activar/desactivar los 6 módulos (`horas`, `gastos`, `dinero`, `planificacion`, `vehiculos`, `notas`) y subir/eliminar planos y fotos de la obra. | `components/ajustes/ConfigurarObra.tsx` | `PENDING` | `/galeria/ajustes` |
| `AJU-03` | `<Accesos />` — Invitaciones por código de 6 letras (visible para `dueno` y `manager`): generar código para `trabajador`, `jefe_obra` o `manager` (el `manager` no puede crear códigos de `manager`), copiar mensaje para WhatsApp y borrar códigos pendientes. | `components/ajustes/Accesos.tsx` | `PENDING` | `/galeria/ajustes` |
| `AJU-04` | `<Accesos />` — Invitación por correo a otra empresa (`invitaciones_empresa`, visible **solo para `dueno`**): permite invitar como `manager` o `jefe_obra` a alguien que ya usa la app en otra empresa. | `components/ajustes/Accesos.tsx` | `PENDING` | `/galeria/ajustes` |
| `AJU-05` | `<Accesos />` — Solicitudes pendientes de aprobación (`miembros` con `rol === "pendiente"`): aprobar eligiendo rol y obras asignadas (`todas` o selección) o rechazar. | `components/ajustes/Accesos.tsx` | `PENDING` | `/galeria/ajustes?state=solicitudes` |
| `AJU-06` | `<Accesos />` — Lista de personas con acceso: cambiar rol, activar/bloquear (`activo`), cambiar obras asignadas (`todas` o selección de obras) y quitar acceso (protegiendo siempre la cuenta del `dueno`). | `components/ajustes/Accesos.tsx` | `PENDING` | `/galeria/ajustes` |
| `AJU-07` | `<SoporteAcceso />` (visible **solo para `dueno`**): abrir acceso temporal al soporte técnico (motivo + duración `2h`/`6h`/`24h`/`72h`), ver quién entró y cortar el acceso en el acto (`revocado_en`). Sin errores de pureza en render (`Date.now()`). | `components/ajustes/SoporteAcceso.tsx` | `PENDING` | `/galeria/ajustes` |
| `AJU-08` | `<EliminarObra />` (visible **solo para `dueno`**): borrado definitivo de la obra actual (archivos en Storage + fila en `obras` con cascada) exigiendo escribir el nombre exacto de la obra. | `components/ajustes/EliminarObra.tsx` | `PENDING` | `/galeria/ajustes` |
| `AJU-09` | Cuenta del usuario en `/ajustes`: muestra correo actual, formulario desplegable «Cambiar contraseña» (`supabase.auth.updateUser`) y botón «Cerrar sesión». | `app/(dashboard)/ajustes/page.tsx` | `PENDING` | `/galeria/ajustes` |
| `AJU-W1` | Vista de `/ajustes` para `trabajador`: muestra únicamente Idioma (`AJU-01`) y Cuenta (`AJU-09`), ocultando configuración de obra, accesos, soporte y borrado de obra. | `app/(dashboard)/ajustes/page.tsx` | `PENDING` | `/galeria/ajustes?actor=trabajador` |

---

## 12. Administración de Plataforma (`/admin`) (`ADM-*`) y Plataforma (`PLT-*`)

| ID | Requisito / Comportamiento esperado | Ruta / Componente v2 | Estado | Evidencia / Verificación |
| :--- | :--- | :--- | :--- | :--- |
| `ADM-01` | Verificación `es_admin_plataforma()` en `/admin`: si no es administrador de plataforma muestra pantalla «Sin permiso» con enlace para volver a `/`. | `app/admin/page.tsx` | `PENDING` | `/galeria/admin?state=sin-permiso` |
| `ADM-02` | Generación y gestión de códigos de alta de 8 letras en `/admin`: crear código (nombre de empresa, nota, días pagados por defecto 30), copiar mensaje y cancelar códigos sin usar (`cancelar_codigo_alta`). | `app/admin/page.tsx` | `PENDING` | `/galeria/admin` |
| `ADM-03` | Gestión de empresas en `/admin`: listado con estado (`Activa` / `Caducada`), miembros, obras y edición de fecha `pagado_hasta` con motivo obligatorio (`poner_fecha_pago_empresa`). | `app/admin/page.tsx` | `PENDING` | `/galeria/admin` |
| `ADM-04` | Sesiones de soporte abiertas (`entrar_como_soporte`) y registro de los últimos 50 errores (`ultimos_errores`) en `/admin`. | `app/admin/page.tsx` | `PENDING` | `/galeria/admin` |
| `PLT-01` | PWA instalable (`public/manifest.webmanifest`, `public/sw.js`, `ServiceWorkerRegister.tsx`, iconos en `public/icons/*` actualizados a la nueva identidad v2). | `public/manifest.webmanifest`, `public/sw.js`, `app/layout.tsx` | `PENDING` | Verificación de build y manifest |
| `PLT-02` | Captura global de errores en cliente (`instrumentation-client.ts`, `app/error.tsx`, `app/global-error.tsx`) y servidor (`instrumentation.ts`) hacia `errores_app`. | `lib/errores.ts`, `app/error.tsx`, `app/global-error.tsx` | `PENDING` | Revisión de módulos dorados |
| `PLT-03` | Internacionalización completa `es` / `uk` / `en` sin una sola cadena visible sin traducir (`node scripts/claves-i18n.js` reporta 0 faltantes en `uk` y `en`). | `lib/i18n/*` | `PENDING` | Ejecución de `node scripts/claves-i18n.js` |
| `PLT-04` | Paso del 100% de los tests unitarios deterministas (`test-horas.ts`, `test-dinero.ts`, `test-fechas.ts`, `test-gantt.ts`, `test-importar-excel.ts`). | `scripts/test-*.ts` | `PENDING` | Ejecución con `npx tsx` |
| `PLT-05` | Galería interactiva de verificación `/galeria` y `/galeria/[screen]` protegida por `NEXT_PUBLIC_GALERIA=1` (devuelve `notFound()` si no está activa), con conmutador en vivo de idioma (`es`/`uk`/`en`), rol (`dueno`/`manager`/`jefe_obra`/`trabajador`), módulos, estado (`populated`/`empty`/`loading`/`error`/`offline`) y ancho de marco (`320`/`375`/`430`/`768`/`1280`), 100% en memoria con cero llamadas de red. | `app/galeria/page.tsx`, `app/galeria/[screen]/page.tsx`, `lib/galeria-fixtures.ts` | `PENDING` | Verificación en navegador y Playwright |
| `PLT-06` | Cumplimiento estricto de contraste diurno WCAG AA/AAA, objetivos táctiles >= 44x44 px y cero desbordamiento horizontal en `320`, `375`, `430`, `768` y `1280` en los 3 idiomas. | `app/globals.css`, sistema de diseño v2 | `PENDING` | Reporte en `ENTREGA/metricas.md` |
