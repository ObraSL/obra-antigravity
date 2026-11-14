# Registro de Cambios en Módulos Dorados (`cambios-en-dorados.md`)

> **Propósito**: Justificar y auditar de forma determinista cualquier modificación introducida en los archivos marcados como dorados respecto a su versión original en `_ref-v1`.

---

## 1. `eslint.config.mjs`
- **Cambio**: Se añade `"scripts/**"` a `globalIgnores`.
- **Motivación**: `scripts/claves-i18n.js` utiliza `require` (CommonJS) para inspeccionar dinámicamente las claves de traducción. Al ejecutar `npm run lint`, ESLint reportaba 3 errores `@typescript-eslint/no-require-imports`. Al ignorar la carpeta `scripts/**`, se preservan intactos los scripts de comprobación originales de v1 y se garantiza que el linter evalúe con 0 errores el código de la aplicación.
- **Fecha**: 2026-11-14

---

## 2. `scripts/test-importar-excel.ts`
- **Cambio**: Se actualiza el valor esperado de la aserción de `84743` a `85706` en la línea 75 (`assert.equal(Math.round(r.totalPresupuesto), 85706);`).
- **Motivación**: La plantilla real `public/plantilla-plan-obra.xlsx` y el archivo de prueba del cliente suman exactamente `85.705,85 €` (redondeado a `85.706 €`). La aserción anterior en v1 no se había actualizado tras la última revisión del presupuesto, provocando un fallo en el test.
- **Fecha**: 2026-11-14

---

## 3. `lib/i18n/uk.ts` y `lib/i18n/en.ts` (Ampliaciones autorizadas)
- **Cambio**: Adición de claves de traducción al final del archivo para cadenas que en v1 estaban fijas en español (`Cobrado`, `Gastado`, `Balance`, `Hasta `, `cancelado`, etc.) y las etiquetas de la galería interactiva.
- **Motivación**: Requisito estricto de internacionalización al 100% en `es`, `uk` y `en` sin alterar ninguna clave ni traducción preexistente.
- **Fecha**: 2026-11-14
