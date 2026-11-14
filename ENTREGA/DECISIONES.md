# Registro de Decisiones de Arquitectura y Diseño (`DECISIONES.md`)

> **Propósito**: Registro determinista de las decisiones tomadas durante la construcción de Control de Obra v2, su motivación técnica y las alternativas descartadas.

---

## DEC-01: Identidad Visual «Tactical Architectural Slate & Signal Lime» (Inspiración Dribbble + Legibilidad Solar AAA)
- **Estado**: `FROZEN_APPROVED`
- **Contexto**: La clienta (María) proporcionó como referencia visual el diseño *Construction Management App UI* (`https://dribbble.com/shots/27875610-Construction-Management-App-UI`), caracterizado por tonos pizarra-salvia arquitectónicos (`#2D352E` / `#1C221E`), acento lima eléctrico de alta visibilidad (`#D4E565`), telemetría de progreso mediante barras verticales tipo ecualizador y cronogramas escalonados por hitos. Al mismo tiempo, las reglas `C-3` y la Fase 1 exigen:
  1. No copiar textualmente ningún diseño de terceros ni reutilizar la estética crema/naranja de v1 (`#f7f3ec` / `#f2851b`).
  2. Garantizar contraste diurno bajo luz solar directa en obra (WCAG AA >= 4.5:1 para texto normal y >= 7:1 AAA para cifras críticas, importes y sellos de fichaje).
- **Decisión**:
  - Crear el sistema de diseño original **«Arquitectura Táctica: Pizarra Mineral y Lima Señal»** (*Tactical Architectural Slate & Signal Lime*), articulado en dos superficies complementarias de alto contraste:
    - **Superficie Base Diurna (Mineral Sage Stone `#F2F4F0` y Tarjeta Blanca Pizarra `#FFFFFF`)**: optimizada para lectura bajo el sol directo en obra con tinta carbón pizarra `#141915` (contraste **16.4:1 AAA**).
    - **Superficie Táctica de Comando (Deep Architectural Slate `#1E2520` / `#28312B`)**: utilizada en la tarjeta hero de telemetría de obra, el sello maestro de fichaje, la barra de navegación flotante con cristal esmerilado y el cronograma ejecutivo, con texto blanco hueso `#F7F9F5` (contraste **13.8:1 AAA**) y acento **Signal Lime `#D4E565`** con tinta oscura `#141915` (contraste **11.6:1 AAA**).
- **Alternativas descartadas**:
  - *Todo el fondo de la aplicación en verde grisáceo medio (`#5E6860`) con texto gris claro*: descartado porque bajo el sol directo de una obra en España el contraste cae por debajo de 3.2:1, incumpliendo WCAG AA.

---

## DEC-02: Tres Momentos Firma (Signature Moments) de Control de Obra v2
- **Estado**: `FROZEN_APPROVED`
- **Decisión**:
  1. **Sello Táctico de Fichaje en 2 Segundos (`Tactical Stamp Control`)**: Botones gemelos sobredimensionados (`>= 60px` de alto) con estética de instrumento de obra: `Entrada` en Lima Señal (`#D4E565` con tinta `#141915`) y `Salida` en Ámbar Táctico (`#F59E0B` / Terracota `#E05A36`), bloqueo automático tras fichar, indicador GPS integrado y pulso ámbar cuando opera en cola sin cobertura (`offline`).
  2. **Telemetría de Avance por Ecualizador Vertical (`Equalizer Telemetry Bars`)**: Reemplaza el degradado radial de v1 por una matriz de barras verticales segmentadas de precisión (inspirada en la dirección visual elegida por María) que codifica simultáneamente el porcentaje de avance ponderado, los capítulos completados (lima `#D4E565`), en marcha (esmeralda `#22C55E`) y retrasados (coral `#EF4444`), además del medidor de 14 días de horas.
  3. **Cronograma Escalonado con Láser «Hoy» y Libro Mayor al Céntimo (`Stepped Milestone Gantt & Cents Ledger`)**: Diagrama de Gantt 100% libre de scroll horizontal con barras escalonadas por capítulos, línea vertical láser para el día de hoy (`posicionHoy`) y tarjetas financieras con tipografía monoespaciada tabular (`tabular-nums`).

---

## DEC-03: Arquitectura de Vistas Puras Desacopladas para `/galeria` (`C-5`)
- **Estado**: `FROZEN_APPROVED`
- **Contexto**: El requisito `C-5` exige que `/galeria` y `/galeria/[screen]` rendericen las vistas reales de producción alimentadas por datos en memoria (*fixtures*), con **cero llamadas de red** y conmutación instantánea de rol, idioma, módulos, estado y ancho de pantalla.
- **Decisión**:
  - Mantener intactos los proveedores globales (`MiembroProvider`, `ObraProvider`, `IdiomaProvider`) pero añadirles soporte de **hidratación por fixture en memoria** (`initialFixture`) cuando se montan dentro del contenedor de `/galeria`.
  - De este modo, las páginas y componentes de v2 son exactamente los mismos en producción y en `/galeria`, sin duplicar plantillas JSX ni arriesgar divergencias visuales.

---

## DEC-04: Corrección de Defectos de Permisos e i18n Detectados en la Auditoría de v1
- **Estado**: `FROZEN_APPROVED`
- **Decisión**:
  - Restringir el botón «Nueva obra» en `ObraPicker.tsx` a `rol === "dueno" || rol === "manager"` (`SHL-04`).
  - Restringir el botón «+ Añadir trabajador» en `/fichajes` a `rol === "dueno" || rol === "manager"` (`FIC-15`).
  - Eliminar la llamada impura a `Date.now()` durante el render en `SoporteAcceso.tsx` para cumplir con React 19 y ESLint 9.
  - Internacionalizar el 100% de las cadenas y fechas que en v1 quedaron fijas en español (`Cobrado`, `Gastado`, `Balance`, `Hasta `, `cancelado`, `localeActual()`), añadiendo sus traducciones en `lib/i18n/uk.ts` y `lib/i18n/en.ts`.
  - Cargar `lib/exportar-excel.ts` mediante `import()` dinámico en `/resumen` para sacar `exceljs` del bundle inicial (`T-36`).
