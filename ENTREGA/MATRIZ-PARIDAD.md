# Matriz de Paridad Funcional v1 в†’ v2 (`MATRIZ-PARIDAD.md`)

> **PropГіsito**: Seguimiento exhaustivo de cada requisito e identificador funcional de `ESPECIFICACION-ESTRUCTURA.md` (`ACC-01` a `PLT-06`). Ninguna funcionalidad puede darse por terminada (`DONE`) sin cГіdigo real en disco, prueba en `/galeria` y verificaciГіn visual.

---

## 1. AutenticaciГіn, Acceso, Alta y Puertas (`ACC-*`, `ONB-*`)

| ID | Requisito / Comportamiento esperado | Ruta / Componente v2 | Estado | Evidencia / VerificaciГіn |
| :--- | :--- | :--- | :--- | :--- |
| `ACC-01` | Portada pГєblica sin sesiГіn (`LandingMock`): cabe en `100dvh` sin scroll vertical ni horizontal, selector de obra de ejemplo (`Obra Marbella`, `Obra Centro`, `Obra Norte`), porcentaje de avance (`72%`), grГЎfico/plano y botГіn a `/login`. | `components/landing/LandingMock.tsx` | `PENDING` | `/galeria/landing` (`320`, `375`, `1280`) |
| `ACC-02` | Selector de idioma `ES` / `UA` / `EN` visible arriba a la derecha en `/login` y en `/ajustes`, persistiendo en `localStorage["obra_idioma"]` y `<html lang="...">`. | `components/ui/SelectorIdioma.tsx`, `app/login/page.tsx`, `app/(dashboard)/ajustes/page.tsx` | `PENDING` | `/galeria/login`, `/galeria/ajustes` |
| `ACC-03` | Vista `entrar` en `/login`: correo + contraseГ±a (`signInWithPassword`), enlaces a В«ВїOlvidaste la contraseГ±a?В», В«Crear cuentaВ» y В«Tengo un cГіdigo de invitaciГіnВ». | `app/login/page.tsx` | `PENDING` | `/galeria/login?state=entrar` |
| `ACC-04` | Vista `registro` en `/login`: correo + contraseГ±a mГ­ni. 6 caracteres (`signUp` con `emailRedirectTo: /login?aviso=confirmado`). Si requiere confirmar correo muestra aviso; si entra directo pasa a `codigo`. | `app/login/page.tsx` | `PENDING` | `/galeria/login?state=registro` |
| `ACC-05` | Banner de confirmaciГіn (`?aviso=confirmado`) en `/login`: muestra В«Correo confirmado. Ya puedes entrar con tu correo y contraseГ±a.В». | `app/login/page.tsx` | `PENDING` | `/galeria/login?state=confirmado` |
| `ACC-06` | Vista `codigo` en `/login`: input en mayГєsculas (`maxLength=8`, `tracking-widest`), llama a `unirse_con_codigo(p_codigo)`. Distingue cГіdigo de empresa (8 letras в†’ `dueno`) y de invitaciГіn (6 letras в†’ `pendiente`). | `app/login/page.tsx` | `PENDING` | `/galeria/login?state=codigo` |
| `ACC-07` | Vista `olvide` en `/login`: envГ­a enlace de recuperaciГіn (`resetPasswordForEmail` con `redirectTo: /reset-password`) y muestra confirmaciГіn `olvideEnviado`. | `app/login/page.tsx` | `PENDING` | `/galeria/login?state=olvide` |
| `ACC-08` | Pantalla `/reset-password`: escucha `PASSWORD_RECOVERY` o sesiГіn activa; pide nueva contraseГ±a + repetir; si no hay enlace vГЎlido en 1,5 s muestra aviso y botГіn para volver a `/login`. | `app/reset-password/page.tsx` | `PENDING` | `/galeria/reset-password` |
| `ACC-09` | Pantalla `/alta`: consulta `GET /api/alta/checkout`; muestra precio mensual con 14 dГ­as gratis, lista de ventajas, campo de correo opcional y botГіn В«Continuar al pagoВ» (`POST /api/alta/checkout`) o aviso si Stripe no estГЎ activo. | `app/alta/page.tsx` | `PENDING` | `/galeria/alta` |
| `ACC-10` | Pantalla `/alta/ok`: recoge `session_id`, consulta `GET /api/alta/codigo` (hasta 10 intentos cada 1,5 s), muestra cГіdigo de 8 letras con botГіn В«Copiar cГіdigoВ» y enlace a `/login`. | `app/alta/ok/page.tsx` | `PENDING` | `/galeria/alta-ok` |
| `ACC-11` | Puerta `AuthGate`: mientras carga muestra spinner; sin sesiГіn muestra `<LandingMock />`; con sesiГіn envuelve en `<MiembroProvider>` y `<AccesoGate>`. | `components/layout/AuthGate.tsx` | `PENDING` | RevisiГіn de cГіdigo + `/galeria` |
| `ACC-12` | Puerta `PendienteAprobacion` (`AccesoGate`): se muestra cuando `rol === null`, `rol === "pendiente"` o `!activo`. Incluye formulario para introducir cГіdigo (`unirse_con_codigo`), botГіn В«Comprobar otra vezВ» y В«Cerrar sesiГіnВ». | `components/layout/PendienteAprobacion.tsx` | `PENDING` | `/galeria/pendiente` |
| `ACC-13` | Puerta `SuscripcionInactiva` (`AccesoGate`): se muestra cuando `suscripcionActiva === false`. Si `esDueno` explica que la suscripciГіn ha caducado; si es miembro pide avisar al dueГ±o. | `components/layout/SuscripcionInactiva.tsx` | `PENDING` | `/galeria/suscripcion-inactiva` |
| `ACC-14` | Estados sin obras en `DashboardShell`: si `obras.length === 0`, el gestor (`gestiona === true`) ve `<SinObras />` (`ONB-01`) y el `trabajador` ve `<SinObrasAsignadas />` (`ONB-02`). | `components/layout/SinObras.tsx`, `components/layout/SinObrasAsignadas.tsx` | `PENDING` | `/galeria/sin-obras`, `/galeria/sin-obras-asignadas` |
| `ONB-01` | Formulario `<SinObras />`: permite crear la primera obra (nombre obligatorio + direcciГіn opcional) y la selecciona inmediatamente. | `components/layout/SinObras.tsx` | `PENDING` | `/galeria/sin-obras` |
| `ONB-02` | Vista `<SinObrasAsignadas />`: informa al trabajador de que aГєn no tiene obra asignada. | `components/layout/SinObrasAsignadas.tsx` | `PENDING` | `/galeria/sin-obras-asignadas` |
| `ONB-03` | `claiming_miembro()` automГЎtico al iniciar sesiГіn en `MiembroProvider`. | `lib/miembro-context.tsx` | `PENDING` | RevisiГіn de cГіdigo |
| `ONB-04` | RedirecciГіn `/facturas` в†’ `/gastos`. | `app/(dashboard)/facturas/page.tsx` | `PENDING` | RevisiГіn de ruta |

