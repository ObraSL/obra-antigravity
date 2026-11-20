"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check, Globe } from "lucide-react";
import clsx from "clsx";
import { IDIOMAS, type Idioma } from "@/lib/i18n";
import { useIdioma } from "@/lib/i18n/provider";

const BANDERAS: Record<Idioma, string> = {
  uk: "🇺🇦",
  es: "🇪🇸",
  en: "🇬🇧",
};

/**
 * Selector de idioma compacto estilo Dropdown.
 * Muestra el idioma activo y se despliega al hacer clic.
 */
export function SelectorIdioma({ className }: { className?: string }) {
  const { idioma, cambiarIdioma } = useIdioma();
  const [abierto, setAbierto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const actual = IDIOMAS.find((i) => i.id === idioma) || IDIOMAS[0];

  useEffect(() => {
    function handleClickFuera(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setAbierto(false);
      }
    }
    if (abierto) {
      document.addEventListener("mousedown", handleClickFuera);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickFuera);
    };
  }, [abierto]);

  const seleccionar = (id: Idioma) => {
    cambiarIdioma(id);
    setAbierto(false);
  };

  return (
    <div ref={ref} className={clsx("relative inline-block text-left", className)}>
      <button
        type="button"
        onClick={() => setAbierto((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={abierto}
        className={clsx(
          "inline-flex items-center gap-2 rounded-xl border border-white/14 bg-[#141915]/90 px-3 py-2 text-xs font-semibold text-white backdrop-blur-md transition shadow-[0_3px_10px_rgba(0,0,0,0.25)] hover:bg-[#1c221e]",
          abierto && "border-[#d7dc9a]/40 bg-[#1c221e]"
        )}
      >
        <span className="text-sm">{BANDERAS[actual.id]}</span>
        <span className="font-mono-obra tracking-wide text-white/90">{actual.corto}</span>
        <span className="text-white/60 font-medium">· {actual.nombre}</span>
        <ChevronDown
          size={14}
          className={clsx(
            "text-[#d7dc9a] transition-transform duration-200",
            abierto && "rotate-180"
          )}
        />
      </button>

      {abierto && (
        <div
          role="listbox"
          className="absolute left-0 mt-1.5 z-50 w-48 overflow-hidden rounded-xl border border-white/14 bg-[#141915] p-1 shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150"
        >
          {IDIOMAS.map((i) => {
            const activo = i.id === idioma;
            return (
              <button
                key={i.id}
                role="option"
                aria-selected={activo}
                type="button"
                onClick={() => seleccionar(i.id)}
                className={clsx(
                  "flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs font-medium transition",
                  activo
                    ? "bg-[#1c221e] text-[#d7dc9a] font-bold border border-white/10"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">{BANDERAS[i.id]}</span>
                  <span>{i.nombre}</span>
                  <span className="text-[10.5px] uppercase tracking-wider text-white/40">
                    ({i.corto})
                  </span>
                </div>
                {activo && <Check size={14} className="text-[#d7dc9a]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
