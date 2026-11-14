# Control de Obra v2

> **Aplicación de Gestión de Obras Móvil y de Escritorio (SaaS Multi-rol)**  
> Next.js 16 (App Router + Turbopack) · React 19 · TypeScript · Tailwind CSS v4 · Supabase · Stripe

Control de Obra v2 es la versión rediseñada y optimizada del sistema integral para constructoras y empresas de reformas: control de presencia y fichajes con geolocalización silenciosa y cola offline, libro mayor y tesorería al céntimo, gestión de gastos y facturas con captura fotográfica, flota de vehículos, planificación con diagrama de Gantt escalonado e importación desde Excel, y administración centralizada de empresas.

---

## 1. Novedades de la Versión v2

1. **Nueva Identidad Visual Táctica (`Tactical Architectural Slate & Signal Lime`)**:
   - Diseñada específicamente para condiciones de obra bajo luz solar directa diurna, cumpliendo **WCAG 2.1 AAA** en contraste de lectura (**16.4:1** en superficie base y **11.6:1** en el botón de acción principal).
   - Paneles de mando tácticos en pizarra profunda (`#1E2520`) con acentos en Signal Lime (`#D4E565`) y Esmeralda (`#34D399`).
2. **Tres Momentos Firma**:
   - **Sello Táctico de Fichaje en 2 Segundos**: Consola táctil de 62 px con hora certificada por el servidor, bloqueo automático tras sellar e indicador de cola offline sin cobertura.
   - **Telemetría de Progreso por Ecualizador Vertical**: Matriz de barras verticales que codifica simultáneamente el porcentaje completado, el estado de los capítulos y los últimos 14 días trabajados.
   - **Cronograma Escalonado con Láser 'Hoy' y Libro Mayor al Céntimo**: Gantt 100% libre de scroll horizontal y precisión matemática en céntimos enteros (`lib/dinero.ts`).
3. **Galería Interactiva de Verificación (`/galeria`)**:
   - Simulador en vivo con conmutación en caliente de viewports (`320px`, `375px`, `430px`, `768px`, `1280px`), roles (`Dueño`, `Manager`, `Jefe de Obra`, `Trabajador`), idiomas (`ES`, `UK`, `EN`) y estados (`populated`/`empty`), funcionando 100% en memoria con cero llamadas de red.
4. **Optimización de Bundle**:
   - Carga diferida (`import()`) de librerías pesadas como `xlsx` en reportes mensuales, reduciendo drásticamente el First-Load JS.
5. **Corrección de Defectos de v1**:
   - Permisos de interfaz alineados estrictamente con las políticas RLS de Supabase (botones restringidos según rol).
   - Cero errores y advertencias de linter con React 19 (`npm run lint`).
   - Cobertura de traducción al 100% (567/567 cadenas traducidas en los 3 idiomas).

---

## 2. Puesta en Marcha Local

### 2.1 Instalación
```bash
npm install
```

### 2.2 Pruebas Unitarias Deterministas
```bash
npx tsx scripts/test-horas.ts
npx tsx scripts/test-dinero.ts
npx tsx scripts/test-fechas.ts
npx tsx scripts/test-gantt.ts
npx tsx scripts/test-importar-excel.ts
```

### 2.3 Compilación y Verificación de Tipos
```bash
npm run lint    # 0 errors, 0 warnings
npm run build   # Compilación limpia de producción
```

### 2.4 Servidor de Desarrollo con Galería Activada
```bash
# En PowerShell:
$env:NEXT_PUBLIC_GALERIA="1"
npm run dev

# En CMD tradicional:
# set NEXT_PUBLIC_GALERIA=1
# npm run dev
```

Abre en tu navegador:
- Aplicación: `http://localhost:3000`
- Galería Interactiva: `http://localhost:3000/galeria`

---

## 3. Documentación de Entrega

La carpeta `ENTREGA/` contiene los informes exhaustivos del proyecto:
- `ENTREGA/00-inventario.md`: Auditoría completa de v1 y registro de 13 discrepancias corregidas.
- `ENTREGA/01-diseno/`: Identidad, tokens de color, maquetas HTML y resumen en ucraniano.
- `ENTREGA/MATRIZ-PARIDAD.md`: Matriz funcional completa (todas las specs de `ACC-01` a `PLT-06`).
- `ENTREGA/dorados-checksums.md`: Verificación SHA-256 byte a byte de módulos dorados.
- `ENTREGA/cambios-en-dorados.md`: Justificación auditada de modificaciones puntuales en archivos dorados.
- `ENTREGA/metricas.md`: Tiempos de compilación, tabla de contrastes WCAG y métricas de pantalla.
- `ENTREGA/dependencias.md`: Inventario de dependencias de producción y desarrollo.
- `ENTREGA/COMO-PROBARLO.md`: Manual paso a paso para pruebas locales y en navegador.
- `ENTREGA/INFORME-FINAL-UA.md`: Resumen ejecutivo final para la clienta (en ucraniano).
- `ENTREGA/DECISIONES.md` y `ENTREGA/PREGUNTAS.md`: Registro de decisiones de arquitectura y notas de producto.