---

## 2. Estructura Global, NavegaciГіn y Avisos (`SHL-*`)

| ID | Requisito / Comportamiento esperado | Ruta / Componente v2 | Estado | Evidencia / VerificaciГіn |
| :--- | :--- | :--- | :--- | :--- |
| `SHL-01` | `TopBar` mГіvil y escritorio: emblema `<Logo />` a la izquierda en mГіvil (lleva a `/`), selector de obra central con indicador de activa/terminada, e icono de calendario a `/resumen` a la derecha (solo si `gestiona`). Respeta `env(safe-area-inset-top)`. | `components/layout/TopBar.tsx` | `PENDING` | `/galeria/home-dueno` |
| `SHL-02` | `BottomNav` mГіvil (`< 768px`): barra flotante inferior con hasta 5 iconos segГєn `navMovil(rol, modulos)`. Respeta `env(safe-area-inset-bottom)`. | `components/layout/BottomNav.tsx`, `lib/nav.ts` | `PENDING` | `/galeria/home-dueno` (`375`) |
| `SHL-03` | `Sidebar` escritorio (`>= 768px`): barra lateral fija de `100dvh` con `<Logo />`, tГ­tulo В«Control de ObraВ», lista completa `navLateral(rol, modulos)` y botГіn В«Cerrar sesiГіnВ». | `components/layout/Sidebar.tsx`, `lib/nav.ts` | `PENDING` | `/galeria/home-dueno` (`1280`) |
| `SHL-04` | Selector de obra (`ObraPicker`): lista todas las obras visibles con marca en la actual e insignia В«TerminadaВ» si `activa === false`. BotГіn В«Nueva obraВ» visible **solo para `dueno` y `manager`** (corrige bug de v1). | `components/layout/ObraPicker.tsx` | `PENDING` | `/galeria/home-dueno?state=obra-picker` |
| `SHL-05` | `PullToRefresh`: deslizar hacia abajo desde el tope (`scrollY <= 0`) mГЎs de 70 px recarga los datos (`router.refresh()` + evento `"obra:refresh"`). Ignora gestos dentro de `[data-no-ptr]`. | `components/layout/PullToRefresh.tsx` | `PENDING` | RevisiГіn de cГіdigo |
| `SHL-06` | `AvisoControl` (modo soporte activo para `dueno`): franja superior cuando hay una sesiГіn activa en `soporte_accesos`, con botГіn В«Cortar acceso ahoraВ» y actualizaciГіn en tiempo real (`postgres_changes`). | `components/layout/AvisoControl.tsx` | `PENDING` | `/galeria/home-dueno?state=aviso-soporte` |
| `SHL-07` | `AvisoControl` (modo soporte visto por quien entra con `enSoporte === true`): franja naranja con botГіn В«Salir del modo soporteВ» (`Salir_de_modo_soporte()`). | `components/layout/AvisoControl.tsx` | `PENDING` | `/galeria/home-dueno?state=en-soporte` |
| `SHL-08` | `AvisoControl` (aviso semanal al `dueno`): muestra los cambios de los Гєltimos 7 dГ­as hechos por managers/jefes de obra (`fichajes_cambios`, `gastos`, `movimientos_obra`, `tareas_obra`), con detalle desplegable y cierre guardado en `localStorage`. | `components/layout/AvisoControl.tsx` | `PENDING` | `/galeria/home-dueno?state=aviso-semanal` |
| `SHL-09` | Cero scroll horizontal en toda la aplicaciГіn (`overflow-x: hidden`, `overscroll-behavior-x: none` en `html` y `body`, `touch-action: pan-y` en `body`, `min-w-0` en hijos flex). | `app/globals.css`, todos los componentes | `PENDING` | AuditorГ­a Playwright `320`/`375`/`430`/`768`/`1280` |

---

## 3. Inicio вЂ” Vista Gestor (`HOM-*`) y Vista Trabajador (`HOM-W*`)

