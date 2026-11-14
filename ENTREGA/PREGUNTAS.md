# Preguntas Abiertas y Notas de Producto para María (`PREGUNTAS.md`)

> **Propósito**: Documentar las ambigüedades o discrepancias de negocio detectadas en el código de v1 que se han conservado por prudencia para no alterar el comportamiento esperado, pero que conviene que María confirme de cara a futuras evoluciones.

---

## Q-01: Fórmula del «Balance» en Inicio vs en la pantalla `/dinero`
- **Qué ocurre hoy en v1 (y hemos mantenido en v2)**:
  - En la pantalla de **Inicio** (`/`), dentro del bloque «Dinero de la obra», el **Balance** se calcula como:
    $$\text{Balance}_{\text{Inicio}} = \text{Cobrado del cliente} - \text{Gastado total en la obra}$$
  - En cambio, en la pantalla **`/dinero`**, para el dueño, el **Balance** de la tarjeta superior se calcula como:
    $$\text{Balance}_{\text{Dinero}} = \text{Cobrado del cliente} + \text{Entregado para la obra} - \text{Gastado total en la obra}$$
- **Por qué no lo hemos cambiado por nuestra cuenta**:
  - Cambiar una fórmula financiera sin confirmación explícita podría alterar los números que el dueño espera ver hoy en su móvil.
- **Pregunta para María**:
  - ¿Prefieres que en ambas pantallas el Balance de la obra para el dueño sea siempre `Cobrado del cliente - Gastado total` (ya que el dinero entregado al encargado es un movimiento interno de caja y no un ingreso adicional de la obra), o quieres mantener la suma actual en `/dinero`?

---

## Q-02: Visibilidad de días pasados en `/fichajes` para el rol `manager`
- **Qué ocurre hoy en v1 (y hemos mantenido en v2)**:
  - Aunque en la base de datos (`fichajes_update` / `fichajes_insert`) el rol `manager` tiene permisos técnicos de escritura, la interfaz de `/fichajes` solo muestra el botón del lápiz (`CorregirHorasForm`) y permite editar días pasados al rol **`dueno`** (`esDueno`). Para `manager` y `jefe_obra`, los días anteriores a hoy se muestran en modo de solo lectura.
- **Pregunta para María**:
  - Confirmamos que hemos mantenido esta protección estricta (solo el dueño puede corregir horas o tocar días pasados). Si en algún momento deseas que el `manager` también pueda corregir días pasados dejando marca en el historial, se puede activar con un cambio de una línea.
