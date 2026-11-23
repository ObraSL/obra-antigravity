import type { Instrumentation } from "next";

/**
 * Fallos del servidor (páginas y /api): se guardan en errores_app igual que
 * los del navegador, llamando a registrar_error() con la clave pública. Se
 * espera a que termine (lo pide Next) pero nunca más de 3 segundos.
 */
export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const clave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !clave) return;

  const e = err instanceof Error ? err : null;
  const digest = typeof err === "object" && err !== null && "digest" in err ? ` [digest ${String(err.digest)}]` : "";
  const mensaje = (e?.message ?? String(err)) + digest;
  const detalle = [`${request.method} · ${context.routeType} · ${context.routePath}`, e?.stack]
    .filter(Boolean)
    .join("\n");
  const navegador = String(request.headers["user-agent"] ?? "");

  try {
    await fetch(`${url}/rest/v1/rpc/registrar_error`, {
      method: "POST",
      headers: { apikey: clave, Authorization: `Bearer ${clave}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        p_origen: "servidor",
        p_mensaje: mensaje,
        p_detalle: detalle,
        p_ruta: request.path,
        p_navegador: navegador,
      }),
      signal: AbortSignal.timeout(3000),
    });
  } catch {
    /* si no se puede avisar, no se rompe nada más */
  }

  try {
    const { procesarAlertaError } = await import("@/lib/monitor-alerta");
    await procesarAlertaError({
      origen: "servidor",
      mensaje,
      detalle,
      ruta: request.path,
      navegador,
    });
  } catch {
    /* si no se puede avisar a Telegram/Gemini, no se rompe nada más */
  }
};
