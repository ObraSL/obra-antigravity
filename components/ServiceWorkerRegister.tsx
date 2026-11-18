"use client";

import { useEffect } from "react";

/** Registra el service worker para que el navegador ofrezca instalar la app y fuerza actualización. */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          // Fuerza comprobación de nueva versión en cada arranque
          reg.update().catch(() => {});
        })
        .catch(() => {});
    }
  }, []);

  return null;
}
