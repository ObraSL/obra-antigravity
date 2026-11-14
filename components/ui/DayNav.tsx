"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { fmtDateLong, shiftDay, todayStr } from "@/lib/format";
import { IconButton } from "./Button";
import { tr } from "@/lib/i18n";

export function DayNav({ fecha, onChange }: { fecha: string; onChange: (fecha: string) => void }) {
  const esHoy = fecha === todayStr();
  return (
    <div className="mb-4 flex items-center justify-between">
      <IconButton onClick={() => onChange(shiftDay(fecha, -1))} aria-label={tr("Día anterior")}>
        <ChevronLeft size={18} />
      </IconButton>
      <div className="min-w-0 flex-1 px-2 text-center">
        <div className="font-display text-lg font-bold text-obra-text sm:text-xl">
          {fmtDateLong(fecha)}
        </div>
        {!esHoy && (
          <button
            onClick={() => onChange(todayStr())}
            className="text-xs font-semibold text-obra-yellow"
          >
            {tr("Volver a hoy")}
          </button>
        )}
      </div>
      <IconButton
        onClick={() => onChange(shiftDay(fecha, 1))}
        disabled={esHoy}
        aria-label={tr("Día siguiente")}
      >
        <ChevronRight size={18} />
      </IconButton>
    </div>
  );
}
