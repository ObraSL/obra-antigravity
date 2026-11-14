import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Esta app es un dashboard cliente que carga datos de Supabase
      // según la obra/mes seleccionados (fetch-on-mount / on-dependency
      // -change en useEffect). Es el patrón correcto aquí — no hay
      // Server Components posibles porque los datos dependen de estado
      // del cliente (obra elegida, sesión) — así que se desactiva esta
      // regla, pensada para detectar fetches que deberían resolverse con
      // Server Components/Suspense en vez de con estado local.
      "react-hooks/set-state-in-effect": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Referencia de la app anterior (artifact), no se lintea ni se mantiene.
    "legacy/**",
    // Carpetas de referencia externa y especificación
    "_ref-v1/**",
    "_pack/**",
    // Scripts de mantenimiento y pruebas locales
    "scripts/**",
  ]),
]);

export default eslintConfig;