| ID | Requisito / Comportamiento esperado | Ruta / Componente v2 | Estado | Evidencia / VerificaciГіn |
| :--- | :--- | :--- | :--- | :--- |
| `HOM-01` | Cabecera de obra en Inicio (gestor): nombre de la obra, direcciГіn con icono `MapPin` (si existe) e insignia В«Obra terminadaВ» si `activa === false`. | `app/(dashboard)/page.tsx` | `PENDING` | `/galeria/home-dueno` |
| `HOM-02` | Bloque de progreso / horas en Inicio (gestor): si `modulos.planificacion` y hay tareas con presupuesto > 0, muestra porcentaje exacto con 2 decimales (`avanceObraExacto`), presupuesto total y `<MiniGantt />` clicable hacia `/planificacion`. Si no, y `modulos.horas` estГЎ activo, muestra horas totales, coste y `<BarrasProgreso />` de 14 dГ­as clicable hacia `/fichajes`. | `app/(dashboard)/page.tsx` | `PENDING` | `/galeria/home-dueno` |
| `HOM-03` | Bloque В«Trabajando ahoraВ» y В«Fichajes de hoyВ» (gestor, si `modulos.horas`): contador de fichajes abiertos hoy (con nombres en verde) y total de fichajes del dГ­a con enlace a `/fichajes`. | `app/(dashboard)/page.tsx` | `PENDING` | `/galeria/home-dueno` |
| `HOM-04` | Bloque В«Dinero de la obraВ» (gestor, si `modulos.dinero` o `modulos.gastos`): muestra Cobrado, Gastado y Balance (`cobrado - gastado`), mГЎs el recuadro В«El encargado tiene en manoВ» si hay entregas o gastos del encargado. | `app/(dashboard)/page.tsx` | `PENDING` | `/galeria/home-dueno` |
| `HOM-05` | Bloque `<MiFichaje />` en Inicio (gestor, si `modulos.horas`): permite al propio dueГ±o/manager/jefe de obra fichar su entrada y salida si tiene ficha en `trabajadores`. | `components/fichajes/MiFichaje.tsx` | `PENDING` | `/galeria/home-dueno` |
| `HOM-06` | Bloque В«Horas y coste por trabajadorВ» (gestor, si `modulos.horas`): lista de trabajadores con horas totales, dГ­as trabajados y coste en в‚¬; al tocar un trabajador se abre un `<Sheet>` con su historial dГ­a a dГ­a en la obra (`hora_entrada в†’ hora_salida`, `ubicacion`, horas y coste). | `app/(dashboard)/page.tsx` | `PENDING` | `/galeria/home-dueno?state=detalle-trabajador` |
| `HOM-07` | GalerГ­a de planos y fotos de la obra en Inicio (gestor): cuadrГ­cula con miniaturas firmadas del bucket `documentos` (planos y fotos subidas en `ConfigurarObra`), que al tocar abren `<ArchivoViewer />`, mГЎs enlace В«Subir o quitar en AjustesВ». | `app/(dashboard)/page.tsx` | `PENDING` | `/galeria/home-dueno` |
| `HOM-W1` | Cabecera de obra en `<InicioTrabajador />`: nombre de la obra, direcciГіn e insignia В«Obra terminadaВ» si `activa === false`. | `components/inicio/InicioTrabajador.tsx` | `PENDING` | `/galeria/home-trabajador` |
| `HOM-W2` | Bloque В«Progreso de la obraВ» en `<InicioTrabajador />`: si `modulos.planificacion` y el RPC `avance_obra(o_id)` devuelve `> 0`, muestra el porcentaje entero con `<NumeroGrande />`. | `components/inicio/InicioTrabajador.tsx` | `PENDING` | `/galeria/home-trabajador` |
| `HOM-W3` | Bloque `<MiFichaje />` en `<InicioTrabajador />` (si `modulos.horas`): tarjeta principal de fichaje del trabajador. | `components/inicio/InicioTrabajador.tsx`, `components/fichajes/MiFichaje.tsx` | `PENDING` | `/galeria/home-trabajador` |
| `HOM-W4` | Bloque В«Trabajando ahoraВ» en `<InicioTrabajador />` (si `modulos.horas`): usa RPC `fichar_abiertos_ahora(p_obra_id)` y muestra solo el nГєmero de personas trabajando ahora (sin exponer los nombres de otros compaГ±eros). | `components/inicio/InicioTrabajador.tsx` | `PENDING` | `/galeria/home-trabajador` |
| `HOM-W5` | GalerГ­a de planos y fotos de la obra en `<InicioTrabajador />` (solo lectura, con visor `<ArchivoViewer />`, sin enlace a Ajustes). | `components/inicio/InicioTrabajador.tsx` | `PENDING` | `/galeria/home-trabajador` |

---

## 4. Fichajes: Propio (`MiFichaje`) y Cuadrilla (`/fichajes`) (`FIC-*`)

