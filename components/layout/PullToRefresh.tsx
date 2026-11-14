"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import clsx from "clsx";

const EVENTO = "obra:refrescar";
const UMBRAL = 70;

/** Cada pantalla que quiera enterarse del gesto llama esto con su propia
 *  función de recarga (la misma que usa al entrar). */
export function useEnRefresco(callback: () => void | Promise<void>) {
  useEffect(() => {
    const manejador = () => {
      callback();
    };
    window.addEventListener(EVENTO, manejador);
    return () => window.removeEventListener(EVENTO, manejador);
  }, [callback]);
}

/**
 * Tirar de la pantalla hacia abajo para recargar los datos, sin el parpadeo
 * de recargar la página entera. Solo actúa si ya se está arriba del todo:
 * si no, ese gesto es simplemente hacer scroll.
 */
export function PullToRefresh({ children }: { children: React.ReactNode }) {
  const [altura, setAltura] = useState(0);
  const [girando, setGirando] = useState(false);
  const estado = useRef({ inicioY: 0, arrastrando: false, distancia: 0 });

  useEffect(() => {
    const onStart = (e: TouchEvent) => {
      if (window.scrollY > 0 || girando) return;
      estado.current = { inicioY: e.touches[0].clientY, arrastrando: true, distancia: 0 };
    };

    const onMove = (e: TouchEvent) => {
      if (!estado.current.arrastrando) return;
      const delta = e.touches[0].clientY - estado.current.inicioY;
      if (delta <= 0 || window.scrollY > 0) {
        estado.current.arrastrando = false;
        setAltura(0);
        return;
      }
      const distancia = Math.min(delta * 0.5, 90);
      estado.current.distancia = distancia;
      setAltura(distancia);
    };

    const onEnd = () => {
      if (!estado.current.arrastrando) return;
      estado.current.arrastrando = false;
      if (estado.current.distancia > UMBRAL) {
        setGirando(true);
        setAltura(40);
        window.dispatchEvent(new Event(EVENTO));
        setTimeout(() => {
          setGirando(false);
          setAltura(0);
        }, 700);
      } else {
        setAltura(0);
      }
    };

    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onEnd);
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
    };
  }, [girando]);

  return (
    <>
      <div
        className="flex items-center justify-center overflow-hidden transition-[height] duration-150 ease-out"
        style={{ height: altura }}
      >
        <Loader2
          size={20}
          className={clsx("text-obra-yellow", (girando || altura > UMBRAL) && "animate-spin")}
        />
      </div>
      {children}
    </>
  );
}
