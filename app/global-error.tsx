"use client";

import { useEffect } from "react";
import { reportarError } from "@/lib/errores";

/**
 * Último recurso: falla hasta el layout de la app. No hay estilos ni
 * idiomas aquí (Next no los carga), así que va en los tres idiomas y con
 * estilos a mano.
 */
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    reportarError(error, "global-error");
  }, [error]);

  return (
    <html lang="es">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#f7f3ec", color: "#211c15" }}>
        <div style={{ maxWidth: 360, margin: "20vh auto", padding: 24, textAlign: "center" }}>
          <h2 style={{ margin: "0 0 8px" }}>Algo ha fallado · Щось пішло не так · Something went wrong</h2>
          <button
            onClick={() => retry()}
            style={{ marginTop: 16, padding: "12px 20px", borderRadius: 12, border: 0, background: "#e0a526", fontWeight: 700 }}
          >
            Reintentar · Спробувати ще · Retry
          </button>
        </div>
      </body>
    </html>
  );
}
