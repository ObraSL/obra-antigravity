# Guía de Pruebas y Verificación Local (`COMO-PROBARLO.md`)

> **Proyecto**: Control de Obra v2  
> **Directorio de Trabajo**: `C:\Projects\apps\antigravity\`

---

## 1. Requisitos Previos

- **Node.js**: v20 o superior (recomendado v22+ o v24).
- **npm**: v10 o superior.

---

## 2. Instalación de Dependencias

Ejecutar desde el directorio del proyecto:

```bash
cd C:\Projects\apps\antigravity
npm install
```

---

## 3. Comprobación de Pruebas Unitarias Deterministas

Para verificar que todos los cálculos matemáticos (céntimos en dinero, turnos de horas, fechas, diagramas de Gantt y lectura del Excel del cliente) funcionan al 100%:

```bash
# Ejecutar los 5 tests unitarios en secuencia
npx tsx scripts/test-horas.ts
npx tsx scripts/test-dinero.ts
npx tsx scripts/test-fechas.ts
npx tsx scripts/test-gantt.ts
npx tsx scripts/test-importar-excel.ts
```

*Resultado esperado*: Los 5 tests deben imprimir mensajes de éxito con código de salida `0`.

---

## 4. Comprobación de Calidad de Código (Linter)

Para certificar que no existen violaciones de pureza de React 19, imports indebidos ni variables no utilizadas:

```bash
npm run lint
```

*Resultado esperado*: `0 errors, 0 warnings`.

---

## 5. Comprobación de Internacionalización (i18n)

Para auditar que todas las cadenas de texto visibles en la app están 100% traducidas al ucraniano y al inglés:

```bash
node scripts/claves-i18n.js
```

*Resultado esperado*:
```text
uk: 567/567 traducidas
en: 567/567 traducidas
```

---

## 6. Compilación de Producción (`build`)

Para verificar que las 21 rutas de la aplicación compilan de forma limpia y tipada con Turbopack:

```bash
npm run build
```

*Resultado esperado*: Compilación limpia en menos de 4 segundos sin errores de TypeScript.

---

## 7. Ejecución y Pruebas en el Navegador

### 7.1 Arrancar en modo desarrollo con la Galería Interactiva activada
En PowerShell o CMD:

```bash
# Activar la galería interactiva mediante variable de entorno
$env:NEXT_PUBLIC_GALERIA="1"   # en PowerShell
# set NEXT_PUBLIC_GALERIA=1    # en CMD tradicional

npm run dev
```

### 7.2 Probar la Galería Interactiva de Pantallas
Abrir en el navegador:
👉 **`http://localhost:3000/galeria`**

Desde la galería podrás:
1. **Conmutar el tamaño de pantalla**: Probar en directo cómo se ve cada pantalla en `320px` (iPhone SE), `375px` (móvil estándar), `430px` (iPhone Pro Max), `768px` (iPad) y `1280px` (escritorio).
2. **Conmutar el idioma**: Cambiar al instante entre Español (`ES`), Ucraniano (`UK`) e Inglés (`EN`).
3. **Conmutar el rol**: Ver cómo se adapta cada pantalla para `Dueño`, `Manager`, `Jefe de Obra` o `Trabajador`.
4. **Conmutar el estado**: Probar el comportamiento con datos reales de obra (`populated`) o en estado vacío inicial (`empty`).
5. **Cero dependencias de red**: La galería funciona 100% en memoria con datos predefinidos (*fixtures*), sin tocar bases de datos externas ni credenciales de producción.
