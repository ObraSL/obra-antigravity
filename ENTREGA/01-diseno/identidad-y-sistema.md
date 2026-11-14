# Control de Obra v2 — Identidad de Marca y Sistema de Diseño (`01-diseno/identidad-y-sistema.md`)

---

## 1. Concepto Rector (En una frase)

> **«Precisión de instrumento arquitectónico para el barro de la obra: superficies minerales de alto contraste solar combinadas con paneles tácticos en pizarra profunda y señales en lima eléctrico que permiten fichar, auditar gastos y leer el avance en menos de dos segundos.»**

---

## 2. Los 3 Momentos Firma (Signature Moments)

1. **El Sello Táctico de Fichaje en 2 Segundos (`Tactical Stamp Control`)**:
   - En lugar de pequeños botones convencionales, `MiFichaje` y cada tarjeta de trabajador en `/fichajes` presentan una consola de doble sello táctil de **60 px de altura** con tipografía monoespaciada tabular, indicador de precisión GPS (`±8m`) y estados físicos inequívocos:
     - **Entrada activa**: botón en **Lima Señal (`#D4E565`)** con tinta carbón (`#141915`, contraste **11.6:1 AAA**).
     - **Sello ya estampado**: bloqueado con borde sólido esmeralda (`#15803D` / `#4ADE80`) o terracota (`#C2410C`), ligera impronta de sello y hora certificada por el servidor.
     - **En cola sin cobertura (`offline`)**: pulso ámbar táctico con etiqueta `Enviando…` y cinta de resguardo local.
2. **Telemetría de Avance por Ecualizador Vertical (`Equalizer Telemetry Card`)**:
   - Inspirado en la dirección visual elegida por María (pero rediseñado desde cero con geometría CSS pura sin imágenes pesadas), el panel hero de Inicio y Planificación está construido sobre un bloque **Deep Architectural Slate (`#1E2520`)** que muestra el porcentaje de avance en tipografía display/mono de gran calibre acompañado de una matriz de **24 barras verticales tipo ecualizador**.
   - Cada barra representa un tramo del presupuesto o uno de los últimos 14 días de actividad: las barras completadas brillan en **Lima Señal (`#D4E565`)**, las activas en **Esmeralda (`#34D399`)**, las retrasadas en **Coral (`#F87171`)** y las pendientes en pizarra translúcida.
3. **Cronograma Escalonado con Láser «Hoy» y Libro Mayor al Céntimo (`Stepped Milestone Gantt & Cents Ledger`)**:
   - El diagrama de Gantt en `/planificacion` y el mini-Gantt de portada eliminan por completo el scroll horizontal pintando barras escalonadas en porcentaje (`0..100%`) con una **línea láser vertical para «Hoy»** coronada por una cápsula indicadora.
   - Los bloques financieros (`/`, `/dinero`, `/gastos`, `/resumen`) emplean alineación tabular estricta (`font-variant-numeric: tabular-nums`) y píldoras de estado semánticas para distinguir al instante qué pagó el dueño, qué pagó el encargado y qué tiene en mano.

---

## 3. Principios de Diseño (Anti-Slop & Ergonomía de Obra)

1. **Legibilidad bajo Sol Directo (Daylight First)**:
   - Un teléfono en una obra a las 13:00 en España sufre reflejos extremos. Por ello combinamos un lienzo base claro en **Piedra Salvia Mineral (`#F2F4F0`)** y tarjetas en **Blanco Puro (`#FFFFFF`)** con tinta **Carbón Pizarra (`#141915`, contraste 18.1:1)**, reservando los bloques oscuros **Pizarra Profunda (`#1E2520`)** para las tarjetas hero de mando y la barra flotante inferior, donde el texto blanco hueso (`#F7F9F5`) alcanza **14.2:1 AAA**.