| ID | Requisito / Comportamiento esperado | Ruta / Componente v2 | Estado | Evidencia / VerificaciГіn |
| :--- | :--- | :--- | :--- | :--- |
| `FIC-01` | Estado sin ficha de trabajador en `MiFichaje`: si no existe fila en `trabajadores` con `correo === emailSesion`, muestra aviso В«AГєn no tienes ficha de trabajador. PГ­dele al encargado o al dueГ±o que te aГ±ada con tu correo ({emailSesion}).В». | `components/fichajes/MiFichaje.tsx` | `PENDING` | `/galeria/mi-fichaje?state=sin-ficha` |
| `FIC-02` | Tarjeta `MiFichaje` con nombre, oficio, fecha de hoy (`fmtDateShort`) y horas trabajadas hoy (`fmtHoras`). | `components/fichajes/MiFichaje.tsx` | `PENDING` | `/galeria/mi-fichaje?state=sin-fichar` |
| `FIC-03` | Selector de medio de transporte (`TransporteSelector`: `coche`, `furgoneta`, `moto`, `otro` con iconos): antes de fichar se guarda en estado local; despuГ©s de fichar llama a `cambiar_transporte_propio`. | `components/fichajes/TransporteSelector.tsx`, `components/fichajes/MiFichaje.tsx` | `PENDING` | `/galeria/mi-fichaje` |
| `FIC-04` | Campo В«DГіnde estГЎs / quГ© tarea hacesВ» en `MiFichaje`: editable antes de fichar la salida; se envГ­a en `fichar_propio`. | `components/fichajes/MiFichaje.tsx` | `PENDING` | `/galeria/mi-fichaje?state=trabajando` |
| `FIC-05` | Botones de sello `Entrada` y `Salida` (`StampButton`, altura tГЎctil >= 48вЂ“56 px): `Entrada` activa cuando no hay `hora_entrada`; `Salida` deshabilitada hasta que haya `hora_entrada` (o `pendienteEntrada`). Una vez fichada una hora, el botГіn queda bloqueado (`disabled`) para no machacarla. | `components/ui/StampButton.tsx`, `components/fichajes/MiFichaje.tsx` | `PENDING` | `/galeria/mi-fichaje` |
| `FIC-06` | Captura GPS silenciosa (`pedir Coordenadas` de `lib/geo.ts`, timeout 5 s): nunca bloquea el fichaje si el usuario rechaza permisos o falla el GPS. | `lib/geo.ts`, `components/fichajes/MiFichaje.tsx` | `PENDING` | RevisiГіn de mГіdulo dorado |
| `FIC-07` | Cola offline de fichajes (`lib/offline-fichajes.ts`): si `fichar_propio` falla por falta de red (`esFalloDeRed`), guarda el intento en `localStorage["obra_fichajes_pendientes_v1"]`, muestra В«EnviandoвЂ¦В» en el `StampButton` y banner amarillo В«Guardado en el mГіvil вЂ” no habГ­a cobertura...В», y reintenta al volver `online` / `visibilitychange`. | `lib/offline-fichajes.ts`, `components/fichajes/MiFichaje.tsx` | `PENDING` | `/galeria/mi-fichaje?state=offline` |
| `FIC-08` | Choque con correcciГіn del dueГ±o: si mientras estaba sin cobertura el dueГ±o ya corrigiГі ese dГ­a (`corregido_por_dueno`), descarta el envГ­o pendiente y muestra aviso explicativo. | `components/fichajes/MiFichaje.tsx` | `PENDING` | RevisiГіn de cГіdigo |
| `FIC-09` | Etiqueta В«Corregido por el dueГ±oВ» en `MiFichaje` y muestra del historial de cambios de hoy (`fichajes_cambios`), incluyendo movimientos de obra (В«Hoy el dueГ±o ha cambiado tus horas de {antes} a {despues}В»). | `components/fichajes/MiFichaje.tsx` | `PENDING` | `/galeria/mi-fichaje?state=corregido` |
| `FIC-10` | Bloque desplegable В«Mis Гєltimos dГ­asВ» en `MiFichaje`: Гєltimos 14 fichajes del trabajador (en cualquier obra), indicando nombre de obra si fue en otra, `hora_entrada в†’ hora_salida`, horas totales, insignia В«corregidoВ» y cambios registrados. | `components/fichajes/MiFichaje.tsx` | `PENDING` | `/galeria/mi-fichaje?state=ultimos-dias` |
| `FIC-11` | ProtecciГіn de ruta `/fichajes`: si `rol === "trabajador"` o `!modulos.horas`, redirige a `/`. | `app/(dashboard)/fichajes/page.tsx` | `PENDING` | RevisiГіn de cГіdigo |
| `FIC-12` | Navegador de fecha `<DayNav />` en `/fichajes`: permite ir al dГ­a anterior/siguiente (bloquea ir al futuro mГЎs allГЎ de hoy) y botГіn В«Volver a hoyВ». | `components/ui/DayNav.tsx`, `app/(dashboard)/fichajes/page.tsx` | `PENDING` | `/galeria/fichajes` |
| `FIC-13` | Tarjetas de resumen del dГ­a en `/fichajes`: В«FichadosВ» (`presentes/total`), В«Horas hoyВ» (`fmtHoras`) y В«Coste hoyВ» (`fmtEur`). | `app/(dashboard)/fichajes/page.tsx` | `PENDING` | `/galeria/fichajes` |
| `FIC-14` | OrdenaciГіn de cuadrilla en `/fichajes`: el propio usuario aparece primero con insignia В«TГєВ»; el resto en orden alfabГ©tico (`localeCompare("es")`). | `app/(dashboard)/fichajes/page.tsx` | `PENDING` | `/galeria/fichajes` |
| `FIC-15` | BotГіn В«+ AГ±adir trabajadorВ» en `/fichajes`: visible **solo para `dueno` y `manager`** (corrige bug de v1). Abre `<Sheet>` con nombre, oficio, в‚¬/hora, telГ©fono y correo opcional. | `app/(dashboard)/fichajes/page.tsx` | `PENDING` | `/galeria/fichajes?state=nuevo-trabajador` |
| `FIC-16` | Borrado de trabajador en `/fichajes`: botГіn `Trash2` visible **solo para `dueno`**, con confirmaciГіn (`confirm`). | `app/(dashboard)/fichajes/page.tsx` | `PENDING` | `/galeria/fichajes` |
| `FIC-17` | Fichaje de cuadrilla en el dГ­a de hoy (`esHoy`): el gestor puede pulsar `Entrada` y `Salida` (`marcar("hora_entrada" | "hora_salida")`), elegir `TransporteSelector` y editar `UbicacionForm` para cada trabajador. | `app/(dashboard)/fichajes/page.tsx` | `PENDING` | `/galeria/fichajes` |
| `FIC-18` | Indicador GPS en tarjeta de trabajador en `/fichajes`: muestra В«GPS В±XmВ» con enlace a Google Maps (`urlMapa`) para entrada y salida si existen coordenadas. | `app/(dashboard)/fichajes/page.tsx` | `PENDING` | `/galeria/fichajes` |
| `FIC-19` | Mover fichaje a otra obra (`moverObra`): si el trabajador ya fichГі y existen `obras.length > 1`, botГіn con icono `ArrowRightLeft` que abre `<Sheet>` para cambiar el fichaje de obra. | `app/(dashboard)/fichajes/page.tsx` | `PENDING` | `/galeria/fichajes?state=mover-obra` |
| `FIC-20` | CorrecciГіn de horas por el dueГ±o (`CorregirHorasForm`): botГіn con icono `Pencil` visible **solo para `dueno`** (`esDueno`). Permite editar `Entrada` y `Salida` en cualquier fecha (hoy o dГ­as pasados), valida con `validarHoras()` (avisa si salida <= entrada o si supera 12 h), marca `corregido_por_dueno: true`, muestra historial de cambios y permite В«Quitar este dГ­a (no vino)В» en 2 toques. | `app/(dashboard)/fichajes/page.tsx` | `PENDING` | `/galeria/fichajes?state=corregir-horas` |
| `FIC-21` | Vista de dГ­as pasados para `manager` y `jefe_obra` (`!esHoy && !esDueno`): muestra las horas del dГ­a en modo solo lectura (sin botones de fichar ni lГЎpiz de corregir). | `app/(dashboard)/fichajes/page.tsx` | `PENDING` | `/galeria/fichajes?actor=jefe_obra` |

