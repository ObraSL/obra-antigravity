"use client";

import clsx from "clsx";
import { IDIOMAS } from "@/lib/i18n";
import { useIdioma } from "@/lib/i18n/provider";

/** Tres botones ES / UA / EN. */
export function SelectorIdioma({ className }: { className?: string }) {
  const { idioma, cambiarIdioma } = useIdioma();
  return (
    <div className={clsx("inline-flex rounded-full border border-obra-card-border bg-obra-card p-0.5", className)}>
      {IDIOMAS.map((i) => (
        <button
          key={i.id}
          type="button"
          onClick={() => cambiarIdioma(i.id)}
          aria-label={i.nombre}
          aria-pressed={idioma === i.id}
          className={clsx(
            "rounded-full px-2.5 py-1 text-[12px] font-bold transition-colors",
            idioma === i.id ? "bg-obra-yellow text-obra-yellow-ink" : "text-obra-text-dim"
          )}
        >
          {i.corto}
        </button>
      ))}
    </div>
  );
}
