"use client";

import { useEffect } from "react";

/** Registra el service worker para que el navegador ofrezca instalar la app. */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Si falla (ej. en un navegador sin soporte), la app sigue funcionando igual.
      });
    }
  }, []);

  return null;
}