---

## 5. Gastos: Tickets y Facturas (`/gastos`) (`GAS-*`)

| ID | Requisito / Comportamiento esperado | Ruta / Componente v2 | Estado | Evidencia / VerificaciГіn |
| :--- | :--- | :--- | :--- | :--- |
| `GAS-01` | Cabecera de `/gastos`: total acumulado en в‚¬ (`suma()` en cГ©ntimos), contador de gastos de la obra y botГіn В«Apuntar gastoВ». | `app/(dashboard)/gastos/page.tsx` | `PENDING` | `/galeria/gastos` |
| `GAS-02` | Filtros combinables en `/gastos`: por documento (`todos` / `ticket` / `factura`), por tipo (`material` / `combustible` / `herramienta` / `comida` / `transporte` / `alquiler` / `subcontrata` / `otro`), por quiГ©n pagГі (`encargado` / `dueno`) y por proveedor (si hay > 1 proveedor distinto). BotГіn В«Quitar filtrosВ» cuando hay alguno activo. | `app/(dashboard)/gastos/page.tsx` | `PENDING` | `/galeria/gastos` |
| `GAS-03` | Formulario de nuevo/editar gasto en `<Sheet>`: selector `Ticket` vs `Factura`, captura de cГЎmara (`capture="environment"`) o archivo (imagen comprimida con `compressImage` o PDF hasta 15 MB), selector de tipo, campo `ProveedorSelector` con autocompletado de proveedores previos, nГєmero de factura (si `es_factura`), concepto, importe, fecha, quiГ©n pagГі (`encargado` / `dueno`), forma de pago (`efectivo` / `tarjeta_empresa` / `transferencia`) y selector de vehГ­culo si `tipo === "combustible"` y `modulos.vehiculos`. | `app/(dashboard)/gastos/page.tsx`, `components/gastos/ProveedorSelector.tsx` | `PENDING` | `/galeria/gastos?state=nuevo` |
| `GAS-04` | ValidaciГіn en tiempo real del formulario de gasto (`validarGasto` de `lib/gastos.ts`): muestra el motivo exacto por el que aГєn no se puede guardar y deshabilita el botГіn hasta que sea vГЎlido. | `app/(dashboard)/gastos/page.tsx`, `lib/gastos.ts` | `PENDING` | `/galeria/gastos?state=nuevo` |
| `GAS-05` | Lista de gastos agrupada por mes (`YYYY-MM`): cada grupo muestra nombre del mes, cantidad y subtotal en в‚¬; cada fila muestra icono (`FileText` si factura o icono del tipo), concepto/proveedor, insignias (`Factura`, `PagГі el dueГ±o`, forma de pago, matrГ­cula de vehГ­culo, clip de adjunto) e importe en в‚¬. | `app/(dashboard)/gastos/page.tsx` | `PENDING` | `/galeria/gastos` |
| `GAS-06` | Hoja de detalle de gasto (`<Sheet>`): muestra importe grande, datos completos, visor `<ArchivoViewer />` con descarga/ampliaciГіn si hay foto o PDF, y botГіn В«Cambiar datosВ». | `app/(dashboard)/gastos/page.tsx`, `components/ui/ArchivoViewer.tsx` | `PENDING` | `/galeria/gastos?state=detalle` |
| `GAS-07` | Permisos de borrado de gasto: el botГіn В«Borrar este gastoВ» (con confirmaciГіn en 2 toques y limpieza del archivo en Storage) es visible **solo para `dueno`**. `manager` y `jefe_obra` pueden crear y editar, pero no borrar. | `app/(dashboard)/gastos/page.tsx` | `PENDING` | `/galeria/gastos?state=detalle` |
| `GAS-08` | Subida segura al editar/crear gasto: si falla el `INSERT` o `UPDATE` en base de datos despuГ©s de subir un archivo a Storage, elimina el archivo reciГ©n subido para no dejar huГ©rfanos; al reemplazar adjunto en ediciГіn, borra el antiguo. | `app/(dashboard)/gastos/page.tsx` | `PENDING` | RevisiГіn de cГіdigo |

---

## 6. Dinero de la Obra (`/dinero`) (`DIN-*`)