2. **Ergonomía de Pulgar con Una Sola Mano (One-Handed Thumb Zone)**:
   - Todas las acciones primarias viven en el tercio inferior de la pantalla o en hojas inferiores (`<Sheet>`) cuyo botón principal permanece siempre visible por encima del teclado virtual incluso en un iPhone SE (`320×568`).
   - Ningún área táctil baja de `44×44 px`; los botones de fichar alcanzan `60 px` de altura.
3. **Resiliencia Multilingüe (`ES` / `UK` / `EN`) y Cero Desbordamiento**:
   - Las cadenas en ucraniano (cirílico) son hasta un **32% más largas** que en español (p. ej. `Відхилити` vs `Rechazar`, `Надіслати запрошення` vs `Invitar`, `Загалом за місяць` vs `Total mes`).
   - Todos los contenedores flexibles llevan `min-w-0`, los botones permiten envoltura controlada o truncado con `title`/`aria-label`, y está prohibido fijar anchos rígidos en píxeles para etiquetas de texto.
4. **Cero Ruido Decorativo**:
   - Sin fotos de stock, sin avatares falsos, sin sombras difusas genéricas ni gradientes neón. Cada línea, borde de `1px` y color comunica un estado real de la base de datos.

---

## 4. Propuesta de Emblema y Marca (`Logo.tsx`)

Mantenemos la geometría icónica de vigas estructurales de Control de Obra para preservar el reconocimiento de la marca, pero refinamos su proporción y le añadimos un **nodo de plomada / nivel láser en Lima Señal (`#D4E565`)** en el vértice superior cuando se muestra sobre superficies oscuras o en el icono de la app (`public/icons/*`), simbolizando precisión milimétrica en obra:

```svg
<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Marco de viga en A estructural -->
  <path d="M14 72 L50 16 L86 72" stroke="currentColor" stroke-width="13" stroke-linejoin="miter" stroke-linecap="butt" />
  <!-- Viga de cimentación desplazada -->
  <path d="M34 88 L94 88" stroke="currentColor" stroke-width="13" stroke-linecap="butt" />
  <!-- Travesaño de nivel -->
  <path d="M31 52 L69 52" stroke="currentColor" stroke-width="10" stroke-linecap="butt" opacity="0.85" />
</svg>
```

---

## 5. Tokens de Color y Tabla de Contraste WCAG 2.1

Todos los tokens se definen en `app/globals.css` dentro de `@theme` manteniendo compatibilidad semántica con las utilidades de la aplicación y añadiendo los nuevos tokens tácticos:

