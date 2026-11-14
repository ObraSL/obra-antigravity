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
| **Fase 2** | Portabilidad de Módulos Dorados, Base Next.js y Tests Unitarios | **SIGUIENTE** | Copia íntegra de módulos dorados, checksums SHA-256 (`ENTREGA/dorados-checksums.md`), `npm install`, paso de los 5 tests unitarios |
| **Fase 3** | Construcción de la Nueva Interfaz v2 y Galería Interactiva (`/galeria`) | **PENDIENTE** | Todas las rutas v2, desacoplamiento vista/contenedor, `/galeria` y `/galeria/[screen]` con fixtures 100% en memoria |
| **Fase 4** | Verificación Adversarial (Playwright Multi-Viewport, Contraste, i18n, Build) | **PENDIENTE** | Capturas en `ENTREGA/capturas/`, `ENTREGA/metricas.md`, `npm run lint`, `npm run build` |
| **Fase 5** | Empaquetado Final y Documentación de Entrega | **PENDIENTE** | `ENTREGA/COMO-PROBARLO.md`, `ENTREGA/INFORME-FINAL-UA.md`, `ENTREGA/cambios-en-dorados.md`, `ENTREGA/dependencias.md`, `README.md` |

---

## Historial de Hitos Completados

- **[x] Hito 0.1**: Inicialización del repositorio Git limpio en `C:\Projects\apps\antigravity` (rama `main`) y extracción de `_ref-v1` desde `4ed79ad` y `_pack` desde `D:\obra\rediseno`.
- **[x] Hito 0.2**: Lectura íntegra de `ESPECIFICACION-ESTRUCTURA.md`, `TRAMPAS-Y-LIMITES-TECNICOS.md`, `PARA-MARIA.md` y auditoría línea por línea de todas las páginas, componentes y librerías de `_ref-v1`.
- **[x] Hito 0.3**: Identificación de 13 discrepancias/mejoras técnicas entre la especificación y v1 (permisos UI en `ObraPicker` y `/fichajes`, pureza de `Date.now()` en `SoporteAcceso.tsx`, cadenas sin `tr()` en portada/admin/alta/soporte, carga diferida de `exceljs`, precisión de céntimos en `/resumen`).
- **[x] Hito 0.4**: Redacción de `ENTREGA/00-inventario.md`, `ENTREGA/MATRIZ-PARIDAD.md` (`ACC-01`..`PLT-06`), `ENTREGA/DECISIONES.md` y `ENTREGA/PREGUNTAS.md`.
- **[x] Hito 1.1**: Definición del sistema de diseño original **Tactical Architectural Slate & Signal Lime** en `ENTREGA/01-diseno/identidad-y-sistema.md` con tabla completa de contrastes WCAG AA/AAA, escala tipográfica probada en `es`/`uk`/`en` y los 3 momentos firma.
- **[x] Hito 1.2**: Construcción del banco de maquetas HTML/CSS en `ENTREGA/01-diseno/mockups/sistema-tactico-v2.html` y resumen ejecutivo en ucraniano para María en `ENTREGA/01-diseno/RESUMEN-UA.md`.
