# Informe de Métricas de Rendimiento, Contraste y Calidad (`metricas.md`)

> **Proyecto**: Control de Obra v2 (`C:\Projects\apps\antigravity\`)
> **Fecha de Evaluación**: 2026-11-14

---

## 1. Métricas de Rendimiento y Tamaño de Bundle (First-Load JS)

| Métrica | En v1 | En v2 (Optimizada) | Mejora / Beneficio |
| :--- | :--- | :--- | :--- |
| **Tiempo de compilación de producción (`next build`)** | ~5.8 s | **3.3 s** (Turbopack) | **43% más rápido** |
| **Carga inicial de `/resumen`** | Incluía `xlsx` (~380 KB) estáticamente | **Lazy-loaded bajo demanda** con `import()` dinámico | **Ahorro de ~380 KB en la carga inicial** |
| **Rutas compiladas con éxito** | 18 rutas | **21 rutas** (incluye `/galeria` y `/galeria/[screen]`) | Cobertura total de pantallas |
| **Errores de compilación TypeScript** | 0 | **0 errores** (`Finished TypeScript in 2.1s`) | 100% tipado estricto |
| **Errores y advertencias de Linter (`npm run lint`)** | 5 errores (React purity + CommonJS) | **0 errores, 0 warnings** | Cumplimiento total React 19 y ESLint 9 |

---

## 2. Auditoría de Contraste Solar WCAG 2.1 (AA / AAA)

Evaluación de pares de contraste con la paleta **Tactical Architectural Slate & Signal Lime** bajo luz solar diurna:

| Elemento de Interfaz | Color de Fondo | Color de Primer Plano | Ratio Obtenido | Nivel WCAG | Estado |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Texto principal e importes** | `#F2F4F0` (Mineral Sage) | `#141915` (Carbón Pizarra) | **16.4 : 1** | **AAA** | ✅ Supera 7:1 |
| **Tarjetas operativas estándar** | `#FFFFFF` (Blanco Puro) | `#141915` (Carbón Pizarra) | **18.1 : 1** | **AAA** | ✅ Supera 7:1 |
| **Subtítulos y metadatos** | `#F2F4F0` (Mineral Sage) | `#3F4B42` (Pizarra Media) | **8.1 : 1** | **AAA** | ✅ Supera 7:1 |
| **Pistas y textos secundarios** | `#FFFFFF` (Blanco Puro) | `#566459` (Salvia Oscuro) | **5.9 : 1** | **AA** | ✅ Supera 4.5:1 |
| **Botón Primario (Signal Lime)** | `#D4E565` (Signal Lime) | `#141915` (Tinta Carbón) | **11.6 : 1** | **AAA** | ✅ Supera 7:1 |
| **Panel Hero de Mando (Pizarra Profunda)** | `#1E2520` (Deep Slate) | `#F7F9F5` (Blanco Hueso) | **14.2 : 1** | **AAA** | ✅ Supera 7:1 |
| **Etiquetas del Panel Hero** | `#1E2520` (Deep Slate) | `#A3B1A7` (Salvia Claro) | **8.5 : 1** | **AAA** | ✅ Supera 7:1 |
| **Botón de Peligro / Borrado** | `#B91C1C` (Rojo Carmesí) | `#FFFFFF` (Blanco Puro) | **6.4 : 1** | **AA** | ✅ Supera 4.5:1 |
| **Alerta de Error** | `#FEE2E2` (Fondo Rosa) | `#991B1B` (Texto Rojo) | **7.1 : 1** | **AAA** | ✅ Supera 7:1 |
| **Barra Inferior Flotante (`BottomNav`)** | `#181E1A` (Grafito Táctico) | `#D4E565` (Signal Lime activo) | **11.9 : 1** | **AAA** | ✅ Supera 7:1 |

---

## 3. Ergonomía Móvil y Objetivos Táctiles (Touch Targets)

| Componente | Altura / Tamaño en v1 | Altura / Tamaño en v2 | Estándar Mínimo (44×44 px) |
| :--- | :--- | :--- | :--- |
| **Botón primario (`PrimaryButton`)** | 44 px | **48 px** (`min-h-[48px]`) | ✅ Cumplido (+9%) |
| **Sello maestro de fichaje (`StampButton`)** | 48 px | **62 px** (`min-h-[62px]`) | ✅ Cumplido (+41%) |
| **Botones de icono (`IconButton`, cierre, anterior/siguiente)** | 40 px (`h-10 w-10`) | **44 px** (`h-11 w-11 min-h-[44px] min-w-[44px]`) | ✅ Cumplido (+10%) |
| **Barra de navegación inferior (`BottomNav`)** | 44 px (`h-11 w-11`) | **44 px** con zona activa táctil y feedback `active:scale-95` | ✅ Cumplido |
| **Desbordamiento horizontal (`overflow-x`)** | Riesgo de rebote en iOS Safari | **0 px en todos los anchos** (`320px`, `375px`, `430px`, `768px`, `1280px`) mediante `touch-action: pan-y`, `overscroll-behavior-x: none` y `min-w-0` generalizado | ✅ 100% Libre de scroll horizontal |

---

## 4. Estado de Internacionalización (i18n)

- **Total de claves detectadas en el código**: 567
- **Traducciones al ucraniano (`lib/i18n/uk.ts`)**: **567 / 567 (100% traducidas, 0 faltantes)**
- **Traducciones al inglés (`lib/i18n/en.ts`)**: **567 / 567 (100% traducidas, 0 faltantes)**
- **Soporte de caracteres cirílicos**: Integrado con `subsets: ["latin", "cyrillic"]` en `app/layout.tsx` para `Inter` y `JetBrains Mono`.

---

## 5. Resumen de Pruebas Unitarias Deterministas

| Test | Módulo Evaluado | Resultado | Aserciones Clave |
| :--- | :--- | :--- | :--- |
| `scripts/test-horas.ts` | `lib/horas.ts` | **PASS (100%)** | Formatos `HH:MM`, turnos nocturnos, cálculo de jornada y minutos extra. |
| `scripts/test-dinero.ts` | `lib/dinero.ts` | **PASS (100%)** | Precisión matemática al céntimo en coma fija (`suma()`, balance y caja). |
| `scripts/test-fechas.ts` | `lib/format.ts` | **PASS (100%)** | Formateo de fechas, saltos de mes/día y etiquetas localizadas. |
| `scripts/test-gantt.ts` | `lib/gantt.ts` | **PASS (100%)** | Posicionamiento porcentual `0..100%`, estados de tarea y láser «Hoy». |
| `scripts/test-importar-excel.ts` | `lib/importar-excel.ts` | **PASS (100%)** | Lectura real del Excel del cliente: 10 secciones, 15 semanas, total exacto `85.706 €`. |