| Token CSS (`@theme`) | Valor Hex | Uso en la Interfaz | Par de Contraste Evaluado | Ratio WCAG | Nivel |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `--color-obra-bg` | `#F2F4F0` | Fondo general de la app (Piedra Salvia Mineral) | `#141915` sobre `#F2F4F0` | **16.4 : 1** | **AAA** |
| `--color-obra-bg-elevated` | `#FFFFFF` | Hojas modales (`Sheet`), barra lateral y paneles elevados | `#141915` sobre `#FFFFFF` | **18.1 : 1** | **AAA** |
| `--color-obra-card` | `#FFFFFF` | Superficie de tarjetas estándar | `#141915` sobre `#FFFFFF` | **18.1 : 1** | **AAA** |
| `--color-obra-card-border` | `#D5DDD6` | Borde estructural de tarjetas (`1px solid`) | — (Borde estructural) | — | — |
| `--color-obra-line` | `#C6D0C8` | Líneas divisorias, bordes de inputs y pistas vacías | — (Divisor estructural) | — | — |
| `--color-obra-slate` | `#1E2520` | Superficie táctica oscura (Hero de avance, cabecera login/alta) | `#F7F9F5` sobre `#1E2520` | **14.2 : 1** | **AAA** |
| `--color-obra-slate-card` | `#28312B` | Sub-tarjetas dentro del bloque pizarra oscuro | `#F7F9F5` sobre `#28312B` | **11.8 : 1** | **AAA** |
| `--color-obra-slate-border` | `#39463D` | Bordes sutiles dentro de bloques pizarra oscuros | — | — | — |
| `--color-obra-text` | `#141915` | Texto principal e importes sobre fondo claro | Sobre `#FFFFFF` / `#F2F4F0` | **18.1 : 1** / **16.4 : 1** | **AAA** |
| `--color-obra-text-dim` | `#3F4B42` | Texto secundario, etiquetas de campo y subtítulos | Sobre `#FFFFFF` / `#F2F4F0` | **8.9 : 1** / **8.1 : 1** | **AAA** |
| `--color-obra-text-faint` | `#566459` | Metadatos, pistas y fechas secundarias (subido de tono respecto a v1 para cumplir AA holgado) | Sobre `#FFFFFF` / `#F2F4F0` | **5.9 : 1** / **5.3 : 1** | **AA** |
| `--color-obra-yellow` *(Signal Lime)* | `#D4E565` | Acción primaria (CTA), sello activo en barra oscura, barras completadas en ecualizador | `#141915` sobre `#D4E565` | **11.6 : 1** | **AAA** |
| `--color-obra-yellow-dim` | `#B8C758` | Estado deshabilitado del botón primario | `#141915` sobre `#B8C758` | **8.6 : 1** | **AAA** |
| `--color-obra-yellow-ink` | `#141915` | Tinta oscura sobre botón primario Lima Señal | Sobre `#D4E565` | **11.6 : 1** | **AAA** |
| `--color-obra-accent-ink` | `#365314` | Texto de acento o enlaces accionables sobre fondo blanco/claro | `#365314` sobre `#FFFFFF` | **8.4 : 1** | **AAA** |
| `--color-obra-orange` | `#C2410C` | Sello de `Salida`, avisos de soporte y alertas medias | `#C2410C` sobre `#FFFFFF` | **5.2 : 1** | **AA** |
| `--color-obra-green` | `#15803D` | Sello de `Entrada` fichada, cobros, estado «Libre» / «En curso» sobre fondo claro | `#15803D` sobre `#FFFFFF` | **5.1 : 1** | **AA** |
| `--color-obra-red` | `#B91C1C` | Botón de peligro (`DangerButton`), retrasos y deudas | `#FFFFFF` sobre `#B91C1C` | **6.4 : 1** | **AA** |
| `--color-obra-red-bg` | `#FEE2E2` | Fondo de alertas de error y confirmación de borrado | `#991B1B` sobre `#FEE2E2` | **7.1 : 1** | **AAA** |
| `--color-obra-red-text` | `#991B1B` | Texto de error sobre fondos claros o `--color-obra-red-bg` | Sobre `#FFFFFF` / `#FEE2E2` | **8.2 : 1** / **7.1 : 1** | **AAA** |
| `--color-obra-nav-bg` | `#181E1A` | Barra de navegación inferior flotante (`BottomNav`) | `#D4E565` / `#F7F9F5` sobre `#181E1A` | **11.9 : 1** / **15.1 : 1** | **AAA** |
| `--color-obra-nav-border` | `#2E3831` | Borde de la cápsula de navegación inferior | — | — | — |

> **Nota crítica de accesibilidad**: En v1, `--color-obra-text-faint` (`#a79f8c` sobre `#f7f3ec`) tenía un ratio de solo **2.35:1** (fallaba WCAG AA) y `--color-obra-yellow` (`#f2851b` con texto blanco `#ffffff`) tenía **2.45:1**. En v2 hemos corregido ambos: `--color-obra-text-faint` sube a `#566459` (**5.3:1 AA**) y el botón primario usa `#D4E565` con tinta oscura `#141915` (**11.6:1 AAA**), garantizando lectura perfecta bajo el sol.

---

## 6. Sistema Tipográfico y Prueba de Estrés en 3 Idiomas (`ES` / `UK` / `EN`)

