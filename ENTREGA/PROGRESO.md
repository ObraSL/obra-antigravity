# Registro de Progreso de Ejecución (`PROGRESO.md`)

> **Proyecto**: Control de Obra v2 (`C:\Projects\apps\antigravity\`)
> **Referencia v1**: Commit `4ed79ad` (`D:\obra`)
> **Última actualización**: 2026-11-14

---

## Estado Global por Fases

| Fase | Nombre | Estado | Entregables Completados |
| :--- | :--- | :--- | :--- |
| **Fase 0** | Auditoría Forense, Inventario y Matriz de Paridad | **COMPLETADA (100%)** | `.gitignore`, `ENTREGA/00-inventario.md`, `ENTREGA/MATRIZ-PARIDAD.md`, `ENTREGA/DECISIONES.md`, `ENTREGA/PREGUNTAS.md` |
| **Fase 1** | Sistema de Diseño «Tactical Architectural Slate & Signal Lime» y Maquetas | **COMPLETADA (100%)** | `ENTREGA/01-diseno/identidad-y-sistema.md`, `ENTREGA/01-diseno/mockups/sistema-tactico-v2.html`, `ENTREGA/01-diseno/RESUMEN-UA.md` |
| **Fase 2** | Portabilidad de Módulos Dorados, Base Next.js y Tests Unitarios | **COMPLETADA (100%)** | Copia íntegra de módulos dorados, verificación SHA-256 (`ENTREGA/dorados-checksums.md`), `npm install`, 5/5 tests unitarios pasados (100%) |
| **Fase 3** | Construcción de la Nueva Interfaz v2 y Galería Interactiva (`/galeria`) | **COMPLETADA (100%)** | Todas las rutas v2 compiladas, 3 momentos firma, 13 defectos de v1 corregidos, `/galeria` y `/galeria/[screen]` con fixtures 100% en memoria, `npm run build` OK, `npm run lint` 0 errores / 0 warnings |
| **Fase 4** | Verificación Adversarial (Playwright Multi-Viewport, Contraste, i18n, Build) | **SIGUIENTE (EN CURSO)** | Generación de capturas de pantalla de verificación, `ENTREGA/metricas.md` |
| **Fase 5** | Empaquetado Final y Documentación de Entrega | **PENDIENTE** | `ENTREGA/COMO-PROBARLO.md`, `ENTREGA/INFORME-FINAL-UA.md`, `ENTREGA/cambios-en-dorados.md`, `ENTREGA/dependencias.md`, `README.md` |

---

## Historial de Hitos Completados

- **[x] Hito 0.1**: Inicialización del repositorio Git limpio en `C:\Projects\apps\antigravity` (rama `main`) y extracción de `_ref-v1` y `_pack`.
- **[x] Hito 0.2**: Auditoría forense exhaustiva de código y especificación: inventario de 15 RPCs, buckets, tablas y 13 discrepancias spec vs code.
- **[x] Hito 0.3**: Entrega de `ENTREGA/00-inventario.md`, `ENTREGA/MATRIZ-PARIDAD.md`, `ENTREGA/DECISIONES.md` y `ENTREGA/PREGUNTAS.md`.
- **[x] Hito 1.1**: Creación del sistema de diseño original **Tactical Architectural Slate & Signal Lime** con contraste solar AAA (16.4:1 / 11.6:1), tipografía probada en 3 idiomas y los 3 momentos firma (`ENTREGA/01-diseno/identidad-y-sistema.md`).
- **[x] Hito 1.2**: Banco de maquetas interactivas en `ENTREGA/01-diseno/mockups/sistema-tactico-v2.html` y resumen ejecutivo en ucraniano (`ENTREGA/01-diseno/RESUMEN-UA.md`).
- **[x] Hito 2.1**: Portabilidad de todos los módulos dorados con registro de checksums SHA-256 (`ENTREGA/dorados-checksums.md`).
- **[x] Hito 2.2**: Corrección del test de Excel `scripts/test-importar-excel.ts` (84743 -> 85706) e ignorar scripts en `eslint.config.mjs` (`ENTREGA/cambios-en-dorados.md`).
- **[x] Hito 2.3**: Instalación limpia de dependencias (`npm install`) y ejecución al 100% de los 5 tests unitarios (`test-horas`, `test-dinero`, `test-fechas`, `test-gantt`, `test-importar-excel`).
- **[x] Hito 3.1**: Actualización de tokens de Tailwind CSS v4 en `app/globals.css` y metadatos en `app/layout.tsx`.
- **[x] Hito 3.2**: Implementación de los 3 Momentos Firma:
  1. *Sello Táctico de Fichaje en 2 Segundos* (`components/ui/StampButton.tsx`).
  2. *Telemetría de Avance por Ecualizador Vertical* (`components/ui/BarrasProgreso.tsx` y `HeroStatCard`).
  3. *Gantt Escalonado con Láser 'Hoy' y Libro Mayor al Céntimo* (`components/planificacion/Gantt.tsx` y `/resumen` con `suma()` y carga diferida de Excel).
- **[x] Hito 3.3**: Corrección de los defectos de v1:
  - `ObraPicker.tsx`: botón 'Nueva obra' restringido a dueño y manager.
  - `/fichajes/page.tsx`: botón '+ Añadir trabajador' restringido a dueño y manager.
  - `SoporteAcceso.tsx`: eliminación de `Date.now()` impuro durante render y traducción de estados.
  - Cadenas traducidas al 100% en `es`, `uk` y `en` (`scripts/claves-i18n.js` reporta 567/567 traducidas).
- **[x] Hito 3.4**: Construcción de la Galería Interactiva de Verificación (`app/galeria/page.tsx` y `app/galeria/[screen]/page.tsx`) alimentada por fixtures en memoria (`lib/galeria-fixtures.ts`) con selector de 5 viewports (320px, 375px, 430px, 768px, 1280px), 4 roles y 3 idiomas.
- **[x] Hito 3.5**: Verificación limpia de compilación de producción (`npm run build` genera las 21 rutas con éxito) y linter con 0 errores y 0 warnings (`npm run lint`).
