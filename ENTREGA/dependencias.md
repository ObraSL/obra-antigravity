# Inventario y Justificación de Dependencias (`dependencias.md`)

> **Proyecto**: Control de Obra v2
> **Filosofía**: Cero dependencias superfluas. Solo librerías nativas y estrictamente necesarias para el rendimiento móvil y la lógica de negocio.

---

## 1. Dependencias de Producción (`dependencies`)

| Paquete | Versión | Propósito | Tamaño Aprox. | Justificación Técnica |
| :--- | :--- | :--- | :--- | :--- |
| `next` | `16.3.4` | Framework React Fullstack (App Router, Turbopack) | Núcleo | Plataforma base requerida por la especificación para Server Actions, API routes y compilación optimizada. |
| `react` | `19.2.8` | Librería de renderizado declarativo | Núcleo | Motor de interfaz React 19 nativo con verificación estricta de pureza en hooks y componentes. |
| `react-dom` | `19.2.8` | Adaptador DOM para React | Núcleo | Integración con el navegador y SSR. |
| `@supabase/supabase-js` | `^2.115.0` | SDK oficial de Supabase | ~180 KB | Consultas a base de datos PostgreSQL, llamadas a funciones RPC y suscripciones en tiempo real. |
| `@supabase/ssr` | `^0.12.6` | Adaptador Supabase para Next.js SSR | ~25 KB | Gestión segura de cookies de sesión entre middleware, Server Components y cliente. |
| `lucide-react` | `^1.41.0` | Iconografía táctica vectorial | Tree-shaken (~1-2 KB/icono) | Iconos arquitectónicos ligeros en SVG puro sin dependencias externas pesadas. |
| `clsx` | `^2.1.1` | Utilidad de composición de clases CSS | < 1 KB | Construcción condicional y determinista de clases de Tailwind CSS sin sobrecoste de runtime. |
| `xlsx` | `^0.18.5` | Lector y exportador de hojas de cálculo Excel | ~380 KB (Aislado con lazy-load) | Lectura de presupuestos en `/planificacion` y exportación de reportes mensuales en `/resumen`. Se carga mediante `import()` dinámico para no penalizar el First-Load JS. |
| `stripe` | `^22.6.2` | SDK oficial de pagos Stripe | Server-only | Creación de sesiones de Checkout con 14 días de prueba y procesamiento de webhooks de suscripción. |

---

## 2. Dependencias de Desarrollo (`devDependencies`)

| Paquete | Versión | Propósito |
| :--- | :--- | :--- |
| `typescript` | `^5` | Tipado estricto en tiempo de compilación. |
| `tailwindcss` | `^4` | Motor de utilidades CSS v4 con arquitectura `@theme` en `app/globals.css`. |
| `@tailwindcss/postcss` | `^4` | Plugin PostCSS para integración nativa con Next.js y Turbopack. |
| `eslint` | `^9` | Linter de código estático (evaluado con 0 errores y 0 warnings). |
| `eslint-config-next` | `16.3.4` | Reglas oficiales de rendimiento, Core Web Vitals y pureza de hooks para Next.js. |
| `sharp` | `^0.35.4` | Optimización nativa de imágenes y generación de iconos PWA. |
| `@types/node` / `react` / `react-dom` | `^20` / `^19` | Definiciones TypeScript oficiales. |