### 6.1 Familias Tipográficas (Cargadas con `next/font/google` con subconjunto `latin` + `cyrillic`)
1. **`--font-display` (`Barlow Condensed`, pesos 600, 700, 800)**:
   - Cabeceras de sección, títulos de hojas modales (`Sheet`) y emblemas de estado. Condensada y vertical, permite que títulos largos en ucraniano e inglés quepan en una sola línea en `320px`.
2. **`--font-body` (`Inter`, pesos 400, 500, 600, 700)**:
   - Texto de interfaz, formularios, etiquetas, notas y tablas, con soporte nativo cirílico impecable.
3. **`--font-mono-obra` (`JetBrains Mono`, pesos 500, 600, 700)**:
   - Horas (`08:02 → 17:15`), importes en euros (`14.280,50 €`), porcentajes de avance (`64,25%`), códigos de invitación (`K7M9P2`), matrículas (`4521-KLP`) y coordenadas GPS (`±6m`). Siempre con `font-variant-numeric: tabular-nums`.

### 6.2 Escala Tipográfica Fluida y Reglas de Truncado

| Nivel | Rol | Tamaño / Línea | Peso | Regla Multilingüe (`320px`) |
| :--- | :--- | :--- | :--- | :--- |
| `Hero Metric` | Porcentaje de avance / Importe principal | `clamp(2rem, 6vw, 2.75rem)` / `1.0` | `700` (`font-mono-obra`) | `tabular-nums`, `tracking-tight`, nunca se corta (`shrink-0`). |
| `H1 Obra` | Nombre de la obra en cabecera | `clamp(1.35rem, 4.5vw, 1.75rem)` / `1.15` | `800` (`font-display uppercase`) | `break-words` hasta 2 líneas; en `TopBar` usa `truncate` con `min-w-0`. |
| `H2 Sheet / Page` | Títulos de pantalla y hojas `<Sheet>` | `1.375rem` (`22px`) / `1.2` | `700` (`font-display uppercase`) | `min-w-0 flex-1 pr-2` junto al botón de cerrar. |
| `Section Header` | Cabecera de bloque (`HORAS Y COSTE...`) | `0.75rem` (`12px`) / `1.3` | `700` (`uppercase tracking-wider`) | Permite salto de línea limpio si supera el ancho en `320px`. |
| `Body Primary` | Nombres de trabajadores, conceptos, inputs | `0.9375rem` (`15px`) / `1.4` | `600` (`font-body`) | En inputs `>= 16px` en móvil o con `maximum-scale` controlado para evitar auto-zoom de iOS Safari. |
| `Body Secondary` | Subtítulos, oficios, proveedores, notas | `0.8125rem` (`13px`) / `1.4` | `500` (`font-body`) | Color `--color-obra-text-dim`. |
| `Caption / Badge` | Insignias (`Factura`, `Corregido`, `GPS ±8m`) | `0.6875rem` (`11px`) / `1.2` | `700` (`uppercase`) | `inline-flex items-center gap-1 rounded-full px-2 py-0.5`. |

### 6.3 Prueba con las Cadenas Reales Más Largas (`ES` / `UK` / `EN`)

