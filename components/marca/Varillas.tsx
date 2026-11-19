import React from "react";
import clsx from "clsx";

export type TonoVarilla = "lima" | "blanco" | "coral" | "apagado";

export type Varilla = {
  /** 0–1: proporción de la altura máxima. */
  alto: number;
  tono: TonoVarilla;
  /** Texto corto para tooltip nativo. */
  titulo?: string;
};

const TONO: Record<TonoVarilla, string> = {
  lima: "bg-[#d7dc9a]",
  blanco: "bg-white/85",
  coral: "bg-[#e0826d]",
  apagado: "bg-white/18",
};

type Props = {
  varillas: Varilla[];
  /** Altura del gráfico en px (por defecto 72px). */
  alto?: number;
  /** Marca vertical opcional (ej. "Hoy") en proporción 0–1. */
  marca?: { posicion: number; etiqueta?: React.ReactNode };
  /** Resumen para lectores de pantalla. */
  resumen: string;
  className?: string;
  /** Grosor relativo de cada varilla frente al espacio (0.2 a 0.6). */
  grosor?: number;
};

export function Varillas({
  varillas,
  alto = 72,
  marca,
  resumen,
  className,
  grosor = 0.42,
}: Props) {
  return (
    <div className={clsx("relative w-full min-w-0 select-none", className)}>
      <div
        role="img"
        aria-label={resumen}
        className="flex w-full items-end justify-between"
        style={{ height: alto }}
      >
        {varillas.map((v, i) => {
          const clampedAlto = Math.max(0, Math.min(1, v.alto));
          const alturaPct = Math.max(6, Math.round(clampedAlto * 100));

          return (
            <div
              key={i}
              className="flex h-full min-w-0 flex-1 items-end justify-center px-[2px]"
              title={v.titulo}
            >
              <div
                className={clsx(
                  "w-full transition-all duration-300 rounded-[2px]",
                  TONO[v.tono]
                )}
                style={{
                  maxWidth: `${Math.round(grosor * 18)}px`,
                  minWidth: "2px",
                  height: `${alturaPct}%`,
                }}
              />
            </div>
          );
        })}
      </div>

      {marca && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 flex -translate-x-1/2 flex-col items-center"
          style={{
            left: `${Math.min(100, Math.max(0, marca.posicion * 100))}%`,
            height: alto + 8,
          }}
        >
          <span className="mt-auto block h-full w-[1.5px] bg-white/70" />
          <span className="-mt-[3px] block h-2 w-2 rounded-full border border-black/40 bg-white shadow-xs" />
        </div>
      )}

      {marca?.etiqueta && (
        <div className="relative mt-2 h-5" aria-hidden="true">
          <span
            className="font-mono-obra absolute -translate-x-1/2 whitespace-nowrap text-[11px] font-medium text-white/65"
            style={{
              left: `clamp(2rem, ${Math.min(100, Math.max(0, marca.posicion * 100))}%, calc(100% - 2rem))`,
            }}
          >
            {marca.etiqueta}
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Regla de presupuesto en 40 varillas de alta precisión (estándar industrial).
 * - Blanco: porcentaje gastado dentro del presupuesto.
 * - Lima: porcentaje restante disponible.
 * - Coral: exceso o sobrecoste de presupuesto.
 */
export function varillasPresupuesto(pct: number): Varilla[] {
  const N = 40;
  if (pct <= 100) {
    const gastadas = Math.round((pct / 100) * N);
    return Array.from({ length: N }, (_, i) => ({
      alto: 1,
      tono: (i < gastadas ? "blanco" : "lima") as TonoVarilla,
    }));
  }
  // Excedido
  const dentro = Math.max(1, Math.round((100 / pct) * N));
  return Array.from({ length: N }, (_, i) => ({
    alto: 1,
    tono: (i < dentro ? "blanco" : "coral") as TonoVarilla,
  }));
}