| ID | Requisito / Comportamiento esperado | Ruta / Componente v2 | Estado | Evidencia / VerificaciГіn |
| :--- | :--- | :--- | :--- | :--- |
| `DIN-01` | Resumen financiero en `/dinero` adaptado por rol: el `dueno` ve la tarjeta principal con Cobrado del cliente, Gastado en la obra y Balance (`cobrado + recibidoObra - gastado`), mГЎs la tarjeta В«El encargado tiene en manoВ» (`recibidoObra - gastadoEncargado`). `manager` y `jefe_obra` ven como tarjeta principal В«Tienes en mano para la obraВ» (`recibidoObra - gastadoEncargado`) y no ven los cobros del cliente. | `app/(dashboard)/dinero/page.tsx` | `PENDING` | `/galeria/dinero`, `/galeria/dinero?actor=jefe_obra` |
| `DIN-02` | Botones de acciГіn en `/dinero`: В«Apuntar cobro de clienteВ» visible **solo para `dueno`**; В«Apuntar dinero para la obraВ» visible para `dueno`, `manager` y `jefe_obra`. | `app/(dashboard)/dinero/page.tsx` | `PENDING` | `/galeria/dinero` |
| `DIN-03` | Formulario de movimiento en `<Sheet>`: importe (> 0 y <= 10.000.000), fecha, forma de pago (`efectivo` / `transferencia` / `bizum` / `otro`), nota opcional y justificante opcional (foto comprimida o PDF hasta 15 MB). | `app/(dashboard)/dinero/page.tsx` | `PENDING` | `/galeria/dinero?state=nuevo` |
| `DIN-04` | Lista de movimientos en `/dinero`: el `dueno` tiene filtro (`Todos` / `Cobros` / `Para la obra`); `manager` y `jefe_obra` ven solo los movimientos `entrega_obra`. Cada fila permite ver el justificante (`ArchivoViewer`) y editar (`Pencil`). | `app/(dashboard)/dinero/page.tsx` | `PENDING` | `/galeria/dinero` |
| `DIN-05` | Permiso de borrado en `/dinero`: el botГіn de papelera (`Trash2`) para borrar un movimiento (y su justificante en Storage) es visible **solo para `dueno`**. | `app/(dashboard)/dinero/page.tsx` | `PENDING` | `/galeria/dinero` |

---

## 7. PlanificaciГіn y Diagrama de Gantt (`/planificacion`) (`PLA-*`)

| ID | Requisito / Comportamiento esperado | Ruta / Componente v2 | Estado | Evidencia / VerificaciГіn |
| :--- | :--- | :--- | :--- | :--- |
| `PLA-01` | Cabecera de `/planificacion`: porcentaje de avance ponderado (`avanceObra(tareas)`), presupuesto total en в‚¬ y contadores de tareas (`hecha`, `en_marcha`, `retrasada`, `pendiente`). | `app/(dashboard)/planificacion/page.tsx` | `PENDING` | `/galeria/planificacion` |
| `PLA-02` | Diagrama `<Gantt />` sin scroll horizontal: barras posicionadas en porcentaje (`0..100%`) mediante `posicionBarra(t, rango)` y lГ­nea vertical de В«HoyВ» (`posicionHoy`). Al tocar una tarea se abre `<TareaForm />` para editarla. | `components/planificacion/Gantt.tsx` | `PENDING` | `/galeria/planificacion` (`320`, `375`, `1280`) |
| `PLA-03` | Formulario `<TareaForm />` en `<Sheet>`: tГ­tulo, capГ­tulo opcional, presupuesto en в‚¬, cantidad/unidad opcional, fecha inicio y fin (`fin >= inicio`), deslizador de `avance` (`0..100%` de 5 en 5 con botones rГЎpidos `0%`, `25%`, `50%`, `75%`, `100%`) y notas. BotГіn de borrar tarea visible **solo si `puedeBorrar` (`esDueno`)**. | `components/planificacion/TareaForm.tsx` | `PENDING` | `/galeria/planificacion?state=editar-tarea` |
| `PLA-04` | Importador de Excel (`<ImportarExcel />`): descarga de `/plantilla-plan-obra.xlsx`, lectura en el navegador con `leerExcelPlanificacion(buf)` (`lib/importar-excel.ts`), vista previa de capГ­tulos/importe/fechas y opciones В«AГ±adir a las que hayВ» o В«Sustituir todasВ» (sustituir todas disponible **solo para `dueno`**). | `components/planificacion/ImportarExcel.tsx` | `PENDING` | `/galeria/planificacion?state=importar-excel` |
| `PLA-05` | SincronizaciГіn automГЎtica del avance con la portada: cualquier cambio en `tareas_obra` actualiza el avance en `/` y en `avance_obra(o_id)`. | `lib/gantt.ts`, `app/(dashboard)/planificacion/page.tsx` | `PENDING` | Pruebas unitarias `test-gantt.ts` + `test-importar-excel.ts` |
| `PLA-06` | Estado vacГ­o de `/planificacion`: ofrece crear la primera tarea a mano o importar desde Excel. | `app/(dashboard)/planificacion/page.tsx` | `PENDING` | `/galeria/planificacion?state=vacio` |

---

## 8. VehГ­culos (`/vehiculos`) (`VEH-*`)

| ID | Requisito / Comportamiento esperado | Ruta / Componente v2 | Estado | Evidencia / VerificaciГіn |
| :--- | :--- | :--- | :--- | :--- |
| `VEH-01` | Lista de vehГ­culos de la empresa en `/vehiculos` (accesible tambiГ©n para `trabajador` si `modulos.vehiculos`): muestra nombre, matrГ­cula, km actuales (`km_actual`), estado (В«LibreВ» en verde o В«Lo lleva {quien}В» en amarillo) y botГіn В«CogerВ» o В«DevolverВ». | `app/(dashboard)/vehiculos/page.tsx` | `PENDING` | `/galeria/vehiculos` |
| `VEH-02` | Flujo de В«CogerВ» y В«DevolverВ» vehГ­culo en `<Sheet>`: al coger pide quiГ©n lo coge (autocompletado con nombre del trabajador), km al salir (sugiere `km_actual`), obra y nota; al devolver pide km al volver (valida `kmFin >= km_inicio`) y actualiza `vehiculos.km_actual`. | `app/(dashboard)/vehiculos/page.tsx` | `PENDING` | `/galeria/vehiculos?state=coger` |
| `VEH-03` | Crear/editar vehГ­culo en `/vehiculos`: visible para `gestiona` (`dueno`, `manager`, `jefe_obra`). Borrar vehГ­culo visible **solo para `dueno`** y bloqueado si tiene un uso abierto. | `app/(dashboard)/vehiculos/page.tsx` | `PENDING` | `/galeria/vehiculos` |
| `VEH-04` | Historial de usos y combustible por vehГ­culo: desplegable В«Ver usosВ» con los Гєltimos recorridos (`km_inicio в†’ km_fin`, diferencia de km, quiГ©n y fecha) y total gastado en combustible vinculado a ese vehГ­culo en la obra actual. | `app/(dashboard)/vehiculos/page.tsx` | `PENDING` | `/galeria/vehiculos` |

