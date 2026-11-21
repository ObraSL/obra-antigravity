"use client";

import { useEffect, useState } from "react";

const CLAVE_IOS_MODE = "obra_ios_app_mode";

/**
 * Detecta si la app se ejecuta en modo B2B Companion para Apple App Store.
 * En este modo se ocultan los flujos de compra externa con Stripe (/alta)
 * para cumplir App Store Review Guidelines 3.1.1 y 3.1.3(b) sin comisión IAP.
 */
export function esModoIosAppStore(): boolean {
  if (process.env.NEXT_PUBLIC_APP_STORE_IOS === "1") return true;
  if (typeof window === "undefined") return false;

  try {
    const params = new URLSearchParams(window.location.search);
    const param = params.get("ios_app");
    if (param === "1") {
      window.sessionStorage.setItem(CLAVE_IOS_MODE, "1");
      return true;
    }
    if (param === "0") {
      window.sessionStorage.removeItem(CLAVE_IOS_MODE);
      return false;
    }
    if (window.sessionStorage.getItem(CLAVE_IOS_MODE) === "1") return true;
  } catch {
    /* sessionStorage puede estar deshabilitado en modo privado estricto */
  }

  const win = window as unknown as {
    Capacitor?: { getPlatform?: () => string };
    webkit?: { messageHandlers?: Record<string, unknown> };
  };

  if (win.Capacitor?.getPlatform?.() === "ios") return true;

  const esDispositivoApple = /iPad|iPhone|iPod/.test(window.navigator.userAgent);
  const tieneBridgeNativo = Boolean(
    win.webkit?.messageHandlers && Object.keys(win.webkit.messageHandlers).length > 0
  );

  return esDispositivoApple && tieneBridgeNativo;
}

/** Hook seguro para SSR que activa la detección de cliente tras montar. */
export function useEsIosAppStore(): boolean {
  const [esIos, setEsIos] = useState(() => process.env.NEXT_PUBLIC_APP_STORE_IOS === "1");

  useEffect(() => {
    setEsIos(esModoIosAppStore());
  }, []);

  return esIos;
}
