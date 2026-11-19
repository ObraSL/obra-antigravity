"use client";

import React from "react";
import clsx from "clsx";
import { tr } from "@/lib/i18n";

interface FotoEdificioProps {
  className?: string;
  prioritaria?: boolean;
  retrasadas?: number;
  badgeLabel?: string;
  altura?: string;
}

/**
 * Fotografía atmosférica de la obra en construcción con grúa torre (Adrian Cogua / Unsplash).
 * Sustituye completamente al render 3D estático anterior.
 * Se funde suavemente con el fondo salvia (#737F73) mediante gradiente de máscara vertical
 * y un velo con mezcla multiply para igualar la temperatura cromática.
 */
export function FotoEdificio({
  className,
  prioritaria = false,
  retrasadas,
  badgeLabel,
  altura = "h-[220px] sm:h-[250px]",
}: FotoEdificioProps) {
  const tieneRetraso = typeof retrasadas === "number" && retrasadas > 0;
  const textoBadge =
    badgeLabel ??
    (tieneRetraso
      ? tr("{n} con retraso", { n: retrasadas })
      : tr("En plazo"));

  return (
    <div
      className={clsx(
        "relative -mx-3 overflow-hidden select-none pointer-events-none",
        altura,
        className
      )}
      aria-hidden="true"
    >
      {/* Insignia obsidian flotante (Screen 2 & 3 Dribbble: On Track) */}
      <div className="absolute right-4 top-3 z-10 pointer-events-auto flex items-center gap-1.5 rounded-full border border-white/20 bg-[#121613]/75 px-3 py-1.5 text-[11.5px] font-medium text-white backdrop-blur-md shadow-[0_8px_20px_rgba(0,0,0,0.32)]">
        <span
          className={clsx(
            "h-2 w-2 rounded-full shrink-0",
            tieneRetraso ? "bg-[#e0826d] shadow-[0_0_6px_#e0826d]" : "bg-[#d7dc9a] shadow-[0_0_6px_#d7dc9a]"
          )}
        />
        <span className="tracking-tight">{textoBadge}</span>
      </div>

      {/* Fotografía de alta resolución con máscara de desvanecimiento suave */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/fotos/obra-1200.webp"
        srcSet="/fotos/obra-700.webp 700w, /fotos/obra-1200.webp 1200w"
        sizes="(min-width: 768px) 65vw, 100vw"
        alt=""
        width={1200}
        height={973}
        decoding="async"
        loading={prioritaria ? "eager" : "lazy"}
        className="absolute inset-0 h-full w-full object-cover object-[50%_28%]"
        style={{
          maskImage:
            "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.7) 10%, black 35%, black 65%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.7) 10%, black 35%, black 65%, transparent 100%)",
        }}
      />

      {/* Velo salvia unificador (multiply) para fundir la atmósfera con el lienzo #737F73 */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(115, 127, 115, 0.3) 0%, rgba(115, 127, 115, 0.6) 100%)",
          mixBlendMode: "multiply",
          maskImage:
            "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.7) 10%, black 35%, black 65%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.7) 10%, black 35%, black 65%, transparent 100%)",
        }}
      />
    </div>
  );
}