---

## 9. Notas (`/notas`) (`NOT-*`)

| ID | Requisito / Comportamiento esperado | Ruta / Componente v2 | Estado | Evidencia / VerificaciГіn |
| :--- | :--- | :--- | :--- | :--- |
| `NOT-01` | Lista de notas de la obra en `/notas`: ordenadas con las fijadas (`fijada === true`) primero y luego por fecha descendente. | `app/(dashboard)/notas/page.tsx` | `PENDING` | `/galeria/notas` |
| `NOT-02` | Crear nota en `<Sheet>`: tГ­tulo, texto obligatorio y autor opcional. | `app/(dashboard)/notas/page.tsx` | `PENDING` | `/galeria/notas?state=nueva` |
| `NOT-03` | Fijar / desfijar nota (`Pin`) con un toque. | `app/(dashboard)/notas/page.tsx` | `PENDING` | `/galeria/notas` |
| `NOT-04` | Borrar nota (`Trash2`) con un toque. | `app/(dashboard)/notas/page.tsx` | `PENDING` | `/galeria/notas` |

---

## 10. Resumen Mensual (`/resumen`) (`RES-*`)

| ID | Requisito / Comportamiento esperado | Ruta / Componente v2 | Estado | Evidencia / VerificaciГіn |
| :--- | :--- | :--- | :--- | :--- |
| `RES-01` | Selector de mes (`shiftMonth(mes, -1 | 1)`) y tarjetas de totales del mes (Horas, Coste mano de obra, Gastos con `suma()` en cГ©ntimos y Total mes). | `app/(dashboard)/resumen/page.tsx` | `PENDING` | `/galeria/resumen` |
| `RES-02` | ExportaciГіn a Excel (`exportarResumenExcel` cargado con `import()` dinГЎmico al pulsar el botГіn): genera el archivo `.xlsx` con las hojas del mes (Resumen, Mano de obra, Fichajes detallados, Gastos). | `app/(dashboard)/resumen/page.tsx`, `lib/exportar-excel.ts` | `PENDING` | `/galeria/resumen` + verificaciГіn de bundle en `metricas.md` |
| `RES-03` | Tabla В«Por trabajadorВ» en `/resumen` (si `modulos.horas`): dГ­as, horas, в‚¬/h, coste total e insignia В«{n} corregido(s)В» si tiene dГ­as con `corregido_por_dueno`. | `app/(dashboard)/resumen/page.tsx` | `PENDING` | `/galeria/resumen` |
| `RES-04` | Bloque В«DГ­as corregidos por el dueГ±oВ» en `/resumen`: lista auditable de cada correcciГіn del mes con fecha, trabajador, horas resultantes e historial `antes в†’ despuГ©s` o cambio de obra. | `app/(dashboard)/resumen/page.tsx` | `PENDING` | `/galeria/resumen` |
| `RES-05` | Desgloses de gastos en `/resumen` (si `modulos.gastos`): В«Gastos por tipoВ» (con barra de porcentaje), В«Gastos por proveedorВ» (con subtotales de facturas y tickets) y В«Gastos por forma de pagoВ» (`PagГі el encargado` vs `PagГі el dueГ±o` y mГ©todo). | `app/(dashboard)/resumen/page.tsx` | `PENDING` | `/galeria/resumen` |

---

## 11. Ajustes (`/ajustes`) (`AJU-*`, `AJU-W1`)

| ID | Requisito / Comportamiento esperado | Ruta / Componente v2 | Estado | Evidencia / VerificaciГіn |
| :--- | :--- | :--- | :--- | :--- |
| `AJU-01` | Selector de idioma (`SelectorIdioma`) en `/ajustes` visible para todos los roles. | `app/(dashboard)/ajustes/page.tsx` | `PENDING` | `/galeria/ajustes` |
| `AJU-02` | `<ConfigurarObra />` (visible si `gestiona`): editar nombre y direcciГіn de la obra, marcar como В«En cursoВ» o В«TerminadaВ» (`activa`), activar/desactivar los 6 mГіdulos (`horas`, `gastos`, `dinero`, `planificacion`, `vehiculos`, `notas`) y subir/eliminar planos y fotos de la obra. | `components/ajustes/ConfigurarObra.tsx` | `PENDING` | `/galeria/ajustes` |
| `AJU-03` | `<Accesos />` вЂ” Invitaciones por cГіdigo de 6 letras (visible para `dueno` y `manager`): generar cГіdigo para `trabajador`, `jefe_obra` o `manager` (el `manager` no puede crear cГіdigos de `manager`), copiar mensaje para WhatsApp y borrar cГіdigos pendientes. | `components/ajustes/Accesos.tsx` | `PENDING` | `/galeria/ajustes` |
| `AJU-04` | `<Accesos />` вЂ” InvitaciГіn por correo a otra empresa (`invitaciones_empresa`, visible **solo para `dueno`**): permite invitar como `manager` o `jefe_obra` a alguien que ya usa la app en otra empresa. | `components/ajustes/Accesos.tsx` | `PENDING` | `/galeria/ajustes` |
| `AJU-05` | `<Accesos />` вЂ” Solicitudes pendientes de aprobaciГіn (`miembros` con `rol === "pendiente"`): aprobar eligiendo rol y obras asignadas (`todas` o selecciГіn) o rechazar. | `components/ajustes/Accesos.tsx` | `PENDING` | `/galeria/ajustes?state=solicitudes` |
| `AJU-06` | `<Accesos />` вЂ” Lista de personas con acceso: cambiar rol, activar/bloquear (`activo`), cambiar obras asignadas (`todas` o selecciГіn de obras) y quitar acceso (protegiendo siempre la cuenta del `dueno`). | `components/ajustes/Accesos.tsx` | `PENDING` | `/galeria/ajustes` |
| `AJU-07` | `<SoporteAcceso />` (visible **solo para `dueno`**): abrir acceso temporal al soporte tГ©cnico (motivo + duraciГіn `2h`/`6h`/`24h`/`72h`), ver quiГ©n entrГі y cortar el acceso en el acto (`revocado_en`). Sin errores de pureza en render (`Date.now()`). | `components/ajustes/SoporteAcceso.tsx` | `PENDING` | `/galeria/ajustes` |
| `AJU-08` | `<EliminarObra />` (visible **solo para `dueno`**): borrado definitivo de la obra actual (archivos en Storage + fila en `obras` con cascada) exigiendo escribir el nombre exacto de la obra. | `components/ajustes/EliminarObra.tsx` | `PENDING` | `/galeria/ajustes` |
| `AJU-09` | Cuenta del usuario en `/ajustes`: muestra correo actual, formulario desplegable В«Cambiar contraseГ±aВ» (`supabase.auth.updateUser`) y botГіn В«Cerrar sesiГіnВ». | `app/(dashboard)/ajustes/page.tsx` | `PENDING` | `/galeria/ajustes` |
| `AJU-W1` | Vista de `/ajustes` para `trabajador`: muestra Гєnicamente Idioma (`AJU-01`) y Cuenta (`AJU-09`), ocultando configuraciГіn de obra, accesos, soporte y borrado de obra. | `app/(dashboard)/ajustes/page.tsx` | `PENDING` | `/galeria/ajustes?actor=trabajador` |