| Contexto | Español (`es`) | Ucraniano (`uk` — Cirílico) | Inglés (`en`) | Solución de Layout en `320px` |
| :--- | :--- | :--- | :--- | :--- |
| Botón borrar en 2 toques (`FIC-20`) | `Toca otra vez: Alejandro Gómez-astrana no cuenta este día` (58 car.) | `Натисніть ще раз: Alejandro Gómez-astrana не враховується в цей день` (69 car.) | `Tap again: Alejandro Gómez-astrana does not count this day` (59 car.) | El botón usa `whitespace-normal text-center leading-snug py-3 px-3` (nunca `whitespace-nowrap`). |
| Cinta de soporte (`SHL-06`) | `El soporte técnico tiene permiso para entrar en tu empresa (1 persona dentro ahora)` | `Техпідтримка має дозвіл на вхід у вашу компанію (зараз усередині: 1)` | `Technical support has permission to access your company (1 person inside now)` | Layout apilado en móvil (`flex-col sm:flex-row sm:items-center`) con botón `Cortar acceso ahora` de ancho completo en `320px`. |
| Etiqueta de módulo (`AJU-02`) | `Planificación (Gantt y capítulos de obra)` | `Планування (діаграма Ганта та розділи об'єкта)` | `Planning (Gantt chart and site chapters)` | Fila `flex items-start justify-between gap-3`: texto en `min-w-0 flex-1` y switch/checkbox en `shrink-0`. |
| Filtro de gastos (`GAS-02`) | `Pagó el encargado` / `Pagó el dueño` | `Оплатив виконроб` / `Оплатив власник` | `Paid by foreman` / `Paid by owner` | Contenedor de filtros con `flex-wrap gap-1.5` (sin carruseles horizontales ocultos). |

---

## 7. Espaciado, Radios, Elevación y Especificación de Componentes

### 7.1 Geometría y Espaciado
- **Contenedor principal del panel**: `max-w-3xl mx-auto px-3.5 sm:px-6 pb-[calc(6.5rem+env(safe-area-inset-bottom))]`.
- **Radios de borde**:
  - Tarjetas hero y contenedores principales: `rounded-[22px]` (`22px`).
  - Tarjetas operativas estándar (`Card`): `rounded-2xl` (`16px`).
  - Botones primarios, inputs y sellos (`PrimaryButton`, `Input`, `StampButton`): `rounded-xl` (`12px`).
  - Barra inferior flotante (`BottomNav`) e insignias de estado: `rounded-full`.
- **Sombras y Bordes**:
  - Superficies claras: borde nítido `1px solid var(--color-obra-card-border)` + sombra direccional muy sutil `0 2px 10px rgba(20, 25, 21, 0.05)`.
  - Superficies tácticas oscuras (`--color-obra-slate`): borde `1px solid var(--color-obra-slate-border)` + sombra `0 12px 28px rgba(15, 20, 16, 0.22)`.

### 7.2 Catálogo de Componentes Base (`components/ui/*`)
1. **`PrimaryButton`**: Fondo `--color-obra-yellow` (`#D4E565`), texto `--color-obra-yellow-ink` (`#141915`), borde sutil `1px solid rgba(20,25,21,0.12)`, altura mínima `48px` (`py-3 px-4`), peso `700`, transición de brillo y escala activa (`active:scale-[0.99]`).
2. **`GhostButton` / `DangerButton` / `IconButton`**:
   - `IconButton` garantiza `min-h-[44px] min-w-[44px]` (`h-11 w-11`) para cumplir holgadamente el estándar táctil de `44×44 px` en toda la aplicación (en v1 era `h-10 w-10` = `40px`, lo que quedaba justo en el límite; en v2 lo subimos a `44px`).
3. **`StampButton` (Rediseñado para el Momento Firma #1)**:
   - Altura mínima `60px`, diseño de sello táctico con indicador superior de estado, etiqueta en mayúsculas y hora en `font-mono-obra text-base font-bold`.
4. **`BarrasProgreso` (Rediseñado para el Momento Firma #2)**:
   - Barras verticales tipo ecualizador con transición cromática desde pizarra salvia hasta Lima Señal (`#D4E565`) y Esmeralda (`#22C55E`), con cápsulas de valor máximo y mínimo.
5. **`Sheet` (Hoja modal inferior adaptada a teclado móvil)**:
   - En móvil se ancla abajo (`items-end`) con `max-h-[90dvh]`, cabecera sticky con el título y botón de cierre de `44×44 px`, y cuerpo con scroll suave + `pb-[calc(1.25rem+env(safe-area-inset-bottom))]` para que el botón de guardar quede siempre accesible en `320×568`.
