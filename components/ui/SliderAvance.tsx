"use client";

import React from "react";
import clsx from "clsx";

interface SliderAvanceProps {
  valor: number;
  onChange: (nuevoValor: number) => void;
  className?: string;
  paso?: number;
  disabled?: boolean;
}

export function SliderAvance({
  valor,
  onChange,
  className,
  paso = 5,
  disabled = false,
}: SliderAvanceProps) {
  const pct = Math.max(0, Math.min(100, Math.round(valor)));

  return (
    <div className={clsx("w-full space-y-3 select-none", className)}>
      {/* Contenedor del slider interactivo */}
      <div className="relative flex items-center py-2">
        <input
          type="range"
          min={0}
          max={100}
          step={paso}
          value={pct}
          disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value))}
          className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0 z-20 disabled:cursor-not-allowed"
          aria-label="Avance"
        />

        {/* Pista de fondo rebajada */}
        <div className="relative h-2 w-full rounded-full bg-white/15 overflow-hidden">
          {/* Relleno activo en verde lima */}
          <div
            className="h-full bg-[#d7dc9a] transition-all duration-100 ease-out rounded-full"
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Pulgar / Manecilla personalizada de precisión */}
        <div
          className="pointer-events-none absolute h-5 w-5 -translate-x-1/2 rounded-full border-2 border-white bg-[#121613] shadow-[0_2px_8px_rgba(0,0,0,0.4)] transition-all duration-100 ease-out z-10 peer-focus-visible:ring-2 peer-focus-visible:ring-[#d7dc9a] peer-active:scale-110"
          style={{ left: `${pct}%` }}
        >
          <div className="absolute inset-1 rounded-full bg-[#d7dc9a]" />
        </div>
      </div>

      {/* Botones de acceso rápido a hitos principales */}
      <div className="grid grid-cols-5 gap-1.5">
        {[0, 25, 50, 75, 100].map((v) => {
          const activo = pct === v;
          return (
            <button
              key={v}
              type="button"
              disabled={disabled}
              onClick={() => onChange(v)}
              className={clsx(
                "font-mono-obra flex h-8 items-center justify-center rounded-lg border text-[11.5px] font-semibold transition-all active:scale-95 disabled:opacity-40",
                activo
                  ? "border-[#d7dc9a] bg-[#d7dc9a]/20 text-[#d7dc9a] shadow-xs"
                  : "border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10 hover:text-white"
              )}
            >
              {v}%
            </button>
          );
        })}
      </div>
    </div>
  );
}