---

## 12. AdministraciГіn de Plataforma (`/admin`) (`ADM-*`) y Plataforma (`PLT-*`)

| ID | Requisito / Comportamiento esperado | Ruta / Componente v2 | Estado | Evidencia / VerificaciГіn |
| :--- | :--- | :--- | :--- | :--- |
| `ADM-01` | VerificaciГіn `es_admin_plataforma()` en `/admin`: si no es administrador de plataforma muestra pantalla В«Sin permisoВ» con enlace para volver a `/`. | `app/admin/page.tsx` | `PENDING` | `/galeria/admin?state=sin-permiso` |
| `ADM-02` | GeneraciГіn y gestiГіn de cГіdigos de alta de 8 letras en `/admin`: crear cГіdigo (nombre de empresa, nota, dГ­as pagados por defecto 30), copiar mensaje y cancelar cГіdigos sin usar (`cancelar_codigo_alta`). | `app/admin/page.tsx` | `PENDING` | `/galeria/admin` |
| `ADM-03` | GestiГіn de empresas en `/admin`: listado con estado (`Activa` / `Caducada`), miembros, obras y ediciГіn de fecha `pagado_hasta` con motivo obligatorio (`poner_fecha_pago_empresa`). | `app/admin/page.tsx` | `PENDING` | `/galeria/admin` |
| `ADM-04` | Sesiones de soporte abiertas (`entrar_como_soporte`) y registro de los Гєltimos 50 errores (`ultimos_errores`) en `/admin`. | `app/admin/page.tsx` | `PENDING` | `/galeria/admin` |
| `PLT-01` | PWA instalable (`public/manifest.webmanifest`, `public/sw.js`, `ServiceWorkerRegister.tsx`, iconos en `public/icons/*` actualizados a la nueva identidad v2). | `public/manifest.webmanifest`, `public/sw.js`, `app/layout.tsx` | `PENDING` | VerificaciГіn de build y manifest |
| `PLT-02` | Captura global de errores en cliente (`instrumentation-client.ts`, `app/error.tsx`, `app/global-error.tsx`) y servidor (`instrumentation.ts`) hacia `errores_app`. | `lib/errores.ts`, `app/error.tsx`, `app/global-error.tsx` | `PENDING` | RevisiГіn de mГіdulos dorados |
| `PLT-03` | InternacionalizaciГіn completa `es` / `uk` / `en` sin una sola cadena visible sin traducir (`node scripts/claves-i18n.js` reporta 0 faltantes en `uk` y `en`). | `lib/i18n/*` | `PENDING` | EjecuciГіn de `node scripts/claves-i18n.js` |
| `PLT-04` | Paso del 100% de los tests unitarios deterministas (`test-horas.ts`, `test-dinero.ts`, `test-fechas.ts`, `test-gantt.ts`, `test-importar-excel.ts`). | `scripts/test-*.ts` | `PENDING` | EjecuciГіn con `npx tsx` |
| `PLT-05` | GalerГ­a interactiva de verificaciГіn `/galeria` y `/galeria/[screen]` protegida por `NEXT_PUBLIC_GALERIA=1` (devuelve `notFound()` si no estГЎ activa), con conmutador en vivo de idioma (`es`/`uk`/`en`), rol (`dueno`/`manager`/`jefe_obra`/`trabajador`), mГіdulos, estado (`populated`/`empty`/`loading`/`error`/`offline`) y ancho de marco (`320`/`375`/`430`/`768`/`1280`), 100% en memoria con cero llamadas de red. | `app/galeria/page.tsx`, `app/galeria/[screen]/page.tsx`, `lib/galeria-fixtures.ts` | `PENDING` | VerificaciГіn en navegador y Playwright |
| `PLT-06` | Cumplimiento estricto de contraste diurno WCAG AA/AAA, objetivos tГЎctiles >= 44x44 px y cero desbordamiento horizontal en `320`, `375`, `430`, `768` y `1280` en los 3 idiomas. | `app/globals.css`, sistema de diseГ±o v2 | `PENDING` | Reporte en `ENTREGA/metricas.md` |
